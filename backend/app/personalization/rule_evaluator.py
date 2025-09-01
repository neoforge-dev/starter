"""Rule evaluation engine for personalization conditions and application."""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.models.personalization import PersonalizationProfile, PersonalizationRule
from app.schemas.personalization import PersonalizationRequest
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class RuleEvaluator:
    """
    Evaluates personalization rules and applies their configurations.
    Handles complex conditional logic and rule interactions.
    """

    async def evaluate_rule(
        self,
        db: AsyncSession,
        rule: PersonalizationRule,
        profile: PersonalizationProfile,
        request: PersonalizationRequest,
    ) -> bool:
        """
        Evaluate if a rule should be applied for a given user and context.

        Args:
            db: Database session
            rule: Personalization rule to evaluate
            profile: User's personalization profile
            request: Personalization request context

        Returns:
            bool: True if rule should be applied
        """
        try:
            # Basic checks
            if not rule.is_active:
                return False

            # Time-based checks
            now = datetime.utcnow()
            if rule.starts_at and now < rule.starts_at:
                return False
            if rule.expires_at and now > rule.expires_at:
                return False

            # Segment matching
            if not self._check_segment_match(rule, profile):
                return False

            # Context matching
            if not self._check_context_match(rule, request):
                return False

            # Evaluate custom conditions
            if not await self._evaluate_conditions(db, rule, profile, request):
                return False

            # A/B test logic
            if rule.is_ab_test and not self._check_ab_test_assignment(rule, profile):
                return False

            logger.debug(f"Rule {rule.rule_id} matches for user {profile.user_id}")
            return True

        except Exception as e:
            logger.error(f"Error evaluating rule {rule.rule_id}: {e}")
            return False

    async def apply_rule(
        self,
        db: AsyncSession,
        rule: PersonalizationRule,
        profile: PersonalizationProfile,
        request: PersonalizationRequest,
    ) -> Dict[str, Any]:
        """
        Apply a rule's configuration with any dynamic customizations.

        Args:
            db: Database session
            rule: Rule to apply
            profile: User profile
            request: Request context

        Returns:
            Dict containing the rule's configuration to merge
        """
        try:
            base_config = rule.configuration.copy()

            # Apply rule type-specific logic
            if rule.personalization_type == "ui_adaptation":
                return await self._apply_ui_adaptation(db, rule, profile, base_config)
            elif rule.personalization_type == "content_filter":
                return await self._apply_content_filter(db, rule, profile, base_config)
            elif rule.personalization_type == "feature_toggle":
                return await self._apply_feature_toggle(db, rule, profile, base_config)
            elif rule.personalization_type == "workflow_optimization":
                return await self._apply_workflow_optimization(
                    db, rule, profile, base_config
                )
            elif rule.personalization_type == "navigation_customization":
                return await self._apply_navigation_customization(
                    db, rule, profile, base_config
                )
            else:
                logger.warning(
                    f"Unknown personalization type: {rule.personalization_type}"
                )
                return {}

        except Exception as e:
            logger.error(f"Error applying rule {rule.rule_id}: {e}")
            return {}

    def _check_segment_match(
        self, rule: PersonalizationRule, profile: PersonalizationProfile
    ) -> bool:
        """Check if user's segment matches rule targets."""
        user_segments = [profile.primary_segment]
        if profile.secondary_segments:
            user_segments.extend(profile.secondary_segments)

        return any(segment in rule.target_segments for segment in user_segments)

    def _check_context_match(
        self, rule: PersonalizationRule, request: PersonalizationRequest
    ) -> bool:
        """Check if request context matches rule targets."""
        return request.context in rule.target_contexts

    async def _evaluate_conditions(
        self,
        db: AsyncSession,
        rule: PersonalizationRule,
        profile: PersonalizationProfile,
        request: PersonalizationRequest,
    ) -> bool:
        """Evaluate complex rule conditions."""
        conditions = rule.conditions

        if not conditions:
            return True

        # Evaluate each condition type
        for condition_type, condition_value in conditions.items():
            if condition_type == "min_sessions":
                if profile.total_sessions < condition_value:
                    return False

            elif condition_type == "max_sessions":
                if profile.total_sessions > condition_value:
                    return False

            elif condition_type == "min_features_adopted":
                if profile.features_adopted < condition_value:
                    return False

            elif condition_type == "max_last_active_days":
                if profile.last_active_days > condition_value:
                    return False

            elif condition_type == "min_churn_risk":
                if (
                    not profile.predicted_churn_risk
                    or profile.predicted_churn_risk < condition_value
                ):
                    return False

            elif condition_type == "max_churn_risk":
                if (
                    profile.predicted_churn_risk
                    and profile.predicted_churn_risk > condition_value
                ):
                    return False

            elif condition_type == "device_types":
                if request.device_type and request.device_type not in condition_value:
                    return False

            elif condition_type == "time_of_day":
                current_hour = datetime.utcnow().hour
                if not (
                    condition_value["start"] <= current_hour <= condition_value["end"]
                ):
                    return False

            elif condition_type == "day_of_week":
                current_day = datetime.utcnow().weekday()
                if current_day not in condition_value:
                    return False

            elif condition_type == "feature_usage":
                feature_usage = profile.feature_usage or {}
                for feature, min_usage in condition_value.items():
                    if feature_usage.get(feature, 0) < min_usage:
                        return False

            elif condition_type == "ui_preferences":
                ui_prefs = profile.ui_preferences or {}
                for pref_key, expected_value in condition_value.items():
                    if ui_prefs.get(pref_key) != expected_value:
                        return False

            elif condition_type == "custom_logic":
                # Allow for custom Python evaluation (use with caution)
                if not await self._evaluate_custom_logic(
                    db, condition_value, profile, request
                ):
                    return False

            else:
                logger.warning(f"Unknown condition type: {condition_type}")

        return True

    def _check_ab_test_assignment(
        self, rule: PersonalizationRule, profile: PersonalizationProfile
    ) -> bool:
        """Check A/B test assignment for user."""
        if not rule.ab_test_id:
            return True

        # Simple hash-based assignment
        # In production, integrate with proper A/B testing framework
        user_hash = hash(f"{rule.ab_test_id}_{profile.user_id}") % 100

        # Get assignment percentage from rule configuration
        assignment_pct = rule.configuration.get("ab_test_percentage", 50)

        return user_hash < assignment_pct

    async def _apply_ui_adaptation(
        self,
        db: AsyncSession,
        rule: PersonalizationRule,
        profile: PersonalizationProfile,
        config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Apply UI adaptation rule."""
        ui_adaptations = {}

        # Process UI changes
        if "theme" in config:
            ui_adaptations["theme"] = config["theme"]

        if "layout" in config:
            ui_adaptations["layout"] = config["layout"]

        if "font_size" in config:
            # Adapt font size based on user preferences or age
            base_size = config["font_size"]
            if profile.ui_preferences:
                size_pref = profile.ui_preferences.get("font_size_preference", "medium")
                if size_pref == "large":
                    base_size = int(base_size * 1.2)
                elif size_pref == "small":
                    base_size = int(base_size * 0.8)
            ui_adaptations["font_size"] = base_size

        if "color_scheme" in config:
            ui_adaptations["color_scheme"] = config["color_scheme"]

        if "density" in config:
            # Adapt UI density based on user skill level
            density = config["density"]
            if profile.primary_segment == "new_user":
                density = "spacious"
            elif profile.primary_segment == "power_user":
                density = "compact"
            ui_adaptations["density"] = density

        return {"ui_adaptations": ui_adaptations}

    async def _apply_content_filter(
        self,
        db: AsyncSession,
        rule: PersonalizationRule,
        profile: PersonalizationProfile,
        config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Apply content filtering rule."""
        content_filters = {}

        if "content_types" in config:
            # Filter content based on user preferences
            preferred_types = (
                profile.content_preferences.get("preferred_types", [])
                if profile.content_preferences
                else []
            )
            allowed_types = (
                list(set(config["content_types"]) & set(preferred_types))
                if preferred_types
                else config["content_types"]
            )
            content_filters["allowed_content_types"] = allowed_types

        if "difficulty_level" in config:
            # Adapt difficulty based on user skill
            base_difficulty = config["difficulty_level"]
            if profile.primary_segment == "new_user":
                base_difficulty = "beginner"
            elif profile.primary_segment == "power_user":
                base_difficulty = "advanced"
            content_filters["difficulty_level"] = base_difficulty

        if "personalized_recommendations" in config:
            content_filters["show_recommendations"] = config[
                "personalized_recommendations"
            ]

        return {"content_filters": content_filters}

    async def _apply_feature_toggle(
        self,
        db: AsyncSession,
        rule: PersonalizationRule,
        profile: PersonalizationProfile,
        config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Apply feature toggle rule."""
        feature_flags = {}

        for feature, settings in config.items():
            if isinstance(settings, bool):
                # Simple boolean toggle
                feature_flags[feature] = settings
            elif isinstance(settings, dict):
                # Complex feature configuration
                enabled = settings.get("enabled", True)

                # Check user readiness for feature
                if "min_sessions" in settings:
                    if profile.total_sessions < settings["min_sessions"]:
                        enabled = False

                if "required_features" in settings:
                    user_features = profile.feature_usage or {}
                    for required_feature in settings["required_features"]:
                        if user_features.get(required_feature, 0) == 0:
                            enabled = False
                            break

                feature_flags[feature] = {
                    "enabled": enabled,
                    "config": settings.get("config", {}),
                }

        return {"feature_flags": feature_flags}

    async def _apply_workflow_optimization(
        self,
        db: AsyncSession,
        rule: PersonalizationRule,
        profile: PersonalizationProfile,
        config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Apply workflow optimization rule."""
        ui_adaptations = {}

        if "simplified_flows" in config:
            # Show simplified workflows for new users
            if profile.primary_segment in ["new_user", "casual_user"]:
                ui_adaptations["workflow_complexity"] = "simple"
            else:
                ui_adaptations["workflow_complexity"] = "full"

        if "skip_steps" in config:
            # Skip steps user has mastered
            skip_steps = []
            user_features = profile.feature_usage or {}
            for step, min_usage in config["skip_steps"].items():
                if user_features.get(step, 0) >= min_usage:
                    skip_steps.append(step)
            ui_adaptations["skip_steps"] = skip_steps

        if "shortcuts" in config:
            # Show shortcuts to power users
            if profile.primary_segment == "power_user":
                ui_adaptations["show_shortcuts"] = config["shortcuts"]

        return {"ui_adaptations": ui_adaptations}

    async def _apply_navigation_customization(
        self,
        db: AsyncSession,
        rule: PersonalizationRule,
        profile: PersonalizationProfile,
        config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Apply navigation customization rule."""
        navigation_customizations = {}

        if "menu_order" in config:
            # Customize menu order based on usage patterns
            navigation_patterns = profile.navigation_patterns or {}
            most_used = navigation_patterns.get("most_used_sections", [])

            if most_used:
                # Prioritize most used sections
                menu_order = most_used + [
                    item for item in config["menu_order"] if item not in most_used
                ]
                navigation_customizations["menu_order"] = menu_order
            else:
                navigation_customizations["menu_order"] = config["menu_order"]

        if "quick_actions" in config:
            # Show relevant quick actions
            user_actions = profile.next_likely_actions or []
            relevant_actions = [
                action for action in config["quick_actions"] if action in user_actions
            ]
            navigation_customizations["quick_actions"] = (
                relevant_actions or config["quick_actions"][:3]
            )

        if "sidebar_collapsed" in config:
            # Adapt sidebar based on screen real estate preference
            device_prefs = profile.device_preferences or {}
            if device_prefs.get("prefers_full_width", False):
                navigation_customizations["sidebar_collapsed"] = True
            else:
                navigation_customizations["sidebar_collapsed"] = config[
                    "sidebar_collapsed"
                ]

        return {"navigation_customizations": navigation_customizations}

    async def _evaluate_custom_logic(
        self,
        db: AsyncSession,
        logic: str,
        profile: PersonalizationProfile,
        request: PersonalizationRequest,
    ) -> bool:
        """Safely evaluate custom logic conditions."""
        try:
            # This is a simplified version - in production, use a proper
            # rule engine or sandboxed evaluation

            # Create safe evaluation context
            context = {
                "profile": profile,
                "request": request,
                "datetime": datetime,
                "timedelta": timedelta,
            }

            # Add safe functions
            safe_builtins = {
                "len": len,
                "max": max,
                "min": min,
                "sum": sum,
                "any": any,
                "all": all,
            }

            # Evaluate with restricted context
            return eval(logic, {"__builtins__": safe_builtins}, context)

        except Exception as e:
            logger.warning(f"Custom logic evaluation failed: {e}")
            return False
