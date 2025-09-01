"""ML-powered recommendation algorithms with collaborative and content-based filtering."""
import json
import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

import numpy as np
from app.models.event import Event
from app.models.recommendation import Recommendation, SimilarUsers, UserPreferences
from app.models.user import User
from app.schemas.recommendation import (
    RecommendationCreate,
    RecommendationStatus,
    RecommendationType,
    SimilarUsersCreate,
    UserPreferencesUpdate,
)
from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import get_cache

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """Main recommendation engine with multiple algorithms."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.cache = get_cache()
        self.model_version = "v1.0.0"

    async def generate_recommendations(
        self,
        user_id: int,
        recommendation_types: Optional[List[str]] = None,
        max_recommendations: int = 10,
        algorithm: str = "hybrid",
    ) -> List[RecommendationCreate]:
        """Generate recommendations for a user using specified algorithm."""

        # Get user preferences
        user_prefs = await self._get_user_preferences(user_id)

        # Determine which types to generate
        if not recommendation_types:
            recommendation_types = [
                RecommendationType.FEATURE,
                RecommendationType.CONTENT,
                RecommendationType.ACTION,
                RecommendationType.PERSONALIZATION,
                RecommendationType.SOCIAL,
            ]

        recommendations = []

        for rec_type in recommendation_types:
            type_recommendations = await self._generate_by_type_and_algorithm(
                user_id, rec_type, algorithm, user_prefs
            )
            recommendations.extend(type_recommendations)

        # Sort by combined score and limit
        recommendations.sort(
            key=lambda x: x.priority_score * x.confidence_score, reverse=True
        )

        return recommendations[:max_recommendations]

    async def _generate_by_type_and_algorithm(
        self,
        user_id: int,
        rec_type: str,
        algorithm: str,
        user_prefs: Optional[UserPreferences] = None,
    ) -> List[RecommendationCreate]:
        """Generate recommendations by type and algorithm."""

        if algorithm == "collaborative":
            return await self._collaborative_filtering(user_id, rec_type, user_prefs)
        elif algorithm == "content_based":
            return await self._content_based_filtering(user_id, rec_type, user_prefs)
        elif algorithm == "hybrid":
            return await self._hybrid_filtering(user_id, rec_type, user_prefs)
        else:
            logger.warning(f"Unknown algorithm: {algorithm}, falling back to hybrid")
            return await self._hybrid_filtering(user_id, rec_type, user_prefs)

    async def _collaborative_filtering(
        self,
        user_id: int,
        rec_type: str,
        user_prefs: Optional[UserPreferences] = None,
    ) -> List[RecommendationCreate]:
        """Generate recommendations using collaborative filtering."""

        # Get similar users
        similar_users = await self._get_similar_users(user_id)
        if not similar_users:
            # Fall back to popularity-based recommendations
            return await self._popularity_based_recommendations(user_id, rec_type)

        # Analyze what similar users have engaged with
        similar_user_ids = [su.similar_user_id for su in similar_users[:10]]

        # Get events from similar users to understand their preferences
        similar_user_events = await self._get_user_events_analysis(similar_user_ids)

        recommendations = []

        if rec_type == RecommendationType.FEATURE:
            recommendations = await self._recommend_features_collaborative(
                user_id, similar_user_events, user_prefs
            )
        elif rec_type == RecommendationType.CONTENT:
            recommendations = await self._recommend_content_collaborative(
                user_id, similar_user_events, user_prefs
            )
        elif rec_type == RecommendationType.ACTION:
            recommendations = await self._recommend_actions_collaborative(
                user_id, similar_user_events, user_prefs
            )
        elif rec_type == RecommendationType.SOCIAL:
            recommendations = await self._recommend_social_collaborative(
                user_id, similar_users, user_prefs
            )

        return recommendations

    async def _content_based_filtering(
        self,
        user_id: int,
        rec_type: str,
        user_prefs: Optional[UserPreferences] = None,
    ) -> List[RecommendationCreate]:
        """Generate recommendations using content-based filtering."""

        # Get user's historical behavior
        user_events = await self._get_user_events_analysis([user_id])
        user_behavior = user_events.get(user_id, {})

        recommendations = []

        if rec_type == RecommendationType.FEATURE:
            recommendations = await self._recommend_features_content_based(
                user_id, user_behavior, user_prefs
            )
        elif rec_type == RecommendationType.CONTENT:
            recommendations = await self._recommend_content_content_based(
                user_id, user_behavior, user_prefs
            )
        elif rec_type == RecommendationType.ACTION:
            recommendations = await self._recommend_actions_content_based(
                user_id, user_behavior, user_prefs
            )
        elif rec_type == RecommendationType.PERSONALIZATION:
            recommendations = await self._recommend_personalization_content_based(
                user_id, user_behavior, user_prefs
            )

        return recommendations

    async def _hybrid_filtering(
        self,
        user_id: int,
        rec_type: str,
        user_prefs: Optional[UserPreferences] = None,
    ) -> List[RecommendationCreate]:
        """Generate recommendations using hybrid approach."""

        # Get recommendations from both approaches
        collaborative_recs = await self._collaborative_filtering(
            user_id, rec_type, user_prefs
        )
        content_based_recs = await self._content_based_filtering(
            user_id, rec_type, user_prefs
        )

        # Combine and weight the recommendations
        all_recs = {}

        # Add collaborative recommendations with weight 0.6
        for rec in collaborative_recs:
            key = f"{rec.type}:{rec.title}"
            all_recs[key] = {
                "recommendation": rec,
                "collaborative_score": rec.confidence_score,
                "content_score": 0.0,
            }

        # Add content-based recommendations with weight 0.4
        for rec in content_based_recs:
            key = f"{rec.type}:{rec.title}"
            if key in all_recs:
                all_recs[key]["content_score"] = rec.confidence_score
            else:
                all_recs[key] = {
                    "recommendation": rec,
                    "collaborative_score": 0.0,
                    "content_score": rec.confidence_score,
                }

        # Calculate hybrid scores
        hybrid_recommendations = []
        for rec_data in all_recs.values():
            rec = rec_data["recommendation"]
            hybrid_score = (
                0.6 * rec_data["collaborative_score"] + 0.4 * rec_data["content_score"]
            )

            # Update confidence score with hybrid score
            rec.confidence_score = hybrid_score
            rec.algorithm = "hybrid"
            rec.rec_metadata = {
                "collaborative_score": rec_data["collaborative_score"],
                "content_score": rec_data["content_score"],
                "hybrid_score": hybrid_score,
            }

            hybrid_recommendations.append(rec)

        return hybrid_recommendations

    # Feature recommendations
    async def _recommend_features_collaborative(
        self,
        user_id: int,
        similar_user_events: Dict[int, Dict[str, Any]],
        user_prefs: Optional[UserPreferences] = None,
    ) -> List[RecommendationCreate]:
        """Recommend features based on similar user behavior."""
        recommendations = []

        # Analyze features used by similar users that current user hasn't used
        user_events = await self._get_user_events_analysis([user_id])
        user_features = set(user_events.get(user_id, {}).get("features_used", []))

        feature_scores = defaultdict(lambda: {"score": 0.0, "users": []})

        for similar_user_id, events_data in similar_user_events.items():
            similar_features = set(events_data.get("features_used", []))
            new_features = similar_features - user_features

            for feature in new_features:
                feature_scores[feature]["score"] += 1.0
                feature_scores[feature]["users"].append(similar_user_id)

        # Create recommendations for top features
        for feature, data in sorted(
            feature_scores.items(), key=lambda x: x[1]["score"], reverse=True
        )[:3]:
            confidence = min(data["score"] / len(similar_user_events), 1.0)

            recommendations.append(
                RecommendationCreate(
                    user_id=user_id,
                    type=RecommendationType.FEATURE,
                    title=f"Try {feature.replace('_', ' ').title()}",
                    description=f"Based on users similar to you, you might enjoy using {feature.replace('_', ' ')}. {len(data['users'])} similar users have found this feature helpful.",
                    confidence_score=confidence,
                    priority_score=0.7,
                    relevance_score=confidence,
                    context={
                        "feature_name": feature,
                        "similar_users_count": len(data["users"]),
                    },
                    model_version=self.model_version,
                    algorithm="collaborative",
                )
            )

        return recommendations

    async def _recommend_features_content_based(
        self,
        user_id: int,
        user_behavior: Dict[str, Any],
        user_prefs: Optional[UserPreferences] = None,
    ) -> List[RecommendationCreate]:
        """Recommend features based on user's content preferences."""
        recommendations = []

        # Analyze user's current feature usage patterns
        features_used = user_behavior.get("features_used", [])
        feature_categories = user_behavior.get("feature_categories", {})

        # Define feature relationships and recommendations
        feature_suggestions = {
            "dashboard": ["analytics", "reporting", "data_export"],
            "analytics": ["dashboard", "reporting", "data_visualization"],
            "user_management": ["permissions", "roles", "audit_log"],
            "api": ["webhooks", "integrations", "automation"],
        }

        used_features_set = set(features_used)

        for used_feature in features_used:
            if used_feature in feature_suggestions:
                for suggested_feature in feature_suggestions[used_feature]:
                    if suggested_feature not in used_features_set:
                        confidence = 0.6 + 0.2 * feature_categories.get(used_feature, 0)

                        recommendations.append(
                            RecommendationCreate(
                                user_id=user_id,
                                type=RecommendationType.FEATURE,
                                title=f"Enhance your {used_feature} with {suggested_feature.replace('_', ' ').title()}",
                                description=f"Since you use {used_feature}, you might find {suggested_feature.replace('_', ' ')} helpful for enhanced functionality.",
                                confidence_score=min(confidence, 1.0),
                                priority_score=0.6,
                                relevance_score=min(confidence, 1.0),
                                context={
                                    "base_feature": used_feature,
                                    "suggested_feature": suggested_feature,
                                },
                                model_version=self.model_version,
                                algorithm="content_based",
                            )
                        )

        return recommendations

    # Action recommendations
    async def _recommend_actions_collaborative(
        self,
        user_id: int,
        similar_user_events: Dict[int, Dict[str, Any]],
        user_prefs: Optional[UserPreferences] = None,
    ) -> List[RecommendationCreate]:
        """Recommend actions based on similar user patterns."""
        recommendations = []

        # Analyze common action sequences from similar users
        action_patterns = defaultdict(int)

        for similar_user_id, events_data in similar_user_events.items():
            actions = events_data.get("recent_actions", [])
            for i, action in enumerate(actions[:-1]):
                next_action = actions[i + 1]
                action_patterns[f"{action} -> {next_action}"] += 1

        # Get user's recent actions
        user_events = await self._get_user_events_analysis([user_id])
        user_recent_actions = user_events.get(user_id, {}).get("recent_actions", [])

        if user_recent_actions:
            last_action = user_recent_actions[-1]

            # Find patterns that start with user's last action
            relevant_patterns = [
                (pattern, count)
                for pattern, count in action_patterns.items()
                if pattern.startswith(f"{last_action} -> ")
            ]

            for pattern, count in sorted(
                relevant_patterns, key=lambda x: x[1], reverse=True
            )[:2]:
                next_action = pattern.split(" -> ")[1]
                confidence = min(count / len(similar_user_events), 1.0)

                recommendations.append(
                    RecommendationCreate(
                        user_id=user_id,
                        type=RecommendationType.ACTION,
                        title=f"Next: {next_action.replace('_', ' ').title()}",
                        description=f"Based on your recent {last_action.replace('_', ' ')}, users typically continue with {next_action.replace('_', ' ')}.",
                        confidence_score=confidence,
                        priority_score=0.8,
                        relevance_score=confidence,
                        context={
                            "last_action": last_action,
                            "suggested_action": next_action,
                            "pattern_strength": count,
                        },
                        model_version=self.model_version,
                        algorithm="collaborative",
                    )
                )

        return recommendations

    async def _recommend_actions_content_based(
        self,
        user_id: int,
        user_behavior: Dict[str, Any],
        user_prefs: Optional[UserPreferences] = None,
    ) -> List[RecommendationCreate]:
        """Recommend actions based on user's behavior patterns."""
        recommendations = []

        # Analyze user's incomplete workflows
        incomplete_workflows = user_behavior.get("incomplete_workflows", [])
        session_patterns = user_behavior.get("session_patterns", {})

        for workflow in incomplete_workflows:
            completion_steps = {
                "user_registration": "complete_profile",
                "project_creation": "add_team_members",
                "data_import": "create_dashboard",
                "api_setup": "test_integration",
            }

            if workflow in completion_steps:
                next_step = completion_steps[workflow]
                confidence = 0.8  # High confidence for incomplete workflows

                recommendations.append(
                    RecommendationCreate(
                        user_id=user_id,
                        type=RecommendationType.ACTION,
                        title=f"Complete your {workflow.replace('_', ' ')}",
                        description=f"You started {workflow.replace('_', ' ')} but haven't finished. Complete it by {next_step.replace('_', ' ')}.",
                        confidence_score=confidence,
                        priority_score=0.9,  # High priority for incomplete workflows
                        relevance_score=confidence,
                        context={
                            "incomplete_workflow": workflow,
                            "next_step": next_step,
                        },
                        model_version=self.model_version,
                        algorithm="content_based",
                    )
                )

        return recommendations

    # Content recommendations
    async def _recommend_content_collaborative(
        self,
        user_id: int,
        similar_user_events: Dict[int, Dict[str, Any]],
        user_prefs: Optional[UserPreferences] = None,
    ) -> List[RecommendationCreate]:
        """Recommend content based on similar users' interests."""
        recommendations = []

        # Analyze content preferences from similar users
        content_interests = defaultdict(float)

        for similar_user_id, events_data in similar_user_events.items():
            interests = events_data.get("content_interests", {})
            for topic, score in interests.items():
                content_interests[topic] += score

        # Normalize scores
        max_score = max(content_interests.values()) if content_interests else 1.0

        for topic, score in sorted(
            content_interests.items(), key=lambda x: x[1], reverse=True
        )[:3]:
            normalized_score = score / max_score

            recommendations.append(
                RecommendationCreate(
                    user_id=user_id,
                    type=RecommendationType.CONTENT,
                    title=f"Explore {topic.replace('_', ' ').title()} Content",
                    description=f"Users with similar interests to you have been engaging with {topic.replace('_', ' ')} content. Discover relevant articles, tutorials, and resources.",
                    confidence_score=normalized_score,
                    priority_score=0.5,
                    relevance_score=normalized_score,
                    context={"content_topic": topic, "interest_score": score},
                    model_version=self.model_version,
                    algorithm="collaborative",
                )
            )

        return recommendations

    async def _recommend_content_content_based(
        self,
        user_id: int,
        user_behavior: Dict[str, Any],
        user_prefs: Optional[UserPreferences] = None,
    ) -> List[RecommendationCreate]:
        """Recommend content based on user's content consumption patterns."""
        recommendations = []

        # Analyze user's content preferences
        content_interests = user_behavior.get("content_interests", {})
        reading_patterns = user_behavior.get("reading_patterns", {})

        # Define content relationships
        content_suggestions = {
            "api_documentation": ["integration_guides", "code_examples"],
            "tutorials": ["best_practices", "advanced_guides"],
            "getting_started": ["tutorials", "use_cases"],
            "troubleshooting": ["faq", "community_discussions"],
        }

        for consumed_content, score in content_interests.items():
            if consumed_content in content_suggestions and score > 0.3:
                for suggested_content in content_suggestions[consumed_content]:
                    confidence = (
                        score * 0.8
                    )  # Slightly lower confidence than direct interest

                    recommendations.append(
                        RecommendationCreate(
                            user_id=user_id,
                            type=RecommendationType.CONTENT,
                            title=f"Related: {suggested_content.replace('_', ' ').title()}",
                            description=f"Since you've shown interest in {consumed_content.replace('_', ' ')}, you might also like {suggested_content.replace('_', ' ')}.",
                            confidence_score=confidence,
                            priority_score=0.5,
                            relevance_score=confidence,
                            context={
                                "source_content": consumed_content,
                                "suggested_content": suggested_content,
                            },
                            model_version=self.model_version,
                            algorithm="content_based",
                        )
                    )

        return recommendations

    # Social recommendations
    async def _recommend_social_collaborative(
        self,
        user_id: int,
        similar_users: List[SimilarUsers],
        user_prefs: Optional[UserPreferences] = None,
    ) -> List[RecommendationCreate]:
        """Recommend social connections and interactions."""
        recommendations = []

        # Recommend connecting with highly similar users
        for similar_user in similar_users[:3]:
            if similar_user.similarity_score > 0.7:
                recommendations.append(
                    RecommendationCreate(
                        user_id=user_id,
                        type=RecommendationType.SOCIAL,
                        title=f"Connect with Similar User",
                        description=f"You have {similar_user.similarity_score:.0%} similarity with another user. Consider connecting to share experiences and insights.",
                        confidence_score=similar_user.similarity_score,
                        priority_score=0.4,
                        relevance_score=similar_user.similarity_score,
                        context={
                            "similar_user_id": similar_user.similar_user_id,
                            "similarity_score": similar_user.similarity_score,
                            "common_features": similar_user.common_features,
                        },
                        model_version=self.model_version,
                        algorithm="collaborative",
                    )
                )

        return recommendations

    # Personalization recommendations
    async def _recommend_personalization_content_based(
        self,
        user_id: int,
        user_behavior: Dict[str, Any],
        user_prefs: Optional[UserPreferences] = None,
    ) -> List[RecommendationCreate]:
        """Recommend personalization options based on usage patterns."""
        recommendations = []

        # Analyze usage patterns for personalization opportunities
        usage_patterns = user_behavior.get("usage_patterns", {})
        session_times = user_behavior.get("session_times", [])

        # Theme recommendations based on usage times
        if session_times:
            evening_usage = sum(1 for hour in session_times if 18 <= hour <= 23)
            if evening_usage / len(session_times) > 0.4:
                recommendations.append(
                    RecommendationCreate(
                        user_id=user_id,
                        type=RecommendationType.PERSONALIZATION,
                        title="Try Dark Mode",
                        description="You frequently use the app in the evening. Dark mode might be easier on your eyes and improve your experience.",
                        confidence_score=0.7,
                        priority_score=0.3,
                        relevance_score=0.7,
                        context={
                            "evening_usage_ratio": evening_usage / len(session_times)
                        },
                        model_version=self.model_version,
                        algorithm="content_based",
                    )
                )

        # Dashboard customization based on frequent actions
        frequent_actions = usage_patterns.get("frequent_actions", [])
        if len(frequent_actions) > 3:
            recommendations.append(
                RecommendationCreate(
                    user_id=user_id,
                    type=RecommendationType.PERSONALIZATION,
                    title="Customize Your Dashboard",
                    description="You have consistent usage patterns. Customize your dashboard to put your most-used features front and center.",
                    confidence_score=0.6,
                    priority_score=0.4,
                    relevance_score=0.6,
                    context={"frequent_actions": frequent_actions[:5]},
                    model_version=self.model_version,
                    algorithm="content_based",
                )
            )

        return recommendations

    # Popularity-based fallback
    async def _popularity_based_recommendations(
        self,
        user_id: int,
        rec_type: str,
    ) -> List[RecommendationCreate]:
        """Generate popularity-based recommendations as fallback."""
        recommendations = []

        # Get popular features from recent events
        if rec_type == RecommendationType.FEATURE:
            popular_features = await self._get_popular_features()

            for i, (feature, popularity_score) in enumerate(popular_features[:2]):
                recommendations.append(
                    RecommendationCreate(
                        user_id=user_id,
                        type=RecommendationType.FEATURE,
                        title=f"Popular: {feature.replace('_', ' ').title()}",
                        description=f"{feature.replace('_', ' ').title()} is trending with users. Give it a try!",
                        confidence_score=0.4,  # Lower confidence for popularity-based
                        priority_score=0.3,
                        relevance_score=popularity_score,
                        context={"feature": feature, "popularity_rank": i + 1},
                        model_version=self.model_version,
                        algorithm="popularity_based",
                    )
                )

        return recommendations

    # Helper methods
    async def _get_user_preferences(self, user_id: int) -> Optional[UserPreferences]:
        """Get user preferences from database."""
        result = await self.db.execute(
            select(UserPreferences).where(UserPreferences.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def _get_similar_users(
        self, user_id: int, limit: int = 10
    ) -> List[SimilarUsers]:
        """Get similar users from database."""
        current_time = datetime.utcnow()

        result = await self.db.execute(
            select(SimilarUsers)
            .where(
                and_(
                    SimilarUsers.user_id == user_id,
                    SimilarUsers.expires_at > current_time,
                    SimilarUsers.similarity_score > 0.1,
                )
            )
            .order_by(desc(SimilarUsers.similarity_score))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def _get_user_events_analysis(
        self, user_ids: List[int]
    ) -> Dict[int, Dict[str, Any]]:
        """Analyze user events to extract behavior patterns."""
        # Get recent events for users
        cutoff_date = datetime.utcnow() - timedelta(days=30)

        result = await self.db.execute(
            select(Event)
            .where(and_(Event.user_id.in_(user_ids), Event.timestamp >= cutoff_date))
            .order_by(desc(Event.timestamp))
        )
        events = result.scalars().all()

        # Analyze events by user
        user_analysis = {}

        for user_id in user_ids:
            user_events = [e for e in events if e.user_id == user_id]

            analysis = {
                "features_used": list(
                    set(
                        e.event_name
                        for e in user_events
                        if e.event_type == "interaction" and "feature_" in e.event_name
                    )
                ),
                "recent_actions": [e.event_name for e in user_events[:10]],
                "content_interests": self._extract_content_interests(user_events),
                "session_patterns": self._extract_session_patterns(user_events),
                "usage_patterns": self._extract_usage_patterns(user_events),
                "incomplete_workflows": self._extract_incomplete_workflows(user_events),
                "feature_categories": self._extract_feature_categories(user_events),
                "session_times": [e.timestamp.hour for e in user_events],
                "reading_patterns": self._extract_reading_patterns(user_events),
            }

            user_analysis[user_id] = analysis

        return user_analysis

    def _extract_content_interests(self, events: List[Event]) -> Dict[str, float]:
        """Extract content interests from user events."""
        interests = defaultdict(float)

        for event in events:
            if event.event_type == "interaction" and event.properties:
                content_type = event.properties.get("content_type")
                if content_type:
                    interests[content_type] += 1.0

        # Normalize scores
        max_score = max(interests.values()) if interests else 1.0
        return {k: v / max_score for k, v in interests.items()}

    def _extract_session_patterns(self, events: List[Event]) -> Dict[str, Any]:
        """Extract session patterns from events."""
        sessions = defaultdict(list)

        for event in events:
            if event.session_id:
                sessions[event.session_id].append(event)

        avg_session_length = (
            np.mean([len(session) for session in sessions.values()]) if sessions else 0
        )

        return {
            "avg_session_length": avg_session_length,
            "total_sessions": len(sessions),
            "session_frequency": len(sessions) / 30
            if sessions
            else 0,  # sessions per day over 30 days
        }

    def _extract_usage_patterns(self, events: List[Event]) -> Dict[str, Any]:
        """Extract usage patterns from events."""
        action_counts = defaultdict(int)

        for event in events:
            if event.event_type == "interaction":
                action_counts[event.event_name] += 1

        frequent_actions = sorted(
            action_counts.items(), key=lambda x: x[1], reverse=True
        )[:5]

        return {
            "frequent_actions": [action for action, _ in frequent_actions],
            "action_diversity": len(action_counts),
            "total_actions": sum(action_counts.values()),
        }

    def _extract_incomplete_workflows(self, events: List[Event]) -> List[str]:
        """Extract incomplete workflows from events."""
        workflows = {
            "user_registration": ["register", "verify_email", "complete_profile"],
            "project_creation": [
                "create_project",
                "add_team_members",
                "configure_settings",
            ],
            "data_import": ["start_import", "map_fields", "complete_import"],
        }

        incomplete = []
        event_names = [e.event_name for e in events]

        for workflow, steps in workflows.items():
            completed_steps = sum(1 for step in steps if step in event_names)
            if 0 < completed_steps < len(steps):
                incomplete.append(workflow)

        return incomplete

    def _extract_feature_categories(self, events: List[Event]) -> Dict[str, int]:
        """Extract feature category usage from events."""
        categories = defaultdict(int)

        feature_mappings = {
            "dashboard": ["view_dashboard", "customize_dashboard"],
            "analytics": ["view_analytics", "create_report", "export_data"],
            "user_management": ["manage_users", "set_permissions"],
            "api": ["api_call", "webhook_setup", "integration"],
        }

        for event in events:
            for category, actions in feature_mappings.items():
                if event.event_name in actions:
                    categories[category] += 1

        return dict(categories)

    def _extract_reading_patterns(self, events: List[Event]) -> Dict[str, Any]:
        """Extract content reading patterns."""
        reading_events = [
            e
            for e in events
            if e.event_type == "interaction" and "read" in e.event_name
        ]

        if not reading_events:
            return {}

        return {
            "avg_reading_session": len(reading_events)
            / len(set(e.session_id for e in reading_events if e.session_id)),
            "preferred_content_length": "medium",  # Could be derived from event properties
            "reading_frequency": len(reading_events) / 30,  # per day over 30 days
        }

    async def _get_popular_features(self) -> List[Tuple[str, float]]:
        """Get popular features based on recent usage."""
        cutoff_date = datetime.utcnow() - timedelta(days=7)

        result = await self.db.execute(
            select(Event.event_name, func.count(Event.id).label("usage_count"))
            .where(
                and_(
                    Event.event_type == "interaction",
                    Event.timestamp >= cutoff_date,
                    Event.event_name.like("feature_%"),
                )
            )
            .group_by(Event.event_name)
            .order_by(desc(text("usage_count")))
            .limit(10)
        )

        popular_features = []
        max_count = 0

        for row in result.all():
            if max_count == 0:
                max_count = row.usage_count

            popularity_score = row.usage_count / max_count
            popular_features.append((row.event_name, popularity_score))

        return popular_features


class SimilarityEngine:
    """Engine for computing user similarities for collaborative filtering."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def compute_user_similarities(
        self,
        user_id: Optional[int] = None,
        algorithm: str = "cosine",
        batch_size: int = 100,
    ) -> int:
        """Compute user similarities using specified algorithm."""

        if user_id:
            # Compute similarities for specific user
            return await self._compute_similarities_for_user(user_id, algorithm)
        else:
            # Compute similarities for all users
            return await self._compute_all_similarities(algorithm, batch_size)

    async def _compute_similarities_for_user(
        self,
        user_id: int,
        algorithm: str,
    ) -> int:
        """Compute similarities for a specific user."""

        # Get user's behavior vector
        user_vector = await self._get_user_behavior_vector(user_id)
        if not user_vector:
            return 0

        # Get all other users
        result = await self.db.execute(
            select(User.id).where(User.id != user_id).where(User.is_active == True)
        )
        other_user_ids = [row.id for row in result.all()]

        similarities = []

        for other_user_id in other_user_ids:
            other_vector = await self._get_user_behavior_vector(other_user_id)
            if not other_vector:
                continue

            similarity = self._calculate_similarity(
                user_vector, other_vector, algorithm
            )

            if similarity > 0.1:  # Only store significant similarities
                similarities.append(
                    SimilarUsersCreate(
                        user_id=user_id,
                        similar_user_id=other_user_id,
                        similarity_score=similarity,
                        algorithm=algorithm,
                        behavioral_similarity=similarity,
                        expires_at=datetime.utcnow() + timedelta(days=7),
                    )
                )

        # Store similarities
        if similarities:
            from app.crud.recommendation import similar_users

            await similar_users.create_bulk_similarities(
                self.db, similarities=similarities
            )

        return len(similarities)

    async def _compute_all_similarities(
        self,
        algorithm: str,
        batch_size: int,
    ) -> int:
        """Compute similarities for all users."""

        # Get all active users
        result = await self.db.execute(
            select(User.id).where(User.is_active == True).limit(batch_size)
        )
        user_ids = [row.id for row in result.all()]

        total_computed = 0

        for user_id in user_ids:
            computed = await self._compute_similarities_for_user(user_id, algorithm)
            total_computed += computed

        return total_computed

    async def _get_user_behavior_vector(self, user_id: int) -> Optional[np.ndarray]:
        """Get user's behavior as a feature vector."""

        # Get user events from last 30 days
        cutoff_date = datetime.utcnow() - timedelta(days=30)

        result = await self.db.execute(
            select(Event).where(
                and_(
                    Event.user_id == user_id,
                    Event.timestamp >= cutoff_date,
                    Event.event_type == "interaction",
                )
            )
        )
        events = list(result.scalars().all())

        if not events:
            return None

        # Create feature vector based on event types and frequencies
        features = {
            "page_views": 0,
            "button_clicks": 0,
            "feature_usage": 0,
            "api_calls": 0,
            "session_duration": 0,
            "weekend_usage": 0,
            "evening_usage": 0,
        }

        for event in events:
            if event.event_name == "page_view":
                features["page_views"] += 1
            elif "click" in event.event_name:
                features["button_clicks"] += 1
            elif event.event_name.startswith("feature_"):
                features["feature_usage"] += 1
            elif event.event_name == "api_call":
                features["api_calls"] += 1

            # Time-based features
            if event.timestamp.weekday() >= 5:  # Weekend
                features["weekend_usage"] += 1
            if event.timestamp.hour >= 18:  # Evening
                features["evening_usage"] += 1

        # Normalize features
        max_count = max(features.values()) if any(features.values()) else 1
        normalized_features = [count / max_count for count in features.values()]

        return np.array(normalized_features)

    def _calculate_similarity(
        self,
        vector1: np.ndarray,
        vector2: np.ndarray,
        algorithm: str,
    ) -> float:
        """Calculate similarity between two user vectors."""

        if algorithm == "cosine":
            # Cosine similarity
            dot_product = np.dot(vector1, vector2)
            norm1 = np.linalg.norm(vector1)
            norm2 = np.linalg.norm(vector2)

            if norm1 == 0 or norm2 == 0:
                return 0.0

            return dot_product / (norm1 * norm2)

        elif algorithm == "pearson":
            # Pearson correlation coefficient
            if len(vector1) < 2:
                return 0.0

            correlation_matrix = np.corrcoef(vector1, vector2)
            correlation = correlation_matrix[0, 1]

            return correlation if not np.isnan(correlation) else 0.0

        else:
            # Euclidean similarity (inverse of distance)
            distance = np.linalg.norm(vector1 - vector2)
            return 1 / (1 + distance)
