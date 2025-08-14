"""Integration service for recommendation system with existing analytics and event tracking."""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import get_cache
from app.crud import event as crud_event, recommendation as crud_recommendation
from app.ml.recommendations import RecommendationEngine
from app.models.event import Event
from app.models.user import User
from app.schemas.event import EventCreate, EventType
from app.schemas.recommendation import (
    RecommendationCreate, UserPreferencesUpdate, RecommendationType
)

logger = logging.getLogger(__name__)


class RecommendationIntegrationService:
    """Service for integrating recommendations with existing systems."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.cache = get_cache()
        self.recommendation_engine = RecommendationEngine(db)
    
    async def process_user_event_for_recommendations(
        self,
        event: Event,
        user: User,
    ) -> None:
        """Process a user event to trigger recommendation updates."""
        try:
            # Check if we should trigger recommendation generation
            should_generate = await self._should_generate_recommendations_for_event(event, user)
            
            if should_generate:
                # Generate recommendations based on the event
                await self._generate_event_triggered_recommendations(event, user)
            
            # Update user preferences based on the event
            await self._update_user_preferences_from_event(event, user)
            
            # Track recommendation-relevant metrics
            await self._track_recommendation_metrics(event, user)
            
        except Exception as e:
            logger.error(f"Error processing event {event.id} for recommendations: {str(e)}")
    
    async def _should_generate_recommendations_for_event(
        self,
        event: Event,
        user: User,
    ) -> bool:
        """Determine if we should generate new recommendations based on the event."""
        
        # Cache key for rate limiting
        cache_key = f"rec_gen_rate_limit:user:{user.id}"
        
        # Check if we recently generated recommendations for this user
        recent_generation = await self.cache.get(cache_key)
        if recent_generation:
            return False
        
        # Trigger recommendation generation for specific event types
        trigger_events = {
            "feature_first_use",      # User tries a new feature
            "workflow_completed",     # User completes a workflow
            "session_milestone",      # User reaches session milestone
            "engagement_threshold",   # High engagement detected
            "return_after_absence",   # User returns after being away
        }
        
        if event.event_name in trigger_events:
            # Set rate limit (don't generate again for 1 hour)
            await self.cache.set(cache_key, "generated", expire=3600)
            return True
        
        # Also trigger for high-value interactions
        if event.event_type == EventType.INTERACTION and event.properties:
            session_duration = event.properties.get("session_duration", 0)
            if session_duration > 30:  # Long session
                await self.cache.set(cache_key, "generated", expire=3600)
                return True
        
        return False
    
    async def _generate_event_triggered_recommendations(
        self,
        event: Event,
        user: User,
    ) -> List[RecommendationCreate]:
        """Generate recommendations triggered by a specific event."""
        
        # Determine recommendation types based on event context
        recommendation_types = []
        
        if event.event_name.startswith("feature_"):
            recommendation_types.extend([
                RecommendationType.FEATURE,
                RecommendationType.ACTION,
            ])
        elif "workflow" in event.event_name:
            recommendation_types.extend([
                RecommendationType.ACTION,
                RecommendationType.CONTENT,
            ])
        elif event.event_type == EventType.INTERACTION:
            recommendation_types.extend([
                RecommendationType.PERSONALIZATION,
                RecommendationType.CONTENT,
            ])
        
        if not recommendation_types:
            recommendation_types = [RecommendationType.FEATURE]
        
        # Generate contextual recommendations
        recommendations = await self.recommendation_engine.generate_recommendations(
            user_id=user.id,
            recommendation_types=recommendation_types,
            max_recommendations=3,  # Fewer for event-triggered
            algorithm="hybrid",
        )
        
        # Add event context to recommendations
        for rec in recommendations:
            rec.context = {
                **rec.context,
                "triggered_by_event": event.event_id,
                "trigger_event_type": event.event_type,
                "trigger_event_name": event.event_name,
                "generation_trigger": "event_based",
            }
            rec.priority_score = min(rec.priority_score + 0.1, 1.0)  # Slight boost for event-triggered
        
        # Create recommendations in database
        created_recommendations = []
        for rec_create in recommendations:
            try:
                created_rec = await crud_recommendation.recommendation.create(
                    self.db, obj_in=rec_create
                )
                created_recommendations.append(created_rec)
            except Exception as e:
                logger.error(f"Failed to create event-triggered recommendation: {str(e)}")
        
        logger.info(f"Generated {len(created_recommendations)} event-triggered recommendations for user {user.id}")
        return recommendations
    
    async def _update_user_preferences_from_event(
        self,
        event: Event,
        user: User,
    ) -> None:
        """Update user preferences based on event data."""
        
        # Get existing preferences
        existing_prefs = await crud_recommendation.user_preferences.get_by_user_id(
            self.db, user_id=user.id
        )
        
        # Initialize preferences if none exist
        if not existing_prefs:
            base_prefs = {
                "feature_interests": {},
                "content_preferences": {},
                "ui_preferences": {},
                "behavioral_patterns": {},
            }
        else:
            base_prefs = {
                "feature_interests": existing_prefs.feature_interests or {},
                "content_preferences": existing_prefs.content_preferences or {},
                "ui_preferences": existing_prefs.ui_preferences or {},
                "behavioral_patterns": existing_prefs.behavioral_patterns or {},
            }
        
        # Update preferences based on event
        updates = {}
        
        # Feature interests
        if event.event_name.startswith("feature_"):
            feature_name = event.event_name.replace("feature_", "")
            current_interest = base_prefs["feature_interests"].get(feature_name, 0.0)
            base_prefs["feature_interests"][feature_name] = min(current_interest + 0.1, 1.0)
            updates["feature_interests"] = base_prefs["feature_interests"]
        
        # Content preferences
        if event.properties and "content_type" in event.properties:
            content_type = event.properties["content_type"]
            current_pref = base_prefs["content_preferences"].get(content_type, 0.0)
            base_prefs["content_preferences"][content_type] = min(current_pref + 0.05, 1.0)
            updates["content_preferences"] = base_prefs["content_preferences"]
        
        # UI preferences
        if event.properties:
            if "theme" in event.properties:
                base_prefs["ui_preferences"]["preferred_theme"] = event.properties["theme"]
                updates["ui_preferences"] = base_prefs["ui_preferences"]
        
        # Behavioral patterns
        if event.session_id:
            # Update session-based patterns
            patterns = base_prefs["behavioral_patterns"]
            patterns["last_session_id"] = event.session_id
            patterns["last_activity_time"] = event.timestamp.hour
            patterns["recent_activity_count"] = patterns.get("recent_activity_count", 0) + 1
            updates["behavioral_patterns"] = patterns
        
        # Apply updates if any
        if updates:
            preferences_update = UserPreferencesUpdate(**updates)
            await crud_recommendation.user_preferences.create_or_update(
                self.db, user_id=user.id, obj_in=preferences_update
            )
    
    async def _track_recommendation_metrics(
        self,
        event: Event,
        user: User,
    ) -> None:
        """Track metrics related to recommendation performance."""
        
        # Track recommendation interactions
        if event.properties and "recommendation_id" in event.properties:
            recommendation_id = event.properties["recommendation_id"]
            
            # Update recommendation engagement based on event
            if event.event_name == "recommendation_shown":
                await crud_recommendation.recommendation.update_engagement(
                    self.db,
                    recommendation_id=recommendation_id,
                    action="shown",
                    increment_impressions=True,
                )
            elif event.event_name == "recommendation_clicked":
                await crud_recommendation.recommendation.update_engagement(
                    self.db,
                    recommendation_id=recommendation_id,
                    action="clicked",
                    increment_clicks=True,
                )
            elif event.event_name == "recommendation_dismissed":
                await crud_recommendation.recommendation.update_engagement(
                    self.db,
                    recommendation_id=recommendation_id,
                    action="dismissed",
                )
            elif event.event_name == "recommendation_converted":
                await crud_recommendation.recommendation.update_engagement(
                    self.db,
                    recommendation_id=recommendation_id,
                    action="converted",
                )
    
    async def create_recommendation_event(
        self,
        user_id: int,
        action: str,
        recommendation_id: str,
        context: Optional[Dict] = None,
        session_id: Optional[str] = None,
    ) -> Event:
        """Create an event for recommendation interactions."""
        
        event_create = EventCreate(
            event_type=EventType.INTERACTION,
            event_name=f"recommendation_{action}",
            source="recommendation_system",
            session_id=session_id,
            properties={
                "recommendation_id": recommendation_id,
                "action": action,
                **(context or {}),
            },
        )
        
        return await crud_event.event.create(
            self.db,
            obj_in=event_create,
            user_id=user_id,
        )
    
    async def get_recommendation_analytics_for_events(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, any]:
        """Get recommendation analytics based on event data."""
        
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=7)
        if not end_date:
            end_date = datetime.utcnow()
        
        # Get recommendation-related events
        from sqlalchemy import and_, func, select
        
        # Query for recommendation interaction events
        result = await self.db.execute(
            select(
                Event.event_name,
                func.count(Event.id).label("count"),
                func.count(func.distinct(Event.user_id)).label("unique_users"),
                func.count(func.distinct(Event.session_id)).label("unique_sessions"),
            )
            .where(
                and_(
                    Event.event_name.like("recommendation_%"),
                    Event.timestamp >= start_date,
                    Event.timestamp <= end_date,
                )
            )
            .group_by(Event.event_name)
        )
        
        event_analytics = {}
        for row in result.all():
            event_analytics[row.event_name] = {
                "count": row.count,
                "unique_users": row.unique_users,
                "unique_sessions": row.unique_sessions,
            }
        
        # Calculate derived metrics
        total_shown = event_analytics.get("recommendation_shown", {}).get("count", 0)
        total_clicked = event_analytics.get("recommendation_clicked", {}).get("count", 0)
        total_converted = event_analytics.get("recommendation_converted", {}).get("count", 0)
        
        ctr = (total_clicked / total_shown) if total_shown > 0 else 0.0
        conversion_rate = (total_converted / total_clicked) if total_clicked > 0 else 0.0
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            },
            "event_analytics": event_analytics,
            "derived_metrics": {
                "total_impressions": total_shown,
                "total_clicks": total_clicked,
                "total_conversions": total_converted,
                "click_through_rate": ctr,
                "conversion_rate": conversion_rate,
            },
        }
    
    async def sync_recommendation_data_with_events(
        self,
        user_id: Optional[int] = None,
    ) -> Dict[str, int]:
        """Sync recommendation engagement data with event data."""
        
        # Get recommendations that need syncing
        if user_id:
            recommendations = await crud_recommendation.recommendation.get_user_recommendations(
                self.db, user_id=user_id, limit=1000
            )
        else:
            # Get recent recommendations for syncing
            from sqlalchemy import select
            result = await self.db.execute(
                select(crud_recommendation.recommendation.model)
                .where(
                    crud_recommendation.recommendation.model.created_at >= 
                    datetime.utcnow() - timedelta(days=30)
                )
                .limit(1000)
            )
            recommendations = list(result.scalars().all())
        
        synced_count = 0
        errors = 0
        
        for recommendation in recommendations:
            try:
                # Get events for this recommendation
                from sqlalchemy import and_, func
                
                # Count impressions (shown events)
                impression_result = await self.db.execute(
                    select(func.count(Event.id))
                    .where(
                        and_(
                            Event.event_name == "recommendation_shown",
                            Event.properties.op("@>")({
                                "recommendation_id": recommendation.recommendation_id
                            }),
                        )
                    )
                )
                impression_count = impression_result.scalar() or 0
                
                # Count clicks
                click_result = await self.db.execute(
                    select(func.count(Event.id))
                    .where(
                        and_(
                            Event.event_name == "recommendation_clicked",
                            Event.properties.op("@>")({
                                "recommendation_id": recommendation.recommendation_id
                            }),
                        )
                    )
                )
                click_count = click_result.scalar() or 0
                
                # Update recommendation if counts differ
                if (recommendation.impressions != impression_count or 
                    recommendation.clicks != click_count):
                    
                    from sqlalchemy import update
                    from app.models.recommendation import Recommendation
                    
                    await self.db.execute(
                        update(Recommendation)
                        .where(Recommendation.id == recommendation.id)
                        .values(
                            impressions=impression_count,
                            clicks=click_count,
                        )
                    )
                    synced_count += 1
                
            except Exception as e:
                logger.error(f"Error syncing recommendation {recommendation.recommendation_id}: {str(e)}")
                errors += 1
        
        await self.db.commit()
        
        return {
            "recommendations_processed": len(recommendations),
            "synced_count": synced_count,
            "errors": errors,
        }
    
    async def generate_contextual_recommendations_for_session(
        self,
        user_id: int,
        session_id: str,
        session_events: List[Event],
    ) -> List[RecommendationCreate]:
        """Generate contextual recommendations based on current session activity."""
        
        # Analyze session events for patterns
        session_analysis = self._analyze_session_events(session_events)
        
        # Determine recommendation types based on session activity
        recommendation_types = []
        
        if session_analysis["feature_exploration"] > 2:
            recommendation_types.append(RecommendationType.FEATURE)
        
        if session_analysis["content_consumption"] > 1:
            recommendation_types.append(RecommendationType.CONTENT)
        
        if session_analysis["workflow_progress"] > 0:
            recommendation_types.append(RecommendationType.ACTION)
        
        if len(session_events) > 10:  # Active session
            recommendation_types.append(RecommendationType.PERSONALIZATION)
        
        if not recommendation_types:
            recommendation_types = [RecommendationType.FEATURE]
        
        # Generate session-aware recommendations
        recommendations = await self.recommendation_engine.generate_recommendations(
            user_id=user_id,
            recommendation_types=recommendation_types,
            max_recommendations=5,
            algorithm="content_based",  # Focus on current activity patterns
        )
        
        # Add session context
        for rec in recommendations:
            rec.context = {
                **rec.context,
                "session_id": session_id,
                "session_analysis": session_analysis,
                "generation_context": "session_based",
            }
        
        return recommendations
    
    def _analyze_session_events(self, events: List[Event]) -> Dict[str, int]:
        """Analyze session events for recommendation context."""
        analysis = {
            "feature_exploration": 0,
            "content_consumption": 0,
            "workflow_progress": 0,
            "error_encounters": 0,
            "help_seeking": 0,
        }
        
        for event in events:
            if event.event_name.startswith("feature_"):
                analysis["feature_exploration"] += 1
            elif "read" in event.event_name or "view" in event.event_name:
                analysis["content_consumption"] += 1
            elif "complete" in event.event_name or "submit" in event.event_name:
                analysis["workflow_progress"] += 1
            elif event.event_type == EventType.ERROR:
                analysis["error_encounters"] += 1
            elif "help" in event.event_name or "support" in event.event_name:
                analysis["help_seeking"] += 1
        
        return analysis


# Event handler integration
async def handle_event_for_recommendations(
    db: AsyncSession,
    event: Event,
    user: User,
) -> None:
    """Handle an event for recommendation system integration."""
    
    integration_service = RecommendationIntegrationService(db)
    await integration_service.process_user_event_for_recommendations(event, user)


# Utility function for creating recommendation tracking events
async def track_recommendation_interaction(
    db: AsyncSession,
    user_id: int,
    recommendation_id: str,
    action: str,
    context: Optional[Dict] = None,
    session_id: Optional[str] = None,
) -> Event:
    """Utility to track recommendation interactions as events."""
    
    integration_service = RecommendationIntegrationService(db)
    return await integration_service.create_recommendation_event(
        user_id=user_id,
        recommendation_id=recommendation_id,
        action=action,
        context=context,
        session_id=session_id,
    )