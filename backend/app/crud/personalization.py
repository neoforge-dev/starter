"""CRUD operations for personalization system."""
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
from uuid import uuid4

from app.crud.base import CRUDBase
from app.models.personalization import (
    PersonalizationInteraction,
    PersonalizationProfile,
    PersonalizationRule,
    PersonalizationSegmentAnalysis,
    UserPersonalizationRules,
)
from app.schemas.personalization import (
    PersonalizationInteractionCreate,
    PersonalizationProfileCreate,
    PersonalizationProfileUpdate,
    PersonalizationRuleCreate,
    PersonalizationRuleUpdate,
)
from sqlalchemy import and_, case, desc, func, or_, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


class CRUDPersonalizationProfile(
    CRUDBase[
        PersonalizationProfile,
        PersonalizationProfileCreate,
        PersonalizationProfileUpdate,
    ]
):
    """CRUD operations for personalization profiles."""

    async def get_by_user_id(
        self, db: AsyncSession, *, user_id: int
    ) -> Optional[PersonalizationProfile]:
        """Get personalization profile by user ID."""
        result = await db.execute(
            select(PersonalizationProfile).where(
                PersonalizationProfile.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    async def create_or_update_profile(
        self, db: AsyncSession, *, user_id: int, profile_data: Dict[str, Any]
    ) -> PersonalizationProfile:
        """Create or update a personalization profile."""
        existing = await self.get_by_user_id(db, user_id=user_id)

        if existing:
            # Update existing profile
            update_data = {
                **profile_data,
                "updated_at": datetime.utcnow(),
                "last_analyzed_at": datetime.utcnow(),
            }
            for field, value in update_data.items():
                if hasattr(existing, field):
                    setattr(existing, field, value)

            await db.commit()
            await db.refresh(existing)
            return existing
        else:
            # Create new profile
            create_data = {
                "user_id": user_id,
                **profile_data,
                "last_analyzed_at": datetime.utcnow(),
            }
            profile = PersonalizationProfile(**create_data)
            db.add(profile)
            await db.commit()
            await db.refresh(profile)
            return profile

    async def get_profiles_by_segment(
        self, db: AsyncSession, *, segment: str, skip: int = 0, limit: int = 100
    ) -> List[PersonalizationProfile]:
        """Get profiles by segment."""
        result = await db.execute(
            select(PersonalizationProfile)
            .where(PersonalizationProfile.primary_segment == segment)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_profiles_by_churn_risk(
        self,
        db: AsyncSession,
        *,
        min_risk: float = 0.7,
        skip: int = 0,
        limit: int = 100
    ) -> List[PersonalizationProfile]:
        """Get profiles with high churn risk."""
        result = await db.execute(
            select(PersonalizationProfile)
            .where(
                and_(
                    PersonalizationProfile.predicted_churn_risk.isnot(None),
                    PersonalizationProfile.predicted_churn_risk >= min_risk,
                )
            )
            .order_by(desc(PersonalizationProfile.predicted_churn_risk))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def update_ml_insights(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        churn_risk: Optional[float] = None,
        lifetime_value: Optional[float] = None,
        next_actions: Optional[List[str]] = None
    ) -> Optional[PersonalizationProfile]:
        """Update ML-generated insights for a profile."""
        profile = await self.get_by_user_id(db, user_id=user_id)
        if not profile:
            return None

        update_data = {"last_analyzed_at": datetime.utcnow()}
        if churn_risk is not None:
            update_data["predicted_churn_risk"] = churn_risk
        if lifetime_value is not None:
            update_data["lifetime_value_score"] = lifetime_value
        if next_actions is not None:
            update_data["next_likely_actions"] = next_actions

        for field, value in update_data.items():
            setattr(profile, field, value)

        await db.commit()
        await db.refresh(profile)
        return profile


class CRUDPersonalizationRule(
    CRUDBase[PersonalizationRule, PersonalizationRuleCreate, PersonalizationRuleUpdate]
):
    """CRUD operations for personalization rules."""

    async def create_rule(
        self, db: AsyncSession, *, obj_in: PersonalizationRuleCreate
    ) -> PersonalizationRule:
        """Create a new personalization rule."""
        create_data = obj_in.model_dump()
        create_data["rule_id"] = str(uuid4())

        rule = PersonalizationRule(**create_data)
        db.add(rule)
        await db.commit()
        await db.refresh(rule)
        return rule

    async def get_active_rules_for_user(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        context: Optional[str] = None,
        include_ab_tests: bool = True
    ) -> List[PersonalizationRule]:
        """Get active personalization rules for a user."""
        # First get user's profile to determine segment
        profile = await db.execute(
            select(PersonalizationProfile).where(
                PersonalizationProfile.user_id == user_id
            )
        )
        profile = profile.scalar_one_or_none()

        if not profile:
            return []

        # Build query conditions
        conditions = [
            PersonalizationRule.is_active.is_(True),
            or_(
                PersonalizationRule.starts_at.is_(None),
                PersonalizationRule.starts_at <= datetime.utcnow(),
            ),
            or_(
                PersonalizationRule.expires_at.is_(None),
                PersonalizationRule.expires_at > datetime.utcnow(),
            ),
        ]

        # Filter by user segment
        segment_condition = func.jsonb_exists_any(
            PersonalizationRule.target_segments,
            [profile.primary_segment] + (profile.secondary_segments or []),
        )
        conditions.append(segment_condition)

        # Filter by context if provided
        if context:
            context_condition = func.jsonb_exists(
                PersonalizationRule.target_contexts, context
            )
            conditions.append(context_condition)

        # Filter A/B tests if needed
        if not include_ab_tests:
            conditions.append(PersonalizationRule.is_ab_test.is_(False))

        result = await db.execute(
            select(PersonalizationRule)
            .where(and_(*conditions))
            .order_by(PersonalizationRule.priority.asc())
        )
        return result.scalars().all()

    async def get_rules_by_type(
        self,
        db: AsyncSession,
        *,
        personalization_type: str,
        is_active: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> List[PersonalizationRule]:
        """Get rules by personalization type."""
        conditions = [PersonalizationRule.personalization_type == personalization_type]
        if is_active:
            conditions.append(PersonalizationRule.is_active.is_(True))

        result = await db.execute(
            select(PersonalizationRule)
            .where(and_(*conditions))
            .order_by(PersonalizationRule.priority.asc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_ab_test_rules(
        self,
        db: AsyncSession,
        *,
        ab_test_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[PersonalizationRule]:
        """Get A/B test rules."""
        conditions = [PersonalizationRule.is_ab_test.is_(True)]
        if ab_test_id:
            conditions.append(PersonalizationRule.ab_test_id == ab_test_id)

        result = await db.execute(
            select(PersonalizationRule)
            .where(and_(*conditions))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def update_rule_performance(
        self,
        db: AsyncSession,
        *,
        rule_id: str,
        applications_count: Optional[int] = None,
        success_rate: Optional[float] = None,
        avg_improvement: Optional[float] = None
    ) -> Optional[PersonalizationRule]:
        """Update rule performance metrics."""
        rule = await self.get_by_field(db, field="rule_id", value=rule_id)
        if not rule:
            return None

        update_data = {"updated_at": datetime.utcnow()}
        if applications_count is not None:
            update_data["applications_count"] = applications_count
        if success_rate is not None:
            update_data["success_rate"] = success_rate
        if avg_improvement is not None:
            update_data["avg_improvement"] = avg_improvement

        for field, value in update_data.items():
            setattr(rule, field, value)

        await db.commit()
        await db.refresh(rule)
        return rule

    async def get_rule_performance_stats(
        self, db: AsyncSession, *, rule_id: str, days: int = 30
    ) -> Dict[str, Any]:
        """Get performance statistics for a rule."""
        since_date = datetime.utcnow() - timedelta(days=days)

        # Get interaction statistics
        result = await db.execute(
            select(
                func.count(PersonalizationInteraction.interaction_id).label(
                    "total_interactions"
                ),
                func.count(
                    case(
                        (PersonalizationInteraction.outcome == "positive", 1),
                        else_=None,
                    )
                ).label("positive_outcomes"),
                func.avg(PersonalizationInteraction.response_time_ms).label(
                    "avg_response_time"
                ),
                func.avg(PersonalizationInteraction.engagement_score).label(
                    "avg_engagement"
                ),
            ).where(
                and_(
                    PersonalizationInteraction.rule_id == rule_id,
                    PersonalizationInteraction.created_at >= since_date,
                )
            )
        )
        stats = result.first()

        return {
            "total_interactions": stats.total_interactions or 0,
            "positive_outcomes": stats.positive_outcomes or 0,
            "success_rate": (stats.positive_outcomes / stats.total_interactions)
            if stats.total_interactions
            else 0,
            "avg_response_time_ms": float(stats.avg_response_time)
            if stats.avg_response_time
            else 0,
            "avg_engagement_score": float(stats.avg_engagement)
            if stats.avg_engagement
            else 0,
            "period_days": days,
        }


class CRUDPersonalizationInteraction(
    CRUDBase[PersonalizationInteraction, PersonalizationInteractionCreate, None]
):
    """CRUD operations for personalization interactions."""

    async def create_interaction(
        self, db: AsyncSession, *, obj_in: PersonalizationInteractionCreate
    ) -> PersonalizationInteraction:
        """Create a new personalization interaction."""
        create_data = obj_in.model_dump()
        create_data["interaction_id"] = str(uuid4())

        interaction = PersonalizationInteraction(**create_data)
        db.add(interaction)
        await db.commit()
        await db.refresh(interaction)
        return interaction

    async def create_bulk_interactions(
        self, db: AsyncSession, *, interactions: List[PersonalizationInteractionCreate]
    ) -> List[PersonalizationInteraction]:
        """Create multiple interactions efficiently."""
        db_interactions = []
        for interaction_data in interactions:
            create_data = interaction_data.model_dump()
            create_data["interaction_id"] = str(uuid4())
            db_interactions.append(PersonalizationInteraction(**create_data))

        db.add_all(db_interactions)
        await db.commit()

        # Refresh all objects
        for interaction in db_interactions:
            await db.refresh(interaction)

        return db_interactions

    async def get_user_interactions(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        context: Optional[str] = None,
        days: int = 30,
        skip: int = 0,
        limit: int = 100
    ) -> List[PersonalizationInteraction]:
        """Get user interactions with optional filtering."""
        since_date = datetime.utcnow() - timedelta(days=days)

        conditions = [
            PersonalizationInteraction.user_id == user_id,
            PersonalizationInteraction.created_at >= since_date,
        ]

        if context:
            conditions.append(PersonalizationInteraction.context == context)

        result = await db.execute(
            select(PersonalizationInteraction)
            .where(and_(*conditions))
            .order_by(desc(PersonalizationInteraction.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_rule_interactions(
        self,
        db: AsyncSession,
        *,
        rule_id: str,
        days: int = 30,
        skip: int = 0,
        limit: int = 100
    ) -> List[PersonalizationInteraction]:
        """Get interactions for a specific rule."""
        since_date = datetime.utcnow() - timedelta(days=days)

        result = await db.execute(
            select(PersonalizationInteraction)
            .options(selectinload(PersonalizationInteraction.user))
            .where(
                and_(
                    PersonalizationInteraction.rule_id == rule_id,
                    PersonalizationInteraction.created_at >= since_date,
                )
            )
            .order_by(desc(PersonalizationInteraction.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_interaction_analytics(
        self,
        db: AsyncSession,
        *,
        user_id: Optional[int] = None,
        rule_id: Optional[str] = None,
        context: Optional[str] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get interaction analytics with various filters."""
        since_date = datetime.utcnow() - timedelta(days=days)

        conditions = [PersonalizationInteraction.created_at >= since_date]
        if user_id:
            conditions.append(PersonalizationInteraction.user_id == user_id)
        if rule_id:
            conditions.append(PersonalizationInteraction.rule_id == rule_id)
        if context:
            conditions.append(PersonalizationInteraction.context == context)

        # Get aggregated statistics
        result = await db.execute(
            select(
                func.count(PersonalizationInteraction.interaction_id).label(
                    "total_interactions"
                ),
                func.count(
                    case(
                        (PersonalizationInteraction.interaction_type == "clicked", 1),
                        else_=None,
                    )
                ).label("clicks"),
                func.count(
                    case(
                        (PersonalizationInteraction.outcome == "positive", 1),
                        else_=None,
                    )
                ).label("positive_outcomes"),
                func.avg(PersonalizationInteraction.response_time_ms).label(
                    "avg_response_time"
                ),
                func.avg(PersonalizationInteraction.engagement_score).label(
                    "avg_engagement"
                ),
                func.count(func.distinct(PersonalizationInteraction.user_id)).label(
                    "unique_users"
                ),
            ).where(and_(*conditions))
        )
        stats = result.first()

        # Get interaction type breakdown
        type_result = await db.execute(
            select(
                PersonalizationInteraction.interaction_type,
                func.count(PersonalizationInteraction.interaction_id).label("count"),
            )
            .where(and_(*conditions))
            .group_by(PersonalizationInteraction.interaction_type)
        )
        type_breakdown = {row.interaction_type: row.count for row in type_result}

        return {
            "total_interactions": stats.total_interactions or 0,
            "clicks": stats.clicks or 0,
            "positive_outcomes": stats.positive_outcomes or 0,
            "click_through_rate": (stats.clicks / stats.total_interactions)
            if stats.total_interactions
            else 0,
            "success_rate": (stats.positive_outcomes / stats.total_interactions)
            if stats.total_interactions
            else 0,
            "avg_response_time_ms": float(stats.avg_response_time)
            if stats.avg_response_time
            else 0,
            "avg_engagement_score": float(stats.avg_engagement)
            if stats.avg_engagement
            else 0,
            "unique_users": stats.unique_users or 0,
            "interaction_type_breakdown": type_breakdown,
            "period_days": days,
        }


class CRUDPersonalizationAnalytics:
    """CRUD operations for personalization analytics and reporting."""

    async def get_segment_performance(
        self, db: AsyncSession, *, days: int = 30
    ) -> Dict[str, Dict[str, Any]]:
        """Get performance metrics by user segment."""
        since_date = datetime.utcnow() - timedelta(days=days)

        # Get segment performance data
        result = await db.execute(
            select(
                PersonalizationProfile.primary_segment,
                func.count(func.distinct(PersonalizationProfile.user_id)).label(
                    "total_users"
                ),
                func.avg(PersonalizationProfile.avg_session_duration).label(
                    "avg_session_duration"
                ),
                func.avg(PersonalizationProfile.predicted_churn_risk).label(
                    "avg_churn_risk"
                ),
                func.avg(PersonalizationProfile.lifetime_value_score).label(
                    "avg_lifetime_value"
                ),
            )
            .join(
                PersonalizationInteraction,
                PersonalizationProfile.user_id == PersonalizationInteraction.user_id,
            )
            .where(PersonalizationInteraction.created_at >= since_date)
            .group_by(PersonalizationProfile.primary_segment)
        )

        segment_data = {}
        for row in result:
            segment_data[row.primary_segment] = {
                "total_users": row.total_users,
                "avg_session_duration": float(row.avg_session_duration)
                if row.avg_session_duration
                else 0,
                "avg_churn_risk": float(row.avg_churn_risk)
                if row.avg_churn_risk
                else 0,
                "avg_lifetime_value": float(row.avg_lifetime_value)
                if row.avg_lifetime_value
                else 0,
            }

        return segment_data

    async def get_top_performing_rules(
        self, db: AsyncSession, *, limit: int = 10, days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get top performing personalization rules."""
        since_date = datetime.utcnow() - timedelta(days=days)

        result = await db.execute(
            select(
                PersonalizationRule.rule_id,
                PersonalizationRule.name,
                PersonalizationRule.personalization_type,
                func.count(PersonalizationInteraction.interaction_id).label(
                    "total_interactions"
                ),
                func.count(
                    case(
                        (PersonalizationInteraction.outcome == "positive", 1),
                        else_=None,
                    )
                ).label("positive_outcomes"),
                func.avg(PersonalizationInteraction.engagement_score).label(
                    "avg_engagement"
                ),
            )
            .join(
                PersonalizationInteraction,
                PersonalizationRule.rule_id == PersonalizationInteraction.rule_id,
            )
            .where(
                and_(
                    PersonalizationInteraction.created_at >= since_date,
                    PersonalizationRule.is_active.is_(True),
                )
            )
            .group_by(
                PersonalizationRule.rule_id,
                PersonalizationRule.name,
                PersonalizationRule.personalization_type,
            )
            .having(func.count(PersonalizationInteraction.interaction_id) >= 10)
            .order_by(desc("positive_outcomes"))
            .limit(limit)
        )

        rules = []
        for row in result:
            success_rate = (
                (row.positive_outcomes / row.total_interactions)
                if row.total_interactions
                else 0
            )
            rules.append(
                {
                    "rule_id": row.rule_id,
                    "name": row.name,
                    "type": row.personalization_type,
                    "total_interactions": row.total_interactions,
                    "positive_outcomes": row.positive_outcomes,
                    "success_rate": success_rate,
                    "avg_engagement": float(row.avg_engagement)
                    if row.avg_engagement
                    else 0,
                }
            )

        return rules

    async def compute_segment_analysis(
        self,
        db: AsyncSession,
        *,
        segment: str,
        period_start: datetime,
        period_end: datetime
    ) -> PersonalizationSegmentAnalysis:
        """Compute and store segment analysis."""
        # Get segment metrics
        profile_result = await db.execute(
            select(
                func.count(PersonalizationProfile.user_id).label("total_users"),
                func.avg(PersonalizationProfile.avg_session_duration).label(
                    "avg_session_duration"
                ),
            ).where(PersonalizationProfile.primary_segment == segment)
        )
        profile_stats = profile_result.first()

        # Get interaction metrics for the period
        interaction_result = await db.execute(
            select(
                func.count(func.distinct(PersonalizationInteraction.user_id)).label(
                    "active_users"
                ),
                func.count(
                    case(
                        (PersonalizationInteraction.outcome == "positive", 1),
                        else_=None,
                    )
                ).label("conversions"),
                func.count(PersonalizationInteraction.interaction_id).label(
                    "total_interactions"
                ),
            )
            .join(
                PersonalizationProfile,
                PersonalizationInteraction.user_id == PersonalizationProfile.user_id,
            )
            .where(
                and_(
                    PersonalizationProfile.primary_segment == segment,
                    PersonalizationInteraction.created_at >= period_start,
                    PersonalizationInteraction.created_at <= period_end,
                )
            )
        )
        interaction_stats = interaction_result.first()

        # Calculate metrics
        conversion_rate = (
            interaction_stats.conversions / interaction_stats.total_interactions
            if interaction_stats.total_interactions
            else 0
        )

        # Create analysis record
        analysis = PersonalizationSegmentAnalysis(
            analysis_id=str(uuid4()),
            segment=segment,
            analysis_period="custom",
            total_users=profile_stats.total_users or 0,
            active_users=interaction_stats.active_users or 0,
            avg_session_duration=float(profile_stats.avg_session_duration)
            if profile_stats.avg_session_duration
            else None,
            conversion_rate=conversion_rate,
            period_start=period_start,
            period_end=period_end,
        )

        db.add(analysis)
        await db.commit()
        await db.refresh(analysis)
        return analysis


# Create instances
personalization_profile = CRUDPersonalizationProfile(PersonalizationProfile)
personalization_rule = CRUDPersonalizationRule(PersonalizationRule)
personalization_interaction = CRUDPersonalizationInteraction(PersonalizationInteraction)
personalization_analytics = CRUDPersonalizationAnalytics()
