"""Background worker for recommendation system processing."""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Optional

from celery import Celery
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.celery import celery_app
from app.db.session import AsyncSessionLocal
from app.crud import recommendation as crud_recommendation, event as crud_event
from app.ml.recommendations import RecommendationEngine, SimilarityEngine
from app.models.event import Event
from app.models.user import User
from app.schemas.recommendation import (
    UserPreferencesUpdate, RecommendationType
)

logger = logging.getLogger(__name__)


@celery_app.task(name="recommendation.generate_daily_recommendations")
def generate_daily_recommendations_task(user_ids: Optional[List[int]] = None) -> dict:
    """Generate daily recommendations for users."""
    
    async def _generate_daily_recommendations():
        async with AsyncSessionLocal() as db:
            engine = RecommendationEngine(db)
            
            # Get active users if no specific user IDs provided
            if not user_ids:
                from sqlalchemy import select
                result = await db.execute(
                    select(User.id)
                    .where(User.is_active == True)
                    .limit(1000)  # Process in batches
                )
                target_user_ids = [row.id for row in result.all()]
            else:
                target_user_ids = user_ids
            
            recommendations_created = 0
            errors = 0
            
            for user_id in target_user_ids:
                try:
                    # Check if user already has recent recommendations
                    existing_recs = await crud_recommendation.recommendation.get_user_recommendations(
                        db,
                        user_id=user_id,
                        skip=0,
                        limit=1,
                    )
                    
                    # Skip if user has recommendations from today
                    if existing_recs:
                        latest_rec = existing_recs[0]
                        if latest_rec.created_at.date() == datetime.utcnow().date():
                            continue
                    
                    # Generate new recommendations
                    new_recommendations = await engine.generate_recommendations(
                        user_id=user_id,
                        recommendation_types=[
                            RecommendationType.FEATURE,
                            RecommendationType.CONTENT,
                            RecommendationType.ACTION,
                        ],
                        max_recommendations=5,
                        algorithm="hybrid",
                    )
                    
                    # Create recommendations
                    for rec_create in new_recommendations:
                        await crud_recommendation.recommendation.create(db, obj_in=rec_create)
                        recommendations_created += 1
                        
                except Exception as e:
                    logger.error(f"Error generating recommendations for user {user_id}: {str(e)}")
                    errors += 1
                    continue
            
            return {
                "users_processed": len(target_user_ids),
                "recommendations_created": recommendations_created,
                "errors": errors,
                "completed_at": datetime.utcnow().isoformat(),
            }
    
    # Run the async function
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(_generate_daily_recommendations())
        logger.info(f"Daily recommendation generation completed: {result}")
        return result
    finally:
        loop.close()


@celery_app.task(name="recommendation.update_user_preferences")
def update_user_preferences_task(user_id: Optional[int] = None) -> dict:
    """Update user preferences based on recent event analysis."""
    
    async def _update_user_preferences():
        async with AsyncSessionLocal() as db:
            # Get users to analyze
            if user_id:
                target_user_ids = [user_id]
            else:
                # Get users with recent activity
                cutoff_date = datetime.utcnow() - timedelta(days=7)
                from sqlalchemy import select, distinct
                result = await db.execute(
                    select(distinct(Event.user_id))
                    .where(
                        Event.timestamp >= cutoff_date,
                        Event.user_id.isnot(None)
                    )
                    .limit(500)
                )
                target_user_ids = [row.user_id for row in result.all()]
            
            preferences_updated = 0
            errors = 0
            
            for uid in target_user_ids:
                try:
                    # Get user's recent events
                    user_events = await crud_event.event.get_user_events(
                        db,
                        user_id=uid,
                        start_date=datetime.utcnow() - timedelta(days=30),
                        limit=500,
                    )
                    
                    if not user_events:
                        continue
                    
                    # Analyze events to extract preferences
                    preferences_analysis = await _analyze_user_events_for_preferences(user_events)
                    
                    # Update user preferences
                    preferences_update = UserPreferencesUpdate(**preferences_analysis)
                    await crud_recommendation.user_preferences.create_or_update(
                        db, user_id=uid, obj_in=preferences_update
                    )
                    
                    preferences_updated += 1
                    
                except Exception as e:
                    logger.error(f"Error updating preferences for user {uid}: {str(e)}")
                    errors += 1
                    continue
            
            return {
                "users_analyzed": len(target_user_ids),
                "preferences_updated": preferences_updated,
                "errors": errors,
                "completed_at": datetime.utcnow().isoformat(),
            }
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(_update_user_preferences())
        logger.info(f"User preferences update completed: {result}")
        return result
    finally:
        loop.close()


@celery_app.task(name="recommendation.compute_user_similarities")
def compute_user_similarities_task(
    user_id: Optional[int] = None,
    algorithm: str = "cosine",
    batch_size: int = 100,
) -> dict:
    """Compute user similarities for collaborative filtering."""
    
    async def _compute_similarities():
        async with AsyncSessionLocal() as db:
            similarity_engine = SimilarityEngine(db)
            
            similarities_computed = await similarity_engine.compute_user_similarities(
                user_id=user_id,
                algorithm=algorithm,
                batch_size=batch_size,
            )
            
            # Clean up expired similarities
            expired_cleaned = await crud_recommendation.similar_users.cleanup_expired_similarities(db)
            
            return {
                "similarities_computed": similarities_computed,
                "expired_similarities_cleaned": expired_cleaned,
                "algorithm": algorithm,
                "completed_at": datetime.utcnow().isoformat(),
            }
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(_compute_similarities())
        logger.info(f"Similarity computation completed: {result}")
        return result
    finally:
        loop.close()


@celery_app.task(name="recommendation.cleanup_expired_recommendations")
def cleanup_expired_recommendations_task() -> dict:
    """Clean up expired recommendations and optimize database."""
    
    async def _cleanup_expired():
        async with AsyncSessionLocal() as db:
            # Expire old recommendations
            expired_count = await crud_recommendation.recommendation.expire_old_recommendations(db)
            
            # Clean up old feedback (older than 1 year)
            cutoff_date = datetime.utcnow() - timedelta(days=365)
            from sqlalchemy import delete
            from app.models.recommendation import RecommendationFeedback
            
            result = await db.execute(
                delete(RecommendationFeedback)
                .where(RecommendationFeedback.created_at < cutoff_date)
            )
            feedback_cleaned = result.rowcount
            await db.commit()
            
            # Clean up expired similar users
            similar_users_cleaned = await crud_recommendation.similar_users.cleanup_expired_similarities(db)
            
            return {
                "expired_recommendations": expired_count,
                "old_feedback_cleaned": feedback_cleaned,
                "expired_similarities_cleaned": similar_users_cleaned,
                "completed_at": datetime.utcnow().isoformat(),
            }
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(_cleanup_expired())
        logger.info(f"Cleanup completed: {result}")
        return result
    finally:
        loop.close()


@celery_app.task(name="recommendation.generate_personalized_notifications")
def generate_personalized_notifications_task(user_ids: Optional[List[int]] = None) -> dict:
    """Generate personalized notification recommendations."""
    
    async def _generate_notifications():
        async with AsyncSessionLocal() as db:
            engine = RecommendationEngine(db)
            
            if not user_ids:
                # Get users who haven't been active recently but have preferences for notifications
                from sqlalchemy import select, and_
                from app.models.recommendation import UserPreferences
                
                cutoff_date = datetime.utcnow() - timedelta(days=3)
                result = await db.execute(
                    select(UserPreferences.user_id)
                    .where(
                        and_(
                            UserPreferences.max_daily_recommendations > 0,
                            UserPreferences.updated_at < cutoff_date,
                        )
                    )
                    .limit(200)
                )
                target_user_ids = [row.user_id for row in result.all()]
            else:
                target_user_ids = user_ids
            
            notifications_generated = 0
            errors = 0
            
            for user_id in target_user_ids:
                try:
                    # Generate re-engagement recommendations
                    recommendations = await engine.generate_recommendations(
                        user_id=user_id,
                        recommendation_types=[
                            RecommendationType.FEATURE,
                            RecommendationType.CONTENT,
                        ],
                        max_recommendations=2,
                        algorithm="content_based",  # Focus on user's known preferences
                    )
                    
                    # Create recommendations with notification context
                    for rec_create in recommendations:
                        rec_create.context = {
                            **rec_create.context,
                            "notification_type": "re_engagement",
                            "trigger": "inactivity_3_days",
                        }
                        rec_create.priority_score = min(rec_create.priority_score + 0.2, 1.0)  # Boost for notifications
                        
                        await crud_recommendation.recommendation.create(db, obj_in=rec_create)
                        notifications_generated += 1
                        
                except Exception as e:
                    logger.error(f"Error generating notifications for user {user_id}: {str(e)}")
                    errors += 1
                    continue
            
            return {
                "users_processed": len(target_user_ids),
                "notifications_generated": notifications_generated,
                "errors": errors,
                "completed_at": datetime.utcnow().isoformat(),
            }
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(_generate_notifications())
        logger.info(f"Personalized notifications generation completed: {result}")
        return result
    finally:
        loop.close()


@celery_app.task(name="recommendation.analyze_recommendation_performance")
def analyze_recommendation_performance_task() -> dict:
    """Analyze recommendation system performance and log metrics."""
    
    async def _analyze_performance():
        async with AsyncSessionLocal() as db:
            # Get performance analytics for last 7 days
            start_date = datetime.utcnow() - timedelta(days=7)
            
            analytics = await crud_recommendation.recommendation.get_performance_analytics(
                db,
                start_date=start_date,
            )
            
            # Calculate key metrics
            total_recommendations = analytics.get("total_recommendations", 0)
            total_impressions = analytics.get("total_impressions", 0)
            total_clicks = analytics.get("total_clicks", 0)
            avg_ctr = analytics.get("avg_ctr", 0.0)
            conversion_rate = analytics.get("conversion_rate", 0.0)
            
            # Log performance metrics (these could be sent to monitoring systems)
            performance_data = {
                "period": "7_days",
                "total_recommendations": total_recommendations,
                "total_impressions": total_impressions,
                "total_clicks": total_clicks,
                "avg_ctr": avg_ctr,
                "conversion_rate": conversion_rate,
                "top_performing_types": analytics.get("top_performing_types", []),
                "analysis_date": datetime.utcnow().isoformat(),
            }
            
            # Identify performance issues
            alerts = []
            if avg_ctr < 0.05:  # CTR below 5%
                alerts.append("Low click-through rate detected")
            if conversion_rate < 0.1:  # Conversion rate below 10%
                alerts.append("Low conversion rate detected")
            if total_recommendations < 100:  # Very low recommendation volume
                alerts.append("Low recommendation generation volume")
            
            performance_data["alerts"] = alerts
            
            return performance_data
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(_analyze_performance())
        logger.info(f"Performance analysis completed: {result}")
        
        # Log alerts if any
        if result.get("alerts"):
            logger.warning(f"Recommendation system alerts: {result['alerts']}")
        
        return result
    finally:
        loop.close()


# Periodic task scheduling
@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """Set up periodic tasks for recommendation system."""
    from celery.schedules import crontab
    
    # Generate daily recommendations at 6 AM UTC
    sender.add_periodic_task(
        crontab(hour=6, minute=0),
        generate_daily_recommendations_task.s(),
        name='generate daily recommendations'
    )
    
    # Update user preferences every 4 hours
    sender.add_periodic_task(
        crontab(minute=0, hour='*/4'),
        update_user_preferences_task.s(),
        name='update user preferences'
    )
    
    # Compute user similarities daily at 2 AM UTC
    sender.add_periodic_task(
        crontab(hour=2, minute=0),
        compute_user_similarities_task.s(),
        name='compute user similarities'
    )
    
    # Cleanup expired data daily at 3 AM UTC
    sender.add_periodic_task(
        crontab(hour=3, minute=0),
        cleanup_expired_recommendations_task.s(),
        name='cleanup expired recommendations'
    )
    
    # Generate personalized notifications daily at 9 AM UTC
    sender.add_periodic_task(
        crontab(hour=9, minute=0),
        generate_personalized_notifications_task.s(),
        name='generate personalized notifications'
    )
    
    # Analyze performance weekly on Mondays at 1 AM UTC
    sender.add_periodic_task(
        crontab(hour=1, minute=0, day_of_week=1),
        analyze_recommendation_performance_task.s(),
        name='analyze recommendation performance'
    )


async def _analyze_user_events_for_preferences(events: List[Event]) -> dict:
    """Analyze user events to extract preferences."""
    
    from collections import defaultdict
    
    # Initialize analysis containers
    feature_interests = defaultdict(float)
    content_preferences = defaultdict(float)
    ui_preferences = {}
    behavioral_patterns = {}
    
    # Session analysis
    sessions = defaultdict(list)
    total_duration = 0
    
    for event in events:
        if event.session_id:
            sessions[event.session_id].append(event)
    
    # Calculate average session duration
    if sessions:
        total_events = sum(len(session) for session in sessions.values())
        avg_session_duration = total_events / len(sessions) * 2.5  # Rough estimate in minutes
    else:
        avg_session_duration = 0
    
    # Analyze event types and patterns
    event_type_counts = defaultdict(int)
    time_of_day_usage = defaultdict(int)
    
    for event in events:
        event_type_counts[event.event_type] += 1
        time_of_day_usage[event.timestamp.hour] += 1
        
        # Extract feature interests
        if event.event_type == "interaction" and event.event_name.startswith("feature_"):
            feature_name = event.event_name.replace("feature_", "")
            feature_interests[feature_name] += 1.0
            
        # Extract content preferences
        if event.properties and "content_type" in event.properties:
            content_type = event.properties["content_type"]
            content_preferences[content_type] += 1.0
    
    # Normalize feature interests
    if feature_interests:
        max_interest = max(feature_interests.values())
        feature_interests = {k: v / max_interest for k, v in feature_interests.items()}
    
    # Normalize content preferences
    if content_preferences:
        max_pref = max(content_preferences.values())
        content_preferences = {k: v / max_pref for k, v in content_preferences.items()}
    
    # Determine UI preferences
    evening_usage = sum(count for hour, count in time_of_day_usage.items() if 18 <= hour <= 23)
    total_usage = sum(time_of_day_usage.values())
    
    if total_usage > 0 and evening_usage / total_usage > 0.4:
        ui_preferences["preferred_theme"] = "dark"
    else:
        ui_preferences["preferred_theme"] = "light"
    
    # Calculate behavioral patterns
    behavioral_patterns = {
        "avg_events_per_session": total_events / len(sessions) if sessions else 0,
        "preferred_time_of_day": max(time_of_day_usage.items(), key=lambda x: x[1])[0] if time_of_day_usage else 12,
        "interaction_diversity": len(set(e.event_name for e in events)),
        "session_frequency": len(sessions) / 30,  # sessions per day over 30 days
    }
    
    # Calculate weekly active days (rough estimate)
    unique_dates = set(event.timestamp.date() for event in events)
    weeks = (max(unique_dates) - min(unique_dates)).days / 7 if len(unique_dates) > 1 else 1
    weekly_active_days = min(len(unique_dates) / weeks * 7, 7) if weeks > 0 else len(unique_dates)
    
    # Feature adoption rate (how quickly user adopts new features)
    unique_features = set(
        event.event_name.replace("feature_", "") 
        for event in events 
        if event.event_type == "interaction" and event.event_name.startswith("feature_")
    )
    feature_adoption_rate = min(len(unique_features) / 10, 1.0)  # Normalize to 0-1 scale
    
    return {
        "feature_interests": dict(feature_interests),
        "content_preferences": dict(content_preferences),
        "ui_preferences": ui_preferences,
        "behavioral_patterns": behavioral_patterns,
        "avg_session_duration": avg_session_duration,
        "weekly_active_days": int(weekly_active_days),
        "feature_adoption_rate": feature_adoption_rate,
        "notification_preferences": {
            "preferred_time": behavioral_patterns["preferred_time_of_day"],
            "frequency": "daily" if weekly_active_days >= 5 else "weekly",
        },
    }