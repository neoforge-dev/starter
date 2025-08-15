"""CRUD operations for recommendation system with ML integration and performance optimization."""
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

from sqlalchemy import and_, desc, func, or_, select, text, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

from app.crud.base import CRUDBase
from app.models.recommendation import (
    Recommendation, UserPreferences, RecommendationFeedback, SimilarUsers
)
from app.schemas.recommendation import (
    RecommendationCreate, RecommendationUpdate, RecommendationCreateBulk,
    UserPreferencesCreate, UserPreferencesUpdate,
    RecommendationFeedbackCreate, SimilarUsersCreate,
    RecommendationType, RecommendationStatus
)


class CRUDRecommendation(CRUDBase[Recommendation, RecommendationCreate, RecommendationUpdate]):
    """CRUD operations for Recommendation model with ML integration and analytics."""

    async def create(
        self,
        db: AsyncSession,
        *,
        obj_in: RecommendationCreate,
    ) -> Recommendation:
        """Create a new recommendation with automatic ID generation."""
        recommendation_data = obj_in.model_dump(exclude_unset=True)
        
        # Generate unique recommendation ID
        recommendation_data["recommendation_id"] = str(uuid4())
        
        # Set creation timestamp
        recommendation_data["created_at"] = datetime.utcnow()
        
        # Set default status
        if "status" not in recommendation_data:
            recommendation_data["status"] = RecommendationStatus.ACTIVE
            
        db_obj = Recommendation(**recommendation_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def create_bulk(
        self,
        db: AsyncSession,
        *,
        obj_in: RecommendationCreateBulk,
    ) -> List[Recommendation]:
        """Create multiple recommendations efficiently."""
        recommendations = []
        current_time = datetime.utcnow()
        
        for rec_create in obj_in.recommendations:
            rec_data = rec_create.model_dump(exclude_unset=True)
            rec_data["recommendation_id"] = str(uuid4())
            rec_data["created_at"] = current_time
            rec_data["status"] = rec_data.get("status", RecommendationStatus.ACTIVE)
            
            db_obj = Recommendation(**rec_data)
            recommendations.append(db_obj)
            
        # Bulk insert for performance
        db.add_all(recommendations)
        await db.commit()
        
        # Refresh objects to get auto-generated IDs
        for rec in recommendations:
            await db.refresh(rec)
            
        return recommendations

    async def get_by_recommendation_id(
        self, 
        db: AsyncSession, 
        *, 
        recommendation_id: str
    ) -> Optional[Recommendation]:
        """Get recommendation by unique recommendation_id."""
        result = await db.execute(
            select(Recommendation).where(Recommendation.recommendation_id == recommendation_id)
        )
        return result.scalar_one_or_none()

    async def get_user_recommendations(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        types: Optional[List[str]] = None,
        statuses: Optional[List[str]] = None,
        include_expired: bool = False,
        skip: int = 0,
        limit: int = 10,
    ) -> List[Recommendation]:
        """Get recommendations for a specific user with filtering."""
        query = select(Recommendation).where(Recommendation.user_id == user_id)
        
        # Filter by types
        if types:
            query = query.where(Recommendation.type.in_(types))
            
        # Filter by status
        if statuses:
            query = query.where(Recommendation.status.in_(statuses))
        else:
            # Default to active recommendations only
            query = query.where(Recommendation.status == RecommendationStatus.ACTIVE)
            
        # Handle expiration
        if not include_expired:
            current_time = datetime.utcnow()
            query = query.where(
                or_(
                    Recommendation.expires_at.is_(None),
                    Recommendation.expires_at > current_time
                )
            )
            
        # Order by priority and confidence scores
        query = (
            query.order_by(
                desc(Recommendation.priority_score),
                desc(Recommendation.confidence_score),
                desc(Recommendation.created_at)
            )
            .offset(skip)
            .limit(limit)
        )
        
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_trending_recommendations(
        self,
        db: AsyncSession,
        *,
        types: Optional[List[str]] = None,
        time_window_hours: int = 24,
        min_interactions: int = 5,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """Get trending recommendations based on interaction metrics."""
        cutoff_time = datetime.utcnow() - timedelta(hours=time_window_hours)
        
        # Base query for recommendations with good interaction rates
        query = (
            select(
                Recommendation.type,
                Recommendation.title,
                Recommendation.description,
                func.count(Recommendation.id).label("recommendation_count"),
                func.sum(Recommendation.impressions).label("total_impressions"),
                func.sum(Recommendation.clicks).label("total_clicks"),
                func.avg(Recommendation.confidence_score).label("avg_confidence"),
                func.avg(Recommendation.priority_score).label("avg_priority"),
                (func.sum(Recommendation.clicks) / func.greatest(func.sum(Recommendation.impressions), 1)).label("ctr")
            )
            .where(
                and_(
                    Recommendation.created_at >= cutoff_time,
                    Recommendation.impressions + Recommendation.clicks >= min_interactions
                )
            )
        )
        
        # Filter by types if specified
        if types:
            query = query.where(Recommendation.type.in_(types))
            
        # Group and order by performance
        query = (
            query.group_by(
                Recommendation.type,
                Recommendation.title,
                Recommendation.description
            )
            .having(func.count(Recommendation.id) >= 3)  # At least 3 recommendations
            .order_by(
                desc(text("ctr")),
                desc(text("avg_confidence")),
                desc(text("total_impressions"))
            )
            .limit(limit)
        )
        
        result = await db.execute(query)
        return [dict(row._mapping) for row in result.all()]

    async def update_engagement(
        self,
        db: AsyncSession,
        *,
        recommendation_id: str,
        action: str,
        increment_impressions: bool = False,
        increment_clicks: bool = False,
    ) -> Optional[Recommendation]:
        """Update recommendation engagement metrics and status."""
        # Get current recommendation
        recommendation = await self.get_by_recommendation_id(db, recommendation_id=recommendation_id)
        if not recommendation:
            return None
            
        # Prepare update data
        update_data = {}
        current_time = datetime.utcnow()
        
        # Handle different actions
        if action == "shown" or increment_impressions:
            update_data["impressions"] = recommendation.impressions + 1
            if not recommendation.shown_at:
                update_data["shown_at"] = current_time
                
        elif action == "clicked" or increment_clicks:
            update_data["clicks"] = recommendation.clicks + 1
            update_data["clicked_at"] = current_time
            update_data["status"] = RecommendationStatus.CLICKED
            
        elif action == "dismissed":
            update_data["dismissed_at"] = current_time
            update_data["status"] = RecommendationStatus.DISMISSED
            
        elif action == "converted":
            update_data["status"] = RecommendationStatus.CONVERTED
            
        # Apply updates
        if update_data:
            await db.execute(
                update(Recommendation)
                .where(Recommendation.recommendation_id == recommendation_id)
                .values(**update_data)
            )
            await db.commit()
            await db.refresh(recommendation)
            
        return recommendation

    async def get_recommendations_by_confidence(
        self,
        db: AsyncSession,
        *,
        min_confidence: float = 0.7,
        user_id: Optional[int] = None,
        types: Optional[List[str]] = None,
        limit: int = 50,
    ) -> List[Recommendation]:
        """Get high-confidence recommendations for quality filtering."""
        query = select(Recommendation).where(
            and_(
                Recommendation.confidence_score >= min_confidence,
                Recommendation.status == RecommendationStatus.ACTIVE
            )
        )
        
        if user_id:
            query = query.where(Recommendation.user_id == user_id)
            
        if types:
            query = query.where(Recommendation.type.in_(types))
            
        # Handle expiration
        current_time = datetime.utcnow()
        query = query.where(
            or_(
                Recommendation.expires_at.is_(None),
                Recommendation.expires_at > current_time
            )
        )
        
        query = query.order_by(desc(Recommendation.confidence_score)).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())

    async def expire_old_recommendations(
        self,
        db: AsyncSession,
        *,
        batch_size: int = 1000,
    ) -> int:
        """Expire old recommendations past their expiration date."""
        current_time = datetime.utcnow()
        
        # Update expired recommendations
        result = await db.execute(
            update(Recommendation)
            .where(
                and_(
                    Recommendation.expires_at <= current_time,
                    Recommendation.status != RecommendationStatus.EXPIRED
                )
            )
            .values(status=RecommendationStatus.EXPIRED)
            .execution_options(synchronize_session=False)
        )
        
        await db.commit()
        return result.rowcount

    async def get_performance_analytics(
        self,
        db: AsyncSession,
        *,
        user_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        types: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Get recommendation performance analytics."""
        # Build base query
        query = select(Recommendation)
        
        filters = []
        if user_id:
            filters.append(Recommendation.user_id == user_id)
        if start_date:
            filters.append(Recommendation.created_at >= start_date)
        if end_date:
            filters.append(Recommendation.created_at <= end_date)
        if types:
            filters.append(Recommendation.type.in_(types))
            
        if filters:
            query = query.where(and_(*filters))
            
        # Get basic metrics
        basic_metrics_query = select(
            func.count(Recommendation.id).label("total_recommendations"),
            func.sum(
                func.case((Recommendation.status == RecommendationStatus.ACTIVE, 1), else_=0)
            ).label("active_recommendations"),
            func.sum(Recommendation.impressions).label("total_impressions"),
            func.sum(Recommendation.clicks).label("total_clicks"),
            func.sum(
                func.case((Recommendation.status == RecommendationStatus.CONVERTED, 1), else_=0)
            ).label("total_conversions"),
            func.avg(Recommendation.confidence_score).label("avg_confidence"),
            func.avg(Recommendation.priority_score).label("avg_priority"),
        ).select_from(query.subquery())
        
        basic_result = await db.execute(basic_metrics_query)
        basic_metrics = dict(basic_result.first()._mapping)
        
        # Calculate derived metrics
        total_impressions = basic_metrics.get("total_impressions", 0) or 0
        total_clicks = basic_metrics.get("total_clicks", 0) or 0
        total_conversions = basic_metrics.get("total_conversions", 0) or 0
        
        basic_metrics["avg_ctr"] = (total_clicks / total_impressions) if total_impressions > 0 else 0.0
        basic_metrics["conversion_rate"] = (total_conversions / total_clicks) if total_clicks > 0 else 0.0
        
        # Get performance by type
        type_performance_query = (
            query.add_columns(
                Recommendation.type,
                func.count(Recommendation.id).label("count"),
                func.sum(Recommendation.impressions).label("impressions"),
                func.sum(Recommendation.clicks).label("clicks"),
                func.avg(Recommendation.confidence_score).label("avg_confidence")
            )
            .group_by(Recommendation.type)
            .order_by(desc(text("clicks")))
        )
        
        type_result = await db.execute(type_performance_query)
        type_performance = []
        for row in type_result.all():
            row_dict = dict(row._mapping)
            impressions = row_dict.get("impressions", 0) or 0
            clicks = row_dict.get("clicks", 0) or 0
            row_dict["ctr"] = (clicks / impressions) if impressions > 0 else 0.0
            type_performance.append(row_dict)
        
        return {
            **basic_metrics,
            "top_performing_types": type_performance,
        }


class CRUDUserPreferences(CRUDBase[UserPreferences, UserPreferencesCreate, UserPreferencesUpdate]):
    """CRUD operations for UserPreferences model."""

    async def get_by_user_id(
        self, 
        db: AsyncSession, 
        *, 
        user_id: int
    ) -> Optional[UserPreferences]:
        """Get user preferences by user ID."""
        result = await db.execute(
            select(UserPreferences).where(UserPreferences.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_or_update(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        obj_in: UserPreferencesUpdate,
    ) -> UserPreferences:
        """Create or update user preferences."""
        existing = await self.get_by_user_id(db, user_id=user_id)
        
        if existing:
            # Update existing preferences
            update_data = obj_in.model_dump(exclude_unset=True)
            update_data["updated_at"] = datetime.utcnow()
            
            for field, value in update_data.items():
                setattr(existing, field, value)
                
            await db.commit()
            await db.refresh(existing)
            return existing
        else:
            # Create new preferences
            create_data = obj_in.model_dump(exclude_unset=True)
            create_data["user_id"] = user_id
            create_data["created_at"] = datetime.utcnow()
            create_data["updated_at"] = datetime.utcnow()
            
            db_obj = UserPreferences(**create_data)
            db.add(db_obj)
            await db.commit()
            await db.refresh(db_obj)
            return db_obj

    async def update_from_events(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        event_analysis: Dict[str, Any],
    ) -> UserPreferences:
        """Update user preferences based on event analysis."""
        preferences_data = UserPreferencesUpdate(**event_analysis)
        preferences_data.last_analyzed_at = datetime.utcnow()
        
        return await self.create_or_update(
            db, user_id=user_id, obj_in=preferences_data
        )


class CRUDRecommendationFeedback(CRUDBase[RecommendationFeedback, RecommendationFeedbackCreate, Dict[str, Any]]):
    """CRUD operations for RecommendationFeedback model."""

    async def create(
        self,
        db: AsyncSession,
        *,
        obj_in: RecommendationFeedbackCreate,
        user_id: int,
    ) -> RecommendationFeedback:
        """Create recommendation feedback."""
        feedback_data = obj_in.model_dump(exclude_unset=True)
        feedback_data["user_id"] = user_id
        feedback_data["created_at"] = datetime.utcnow()
        
        db_obj = RecommendationFeedback(**feedback_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_recommendation_feedback(
        self,
        db: AsyncSession,
        *,
        recommendation_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[RecommendationFeedback]:
        """Get all feedback for a recommendation."""
        query = (
            select(RecommendationFeedback)
            .where(RecommendationFeedback.recommendation_id == recommendation_id)
            .order_by(desc(RecommendationFeedback.created_at))
            .offset(skip)
            .limit(limit)
        )
        
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_user_feedback(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[RecommendationFeedback]:
        """Get all feedback from a user."""
        query = (
            select(RecommendationFeedback)
            .where(RecommendationFeedback.user_id == user_id)
            .order_by(desc(RecommendationFeedback.created_at))
            .offset(skip)
            .limit(limit)
        )
        
        result = await db.execute(query)
        return list(result.scalars().all())


class CRUDSimilarUsers(CRUDBase[SimilarUsers, SimilarUsersCreate, Dict[str, Any]]):
    """CRUD operations for SimilarUsers model."""

    async def get_similar_users(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        min_similarity: float = 0.1,
        algorithm: Optional[str] = None,
        limit: int = 10,
    ) -> List[SimilarUsers]:
        """Get similar users for a given user."""
        current_time = datetime.utcnow()
        
        query = (
            select(SimilarUsers)
            .where(
                and_(
                    SimilarUsers.user_id == user_id,
                    SimilarUsers.similarity_score >= min_similarity,
                    SimilarUsers.expires_at > current_time
                )
            )
        )
        
        if algorithm:
            query = query.where(SimilarUsers.algorithm == algorithm)
            
        query = query.order_by(desc(SimilarUsers.similarity_score)).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())

    async def create_bulk_similarities(
        self,
        db: AsyncSession,
        *,
        similarities: List[SimilarUsersCreate],
    ) -> List[SimilarUsers]:
        """Create multiple similarity relationships efficiently."""
        db_objects = []
        current_time = datetime.utcnow()
        
        for similarity in similarities:
            sim_data = similarity.model_dump(exclude_unset=True)
            sim_data["computed_at"] = current_time
            
            db_obj = SimilarUsers(**sim_data)
            db_objects.append(db_obj)
            
        db.add_all(db_objects)
        await db.commit()
        
        for obj in db_objects:
            await db.refresh(obj)
            
        return db_objects

    async def cleanup_expired_similarities(
        self,
        db: AsyncSession,
        *,
        batch_size: int = 1000,
    ) -> int:
        """Remove expired similarity relationships."""
        current_time = datetime.utcnow()
        
        result = await db.execute(
            delete(SimilarUsers)
            .where(SimilarUsers.expires_at <= current_time)
            .execution_options(synchronize_session=False)
        )
        
        await db.commit()
        return result.rowcount


# Create instances
recommendation = CRUDRecommendation(Recommendation)
user_preferences = CRUDUserPreferences(UserPreferences)
recommendation_feedback = CRUDRecommendationFeedback(RecommendationFeedback)
similar_users = CRUDSimilarUsers(SimilarUsers)