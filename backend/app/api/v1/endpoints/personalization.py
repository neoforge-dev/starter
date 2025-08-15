"""Personalization API endpoints for adaptive user experiences."""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.crud.personalization import (
    personalization_profile,
    personalization_rule,
    personalization_interaction,
    personalization_analytics,
)
from app.models.user import User
from app.personalization.engine import PersonalizationEngine
from app.schemas.personalization import (
    PersonalizationProfile,
    PersonalizationProfileCreate,
    PersonalizationProfileUpdate,
    PersonalizationRule,
    PersonalizationRuleCreate,
    PersonalizationRuleUpdate,
    PersonalizationInteraction,
    PersonalizationInteractionCreate,
    BulkInteractionCreate,
    PersonalizationConfig,
    PersonalizationRequest,
    PersonalizationAnalytics,
    PersonalizationInsights,
    RulePerformanceReport,
    RuleOptimizationRequest,
    SegmentAnalytics,
    PersonalizationProfileList,
    PersonalizationRuleList,
    PersonalizationInteractionList,
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize personalization engine
personalization_engine = PersonalizationEngine()


@router.get("/profile/{user_id}", response_model=PersonalizationProfile)
async def get_user_personalization_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PersonalizationProfile:
    """
    Get personalization profile for a user.
    
    Retrieves the complete personalization profile including:
    - User segment and confidence
    - Behavioral patterns and preferences
    - ML-generated insights
    - Usage statistics
    """
    # Check permissions - users can only see their own profile unless admin
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this profile"
        )
    
    profile = await personalization_profile.get_by_user_id(db, user_id=user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Personalization profile not found"
        )
    
    return profile


@router.post("/profile/{user_id}", response_model=PersonalizationProfile)
async def create_or_update_personalization_profile(
    user_id: int,
    profile_data: PersonalizationProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PersonalizationProfile:
    """
    Create or update personalization profile for a user.
    
    Allows updating user preferences, behavioral patterns,
    and other personalization data.
    """
    # Check permissions
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to modify this profile"
        )
    
    try:
        # Use personalization engine to update profile
        profile = await personalization_engine.update_user_profile(
            db,
            user_id=user_id,
            interaction_data=profile_data.model_dump(exclude_unset=True),
            force_recompute=False
        )
        
        return profile
        
    except Exception as e:
        logger.error(f"Error updating profile for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update personalization profile"
        )


@router.post("/profile/{user_id}/recompute", response_model=PersonalizationProfile)
async def recompute_user_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PersonalizationProfile:
    """
    Force recomputation of user personalization profile.
    
    Triggers a full analysis of user behavior and regenerates
    the personalization profile from scratch.
    """
    # Check permissions
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to recompute this profile"
        )
    
    try:
        profile = await personalization_engine.update_user_profile(
            db,
            user_id=user_id,
            force_recompute=True
        )
        
        return profile
        
    except Exception as e:
        logger.error(f"Error recomputing profile for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to recompute personalization profile"
        )


@router.post("/config", response_model=PersonalizationConfig)
async def get_personalized_configuration(
    request: PersonalizationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PersonalizationConfig:
    """
    Get personalized configuration for a user in a specific context.
    
    This is the main endpoint for real-time personalization.
    Returns adaptive UI settings, content filters, feature flags,
    and navigation customizations.
    """
    # Check permissions
    if current_user.id != request.user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to get personalization for this user"
        )
    
    try:
        config = await personalization_engine.get_personalized_config(db, request=request)
        return config
        
    except Exception as e:
        logger.error(f"Error generating personalized config for user {request.user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate personalized configuration"
        )


@router.post("/rules", response_model=PersonalizationRule)
async def create_personalization_rule(
    rule: PersonalizationRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PersonalizationRule:
    """
    Create a new personalization rule.
    
    Rules define how the system adapts the user experience
    based on user segments, contexts, and conditions.
    """
    # Only superusers can create rules
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to create personalization rules"
        )
    
    try:
        created_rule = await personalization_rule.create_rule(db, obj_in=rule)
        return created_rule
        
    except Exception as e:
        logger.error(f"Error creating personalization rule: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create personalization rule"
        )


@router.get("/rules", response_model=PersonalizationRuleList)
async def list_personalization_rules(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    personalization_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    segment: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PersonalizationRuleList:
    """
    List personalization rules with filtering options.
    
    Supports filtering by type, status, and target segment.
    """
    # Only superusers can list all rules
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to list personalization rules"
        )
    
    try:
        if personalization_type:
            rules = await personalization_rule.get_rules_by_type(
                db,
                personalization_type=personalization_type,
                is_active=is_active if is_active is not None else True,
                skip=skip,
                limit=limit
            )
        else:
            rules = await personalization_rule.get_multi(db, skip=skip, limit=limit)
        
        # Get total count for pagination
        total = await personalization_rule.count(db)
        
        return PersonalizationRuleList(
            rules=rules,
            total=total,
            page=skip // limit + 1,
            size=limit,
            pages=(total + limit - 1) // limit
        )
        
    except Exception as e:
        logger.error(f"Error listing personalization rules: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list personalization rules"
        )


@router.put("/rules/{rule_id}", response_model=PersonalizationRule)
async def update_personalization_rule(
    rule_id: str,
    rule_update: PersonalizationRuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PersonalizationRule:
    """
    Update an existing personalization rule.
    
    Allows modification of rule configuration, conditions,
    targeting, and status.
    """
    # Only superusers can update rules
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update personalization rules"
        )
    
    rule = await personalization_rule.get_by_field(db, field="rule_id", value=rule_id)
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Personalization rule not found"
        )
    
    try:
        updated_rule = await personalization_rule.update(
            db, db_obj=rule, obj_in=rule_update
        )
        return updated_rule
        
    except Exception as e:
        logger.error(f"Error updating personalization rule {rule_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update personalization rule"
        )


@router.delete("/rules/{rule_id}")
async def delete_personalization_rule(
    rule_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, str]:
    """
    Delete a personalization rule.
    
    Removes the rule and all associated interactions.
    """
    # Only superusers can delete rules
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete personalization rules"
        )
    
    rule = await personalization_rule.get_by_field(db, field="rule_id", value=rule_id)
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Personalization rule not found"
        )
    
    try:
        await personalization_rule.remove(db, id=rule.id)
        return {"message": "Personalization rule deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting personalization rule {rule_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete personalization rule"
        )


@router.post("/track-interaction")
async def track_personalization_interaction(
    interaction: PersonalizationInteractionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, str]:
    """
    Track a personalization interaction.
    
    Records user interactions with personalized elements
    for analytics and optimization.
    """
    # Users can only track their own interactions
    if current_user.id != interaction.user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to track interaction for this user"
        )
    
    try:
        await personalization_engine.track_interaction(db, interaction=interaction)
        return {"message": "Interaction tracked successfully"}
        
    except Exception as e:
        logger.error(f"Error tracking personalization interaction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to track personalization interaction"
        )


@router.post("/track-interactions")
async def track_bulk_personalization_interactions(
    interactions: BulkInteractionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, str]:
    """
    Track multiple personalization interactions efficiently.
    
    Batch endpoint for tracking multiple interactions
    with better performance.
    """
    # Verify permissions for all interactions
    for interaction in interactions.interactions:
        if current_user.id != interaction.user_id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to track interactions for all users"
            )
    
    try:
        await personalization_interaction.create_bulk_interactions(
            db, interactions=interactions.interactions
        )
        return {"message": f"Tracked {len(interactions.interactions)} interactions successfully"}
        
    except Exception as e:
        logger.error(f"Error tracking bulk personalization interactions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to track personalization interactions"
        )


@router.get("/interactions/{user_id}", response_model=PersonalizationInteractionList)
async def get_user_interactions(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    context: Optional[str] = None,
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PersonalizationInteractionList:
    """
    Get personalization interactions for a user.
    
    Returns interaction history with optional filtering
    by context and time period.
    """
    # Check permissions
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view interactions for this user"
        )
    
    try:
        interactions = await personalization_interaction.get_user_interactions(
            db,
            user_id=user_id,
            context=context,
            days=days,
            skip=skip,
            limit=limit
        )
        
        # Get total count for pagination
        total = len(interactions) + skip  # Simplified count
        
        return PersonalizationInteractionList(
            interactions=interactions,
            total=total,
            page=skip // limit + 1,
            size=limit,
            pages=(total + limit - 1) // limit
        )
        
    except Exception as e:
        logger.error(f"Error getting interactions for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get personalization interactions"
        )


@router.get("/analytics", response_model=PersonalizationAnalytics)
async def get_personalization_analytics(
    days: int = Query(30, ge=1, le=365),
    segment: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PersonalizationAnalytics:
    """
    Get personalization system analytics.
    
    Provides performance metrics, success rates,
    and optimization insights across segments and rules.
    """
    # Only superusers can view analytics
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view personalization analytics"
        )
    
    try:
        # Get comprehensive analytics
        period_start = datetime.utcnow() - timedelta(days=days)
        period_end = datetime.utcnow()
        
        # Get segment performance
        segment_performance = await personalization_analytics.get_segment_performance(
            db, days=days
        )
        
        # Get top performing rules
        top_rules = await personalization_analytics.get_top_performing_rules(
            db, days=days, limit=10
        )
        
        # Get overall metrics
        overall_analytics = await personalization_interaction.get_interaction_analytics(
            db, days=days
        )
        
        # Calculate improvement metrics (simplified)
        conversion_improvement = 15.0  # Placeholder - would be calculated from A/B test data
        
        return PersonalizationAnalytics(
            total_rules=await personalization_rule.count(db),
            active_rules=len([r for r in await personalization_rule.get_multi(db, limit=1000) if r.is_active]),
            total_interactions=overall_analytics["total_interactions"],
            avg_response_time_ms=overall_analytics["avg_response_time_ms"],
            success_rate=overall_analytics["success_rate"],
            conversion_improvement=conversion_improvement,
            segment_performance=segment_performance,
            top_performing_rules=top_rules,
            improvement_opportunities=[
                "Optimize rules for casual_user segment",
                "Improve response time for UI adaptations",
                "Add more personalization rules for mobile context"
            ],
            period_start=period_start,
            period_end=period_end
        )
        
    except Exception as e:
        logger.error(f"Error getting personalization analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get personalization analytics"
        )


@router.get("/segments", response_model=List[SegmentAnalytics])
async def get_segment_analytics(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[SegmentAnalytics]:
    """
    Get analytics for all user segments.
    
    Returns performance metrics and insights
    for each user segment.
    """
    # Only superusers can view segment analytics
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view segment analytics"
        )
    
    try:
        period_start = datetime.utcnow() - timedelta(days=days)
        period_end = datetime.utcnow()
        
        # Get all segments
        segments = ["new_user", "casual_user", "feature_explorer", "power_user", "goal_oriented"]
        segment_analytics = []
        
        for segment in segments:
            # Get or compute segment analysis
            try:
                analysis = await personalization_analytics.compute_segment_analysis(
                    db,
                    segment=segment,
                    period_start=period_start,
                    period_end=period_end
                )
                
                segment_analytics.append(SegmentAnalytics(
                    segment=analysis.segment,
                    total_users=analysis.total_users,
                    active_users=analysis.active_users,
                    avg_session_duration=analysis.avg_session_duration,
                    conversion_rate=analysis.conversion_rate,
                    personalization_effectiveness=analysis.personalization_effectiveness,
                    top_performing_rules=analysis.top_performing_rules,
                    improvement_opportunities=analysis.improvement_opportunities,
                    period_start=analysis.period_start,
                    period_end=analysis.period_end
                ))
                
            except Exception as e:
                logger.warning(f"Error analyzing segment {segment}: {e}")
                continue
        
        return segment_analytics
        
    except Exception as e:
        logger.error(f"Error getting segment analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get segment analytics"
        )


@router.get("/insights/{user_id}", response_model=PersonalizationInsights)
async def get_user_personalization_insights(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PersonalizationInsights:
    """
    Get comprehensive personalization insights for a user.
    
    Provides ML-driven insights, behavioral analysis,
    and optimization recommendations.
    """
    # Check permissions
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view insights for this user"
        )
    
    try:
        insights_data = await personalization_engine.get_user_insights(db, user_id=user_id)
        
        if "error" in insights_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=insights_data["error"]
            )
        
        # Convert to response model
        return PersonalizationInsights(
            user_id=user_id,
            segment=insights_data["profile"]["segment"],
            segment_confidence=insights_data["profile"]["segment_confidence"],
            behavioral_insights=insights_data.get("behavior_patterns", {}),
            predicted_actions=[
                {"action": action, "confidence": 0.8} 
                for action in insights_data.get("ml_insights", {}).get("next_actions", [])
            ],
            optimization_recommendations=[
                {"type": "engagement", "recommendation": "Increase feature adoption"}
            ],
            churn_risk_factors=insights_data.get("ml_insights", {}).get("churn_factors", []),
            engagement_opportunities=[
                {"opportunity": "feature_discovery", "priority": "high"}
            ],
            generated_at=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting insights for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get personalization insights"
        )


@router.post("/optimize", response_model=Dict[str, Any])
async def optimize_personalization_rules(
    optimization_request: RuleOptimizationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Optimize personalization rules based on performance data.
    
    Analyzes rule performance and provides optimization
    recommendations for improved effectiveness.
    """
    # Only superusers can optimize rules
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to optimize personalization rules"
        )
    
    try:
        optimization_results = await personalization_engine.optimize_rules(
            db,
            rule_ids=optimization_request.rule_ids,
            segments=optimization_request.segments,
            min_interactions=optimization_request.min_interactions
        )
        
        return optimization_results
        
    except Exception as e:
        logger.error(f"Error optimizing personalization rules: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to optimize personalization rules"
        )


@router.get("/rules/{rule_id}/performance", response_model=RulePerformanceReport)
async def get_rule_performance_report(
    rule_id: str,
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RulePerformanceReport:
    """
    Get detailed performance report for a specific rule.
    
    Provides comprehensive analytics about rule effectiveness,
    user interactions, and optimization opportunities.
    """
    # Only superusers can view rule performance
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view rule performance"
        )
    
    rule = await personalization_rule.get_by_field(db, field="rule_id", value=rule_id)
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Personalization rule not found"
        )
    
    try:
        # Get rule performance statistics
        performance_stats = await personalization_rule.get_rule_performance_stats(
            db, rule_id=rule_id, days=days
        )
        
        # Get rule interactions for timeline
        interactions = await personalization_interaction.get_rule_interactions(
            db, rule_id=rule_id, days=days, limit=100
        )
        
        # Create interaction timeline
        interaction_timeline = [
            {
                "date": interaction.created_at.isoformat(),
                "type": interaction.interaction_type,
                "outcome": interaction.outcome,
                "user_id": interaction.user_id
            }
            for interaction in interactions
        ]
        
        return RulePerformanceReport(
            rule_id=rule.rule_id,
            rule_name=rule.name,
            performance_metrics=performance_stats,
            segment_breakdown={},  # Would be computed from interactions
            interaction_timeline=interaction_timeline,
            optimization_suggestions=[
                "Consider adjusting target segments",
                "Optimize rule conditions for better performance"
            ],
            a_b_test_results=None if not rule.is_ab_test else {},
            report_period={
                "start": datetime.utcnow() - timedelta(days=days),
                "end": datetime.utcnow()
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting performance report for rule {rule_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get rule performance report"
        )