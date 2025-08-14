"""User profiling system for personalization insights."""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event
from app.models.personalization import PersonalizationProfile
from app.models.user_session import UserSession

logger = logging.getLogger(__name__)


class UserProfiler:
    """
    Analyzes user behavior and generates comprehensive profiles
    for personalization targeting and ML model input.
    """

    async def compute_full_profile(
        self,
        db: AsyncSession,
        *,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Compute a complete user profile from scratch.
        
        Args:
            db: Database session
            user_id: User ID to profile
            
        Returns:
            Dict containing profile data
        """
        try:
            logger.info(f"Computing full profile for user {user_id}")
            
            # Get base user data
            profile_data = {
                "total_sessions": 0,
                "avg_session_duration": None,
                "features_adopted": 0,
                "last_active_days": 999,
                "usage_patterns": {},
                "feature_usage": {},
                "navigation_patterns": {},
                "device_preferences": {},
                "ui_preferences": {},
                "content_preferences": {},
                "notification_preferences": {}
            }
            
            # Analyze sessions
            session_data = await self._analyze_sessions(db, user_id)
            profile_data.update(session_data)
            
            # Analyze events and interactions
            event_data = await self._analyze_events(db, user_id)
            profile_data.update(event_data)
            
            # Determine primary segment
            segment_data = await self._determine_user_segment(db, user_id, profile_data)
            profile_data.update(segment_data)
            
            # Set default preferences
            profile_data.update(await self._get_default_preferences(profile_data))
            
            logger.info(f"Computed profile for user {user_id}: segment={profile_data.get('primary_segment')}")
            return profile_data
            
        except Exception as e:
            logger.error(f"Error computing profile for user {user_id}: {e}")
            # Return minimal default profile
            return {
                "primary_segment": "new_user",
                "segment_confidence": 0.5,
                "total_sessions": 0,
                "features_adopted": 0,
                "last_active_days": 0
            }

    async def update_profile_incrementally(
        self,
        profile: PersonalizationProfile,
        interaction_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update profile incrementally based on new interaction.
        
        Args:
            profile: Current profile
            interaction_data: New interaction data
            
        Returns:
            Dict containing updated profile data
        """
        try:
            updated_data = {}
            
            # Update based on interaction type
            interaction_type = interaction_data.get("interaction_type")
            outcome = interaction_data.get("outcome")
            context = interaction_data.get("context")
            
            # Update feature usage
            if interaction_type == "feature_used":
                feature_usage = profile.feature_usage.copy() if profile.feature_usage else {}
                feature_name = interaction_data.get("feature_name")
                if feature_name:
                    feature_usage[feature_name] = feature_usage.get(feature_name, 0) + 1
                updated_data["feature_usage"] = feature_usage
                
                # Update features adopted count
                if feature_usage[feature_name] == 1:  # First time using this feature
                    updated_data["features_adopted"] = profile.features_adopted + 1
            
            # Update navigation patterns
            if context and interaction_type in ["clicked", "viewed"]:
                nav_patterns = profile.navigation_patterns.copy() if profile.navigation_patterns else {}
                most_used = nav_patterns.get("most_used_sections", [])
                
                if context not in most_used:
                    most_used.append(context)
                elif len(most_used) > 10:
                    # Keep only top 10 most used sections
                    most_used = most_used[-10:]
                
                nav_patterns["most_used_sections"] = most_used
                nav_patterns["last_context"] = context
                updated_data["navigation_patterns"] = nav_patterns
            
            # Update engagement signals
            if outcome == "positive":
                usage_patterns = profile.usage_patterns.copy() if profile.usage_patterns else {}
                usage_patterns["positive_interactions"] = usage_patterns.get("positive_interactions", 0) + 1
                usage_patterns["last_positive_interaction"] = datetime.utcnow().isoformat()
                updated_data["usage_patterns"] = usage_patterns
            
            # Re-evaluate segment if significant changes
            if updated_data:
                # Simple heuristic for segment changes
                if updated_data.get("features_adopted", 0) >= 5:
                    if profile.primary_segment == "new_user":
                        updated_data["primary_segment"] = "feature_explorer"
                        updated_data["segment_confidence"] = 0.8
                
                total_features = updated_data.get("features_adopted", profile.features_adopted)
                if total_features >= 10:
                    updated_data["primary_segment"] = "power_user"
                    updated_data["segment_confidence"] = 0.9
            
            logger.debug(f"Updated profile for user {profile.user_id} incrementally")
            return updated_data
            
        except Exception as e:
            logger.error(f"Error updating profile incrementally for user {profile.user_id}: {e}")
            return {}

    async def _analyze_sessions(
        self,
        db: AsyncSession,
        user_id: int
    ) -> Dict[str, Any]:
        """Analyze user sessions for profile insights."""
        try:
            # Get session statistics
            result = await db.execute(
                select(
                    func.count(UserSession.id).label("total_sessions"),
                    func.avg(
                        func.extract('epoch', UserSession.ended_at - UserSession.started_at) / 60
                    ).label("avg_duration_minutes"),
                    func.max(UserSession.started_at).label("last_session")
                )
                .where(
                    and_(
                        UserSession.user_id == user_id,
                        UserSession.ended_at.isnot(None)
                    )
                )
            )
            stats = result.first()
            
            session_data = {
                "total_sessions": stats.total_sessions or 0,
                "avg_session_duration": float(stats.avg_duration_minutes) if stats.avg_duration_minutes else None
            }
            
            # Calculate days since last activity
            if stats.last_session:
                last_active_days = (datetime.utcnow() - stats.last_session).days
                session_data["last_active_days"] = last_active_days
            
            # Analyze session patterns
            if stats.total_sessions and stats.total_sessions > 0:
                # Get recent sessions for pattern analysis
                recent_sessions = await db.execute(
                    select(UserSession)
                    .where(
                        and_(
                            UserSession.user_id == user_id,
                            UserSession.started_at >= datetime.utcnow() - timedelta(days=30)
                        )
                    )
                    .order_by(desc(UserSession.started_at))
                    .limit(50)
                )
                
                sessions = recent_sessions.scalars().all()
                session_data["usage_patterns"] = await self._analyze_session_patterns(sessions)
            
            return session_data
            
        except Exception as e:
            logger.error(f"Error analyzing sessions for user {user_id}: {e}")
            return {"total_sessions": 0, "last_active_days": 999}

    async def _analyze_events(
        self,
        db: AsyncSession,
        user_id: int
    ) -> Dict[str, Any]:
        """Analyze user events for behavior insights."""
        try:
            # Get recent events
            result = await db.execute(
                select(Event)
                .where(
                    and_(
                        Event.user_id == user_id,
                        Event.created_at >= datetime.utcnow() - timedelta(days=90)
                    )
                )
                .order_by(desc(Event.created_at))
                .limit(1000)
            )
            events = result.scalars().all()
            
            if not events:
                return {"feature_usage": {}, "features_adopted": 0}
            
            # Analyze feature usage
            feature_usage = {}
            unique_events = set()
            
            for event in events:
                event_type = event.event_type
                unique_events.add(event_type)
                feature_usage[event_type] = feature_usage.get(event_type, 0) + 1
            
            # Analyze device preferences
            device_preferences = await self._analyze_device_usage(events)
            
            # Analyze content preferences
            content_preferences = await self._analyze_content_engagement(events)
            
            return {
                "feature_usage": feature_usage,
                "features_adopted": len(unique_events),
                "device_preferences": device_preferences,
                "content_preferences": content_preferences
            }
            
        except Exception as e:
            logger.error(f"Error analyzing events for user {user_id}: {e}")
            return {"feature_usage": {}, "features_adopted": 0}

    async def _determine_user_segment(
        self,
        db: AsyncSession,
        user_id: int,
        profile_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Determine user's primary segment based on behavior."""
        try:
            total_sessions = profile_data.get("total_sessions", 0)
            features_adopted = profile_data.get("features_adopted", 0)
            last_active_days = profile_data.get("last_active_days", 999)
            avg_session_duration = profile_data.get("avg_session_duration", 0) or 0
            
            # Segment determination logic
            segment = "new_user"
            confidence = 0.7
            secondary_segments = []
            
            # New user (default)
            if total_sessions <= 3 or features_adopted <= 2:
                segment = "new_user"
                confidence = 0.9
            
            # Casual user
            elif total_sessions <= 20 and avg_session_duration < 15:
                segment = "casual_user"
                confidence = 0.8
                if features_adopted >= 5:
                    secondary_segments.append("feature_explorer")
            
            # Feature explorer
            elif features_adopted >= 8 and total_sessions <= 50:
                segment = "feature_explorer"
                confidence = 0.8
                if avg_session_duration > 30:
                    secondary_segments.append("goal_oriented")
            
            # Power user
            elif (total_sessions > 50 and features_adopted > 15) or avg_session_duration > 45:
                segment = "power_user"
                confidence = 0.9
                if total_sessions > 100:
                    secondary_segments.append("goal_oriented")
            
            # Goal oriented
            elif avg_session_duration > 30 and features_adopted >= 5:
                segment = "goal_oriented"
                confidence = 0.8
            
            # Check for mobile/desktop preference
            device_prefs = profile_data.get("device_preferences", {})
            if device_prefs.get("primary_device") == "mobile":
                secondary_segments.append("mobile_first")
            elif device_prefs.get("primary_device") == "desktop":
                secondary_segments.append("desktop_focused")
            
            # Inactive user check
            if last_active_days > 30:
                confidence *= 0.7  # Lower confidence for inactive users
                if segment != "new_user":
                    secondary_segments.append("at_risk")
            
            return {
                "primary_segment": segment,
                "secondary_segments": secondary_segments if secondary_segments else None,
                "segment_confidence": confidence
            }
            
        except Exception as e:
            logger.error(f"Error determining segment for user {user_id}: {e}")
            return {
                "primary_segment": "new_user",
                "segment_confidence": 0.5
            }

    async def _analyze_session_patterns(
        self, 
        sessions: List[UserSession]
    ) -> Dict[str, Any]:
        """Analyze patterns in user sessions."""
        if not sessions:
            return {}
        
        patterns = {
            "weekly_active_days": 0,
            "preferred_session_times": [],
            "session_consistency": 0.0
        }
        
        # Analyze session timing
        session_hours = []
        session_days = set()
        
        for session in sessions:
            if session.started_at:
                session_hours.append(session.started_at.hour)
                session_days.add(session.started_at.weekday())
        
        if session_hours:
            # Find most common session hours
            hour_counts = {}
            for hour in session_hours:
                hour_counts[hour] = hour_counts.get(hour, 0) + 1
            
            # Get top 3 hours
            top_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:3]
            patterns["preferred_session_times"] = [hour for hour, count in top_hours]
        
        patterns["weekly_active_days"] = len(session_days)
        
        # Calculate session consistency (how regular is the user)
        if len(sessions) > 1:
            # Simple consistency based on session frequency
            date_range = (sessions[0].started_at - sessions[-1].started_at).days
            if date_range > 0:
                sessions_per_day = len(sessions) / date_range
                patterns["session_consistency"] = min(sessions_per_day, 1.0)
        
        return patterns

    async def _analyze_device_usage(
        self, 
        events: List[Event]
    ) -> Dict[str, Any]:
        """Analyze device usage patterns from events."""
        device_counts = {}
        
        for event in events:
            if hasattr(event, 'metadata') and event.metadata:
                device = event.metadata.get("device_type", "unknown")
                device_counts[device] = device_counts.get(device, 0) + 1
        
        if not device_counts:
            return {}
        
        # Determine primary device
        primary_device = max(device_counts, key=device_counts.get)
        total_events = sum(device_counts.values())
        
        return {
            "primary_device": primary_device,
            "device_distribution": {
                device: count / total_events 
                for device, count in device_counts.items()
            },
            "multi_device_user": len(device_counts) > 1
        }

    async def _analyze_content_engagement(
        self, 
        events: List[Event]
    ) -> Dict[str, Any]:
        """Analyze content engagement patterns."""
        content_types = {}
        high_engagement_events = ["page_view", "feature_used", "action_completed"]
        
        for event in events:
            if event.event_type in high_engagement_events:
                if hasattr(event, 'metadata') and event.metadata:
                    content_type = event.metadata.get("content_type", "general")
                    content_types[content_type] = content_types.get(content_type, 0) + 1
        
        if not content_types:
            return {}
        
        total_engagement = sum(content_types.values())
        
        return {
            "preferred_types": list(content_types.keys()),
            "engagement_distribution": {
                content_type: count / total_engagement
                for content_type, count in content_types.items()
            },
            "total_content_interactions": total_engagement
        }

    async def _get_default_preferences(
        self, 
        profile_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get default preferences based on segment."""
        segment = profile_data.get("primary_segment", "new_user")
        
        preferences = {
            "ui_preferences": {},
            "content_preferences": {},
            "notification_preferences": {}
        }
        
        # Segment-based defaults
        if segment == "new_user":
            preferences["ui_preferences"] = {
                "show_tooltips": True,
                "highlight_new_features": True,
                "simplified_interface": True
            }
            preferences["notification_preferences"] = {
                "onboarding_tips": True,
                "feature_announcements": True,
                "frequency": "high"
            }
        
        elif segment == "power_user":
            preferences["ui_preferences"] = {
                "show_tooltips": False,
                "keyboard_shortcuts": True,
                "compact_layout": True
            }
            preferences["notification_preferences"] = {
                "feature_announcements": True,
                "advanced_tips": True,
                "frequency": "low"
            }
        
        elif segment == "casual_user":
            preferences["ui_preferences"] = {
                "show_tooltips": True,
                "simplified_interface": True
            }
            preferences["notification_preferences"] = {
                "gentle_reminders": True,
                "frequency": "medium"
            }
        
        return preferences