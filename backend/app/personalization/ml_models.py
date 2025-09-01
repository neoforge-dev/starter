"""ML models for personalization insights and predictions."""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from app.models.event import Event
from app.models.personalization import (
    PersonalizationInteraction,
    PersonalizationProfile,
    PersonalizationRule,
)
from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class PersonalizationMLModels:
    """
    Machine learning models for personalization insights,
    user profiling, and predictive analytics.
    """

    def __init__(self):
        """Initialize ML models and components."""
        self.churn_model = ChurnPredictionModel()
        self.segmentation_model = UserSegmentationModel()
        self.recommendation_model = PersonalizationRecommendationModel()
        self.optimization_model = RuleOptimizationModel()

    async def generate_user_insights(
        self, db: AsyncSession, profile: PersonalizationProfile
    ) -> Optional[Dict[str, Any]]:
        """
        Generate comprehensive ML-driven insights for a user.

        Args:
            db: Database session
            profile: User's personalization profile

        Returns:
            Dict containing ML insights or None if insufficient data
        """
        try:
            insights = {}

            # Churn risk prediction
            churn_risk = await self.churn_model.predict_churn_risk(db, profile)
            if churn_risk is not None:
                insights["churn_risk"] = churn_risk
                insights["churn_factors"] = await self.churn_model.get_risk_factors(
                    db, profile
                )

            # Lifetime value prediction
            ltv = await self._predict_lifetime_value(db, profile)
            if ltv is not None:
                insights["lifetime_value"] = ltv

            # Next likely actions
            next_actions = await self._predict_next_actions(db, profile)
            if next_actions:
                insights["next_actions"] = next_actions

            # Engagement opportunities
            opportunities = await self._find_engagement_opportunities(db, profile)
            if opportunities:
                insights["engagement_opportunities"] = opportunities

            # Personalization recommendations
            recommendations = await self._generate_personalization_recommendations(
                db, profile
            )
            if recommendations:
                insights["personalization_recommendations"] = recommendations

            return insights if insights else None

        except Exception as e:
            logger.error(
                f"Error generating user insights for user {profile.user_id}: {e}"
            )
            return None

    async def generate_personalized_ui(
        self, db: AsyncSession, profile: PersonalizationProfile, context: str
    ) -> Dict[str, Any]:
        """
        Generate ML-driven UI personalizations for a specific context.

        Args:
            db: Database session
            profile: User profile
            context: UI context

        Returns:
            Dict containing UI personalizations
        """
        try:
            ui_customizations = {}

            # Predict optimal layout based on user behavior
            layout_prefs = await self._predict_layout_preferences(db, profile, context)
            if layout_prefs:
                ui_customizations["layout_preferences"] = layout_prefs

            # Predict content priorities
            content_priorities = await self._predict_content_priorities(db, profile)
            if content_priorities:
                ui_customizations["content_priorities"] = content_priorities

            # Predict feature visibility
            feature_visibility = await self._predict_feature_visibility(db, profile)
            if feature_visibility:
                ui_customizations["feature_visibility"] = feature_visibility

            return ui_customizations

        except Exception as e:
            logger.error(
                f"Error generating personalized UI for user {profile.user_id}: {e}"
            )
            return {}

    async def generate_rule_optimization(
        self, db: AsyncSession, rule: PersonalizationRule, performance: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate optimization recommendations for a personalization rule.

        Args:
            db: Database session
            rule: Personalization rule to optimize
            performance: Current performance metrics

        Returns:
            List of optimization recommendations
        """
        try:
            return await self.optimization_model.optimize_rule(db, rule, performance)
        except Exception as e:
            logger.error(f"Error optimizing rule {rule.rule_id}: {e}")
            return []

    async def generate_global_recommendations(
        self, db: AsyncSession, *, segments: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate global personalization recommendations across segments.

        Args:
            db: Database session
            segments: Specific segments to analyze

        Returns:
            List of global recommendations
        """
        try:
            recommendations = []

            # Analyze segment performance
            segment_analysis = await self._analyze_segment_performance(db, segments)

            for segment, metrics in segment_analysis.items():
                if metrics["effectiveness"] < 0.6:  # Below 60% effectiveness
                    recommendations.append(
                        {
                            "type": "segment_improvement",
                            "segment": segment,
                            "current_effectiveness": metrics["effectiveness"],
                            "recommendation": f"Improve personalization for {segment} segment",
                            "suggested_actions": await self._suggest_segment_improvements(
                                db, segment, metrics
                            ),
                        }
                    )

            # Identify underperforming contexts
            context_analysis = await self._analyze_context_performance(db)
            for context, performance in context_analysis.items():
                if performance["success_rate"] < 0.5:
                    recommendations.append(
                        {
                            "type": "context_optimization",
                            "context": context,
                            "current_performance": performance,
                            "recommendation": f"Optimize personalization for {context} context",
                            "suggested_actions": await self._suggest_context_improvements(
                                db, context, performance
                            ),
                        }
                    )

            return recommendations

        except Exception as e:
            logger.error(f"Error generating global recommendations: {e}")
            return []

    # Private helper methods for ML predictions

    async def _predict_lifetime_value(
        self, db: AsyncSession, profile: PersonalizationProfile
    ) -> Optional[float]:
        """Predict user lifetime value using simple heuristics."""
        try:
            # Simple LTV prediction based on engagement patterns
            base_value = 1.0

            # Factor in session activity
            if profile.total_sessions > 0:
                session_factor = min(profile.total_sessions / 100, 2.0)
                base_value *= session_factor

            # Factor in feature adoption
            if profile.features_adopted > 0:
                feature_factor = min(profile.features_adopted / 20, 3.0)
                base_value *= feature_factor

            # Factor in session duration
            if profile.avg_session_duration:
                duration_factor = min(profile.avg_session_duration / 30, 2.0)
                base_value *= duration_factor

            # Factor in recency
            if profile.last_active_days < 7:
                base_value *= 1.5
            elif profile.last_active_days > 30:
                base_value *= 0.5

            return min(base_value, 10.0)  # Cap at 10.0

        except Exception as e:
            logger.error(f"Error predicting LTV for user {profile.user_id}: {e}")
            return None

    async def _predict_next_actions(
        self, db: AsyncSession, profile: PersonalizationProfile
    ) -> List[str]:
        """Predict user's next likely actions."""
        try:
            next_actions = []

            # Based on user segment
            segment = profile.primary_segment
            features_adopted = profile.features_adopted

            if segment == "new_user":
                next_actions = ["complete_profile", "explore_features", "take_tutorial"]
            elif segment == "casual_user":
                if features_adopted < 5:
                    next_actions = ["try_new_feature", "explore_advanced_options"]
                else:
                    next_actions = ["increase_usage", "share_content"]
            elif segment == "feature_explorer":
                next_actions = [
                    "master_current_features",
                    "provide_feedback",
                    "try_integrations",
                ]
            elif segment == "power_user":
                next_actions = [
                    "optimize_workflow",
                    "use_advanced_features",
                    "mentor_others",
                ]
            elif segment == "goal_oriented":
                next_actions = [
                    "complete_current_project",
                    "set_new_goals",
                    "track_progress",
                ]

            # Add context-specific predictions based on usage patterns
            usage_patterns = profile.usage_patterns or {}
            if usage_patterns.get("prefers_mobile", False):
                next_actions.append("use_mobile_app")

            feature_usage = profile.feature_usage or {}
            unused_features = self._get_unused_features(feature_usage)
            if unused_features:
                next_actions.extend(
                    [f"try_{feature}" for feature in unused_features[:2]]
                )

            return next_actions[:5]  # Return top 5 predictions

        except Exception as e:
            logger.error(
                f"Error predicting next actions for user {profile.user_id}: {e}"
            )
            return []

    async def _find_engagement_opportunities(
        self, db: AsyncSession, profile: PersonalizationProfile
    ) -> List[Dict[str, Any]]:
        """Find opportunities to increase user engagement."""
        try:
            opportunities = []

            # Low feature adoption opportunity
            if profile.features_adopted < 5:
                opportunities.append(
                    {
                        "type": "feature_adoption",
                        "priority": "high",
                        "description": "User has low feature adoption",
                        "suggested_action": "Show feature discovery prompts",
                        "potential_impact": "medium",
                    }
                )

            # Inactive user re-engagement
            if profile.last_active_days > 7:
                opportunities.append(
                    {
                        "type": "reactivation",
                        "priority": "high"
                        if profile.last_active_days > 30
                        else "medium",
                        "description": f"User inactive for {profile.last_active_days} days",
                        "suggested_action": "Send re-engagement notification",
                        "potential_impact": "high",
                    }
                )

            # Short session duration
            if profile.avg_session_duration and profile.avg_session_duration < 10:
                opportunities.append(
                    {
                        "type": "session_extension",
                        "priority": "medium",
                        "description": "User has short session durations",
                        "suggested_action": "Provide engaging content recommendations",
                        "potential_impact": "medium",
                    }
                )

            # High churn risk
            if profile.predicted_churn_risk and profile.predicted_churn_risk > 0.7:
                opportunities.append(
                    {
                        "type": "churn_prevention",
                        "priority": "high",
                        "description": "User has high churn risk",
                        "suggested_action": "Provide personalized support and incentives",
                        "potential_impact": "high",
                    }
                )

            return opportunities

        except Exception as e:
            logger.error(
                f"Error finding engagement opportunities for user {profile.user_id}: {e}"
            )
            return []

    async def _generate_personalization_recommendations(
        self, db: AsyncSession, profile: PersonalizationProfile
    ) -> List[Dict[str, Any]]:
        """Generate specific personalization recommendations for user."""
        try:
            recommendations = []

            segment = profile.primary_segment

            # UI personalization recommendations
            if segment == "new_user":
                recommendations.append(
                    {
                        "category": "ui",
                        "type": "simplification",
                        "description": "Simplify interface for new user",
                        "implementation": {
                            "hide_advanced_features": True,
                            "show_onboarding_tips": True,
                            "use_guided_workflows": True,
                        },
                    }
                )

            elif segment == "power_user":
                recommendations.append(
                    {
                        "category": "ui",
                        "type": "efficiency",
                        "description": "Optimize interface for power user",
                        "implementation": {
                            "show_keyboard_shortcuts": True,
                            "enable_quick_actions": True,
                            "use_compact_layout": True,
                        },
                    }
                )

            # Content personalization recommendations
            feature_usage = profile.feature_usage or {}
            most_used_features = sorted(
                feature_usage.items(), key=lambda x: x[1], reverse=True
            )[:3]

            if most_used_features:
                recommendations.append(
                    {
                        "category": "content",
                        "type": "prioritization",
                        "description": "Prioritize content based on feature usage",
                        "implementation": {
                            "featured_content": [
                                feature for feature, _ in most_used_features
                            ],
                            "hide_unused_features": len(feature_usage) > 10,
                        },
                    }
                )

            return recommendations

        except Exception as e:
            logger.error(
                f"Error generating personalization recommendations for user {profile.user_id}: {e}"
            )
            return []

    async def _predict_layout_preferences(
        self, db: AsyncSession, profile: PersonalizationProfile, context: str
    ) -> Dict[str, Any]:
        """Predict optimal layout preferences for user."""
        try:
            preferences = {}

            segment = profile.primary_segment
            device_prefs = profile.device_preferences or {}

            # Layout based on segment
            if segment == "new_user":
                preferences["layout_density"] = "spacious"
                preferences["show_labels"] = True
                preferences["highlight_important"] = True
            elif segment == "power_user":
                preferences["layout_density"] = "compact"
                preferences["show_labels"] = False
                preferences["enable_customization"] = True

            # Device-based adjustments
            if device_prefs.get("primary_device") == "mobile":
                preferences["mobile_optimized"] = True
                preferences["gesture_navigation"] = True

            # Context-specific adjustments
            if context == "dashboard":
                preferences["widget_priority"] = await self._predict_widget_priorities(
                    db, profile
                )
            elif context == "settings":
                preferences["group_related_settings"] = True
                preferences["show_frequently_used"] = True

            return preferences

        except Exception as e:
            logger.error(
                f"Error predicting layout preferences for user {profile.user_id}: {e}"
            )
            return {}

    async def _predict_content_priorities(
        self, db: AsyncSession, profile: PersonalizationProfile
    ) -> Dict[str, Any]:
        """Predict content priorities for user."""
        try:
            priorities = {}

            # Based on content preferences
            content_prefs = profile.content_preferences or {}
            if "preferred_types" in content_prefs:
                priorities["content_types"] = content_prefs["preferred_types"]

            # Based on feature usage
            feature_usage = profile.feature_usage or {}
            if feature_usage:
                top_features = sorted(
                    feature_usage.items(), key=lambda x: x[1], reverse=True
                )[:5]
                priorities["feature_related_content"] = [
                    feature for feature, _ in top_features
                ]

            # Based on user segment
            segment = profile.primary_segment
            if segment == "new_user":
                priorities["show_tutorials"] = True
                priorities["highlight_getting_started"] = True
            elif segment == "power_user":
                priorities["show_advanced_content"] = True
                priorities["highlight_new_features"] = True

            return priorities

        except Exception as e:
            logger.error(
                f"Error predicting content priorities for user {profile.user_id}: {e}"
            )
            return {}

    async def _predict_feature_visibility(
        self, db: AsyncSession, profile: PersonalizationProfile
    ) -> Dict[str, bool]:
        """Predict which features should be visible to user."""
        try:
            visibility = {}

            segment = profile.primary_segment
            features_adopted = profile.features_adopted
            feature_usage = profile.feature_usage or {}

            # Core features always visible
            core_features = ["dashboard", "profile", "settings"]
            for feature in core_features:
                visibility[feature] = True

            # Advanced features based on segment and adoption
            advanced_features = [
                "analytics",
                "integrations",
                "automation",
                "api_access",
            ]

            if segment == "power_user" or features_adopted > 10:
                for feature in advanced_features:
                    visibility[feature] = True
            elif segment == "feature_explorer" and features_adopted > 5:
                # Show some advanced features
                for feature in advanced_features[:2]:
                    visibility[feature] = True
            else:
                for feature in advanced_features:
                    visibility[feature] = False

            # Hide features user has never used after significant time
            if profile.total_sessions > 20:
                for feature in feature_usage:
                    if feature_usage[feature] == 0:
                        visibility[feature] = False

            return visibility

        except Exception as e:
            logger.error(
                f"Error predicting feature visibility for user {profile.user_id}: {e}"
            )
            return {}

    def _get_unused_features(self, feature_usage: Dict[str, int]) -> List[str]:
        """Get features that user hasn't used yet."""
        all_features = [
            "dashboard",
            "analytics",
            "reports",
            "integrations",
            "automation",
            "collaboration",
            "notifications",
            "search",
            "filters",
            "exports",
        ]

        used_features = set(feature_usage.keys())
        return [feature for feature in all_features if feature not in used_features]

    async def _predict_widget_priorities(
        self, db: AsyncSession, profile: PersonalizationProfile
    ) -> List[str]:
        """Predict widget priorities for dashboard."""
        try:
            priorities = []

            feature_usage = profile.feature_usage or {}
            segment = profile.primary_segment

            # Always include overview widget
            priorities.append("overview")

            # Add widgets based on feature usage
            if feature_usage.get("analytics", 0) > 0:
                priorities.append("analytics_widget")

            if feature_usage.get("projects", 0) > 0:
                priorities.append("recent_projects")

            # Segment-specific widgets
            if segment == "new_user":
                priorities.extend(["getting_started", "quick_actions"])
            elif segment == "power_user":
                priorities.extend(["advanced_metrics", "shortcuts"])

            return priorities

        except Exception as e:
            logger.error(
                f"Error predicting widget priorities for user {profile.user_id}: {e}"
            )
            return ["overview"]

    async def _analyze_segment_performance(
        self, db: AsyncSession, segments: Optional[List[str]] = None
    ) -> Dict[str, Dict[str, Any]]:
        """Analyze performance metrics by user segment."""
        try:
            # This is a simplified analysis - in production, you'd have more sophisticated metrics
            segment_performance = {}

            # Get all segments if none specified
            if not segments:
                result = await db.execute(
                    select(PersonalizationProfile.primary_segment).distinct()
                )
                segments = [row[0] for row in result]

            for segment in segments:
                # Get segment metrics (simplified)
                effectiveness = np.random.uniform(0.4, 0.9)  # Placeholder

                segment_performance[segment] = {
                    "effectiveness": effectiveness,
                    "user_count": 100,  # Placeholder
                    "avg_engagement": 0.6,  # Placeholder
                }

            return segment_performance

        except Exception as e:
            logger.error(f"Error analyzing segment performance: {e}")
            return {}

    async def _suggest_segment_improvements(
        self, db: AsyncSession, segment: str, metrics: Dict[str, Any]
    ) -> List[str]:
        """Suggest improvements for underperforming segment."""
        suggestions = []

        if segment == "new_user":
            suggestions.extend(
                [
                    "Improve onboarding flow",
                    "Add more guided tutorials",
                    "Simplify initial interface",
                ]
            )
        elif segment == "casual_user":
            suggestions.extend(
                [
                    "Send engagement reminders",
                    "Highlight popular features",
                    "Reduce complexity barriers",
                ]
            )
        elif segment == "power_user":
            suggestions.extend(
                [
                    "Add advanced features",
                    "Improve performance",
                    "Enable customization options",
                ]
            )

        return suggestions

    async def _analyze_context_performance(
        self, db: AsyncSession
    ) -> Dict[str, Dict[str, Any]]:
        """Analyze performance by context."""
        try:
            # Simplified context analysis
            contexts = ["login", "dashboard", "settings", "features", "onboarding"]

            context_performance = {}
            for context in contexts:
                # Placeholder metrics
                context_performance[context] = {
                    "success_rate": np.random.uniform(0.3, 0.8),
                    "engagement_rate": np.random.uniform(0.4, 0.9),
                    "conversion_rate": np.random.uniform(0.2, 0.6),
                }

            return context_performance

        except Exception as e:
            logger.error(f"Error analyzing context performance: {e}")
            return {}

    async def _suggest_context_improvements(
        self, db: AsyncSession, context: str, performance: Dict[str, Any]
    ) -> List[str]:
        """Suggest improvements for underperforming context."""
        suggestions = []

        if context == "login":
            suggestions.extend(
                [
                    "Simplify login process",
                    "Add social login options",
                    "Improve error messaging",
                ]
            )
        elif context == "dashboard":
            suggestions.extend(
                [
                    "Personalize dashboard layout",
                    "Improve loading performance",
                    "Add customization options",
                ]
            )
        elif context == "onboarding":
            suggestions.extend(
                [
                    "Reduce onboarding steps",
                    "Add interactive tutorials",
                    "Personalize based on user type",
                ]
            )

        return suggestions


class ChurnPredictionModel:
    """Simple churn prediction model."""

    async def predict_churn_risk(
        self, db: AsyncSession, profile: PersonalizationProfile
    ) -> Optional[float]:
        """Predict churn risk for user."""
        try:
            risk_score = 0.0

            # Days since last activity
            if profile.last_active_days > 30:
                risk_score += 0.4
            elif profile.last_active_days > 14:
                risk_score += 0.2
            elif profile.last_active_days > 7:
                risk_score += 0.1

            # Session frequency
            if profile.total_sessions < 5:
                risk_score += 0.3
            elif profile.total_sessions < 20:
                risk_score += 0.1

            # Feature adoption
            if profile.features_adopted < 3:
                risk_score += 0.2
            elif profile.features_adopted < 5:
                risk_score += 0.1

            # Session duration
            if profile.avg_session_duration and profile.avg_session_duration < 5:
                risk_score += 0.2

            return min(risk_score, 1.0)

        except Exception as e:
            logger.error(f"Error predicting churn risk: {e}")
            return None

    async def get_risk_factors(
        self, db: AsyncSession, profile: PersonalizationProfile
    ) -> List[str]:
        """Get specific risk factors for user."""
        factors = []

        if profile.last_active_days > 14:
            factors.append("inactive_user")

        if profile.total_sessions < 10:
            factors.append("low_engagement")

        if profile.features_adopted < 3:
            factors.append("low_feature_adoption")

        if profile.avg_session_duration and profile.avg_session_duration < 10:
            factors.append("short_sessions")

        return factors


class UserSegmentationModel:
    """User segmentation ML model."""

    async def predict_segment(
        self, db: AsyncSession, user_data: Dict[str, Any]
    ) -> Tuple[str, float]:
        """Predict user segment with confidence."""
        # This would use actual ML model in production
        # For now, using rule-based approach

        total_sessions = user_data.get("total_sessions", 0)
        features_adopted = user_data.get("features_adopted", 0)
        avg_session_duration = user_data.get("avg_session_duration", 0) or 0

        if total_sessions <= 3 or features_adopted <= 2:
            return "new_user", 0.9
        elif features_adopted >= 15 and total_sessions > 50:
            return "power_user", 0.9
        elif features_adopted >= 8:
            return "feature_explorer", 0.8
        elif avg_session_duration > 30:
            return "goal_oriented", 0.8
        else:
            return "casual_user", 0.7


class PersonalizationRecommendationModel:
    """Recommendation model for personalization rules."""

    async def recommend_rules(
        self, db: AsyncSession, profile: PersonalizationProfile
    ) -> List[str]:
        """Recommend personalization rules for user."""
        # Simplified recommendation logic
        recommendations = []

        segment = profile.primary_segment

        if segment == "new_user":
            recommendations.extend(
                [
                    "simplify_interface",
                    "show_onboarding_tips",
                    "highlight_core_features",
                ]
            )
        elif segment == "power_user":
            recommendations.extend(
                ["enable_shortcuts", "show_advanced_features", "compact_layout"]
            )

        return recommendations


class RuleOptimizationModel:
    """Model for optimizing personalization rules."""

    async def optimize_rule(
        self, db: AsyncSession, rule: PersonalizationRule, performance: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate optimization recommendations for rule."""
        recommendations = []

        success_rate = performance.get("success_rate", 0)
        total_interactions = performance.get("total_interactions", 0)

        if success_rate < 0.3 and total_interactions > 100:
            recommendations.append(
                {
                    "type": "target_adjustment",
                    "description": "Rule has low success rate",
                    "suggestion": "Narrow target segments or adjust conditions",
                    "priority": "high",
                }
            )

        if total_interactions < 10:
            recommendations.append(
                {
                    "type": "visibility_increase",
                    "description": "Rule has low visibility",
                    "suggestion": "Broaden target segments or contexts",
                    "priority": "medium",
                }
            )

        avg_response_time = performance.get("avg_response_time_ms", 0)
        if avg_response_time > 200:
            recommendations.append(
                {
                    "type": "performance_optimization",
                    "description": "Rule has slow response time",
                    "suggestion": "Optimize rule conditions or configuration",
                    "priority": "medium",
                }
            )

        return recommendations
