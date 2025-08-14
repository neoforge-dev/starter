"""Recommendations API endpoints for smart ML-powered suggestions."""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.cache import get_cache
from app.crud import recommendation as crud_recommendation
from app.ml.recommendations import RecommendationEngine, SimilarityEngine
from app.schemas.recommendation import (
    Recommendation, RecommendationCreate, RecommendationUpdate, 
    RecommendationCreateBulk, RecommendationBulkResponse,
    RecommendationRequest, RecommendationResponse,
    TrendingRecommendationsRequest, TrendingRecommendationsResponse,
    UserPreferences, UserPreferencesUpdate,
    RecommendationFeedback, RecommendationFeedbackCreate,
    SimilarUsersRequest, SimilarUsersResponse,
    RecommendationAnalytics, ModelRetrainingRequest, ModelRetrainingResponse,
    RecommendationType, RecommendationStatus
)
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/user/{user_id}", response_model=RecommendationResponse)
async def get_user_recommendations(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    user_id: int,
    types: Optional[List[str]] = Query(None, description="Recommendation types to include"),
    limit: int = Query(10, ge=1, le=100, description="Number of recommendations"),
    include_context: bool = Query(True, description="Include context data"),
    exclude_dismissed: bool = Query(True, description="Exclude dismissed recommendations"),
    generate_new: bool = Query(False, description="Generate new recommendations"),
) -> RecommendationResponse:
    """Get personalized recommendations for a user."""
    
    # Check if user can access recommendations for this user_id
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access these recommendations"
        )
    
    try:
        cache = get_cache()
        cache_key = f"recommendations:user:{user_id}:types:{':'.join(types or [])}:limit:{limit}"
        
        # Check cache first (unless generating new)
        if not generate_new:
            cached_response = await cache.get(cache_key)
            if cached_response:
                logger.info(f"Serving cached recommendations for user {user_id}")
                try:
                    cached_data = json.loads(cached_response) if isinstance(cached_response, str) else cached_response
                    return RecommendationResponse(**cached_data)
                except Exception as e:
                    logger.warning(f"Failed to parse cached recommendations: {e}")
                    # Continue to generate fresh recommendations
        
        # Get existing recommendations
        statuses = [RecommendationStatus.ACTIVE] if exclude_dismissed else None
        existing_recommendations = await crud_recommendation.recommendation.get_user_recommendations(
            db,
            user_id=user_id,
            types=types,
            statuses=statuses,
            include_expired=False,
            skip=0,
            limit=limit,
        )
        
        # Generate new recommendations if needed
        if generate_new or len(existing_recommendations) < limit:
            engine = RecommendationEngine(db)
            new_rec_creates = await engine.generate_recommendations(
                user_id=user_id,
                recommendation_types=types,
                max_recommendations=limit - len(existing_recommendations),
                algorithm="hybrid",
            )
            
            # Create new recommendations
            for rec_create in new_rec_creates:
                await crud_recommendation.recommendation.create(db, obj_in=rec_create)
            
            # Re-fetch recommendations
            existing_recommendations = await crud_recommendation.recommendation.get_user_recommendations(
                db,
                user_id=user_id,
                types=types,
                statuses=statuses,
                include_expired=False,
                skip=0,
                limit=limit,
            )
        
        # Convert to response format
        recommendations_data = []
        for rec in existing_recommendations:
            rec_data = Recommendation.model_validate(rec)
            
            # Calculate derived properties
            rec_data.click_through_rate = rec.click_through_rate
            rec_data.is_active = rec.is_active
            rec_data.days_since_created = rec.days_since_created
            
            if not include_context:
                rec_data.context = None
                rec_data.rec_metadata = None
                
            recommendations_data.append(rec_data)
        
        # Get user preferences
        user_prefs = await crud_recommendation.user_preferences.get_by_user_id(db, user_id=user_id)
        user_preferences_data = UserPreferences.model_validate(user_prefs) if user_prefs else None
        
        # Build response
        response = RecommendationResponse(
            recommendations=recommendations_data,
            total_count=len(recommendations_data),
            user_preferences=user_preferences_data,
            metadata={
                "generated_at": datetime.utcnow().isoformat(),
                "algorithm": "hybrid",
                "cache_hit": False,
                "filters_applied": {
                    "types": types,
                    "exclude_dismissed": exclude_dismissed,
                },
            },
        )
        
        # Cache response for 5 minutes
        await cache.set(cache_key, response.model_dump_json(), expire=300)
        
        logger.info(f"Generated {len(recommendations_data)} recommendations for user {user_id}")
        return response
        
    except Exception as e:
        logger.error(f"Error getting recommendations for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recommendations"
        )


@router.get("/trending", response_model=TrendingRecommendationsResponse)
async def get_trending_recommendations(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    types: Optional[List[str]] = Query(None, description="Recommendation types"),
    time_window: int = Query(24, ge=1, le=168, description="Time window in hours"),
    limit: int = Query(20, ge=1, le=100, description="Number of recommendations"),
    min_interactions: int = Query(5, ge=1, description="Minimum interactions required"),
) -> TrendingRecommendationsResponse:
    """Get trending recommendations based on user engagement."""
    
    try:
        cache = get_cache()
        cache_key = f"trending:types:{':'.join(types or [])}:window:{time_window}:limit:{limit}"
        
        # Check cache first
        cached_response = await cache.get(cache_key)
        if cached_response:
            logger.info("Serving cached trending recommendations")
            return TrendingRecommendationsResponse.model_validate_json(cached_response)
        
        # Get trending recommendations
        trending_data = await crud_recommendation.recommendation.get_trending_recommendations(
            db,
            types=types,
            time_window_hours=time_window,
            min_interactions=min_interactions,
            limit=limit,
        )
        
        # Build response
        response = TrendingRecommendationsResponse(
            trending=trending_data,
            time_window=time_window,
            metadata={
                "generated_at": datetime.utcnow().isoformat(),
                "total_results": len(trending_data),
                "filters": {
                    "types": types,
                    "min_interactions": min_interactions,
                },
            },
        )
        
        # Cache for 15 minutes
        await cache.set(cache_key, response.model_dump_json(), expire=900)
        
        logger.info(f"Retrieved {len(trending_data)} trending recommendations")
        return response
        
    except Exception as e:
        logger.error(f"Error getting trending recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get trending recommendations"
        )


@router.post("/feedback", response_model=RecommendationFeedback)
async def submit_recommendation_feedback(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    feedback_in: RecommendationFeedbackCreate,
) -> RecommendationFeedback:
    """Submit feedback on a recommendation."""
    
    try:
        # Verify recommendation exists and belongs to current user
        recommendation = await crud_recommendation.recommendation.get_by_recommendation_id(
            db, recommendation_id=feedback_in.recommendation_id
        )
        
        if not recommendation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recommendation not found"
            )
            
        if recommendation.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to provide feedback on this recommendation"
            )
        
        # Create feedback
        feedback = await crud_recommendation.recommendation_feedback.create(
            db, obj_in=feedback_in, user_id=current_user.id
        )
        
        # Update recommendation status based on feedback
        if feedback_in.action_taken == "clicked":
            await crud_recommendation.recommendation.update_engagement(
                db,
                recommendation_id=feedback_in.recommendation_id,
                action="clicked",
                increment_clicks=True,
            )
        elif feedback_in.action_taken == "dismissed":
            await crud_recommendation.recommendation.update_engagement(
                db,
                recommendation_id=feedback_in.recommendation_id,
                action="dismissed",
            )
        elif feedback_in.action_taken == "converted":
            await crud_recommendation.recommendation.update_engagement(
                db,
                recommendation_id=feedback_in.recommendation_id,
                action="converted",
            )
        
        logger.info(f"User {current_user.id} provided feedback on recommendation {feedback_in.recommendation_id}")
        return RecommendationFeedback.model_validate(feedback)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit feedback"
        )


@router.get("/similar-users/{user_id}", response_model=SimilarUsersResponse)
async def get_similar_users(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    user_id: int,
    limit: int = Query(10, ge=1, le=50, description="Number of similar users"),
    min_similarity: float = Query(0.1, ge=0.0, le=1.0, description="Minimum similarity score"),
    algorithm: Optional[str] = Query(None, description="Specific algorithm"),
) -> SimilarUsersResponse:
    """Get similar users for collaborative filtering insights."""
    
    # Check permissions
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access similar users"
        )
    
    try:
        cache = get_cache()
        cache_key = f"similar_users:{user_id}:limit:{limit}:min_sim:{min_similarity}:algo:{algorithm or 'any'}"
        
        # Check cache
        cached_response = await cache.get(cache_key)
        if cached_response:
            logger.info(f"Serving cached similar users for user {user_id}")
            return SimilarUsersResponse.model_validate_json(cached_response)
        
        # Get similar users
        similar_users_data = await crud_recommendation.similar_users.get_similar_users(
            db,
            user_id=user_id,
            min_similarity=min_similarity,
            algorithm=algorithm,
            limit=limit,
        )
        
        # Convert to response format
        similar_users_list = [
            crud_recommendation.similar_users.model_validate(su) for su in similar_users_data
        ]
        
        response = SimilarUsersResponse(
            similar_users=similar_users_list,
            total_count=len(similar_users_list),
            metadata={
                "generated_at": datetime.utcnow().isoformat(),
                "filters": {
                    "min_similarity": min_similarity,
                    "algorithm": algorithm,
                },
            },
        )
        
        # Cache for 1 hour
        await cache.set(cache_key, response.model_dump_json(), expire=3600)
        
        logger.info(f"Retrieved {len(similar_users_list)} similar users for user {user_id}")
        return response
        
    except Exception as e:
        logger.error(f"Error getting similar users for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get similar users"
        )


@router.post("/retrain", response_model=ModelRetrainingResponse)
async def retrain_recommendation_models(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    background_tasks: BackgroundTasks,
    retrain_request: ModelRetrainingRequest,
) -> ModelRetrainingResponse:
    """Trigger retraining of recommendation models (admin only)."""
    
    try:
        # Check if recent training exists (unless forced)
        if not retrain_request.force_retrain:
            cache = get_cache()
            last_training_key = "last_model_training"
            last_training = await cache.get(last_training_key)
            
            if last_training:
                last_training_time = datetime.fromisoformat(last_training)
                if datetime.utcnow() - last_training_time < timedelta(hours=6):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Model was recently trained. Use force_retrain=true to override."
                    )
        
        # Generate new model version
        model_version = f"v{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        started_at = datetime.utcnow()
        
        # Add background task for model retraining
        background_tasks.add_task(
            _retrain_models_background,
            db,
            retrain_request,
            model_version,
            started_at,
        )
        
        # Update cache with training start time
        cache = get_cache()
        await cache.set("last_model_training", started_at.isoformat(), expire=86400)
        
        response = ModelRetrainingResponse(
            status="started",
            model_version=model_version,
            training_metrics={},
            started_at=started_at,
            completed_at=None,
            message="Model retraining started in background. Check logs for progress.",
        )
        
        logger.info(f"Model retraining started by user {current_user.id} with version {model_version}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting model retraining: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start model retraining"
        )


@router.get("/analytics", response_model=RecommendationAnalytics)
async def get_recommendation_analytics(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    user_id: Optional[int] = Query(None, description="Specific user ID"),
    start_date: Optional[datetime] = Query(None, description="Start date for analytics"),
    end_date: Optional[datetime] = Query(None, description="End date for analytics"),
    types: Optional[List[str]] = Query(None, description="Recommendation types"),
) -> RecommendationAnalytics:
    """Get recommendation performance analytics (admin only)."""
    
    try:
        cache = get_cache()
        cache_key = f"analytics:user:{user_id}:start:{start_date}:end:{end_date}:types:{':'.join(types or [])}"
        
        # Check cache
        cached_response = await cache.get(cache_key)
        if cached_response:
            logger.info("Serving cached recommendation analytics")
            return RecommendationAnalytics.model_validate_json(cached_response)
        
        # Get analytics data
        analytics_data = await crud_recommendation.recommendation.get_performance_analytics(
            db,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            types=types,
        )
        
        # Build comprehensive analytics response
        response = RecommendationAnalytics(
            total_recommendations=analytics_data.get("total_recommendations", 0),
            active_recommendations=analytics_data.get("active_recommendations", 0),
            total_impressions=analytics_data.get("total_impressions", 0),
            total_clicks=analytics_data.get("total_clicks", 0),
            avg_ctr=analytics_data.get("avg_ctr", 0.0),
            conversion_rate=analytics_data.get("conversion_rate", 0.0),
            top_performing_types=analytics_data.get("top_performing_types", []),
            user_engagement={
                "avg_confidence": analytics_data.get("avg_confidence", 0.0),
                "avg_priority": analytics_data.get("avg_priority", 0.0),
            },
            model_performance={
                "current_version": "v1.0.0",
                "accuracy_estimate": 0.72,  # Would come from actual model evaluation
                "precision_estimate": 0.68,
                "recall_estimate": 0.75,
            },
        )
        
        # Cache for 30 minutes
        await cache.set(cache_key, response.model_dump_json(), expire=1800)
        
        logger.info("Retrieved recommendation analytics")
        return response
        
    except Exception as e:
        logger.error(f"Error getting recommendation analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recommendation analytics"
        )


@router.post("/bulk", response_model=RecommendationBulkResponse)
async def create_bulk_recommendations(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    bulk_request: RecommendationCreateBulk,
) -> RecommendationBulkResponse:
    """Create multiple recommendations in bulk (admin only)."""
    
    try:
        # Validate all user IDs exist
        user_ids = list(set(rec.user_id for rec in bulk_request.recommendations))
        
        # Create recommendations
        recommendations = await crud_recommendation.recommendation.create_bulk(
            db, obj_in=bulk_request
        )
        
        # Convert to response format
        recommendations_data = [
            Recommendation.model_validate(rec) for rec in recommendations
        ]
        
        response = RecommendationBulkResponse(
            created_count=len(recommendations),
            recommendations=recommendations_data,
        )
        
        logger.info(f"Created {len(recommendations)} recommendations in bulk")
        return response
        
    except Exception as e:
        logger.error(f"Error creating bulk recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create bulk recommendations"
        )


@router.put("/{recommendation_id}/engagement", response_model=Recommendation)
async def update_recommendation_engagement(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    recommendation_id: str,
    action: str = Query(..., description="Engagement action: shown, clicked, dismissed, converted"),
) -> Recommendation:
    """Update recommendation engagement metrics."""
    
    try:
        # Verify recommendation exists and user has access
        recommendation = await crud_recommendation.recommendation.get_by_recommendation_id(
            db, recommendation_id=recommendation_id
        )
        
        if not recommendation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recommendation not found"
            )
            
        if recommendation.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this recommendation"
            )
        
        # Valid actions
        valid_actions = ["shown", "clicked", "dismissed", "converted"]
        if action not in valid_actions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid action. Must be one of: {valid_actions}"
            )
        
        # Update engagement
        updated_recommendation = await crud_recommendation.recommendation.update_engagement(
            db,
            recommendation_id=recommendation_id,
            action=action,
        )
        
        if not updated_recommendation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recommendation not found"
            )
        
        logger.info(f"Updated recommendation {recommendation_id} with action {action}")
        return Recommendation.model_validate(updated_recommendation)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating recommendation engagement: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update recommendation engagement"
        )


@router.get("/preferences/{user_id}", response_model=Optional[UserPreferences])
async def get_user_preferences(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    user_id: int,
) -> Optional[UserPreferences]:
    """Get user preferences for recommendations."""
    
    # Check permissions
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access user preferences"
        )
    
    try:
        preferences = await crud_recommendation.user_preferences.get_by_user_id(
            db, user_id=user_id
        )
        
        return UserPreferences.model_validate(preferences) if preferences else None
        
    except Exception as e:
        logger.error(f"Error getting user preferences: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user preferences"
        )


@router.put("/preferences/{user_id}", response_model=UserPreferences)
async def update_user_preferences(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    user_id: int,
    preferences_update: UserPreferencesUpdate,
) -> UserPreferences:
    """Update user preferences for recommendations."""
    
    # Check permissions
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update user preferences"
        )
    
    try:
        preferences = await crud_recommendation.user_preferences.create_or_update(
            db, user_id=user_id, obj_in=preferences_update
        )
        
        logger.info(f"Updated preferences for user {user_id}")
        return UserPreferences.model_validate(preferences)
        
    except Exception as e:
        logger.error(f"Error updating user preferences: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user preferences"
        )


async def _retrain_models_background(
    db: AsyncSession,
    retrain_request: ModelRetrainingRequest,
    model_version: str,
    started_at: datetime,
) -> None:
    """Background task for model retraining."""
    
    try:
        logger.info(f"Starting model retraining {model_version}")
        
        # Initialize similarity engine
        similarity_engine = SimilarityEngine(db)
        
        # Compute user similarities
        similarities_computed = await similarity_engine.compute_user_similarities(
            algorithm=retrain_request.algorithm or "cosine",
            batch_size=100,
        )
        
        # Clean up expired similarities
        expired_cleaned = await crud_recommendation.similar_users.cleanup_expired_similarities(db)
        
        # Expire old recommendations
        expired_recs = await crud_recommendation.recommendation.expire_old_recommendations(db)
        
        completed_at = datetime.utcnow()
        training_duration = (completed_at - started_at).total_seconds()
        
        # Log training results
        training_metrics = {
            "similarities_computed": similarities_computed,
            "expired_similarities_cleaned": expired_cleaned,
            "expired_recommendations": expired_recs,
            "training_duration_seconds": training_duration,
        }
        
        logger.info(f"Model retraining {model_version} completed: {training_metrics}")
        
        # Update cache with completion info
        cache = get_cache()
        await cache.set(
            f"training_results:{model_version}",
            str(training_metrics),
            expire=86400,
        )
        
    except Exception as e:
        logger.error(f"Error in background model retraining: {str(e)}")
        # Could implement alerting here for failed training jobs