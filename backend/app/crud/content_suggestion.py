"""CRUD operations for content suggestions with intelligent filtering and AI-powered recommendations."""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union

from app.crud.base import CRUDBase
from app.models.content_suggestion import (
    ContentAnalysisJob,
    ContentCategory,
    ContentItem,
    ContentSuggestion,
    ContentSuggestionFeedback,
    ContentSuggestionStatus,
    ContentType,
    SuggestionType,
)
from app.schemas.content_suggestion import (
    ContentAnalysisJobCreate,
    ContentItemCreate,
    ContentItemUpdate,
    ContentSuggestionCreate,
    ContentSuggestionFeedbackCreate,
    ContentSuggestionUpdate,
)
from sqlalchemy import and_, desc, func, or_, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

logger = logging.getLogger(__name__)


class CRUDContentItem(CRUDBase[ContentItem, ContentItemCreate, ContentItemUpdate]):
    """CRUD operations for content items."""

    async def get_by_content_id(
        self, db: AsyncSession, *, content_id: str
    ) -> Optional[ContentItem]:
        """Get content item by content_id."""
        result = await db.execute(
            select(ContentItem).where(ContentItem.content_id == content_id)
        )
        return result.scalar_one_or_none()

    async def get_multi_by_category(
        self,
        db: AsyncSession,
        *,
        category: ContentCategory,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = True,
    ) -> List[ContentItem]:
        """Get content items by category."""
        query = select(ContentItem).where(ContentItem.category == category)

        if active_only:
            query = query.where(ContentItem.is_active == True)

        query = query.offset(skip).limit(limit).order_by(desc(ContentItem.created_at))

        result = await db.execute(query)
        return result.scalars().all()

    async def get_multi_by_type(
        self,
        db: AsyncSession,
        *,
        content_type: ContentType,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = True,
    ) -> List[ContentItem]:
        """Get content items by type."""
        query = select(ContentItem).where(ContentItem.content_type == content_type)

        if active_only:
            query = query.where(ContentItem.is_active == True)

        query = query.offset(skip).limit(limit).order_by(desc(ContentItem.created_at))

        result = await db.execute(query)
        return result.scalars().all()

    async def search_content(
        self,
        db: AsyncSession,
        *,
        search_query: str,
        categories: Optional[List[ContentCategory]] = None,
        content_types: Optional[List[ContentType]] = None,
        min_quality_score: Optional[float] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ContentItem]:
        """Search content items with filters."""
        # Base query with text search
        query = select(ContentItem).where(
            or_(
                ContentItem.title.ilike(f"%{search_query}%"),
                ContentItem.description.ilike(f"%{search_query}%"),
            )
        )

        # Apply filters
        if categories:
            query = query.where(ContentItem.category.in_(categories))

        if content_types:
            query = query.where(ContentItem.content_type.in_(content_types))

        if min_quality_score is not None:
            query = query.where(ContentItem.quality_score >= min_quality_score)

        # Active content only
        query = query.where(ContentItem.is_active == True)

        # Order by relevance and quality
        query = query.order_by(
            desc(ContentItem.quality_score),
            desc(ContentItem.engagement_rate),
            desc(ContentItem.created_at),
        )

        query = query.offset(skip).limit(limit)

        result = await db.execute(query)
        return result.scalars().all()

    async def get_trending_content(
        self,
        db: AsyncSession,
        *,
        time_window_hours: int = 24,
        categories: Optional[List[ContentCategory]] = None,
        min_engagement_rate: float = 0.01,
        limit: int = 20,
    ) -> List[ContentItem]:
        """Get trending content based on recent engagement."""
        since_time = datetime.utcnow() - timedelta(hours=time_window_hours)

        query = select(ContentItem).where(
            and_(
                ContentItem.is_active == True,
                ContentItem.created_at >= since_time,
                ContentItem.engagement_rate >= min_engagement_rate,
            )
        )

        if categories:
            query = query.where(ContentItem.category.in_(categories))

        # Order by engagement metrics
        query = query.order_by(
            desc(ContentItem.engagement_rate),
            desc(ContentItem.view_count),
            desc(ContentItem.click_count),
        ).limit(limit)

        result = await db.execute(query)
        return result.scalars().all()

    async def update_engagement_metrics(
        self,
        db: AsyncSession,
        *,
        content_id: str,
        increment_views: int = 0,
        increment_clicks: int = 0,
        increment_shares: int = 0,
    ) -> Optional[ContentItem]:
        """Update engagement metrics for content item."""
        # Update metrics
        update_stmt = (
            update(ContentItem)
            .where(ContentItem.content_id == content_id)
            .values(
                view_count=ContentItem.view_count + increment_views,
                click_count=ContentItem.click_count + increment_clicks,
                share_count=ContentItem.share_count + increment_shares,
                updated_at=datetime.utcnow(),
            )
        )

        await db.execute(update_stmt)

        # Recalculate engagement rate
        content_item = await self.get_by_content_id(db, content_id=content_id)
        if content_item:
            total_interactions = (
                content_item.view_count
                + content_item.click_count
                + content_item.share_count
            )
            engagement_rate = (
                content_item.click_count + content_item.share_count
            ) / max(content_item.view_count, 1)

            await db.execute(
                update(ContentItem)
                .where(ContentItem.content_id == content_id)
                .values(engagement_rate=engagement_rate)
            )

        await db.commit()
        return await self.get_by_content_id(db, content_id=content_id)

    async def update_ai_analysis(
        self,
        db: AsyncSession,
        *,
        content_id: str,
        quality_score: Optional[float] = None,
        relevance_score: Optional[float] = None,
        sentiment_score: Optional[float] = None,
        topics: Optional[Dict[str, Any]] = None,
        ai_analysis: Optional[Dict[str, Any]] = None,
        optimization_suggestions: Optional[Dict[str, Any]] = None,
    ) -> Optional[ContentItem]:
        """Update AI analysis results for content item."""
        update_data = {
            "analyzed_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        if quality_score is not None:
            update_data["quality_score"] = quality_score
        if relevance_score is not None:
            update_data["relevance_score"] = relevance_score
        if sentiment_score is not None:
            update_data["sentiment_score"] = sentiment_score
        if topics is not None:
            update_data["topics"] = topics
        if ai_analysis is not None:
            update_data["ai_analysis"] = ai_analysis
        if optimization_suggestions is not None:
            update_data["optimization_suggestions"] = optimization_suggestions

        await db.execute(
            update(ContentItem)
            .where(ContentItem.content_id == content_id)
            .values(**update_data)
        )
        await db.commit()

        return await self.get_by_content_id(db, content_id=content_id)

    async def get_content_needing_analysis(
        self,
        db: AsyncSession,
        *,
        analysis_age_hours: int = 24,
        limit: int = 100,
    ) -> List[ContentItem]:
        """Get content items that need AI analysis."""
        cutoff_time = datetime.utcnow() - timedelta(hours=analysis_age_hours)

        query = (
            select(ContentItem)
            .where(
                and_(
                    ContentItem.is_active == True,
                    or_(
                        ContentItem.analyzed_at.is_(None),
                        ContentItem.analyzed_at < cutoff_time,
                    ),
                )
            )
            .order_by(desc(ContentItem.created_at))
            .limit(limit)
        )

        result = await db.execute(query)
        return result.scalars().all()


class CRUDContentSuggestion(
    CRUDBase[ContentSuggestion, ContentSuggestionCreate, ContentSuggestionUpdate]
):
    """CRUD operations for content suggestions."""

    async def get_by_suggestion_id(
        self, db: AsyncSession, *, suggestion_id: str
    ) -> Optional[ContentSuggestion]:
        """Get content suggestion by suggestion_id."""
        result = await db.execute(
            select(ContentSuggestion)
            .options(selectinload(ContentSuggestion.content_item))
            .where(ContentSuggestion.suggestion_id == suggestion_id)
        )
        return result.scalar_one_or_none()

    async def get_user_suggestions(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        suggestion_types: Optional[List[SuggestionType]] = None,
        statuses: Optional[List[ContentSuggestionStatus]] = None,
        include_expired: bool = False,
        min_confidence: float = 0.0,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ContentSuggestion]:
        """Get content suggestions for a user with filters."""
        query = (
            select(ContentSuggestion)
            .options(selectinload(ContentSuggestion.content_item))
            .where(ContentSuggestion.user_id == user_id)
        )

        # Filter by suggestion types
        if suggestion_types:
            query = query.where(ContentSuggestion.suggestion_type.in_(suggestion_types))

        # Filter by status
        if statuses:
            query = query.where(ContentSuggestion.status.in_(statuses))

        # Exclude expired unless requested
        if not include_expired:
            now = datetime.utcnow()
            query = query.where(
                or_(
                    ContentSuggestion.expires_at.is_(None),
                    ContentSuggestion.expires_at > now,
                )
            )

        # Minimum confidence filter
        if min_confidence > 0.0:
            query = query.where(ContentSuggestion.confidence_score >= min_confidence)

        # Order by priority and relevance
        query = query.order_by(
            desc(ContentSuggestion.priority_score),
            desc(ContentSuggestion.relevance_score),
            desc(ContentSuggestion.confidence_score),
            desc(ContentSuggestion.created_at),
        )

        query = query.offset(skip).limit(limit)

        result = await db.execute(query)
        return result.scalars().all()

    async def create_suggestion(
        self,
        db: AsyncSession,
        *,
        obj_in: ContentSuggestionCreate,
    ) -> ContentSuggestion:
        """Create a new content suggestion with duplicate checking."""
        # Check for existing suggestion
        existing = await db.execute(
            select(ContentSuggestion).where(
                and_(
                    ContentSuggestion.user_id == obj_in.user_id,
                    ContentSuggestion.content_id == obj_in.content_id,
                    ContentSuggestion.suggestion_type == obj_in.suggestion_type,
                    ContentSuggestion.status.in_(
                        [
                            ContentSuggestionStatus.ACTIVE,
                            ContentSuggestionStatus.SHOWN,
                        ]
                    ),
                )
            )
        )

        if existing.scalar_one_or_none():
            logger.warning(
                f"Duplicate suggestion avoided for user {obj_in.user_id}, content {obj_in.content_id}"
            )
            return existing.scalar_one()

        # Create new suggestion
        return await self.create(db, obj_in=obj_in)

    async def create_bulk_suggestions(
        self,
        db: AsyncSession,
        *,
        suggestions: List[ContentSuggestionCreate],
        batch_size: int = 100,
    ) -> Tuple[List[ContentSuggestion], List[str]]:
        """Create multiple suggestions in batches with error handling."""
        created_suggestions = []
        errors = []

        for i in range(0, len(suggestions), batch_size):
            batch = suggestions[i : i + batch_size]

            for suggestion_data in batch:
                try:
                    suggestion = await self.create_suggestion(
                        db, obj_in=suggestion_data
                    )
                    created_suggestions.append(suggestion)
                except Exception as e:
                    error_msg = f"Failed to create suggestion for user {suggestion_data.user_id}: {str(e)}"
                    logger.error(error_msg)
                    errors.append(error_msg)

            # Commit batch
            try:
                await db.commit()
            except Exception as e:
                await db.rollback()
                error_msg = f"Failed to commit batch {i//batch_size + 1}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)

        return created_suggestions, errors

    async def update_engagement(
        self,
        db: AsyncSession,
        *,
        suggestion_id: str,
        action: str,
        increment_impressions: bool = False,
        increment_clicks: bool = False,
    ) -> Optional[ContentSuggestion]:
        """Update suggestion engagement metrics."""
        now = datetime.utcnow()
        update_data = {"updated_at": now}

        # Update based on action
        if action == "shown":
            update_data.update(
                {
                    "impression_count": ContentSuggestion.impression_count + 1,
                    "last_shown_at": now,
                }
            )
            # Set first_shown_at if not set
            suggestion = await self.get_by_suggestion_id(
                db, suggestion_id=suggestion_id
            )
            if suggestion and not suggestion.first_shown_at:
                update_data["first_shown_at"] = now
                update_data["status"] = ContentSuggestionStatus.SHOWN

        elif action == "clicked":
            update_data.update(
                {
                    "click_count": ContentSuggestion.click_count + 1,
                    "clicked_at": now,
                    "status": ContentSuggestionStatus.CLICKED,
                }
            )

        elif action == "dismissed":
            update_data.update(
                {
                    "dismissed_at": now,
                    "status": ContentSuggestionStatus.DISMISSED,
                }
            )

        elif action == "converted":
            update_data[
                "status"
            ] = ContentSuggestionStatus.EXPIRED  # Mark as successful

        # Apply additional increments
        if increment_impressions:
            update_data["impression_count"] = ContentSuggestion.impression_count + 1
        if increment_clicks:
            update_data["click_count"] = ContentSuggestion.click_count + 1

        await db.execute(
            update(ContentSuggestion)
            .where(ContentSuggestion.suggestion_id == suggestion_id)
            .values(**update_data)
        )
        await db.commit()

        return await self.get_by_suggestion_id(db, suggestion_id=suggestion_id)

    async def expire_old_suggestions(
        self,
        db: AsyncSession,
        *,
        max_age_days: int = 7,
        batch_size: int = 1000,
    ) -> int:
        """Expire old suggestions."""
        cutoff_date = datetime.utcnow() - timedelta(days=max_age_days)

        # Update expired suggestions
        result = await db.execute(
            update(ContentSuggestion)
            .where(
                and_(
                    ContentSuggestion.created_at < cutoff_date,
                    ContentSuggestion.status.in_(
                        [
                            ContentSuggestionStatus.ACTIVE,
                            ContentSuggestionStatus.SHOWN,
                        ]
                    ),
                )
            )
            .values(
                status=ContentSuggestionStatus.EXPIRED,
                updated_at=datetime.utcnow(),
            )
        )

        await db.commit()
        return result.rowcount

    async def get_suggestion_analytics(
        self,
        db: AsyncSession,
        *,
        user_id: Optional[int] = None,
        suggestion_types: Optional[List[SuggestionType]] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Get analytics for content suggestions."""
        base_query = select(ContentSuggestion)

        # Apply filters
        filters = []
        if user_id:
            filters.append(ContentSuggestion.user_id == user_id)
        if suggestion_types:
            filters.append(ContentSuggestion.suggestion_type.in_(suggestion_types))
        if start_date:
            filters.append(ContentSuggestion.created_at >= start_date)
        if end_date:
            filters.append(ContentSuggestion.created_at <= end_date)

        if filters:
            base_query = base_query.where(and_(*filters))

        # Total suggestions
        total_result = await db.execute(
            select(func.count(ContentSuggestion.id)).select_from(base_query.subquery())
        )
        total_suggestions = total_result.scalar() or 0

        # Active suggestions
        active_result = await db.execute(
            base_query.where(
                ContentSuggestion.status == ContentSuggestionStatus.ACTIVE
            ).with_only_columns(func.count(ContentSuggestion.id))
        )
        active_suggestions = active_result.scalar() or 0

        # Engagement metrics
        engagement_result = await db.execute(
            base_query.with_only_columns(
                [
                    func.sum(ContentSuggestion.impression_count),
                    func.sum(ContentSuggestion.click_count),
                    func.avg(ContentSuggestion.confidence_score),
                    func.avg(ContentSuggestion.relevance_score),
                ]
            )
        )
        engagement_data = engagement_result.first()

        total_impressions = engagement_data[0] or 0
        total_clicks = engagement_data[1] or 0
        avg_confidence = float(engagement_data[2] or 0.0)
        avg_relevance = float(engagement_data[3] or 0.0)

        # Calculate CTR
        avg_ctr = total_clicks / max(total_impressions, 1)

        # Top performing types
        type_performance = await db.execute(
            base_query.with_only_columns(
                [
                    ContentSuggestion.suggestion_type,
                    func.count(ContentSuggestion.id).label("count"),
                    func.avg(
                        ContentSuggestion.click_count
                        / func.greatest(ContentSuggestion.impression_count, 1)
                    ).label("avg_ctr"),
                ]
            )
            .group_by(ContentSuggestion.suggestion_type)
            .order_by(desc("avg_ctr"))
            .limit(5)
        )

        top_types = []
        for row in type_performance:
            top_types.append(
                {
                    "suggestion_type": row[0],
                    "count": row[1],
                    "avg_ctr": float(row[2] or 0.0),
                }
            )

        return {
            "total_suggestions": total_suggestions,
            "active_suggestions": active_suggestions,
            "total_impressions": total_impressions,
            "total_clicks": total_clicks,
            "avg_ctr": avg_ctr,
            "avg_confidence": avg_confidence,
            "avg_relevance": avg_relevance,
            "top_performing_types": top_types,
        }


class CRUDContentSuggestionFeedback(
    CRUDBase[ContentSuggestionFeedback, ContentSuggestionFeedbackCreate, None]
):
    """CRUD operations for content suggestion feedback."""

    async def create_feedback(
        self,
        db: AsyncSession,
        *,
        obj_in: ContentSuggestionFeedbackCreate,
        user_id: int,
    ) -> ContentSuggestionFeedback:
        """Create feedback with user association."""
        db_obj = ContentSuggestionFeedback(
            **obj_in.model_dump(),
            user_id=user_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_suggestion_feedback(
        self,
        db: AsyncSession,
        *,
        suggestion_id: str,
    ) -> List[ContentSuggestionFeedback]:
        """Get all feedback for a suggestion."""
        result = await db.execute(
            select(ContentSuggestionFeedback)
            .where(ContentSuggestionFeedback.suggestion_id == suggestion_id)
            .order_by(desc(ContentSuggestionFeedback.created_at))
        )
        return result.scalars().all()


class CRUDContentAnalysisJob(
    CRUDBase[ContentAnalysisJob, ContentAnalysisJobCreate, None]
):
    """CRUD operations for content analysis jobs."""

    async def get_by_job_id(
        self, db: AsyncSession, *, job_id: str
    ) -> Optional[ContentAnalysisJob]:
        """Get analysis job by job_id."""
        result = await db.execute(
            select(ContentAnalysisJob)
            .options(selectinload(ContentAnalysisJob.content_item))
            .where(ContentAnalysisJob.job_id == job_id)
        )
        return result.scalar_one_or_none()

    async def create_analysis_job(
        self,
        db: AsyncSession,
        *,
        content_id: str,
        job_type: str,
    ) -> ContentAnalysisJob:
        """Create a new analysis job."""
        db_obj = ContentAnalysisJob(
            content_id=content_id,
            job_type=job_type,
            status="pending",
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_job_status(
        self,
        db: AsyncSession,
        *,
        job_id: str,
        status: str,
        progress: Optional[float] = None,
        results: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
        ai_model_used: Optional[str] = None,
        processing_time_seconds: Optional[float] = None,
        tokens_used: Optional[int] = None,
        cost_usd: Optional[float] = None,
    ) -> Optional[ContentAnalysisJob]:
        """Update analysis job status and results."""
        update_data = {"status": status}

        if status == "running" and not await self._job_has_started(db, job_id):
            update_data["started_at"] = datetime.utcnow()

        if status in ["completed", "failed"]:
            update_data["completed_at"] = datetime.utcnow()

        if progress is not None:
            update_data["progress"] = progress
        if results is not None:
            update_data["results"] = results
        if error_message is not None:
            update_data["error_message"] = error_message
        if ai_model_used is not None:
            update_data["ai_model_used"] = ai_model_used
        if processing_time_seconds is not None:
            update_data["processing_time_seconds"] = processing_time_seconds
        if tokens_used is not None:
            update_data["tokens_used"] = tokens_used
        if cost_usd is not None:
            update_data["cost_usd"] = cost_usd

        await db.execute(
            update(ContentAnalysisJob)
            .where(ContentAnalysisJob.job_id == job_id)
            .values(**update_data)
        )
        await db.commit()

        return await self.get_by_job_id(db, job_id=job_id)

    async def _job_has_started(self, db: AsyncSession, job_id: str) -> bool:
        """Check if job has started_at timestamp."""
        result = await db.execute(
            select(ContentAnalysisJob.started_at).where(
                ContentAnalysisJob.job_id == job_id
            )
        )
        started_at = result.scalar_one_or_none()
        return started_at is not None

    async def get_pending_jobs(
        self,
        db: AsyncSession,
        *,
        job_type: Optional[str] = None,
        limit: int = 100,
    ) -> List[ContentAnalysisJob]:
        """Get pending analysis jobs."""
        query = (
            select(ContentAnalysisJob)
            .where(ContentAnalysisJob.status == "pending")
            .order_by(ContentAnalysisJob.created_at)
        )

        if job_type:
            query = query.where(ContentAnalysisJob.job_type == job_type)

        query = query.limit(limit)

        result = await db.execute(query)
        return result.scalars().all()


# Create CRUD instances
content_item = CRUDContentItem(ContentItem)
content_suggestion = CRUDContentSuggestion(ContentSuggestion)
content_suggestion_feedback = CRUDContentSuggestionFeedback(ContentSuggestionFeedback)
content_analysis_job = CRUDContentAnalysisJob(ContentAnalysisJob)
