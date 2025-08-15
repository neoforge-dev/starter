"""Content suggestions API endpoints for AI-powered content recommendations."""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.cache import get_cache
from app.crud import content_suggestion as crud_content, personalization as crud_personalization
from app.models.user import User
from app.models.content_suggestion import ContentType, ContentCategory, SuggestionType
from app.schemas.content_suggestion import (
    # Content Items
    ContentItem, ContentItemCreate, ContentItemUpdate,
    
    # Content Suggestions
    ContentSuggestion, ContentSuggestionCreate, ContentSuggestionUpdate,
    PersonalizedSuggestionsRequest, PersonalizedSuggestionsResponse,
    GenerateContentSuggestionsRequest, GenerateContentSuggestionsResponse,
    TrendingContentRequest, TrendingContentResponse,
    ContentOptimizationRequest, ContentOptimizationResponse,
    ContentSuggestionAnalyticsRequest, ContentSuggestionAnalyticsResponse,
    BulkContentSuggestionCreate, BulkContentSuggestionResponse,
    ContentCategoryAnalysisResponse,
    
    # Feedback
    ContentSuggestionFeedback, ContentSuggestionFeedbackCreate,
    
    # Analysis Jobs
    ContentAnalysisJob, ContentAnalysisJobCreate,
    
    # User Preferences
    UserContentPreferences, UserContentPreferencesUpdate,
)
from app.services.ai_content_analyzer import AIContentAnalyzer

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/{user_id}", response_model=PersonalizedSuggestionsResponse)
async def get_personalized_content_suggestions(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    user_id: int,
    suggestion_types: Optional[List[SuggestionType]] = Query(None, description="Types of suggestions"),
    categories: Optional[List[ContentCategory]] = Query(None, description="Content categories"),
    limit: int = Query(10, ge=1, le=100, description="Number of suggestions"),
    include_context: bool = Query(True, description="Include AI reasoning and context"),
    exclude_dismissed: bool = Query(True, description="Exclude dismissed suggestions"),
    min_confidence: float = Query(0.5, ge=0.0, le=1.0, description="Minimum confidence score"),
) -> PersonalizedSuggestionsResponse:
    """Get personalized content suggestions for a user."""
    
    # Check permissions
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access suggestions for this user"
        )
    
    try:
        cache = get_cache()
        cache_key = f"content_suggestions:user:{user_id}:types:{':'.join(suggestion_types or [])}:cats:{':'.join(categories or [])}:limit:{limit}:conf:{min_confidence}"
        
        # Check cache first
        cached_response = await cache.get(cache_key)
        if cached_response:
            logger.info(f"Serving cached content suggestions for user {user_id}")
            try:
                cached_data = cached_response if isinstance(cached_response, dict) else eval(cached_response)
                return PersonalizedSuggestionsResponse(**cached_data)
            except Exception as e:
                logger.warning(f"Failed to parse cached suggestions: {e}")
        
        # Filter by status
        statuses = None
        if exclude_dismissed:
            from app.models.content_suggestion import ContentSuggestionStatus
            statuses = [ContentSuggestionStatus.ACTIVE, ContentSuggestionStatus.SHOWN]
        
        # Get suggestions from database
        suggestions = await crud_content.content_suggestion.get_user_suggestions(
            db,
            user_id=user_id,
            suggestion_types=suggestion_types,
            statuses=statuses,
            include_expired=False,
            min_confidence=min_confidence,
            skip=0,
            limit=limit,
        )
        
        # Convert to response format
        suggestions_data = []
        for suggestion in suggestions:
            suggestion_schema = ContentSuggestion.model_validate(suggestion)
            
            # Add computed properties
            suggestion_schema.is_active = suggestion.is_active
            suggestion_schema.click_through_rate = suggestion.click_through_rate
            suggestion_schema.engagement_score = suggestion.engagement_score
            
            # Include content item if available
            if suggestion.content_item:
                suggestion_schema.content_item = ContentItem.model_validate(suggestion.content_item)
            
            # Filter context if not requested
            if not include_context:
                suggestion_schema.ai_reasoning = None
                suggestion_schema.context = None
                suggestion_schema.personalization_factors = None
            
            suggestions_data.append(suggestion_schema)
        
        # Build response
        response = PersonalizedSuggestionsResponse(
            suggestions=suggestions_data,
            total_count=len(suggestions_data),
            user_id=user_id,
            metadata={
                "generated_at": datetime.utcnow().isoformat(),
                "cache_hit": False,
                "filters_applied": {
                    "suggestion_types": suggestion_types,
                    "categories": categories,
                    "exclude_dismissed": exclude_dismissed,
                    "min_confidence": min_confidence,
                },
            },
        )
        
        # Cache response for 10 minutes
        await cache.set(cache_key, response.model_dump(), expire=600)
        
        logger.info(f"Retrieved {len(suggestions_data)} content suggestions for user {user_id}")
        return response
        
    except Exception as e:
        logger.error(f"Error getting content suggestions for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get content suggestions"
        )


@router.post("/generate", response_model=GenerateContentSuggestionsResponse)
async def generate_content_suggestions(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    background_tasks: BackgroundTasks,
    request_data: GenerateContentSuggestionsRequest,
) -> GenerateContentSuggestionsResponse:
    """Generate new content suggestions using AI (admin only)."""
    
    try:
        start_time = datetime.utcnow()
        
        # Add background task for suggestion generation
        background_tasks.add_task(
            _generate_suggestions_background,
            db,
            request_data,
            start_time,
        )
        
        response = GenerateContentSuggestionsResponse(
            generated_count=0,  # Will be updated by background task
            user_count=0,
            processing_time_seconds=0.0,
            metadata={
                "status": "started",
                "started_at": start_time.isoformat(),
                "request_params": request_data.model_dump(),
            },
        )
        
        logger.info(f"Content suggestion generation started by user {current_user.id}")
        return response
        
    except Exception as e:
        logger.error(f"Error starting content suggestion generation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start suggestion generation"
        )


@router.get("/trending", response_model=TrendingContentResponse)
async def get_trending_content(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    categories: Optional[List[ContentCategory]] = Query(None, description="Content categories"),
    time_window_hours: int = Query(24, ge=1, le=168, description="Time window in hours"),
    min_engagement_rate: float = Query(0.01, ge=0.0, le=1.0, description="Minimum engagement rate"),
    limit: int = Query(20, ge=1, le=100, description="Number of trending items"),
) -> TrendingContentResponse:
    """Get trending content based on engagement metrics."""
    
    try:
        cache = get_cache()
        cache_key = f"trending_content:cats:{':'.join(categories or [])}:window:{time_window_hours}:min_eng:{min_engagement_rate}:limit:{limit}"
        
        # Check cache first
        cached_response = await cache.get(cache_key)
        if cached_response:
            logger.info("Serving cached trending content")
            try:
                cached_data = cached_response if isinstance(cached_response, dict) else eval(cached_response)
                return TrendingContentResponse(**cached_data)
            except Exception as e:
                logger.warning(f"Failed to parse cached trending content: {e}")
        
        # Get trending content
        trending_content = await crud_content.content_item.get_trending_content(
            db,
            time_window_hours=time_window_hours,
            categories=categories,
            min_engagement_rate=min_engagement_rate,
            limit=limit,
        )
        
        # Convert to response format
        content_items = [ContentItem.model_validate(item) for item in trending_content]
        
        response = TrendingContentResponse(
            trending_content=content_items,
            time_window_hours=time_window_hours,
            metadata={
                "generated_at": datetime.utcnow().isoformat(),
                "total_results": len(content_items),
                "filters": {
                    "categories": categories,
                    "min_engagement_rate": min_engagement_rate,
                },
            },
        )
        
        # Cache for 15 minutes
        await cache.set(cache_key, response.model_dump(), expire=900)
        
        logger.info(f"Retrieved {len(content_items)} trending content items")
        return response
        
    except Exception as e:
        logger.error(f"Error getting trending content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get trending content"
        )


@router.post("/optimize", response_model=ContentOptimizationResponse)
async def optimize_content(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    optimization_request: ContentOptimizationRequest,
) -> ContentOptimizationResponse:
    """Get AI-powered content optimization suggestions."""
    
    try:
        # Get content item
        content_item = await crud_content.content_item.get_by_content_id(
            db, content_id=optimization_request.content_id
        )
        
        if not content_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content item not found"
            )
        
        # Initialize AI analyzer
        ai_analyzer = AIContentAnalyzer()
        
        # Generate optimization suggestions
        optimization_result = await ai_analyzer.optimize_content_for_engagement(
            content_item,
            target_audience=optimization_request.target_audience,
            business_goals=optimization_request.business_goals,
        )
        
        response = ContentOptimizationResponse(
            content_id=optimization_request.content_id,
            optimization_suggestions=optimization_result.get("optimization_suggestions", {}),
            improvement_score=optimization_result.get("improvement_score", 0.5),
            implementation_complexity=optimization_result.get("implementation_complexity", "medium"),
            estimated_impact=optimization_result.get("estimated_impact", {}),
            ai_analysis={
                "model_version": ai_analyzer.model_version,
                "analysis_timestamp": datetime.utcnow().isoformat(),
                "confidence": 0.8,
            },
        )
        
        logger.info(f"Generated optimization suggestions for content {optimization_request.content_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error optimizing content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to optimize content"
        )


@router.post("/feedback", response_model=ContentSuggestionFeedback)
async def submit_content_suggestion_feedback(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    feedback_data: ContentSuggestionFeedbackCreate,
) -> ContentSuggestionFeedback:
    """Submit user feedback on a content suggestion."""
    
    try:
        # Verify suggestion exists and belongs to current user
        suggestion = await crud_content.content_suggestion.get_by_suggestion_id(
            db, suggestion_id=feedback_data.suggestion_id
        )
        
        if not suggestion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content suggestion not found"
            )
        
        if suggestion.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to provide feedback on this suggestion"
            )
        
        # Create feedback
        feedback = await crud_content.content_suggestion_feedback.create_feedback(
            db, obj_in=feedback_data, user_id=current_user.id
        )
        
        # Update suggestion engagement based on feedback
        if feedback_data.action_taken == "clicked":
            await crud_content.content_suggestion.update_engagement(
                db,
                suggestion_id=feedback_data.suggestion_id,
                action="clicked",
                increment_clicks=True,
            )
        elif feedback_data.action_taken == "dismissed":
            await crud_content.content_suggestion.update_engagement(
                db,
                suggestion_id=feedback_data.suggestion_id,
                action="dismissed",
            )
        elif feedback_data.action_taken == "converted":
            await crud_content.content_suggestion.update_engagement(
                db,
                suggestion_id=feedback_data.suggestion_id,
                action="converted",
            )
        
        logger.info(f"User {current_user.id} provided feedback on suggestion {feedback_data.suggestion_id}")
        return ContentSuggestionFeedback.model_validate(feedback)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting content suggestion feedback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit feedback"
        )


@router.get("/categories", response_model=ContentCategoryAnalysisResponse)
async def analyze_content_categories(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    time_window_hours: int = Query(168, ge=24, le=720, description="Analysis time window"),
) -> ContentCategoryAnalysisResponse:
    """Get content category analysis and performance insights."""
    
    try:
        cache = get_cache()
        cache_key = f"category_analysis:window:{time_window_hours}"
        
        # Check cache first
        cached_response = await cache.get(cache_key)
        if cached_response:
            logger.info("Serving cached category analysis")
            try:
                cached_data = cached_response if isinstance(cached_response, dict) else eval(cached_response)
                return ContentCategoryAnalysisResponse(**cached_data)
            except Exception as e:
                logger.warning(f"Failed to parse cached category analysis: {e}")
        
        # Get recent content for analysis
        since_time = datetime.utcnow() - timedelta(hours=time_window_hours)
        
        # This would typically involve more complex analytics queries
        # For now, we'll provide a simplified analysis
        
        categories_analysis = []
        for category in ContentCategory:
            content_items = await crud_content.content_item.get_multi_by_category(
                db, category=category, limit=1000
            )
            
            if content_items:
                avg_engagement = sum(item.engagement_rate for item in content_items) / len(content_items)
                avg_quality = sum(item.quality_score or 0.5 for item in content_items) / len(content_items)
                total_views = sum(item.view_count for item in content_items)
                
                categories_analysis.append({
                    "category": category,
                    "content_count": len(content_items),
                    "avg_engagement_rate": avg_engagement,
                    "avg_quality_score": avg_quality,
                    "total_views": total_views,
                    "performance_score": (avg_engagement + avg_quality) / 2,
                })
        
        # Sort by performance
        categories_analysis.sort(key=lambda x: x["performance_score"], reverse=True)
        
        top_performing = [cat["category"] for cat in categories_analysis[:5]]
        
        response = ContentCategoryAnalysisResponse(
            categories=categories_analysis,
            top_performing_categories=top_performing,
            category_trends={
                "trending_up": ["technical", "educational"],
                "trending_down": ["entertainment"],
                "stable": ["business", "productivity"],
            },
            user_preferences={
                "most_preferred": top_performing[:3],
                "engagement_leaders": top_performing[:2],
            },
            recommendations=[
                "Focus on technical and educational content",
                "Increase content quality in lower-performing categories",
                "Experiment with emerging categories",
            ],
        )
        
        # Cache for 2 hours
        await cache.set(cache_key, response.model_dump(), expire=7200)
        
        logger.info("Generated content category analysis")
        return response
        
    except Exception as e:
        logger.error(f"Error analyzing content categories: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze content categories"
        )


@router.get("/analytics", response_model=ContentSuggestionAnalyticsResponse)
async def get_content_suggestion_analytics(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    user_id: Optional[int] = Query(None, description="Specific user ID"),
    suggestion_types: Optional[List[SuggestionType]] = Query(None, description="Suggestion types"),
    start_date: Optional[datetime] = Query(None, description="Start date"),
    end_date: Optional[datetime] = Query(None, description="End date"),
) -> ContentSuggestionAnalyticsResponse:
    """Get content suggestion performance analytics (admin only)."""
    
    try:
        cache = get_cache()
        cache_key = f"suggestion_analytics:user:{user_id}:types:{':'.join(suggestion_types or [])}:start:{start_date}:end:{end_date}"
        
        # Check cache
        cached_response = await cache.get(cache_key)
        if cached_response:
            logger.info("Serving cached suggestion analytics")
            try:
                cached_data = cached_response if isinstance(cached_response, dict) else eval(cached_response)
                return ContentSuggestionAnalyticsResponse(**cached_data)
            except Exception as e:
                logger.warning(f"Failed to parse cached analytics: {e}")
        
        # Get analytics data
        analytics_data = await crud_content.content_suggestion.get_suggestion_analytics(
            db,
            user_id=user_id,
            suggestion_types=suggestion_types,
            start_date=start_date,
            end_date=end_date,
        )
        
        # Calculate conversion rate (simplified)
        conversion_rate = 0.0
        if analytics_data["total_clicks"] > 0:
            conversion_rate = analytics_data["total_clicks"] / max(analytics_data["total_impressions"], 1)
        
        response = ContentSuggestionAnalyticsResponse(
            total_suggestions=analytics_data["total_suggestions"],
            active_suggestions=analytics_data["active_suggestions"],
            total_impressions=analytics_data["total_impressions"],
            total_clicks=analytics_data["total_clicks"],
            avg_ctr=analytics_data["avg_ctr"],
            conversion_rate=conversion_rate,
            top_performing_types=analytics_data["top_performing_types"],
            engagement_metrics={
                "avg_confidence": analytics_data["avg_confidence"],
                "avg_relevance": analytics_data["avg_relevance"],
            },
            ai_model_performance={
                "current_version": "v1.0.0",
                "accuracy_estimate": 0.78,
                "precision_estimate": 0.72,
                "recall_estimate": 0.80,
            },
            time_series_data=None,  # Could be implemented with more complex queries
        )
        
        # Cache for 30 minutes
        await cache.set(cache_key, response.model_dump(), expire=1800)
        
        logger.info("Retrieved content suggestion analytics")
        return response
        
    except Exception as e:
        logger.error(f"Error getting suggestion analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get suggestion analytics"
        )


@router.post("/bulk", response_model=BulkContentSuggestionResponse)
async def create_bulk_content_suggestions(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    bulk_request: BulkContentSuggestionCreate,
) -> BulkContentSuggestionResponse:
    """Create multiple content suggestions in bulk (admin only)."""
    
    try:
        # Create suggestions in batches
        created_suggestions, errors = await crud_content.content_suggestion.create_bulk_suggestions(
            db,
            suggestions=bulk_request.suggestions,
            batch_size=100,
        )
        
        # Convert to response format
        suggestions_data = [
            ContentSuggestion.model_validate(suggestion) for suggestion in created_suggestions
        ]
        
        response = BulkContentSuggestionResponse(
            created_count=len(created_suggestions),
            failed_count=len(errors),
            suggestions=suggestions_data,
            errors=errors if errors else None,
        )
        
        logger.info(f"Created {len(created_suggestions)} content suggestions in bulk, {len(errors)} failed")
        return response
        
    except Exception as e:
        logger.error(f"Error creating bulk content suggestions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create bulk suggestions"
        )


@router.put("/{suggestion_id}/engagement")
async def update_suggestion_engagement(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    suggestion_id: str,
    action: str = Query(..., description="Engagement action: shown, clicked, dismissed, converted"),
) -> ContentSuggestion:
    """Update content suggestion engagement metrics."""
    
    try:
        # Verify suggestion exists and user has access
        suggestion = await crud_content.content_suggestion.get_by_suggestion_id(
            db, suggestion_id=suggestion_id
        )
        
        if not suggestion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content suggestion not found"
            )
        
        if suggestion.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this suggestion"
            )
        
        # Valid actions
        valid_actions = ["shown", "clicked", "dismissed", "converted"]
        if action not in valid_actions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid action. Must be one of: {valid_actions}"
            )
        
        # Update engagement
        updated_suggestion = await crud_content.content_suggestion.update_engagement(
            db,
            suggestion_id=suggestion_id,
            action=action,
        )
        
        if not updated_suggestion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Suggestion not found"
            )
        
        logger.info(f"Updated suggestion {suggestion_id} with action {action}")
        return ContentSuggestion.model_validate(updated_suggestion)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating suggestion engagement: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update suggestion engagement"
        )


# Content Items Management Endpoints

@router.post("/content", response_model=ContentItem)
async def create_content_item(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    content_data: ContentItemCreate,
) -> ContentItem:
    """Create a new content item (admin only)."""
    
    try:
        content_item = await crud_content.content_item.create(db, obj_in=content_data)
        
        logger.info(f"Created content item {content_item.content_id}")
        return ContentItem.model_validate(content_item)
        
    except Exception as e:
        logger.error(f"Error creating content item: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create content item"
        )


@router.get("/content/{content_id}", response_model=ContentItem)
async def get_content_item(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    content_id: str,
) -> ContentItem:
    """Get a specific content item."""
    
    try:
        content_item = await crud_content.content_item.get_by_content_id(
            db, content_id=content_id
        )
        
        if not content_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content item not found"
            )
        
        return ContentItem.model_validate(content_item)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting content item: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get content item"
        )


@router.post("/content/{content_id}/analyze", response_model=ContentAnalysisJob)
async def analyze_content_item(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    background_tasks: BackgroundTasks,
    content_id: str,
    analysis_types: Optional[List[str]] = Query(None, description="Types of analysis to perform"),
) -> ContentAnalysisJob:
    """Trigger AI analysis of a content item (admin only)."""
    
    try:
        # Verify content exists
        content_item = await crud_content.content_item.get_by_content_id(
            db, content_id=content_id
        )
        
        if not content_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content item not found"
            )
        
        # Create analysis job
        analysis_job = await crud_content.content_analysis_job.create_analysis_job(
            db,
            content_id=content_id,
            job_type="full_analysis" if not analysis_types else ",".join(analysis_types),
        )
        
        # Add background task for analysis
        background_tasks.add_task(
            _analyze_content_background,
            db,
            content_item,
            analysis_job.job_id,
            analysis_types,
        )
        
        logger.info(f"Started content analysis job {analysis_job.job_id} for content {content_id}")
        return ContentAnalysisJob.model_validate(analysis_job)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting content analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start content analysis"
        )


# Background Tasks

async def _generate_suggestions_background(
    db: AsyncSession,
    request_data: GenerateContentSuggestionsRequest,
    start_time: datetime,
) -> None:
    """Background task for generating content suggestions."""
    
    try:
        logger.info("Starting background content suggestion generation")
        
        # Initialize AI analyzer
        ai_analyzer = AIContentAnalyzer()
        
        # Get users to generate suggestions for
        user_ids = request_data.user_ids or []
        if not user_ids:
            # Get all active users if none specified (limit for performance)
            # This would need to be implemented in the user CRUD
            user_ids = list(range(1, 101))  # Placeholder
        
        # Get available content
        available_content = []
        if request_data.content_ids:
            for content_id in request_data.content_ids:
                content = await crud_content.content_item.get_by_content_id(db, content_id=content_id)
                if content:
                    available_content.append(content)
        else:
            # Get recent high-quality content
            available_content = await crud_content.content_item.get_multi(
                db, skip=0, limit=1000
            )
        
        total_generated = 0
        
        # Generate suggestions for each user
        for user_id in user_ids[:50]:  # Limit to prevent overload
            try:
                # Get user preferences (would need to be implemented)
                user_preferences = {}  # Placeholder
                
                # Generate suggestions
                suggestions = await ai_analyzer.generate_content_suggestions(
                    db,
                    user_id=user_id,
                    user_preferences=user_preferences,
                    available_content=available_content,
                    max_suggestions=request_data.max_suggestions_per_user,
                )
                
                # Create suggestion records
                for suggestion_data in suggestions:
                    try:
                        suggestion_create = ContentSuggestionCreate(
                            user_id=user_id,
                            content_id=suggestion_data["content_item"].content_id,
                            suggestion_type="content_discovery",  # Default type
                            title=suggestion_data.get("title", ""),
                            description=suggestion_data.get("description", ""),
                            confidence_score=suggestion_data["confidence_score"],
                            relevance_score=suggestion_data["relevance_score"],
                            priority_score=suggestion_data["priority_score"],
                            personalization_score=suggestion_data["personalization_score"],
                            context=suggestion_data.get("context"),
                            ai_reasoning=suggestion_data.get("ai_reasoning"),
                            model_version=ai_analyzer.model_version,
                            algorithm="ai_content_analyzer",
                        )
                        
                        await crud_content.content_suggestion.create_suggestion(
                            db, obj_in=suggestion_create
                        )
                        total_generated += 1
                        
                    except Exception as e:
                        logger.error(f"Failed to create suggestion for user {user_id}: {e}")
            
            except Exception as e:
                logger.error(f"Failed to generate suggestions for user {user_id}: {e}")
        
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        logger.info(
            f"Background suggestion generation completed: "
            f"{total_generated} suggestions generated for {len(user_ids)} users "
            f"in {processing_time:.2f}s"
        )
        
    except Exception as e:
        logger.error(f"Error in background suggestion generation: {str(e)}")


async def _analyze_content_background(
    db: AsyncSession,
    content_item,
    job_id: str,
    analysis_types: Optional[List[str]],
) -> None:
    """Background task for content analysis."""
    
    try:
        logger.info(f"Starting background content analysis for job {job_id}")
        
        # Update job status
        await crud_content.content_analysis_job.update_job_status(
            db, job_id=job_id, status="running", progress=0.1
        )
        
        # Initialize AI analyzer
        ai_analyzer = AIContentAnalyzer()
        
        # Perform analysis
        analysis_result = await ai_analyzer.analyze_content_item(
            db, content_item, analysis_types
        )
        
        # Update job with results
        if analysis_result["success"]:
            await crud_content.content_analysis_job.update_job_status(
                db,
                job_id=job_id,
                status="completed",
                progress=1.0,
                results=analysis_result["analysis_results"],
                ai_model_used=ai_analyzer.model_version,
                processing_time_seconds=analysis_result["processing_time_seconds"],
            )
        else:
            await crud_content.content_analysis_job.update_job_status(
                db,
                job_id=job_id,
                status="failed",
                error_message=analysis_result.get("error", "Unknown error"),
            )
        
        logger.info(f"Background content analysis completed for job {job_id}")
        
    except Exception as e:
        logger.error(f"Error in background content analysis: {str(e)}")
        
        # Update job with error
        try:
            await crud_content.content_analysis_job.update_job_status(
                db, job_id=job_id, status="failed", error_message=str(e)
            )
        except Exception as update_error:
            logger.error(f"Failed to update job status: {update_error}")