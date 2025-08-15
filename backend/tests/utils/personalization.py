"""Utilities for personalization testing."""
import random
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.personalization import (
    personalization_profile,
    personalization_rule,
    personalization_interaction,
)
from app.models.personalization import (
    PersonalizationProfile,
    PersonalizationRule,
    PersonalizationInteraction,
)
from app.schemas.personalization import (
    PersonalizationProfileCreate,
    PersonalizationRuleCreate,
    PersonalizationInteractionCreate,
)


async def create_random_personalization_profile(
    db: AsyncSession,
    *,
    user_id: int,
    segment: Optional[str] = None,
    **kwargs
) -> PersonalizationProfile:
    """Create a random personalization profile for testing."""
    
    segments = ["new_user", "casual_user", "feature_explorer", "power_user", "goal_oriented"]
    selected_segment = segment or random.choice(segments)
    
    profile_data = {
        "primary_segment": selected_segment,
        "secondary_segments": random.choice([
            None,
            ["mobile_first"],
            ["desktop_focused"],
            ["social_user"]
        ]),
        "segment_confidence": round(random.uniform(0.6, 0.95), 2),
        "usage_patterns": {
            "weekly_active_days": random.randint(1, 7),
            "preferred_session_times": [random.randint(9, 17) for _ in range(3)],
            "session_consistency": round(random.uniform(0.3, 0.9), 2),
            "positive_interactions": random.randint(5, 50)
        },
        "feature_usage": {
            "dashboard": random.randint(10, 100),
            "analytics": random.randint(0, 50),
            "reports": random.randint(0, 30),
            "settings": random.randint(5, 25),
            "integrations": random.randint(0, 15)
        },
        "navigation_patterns": {
            "most_used_sections": random.sample(
                ["dashboard", "analytics", "reports", "settings", "help"],
                k=random.randint(2, 4)
            ),
            "last_context": random.choice(["dashboard", "settings", "analytics"])
        },
        "device_preferences": {
            "primary_device": random.choice(["desktop", "mobile", "tablet"]),
            "device_distribution": {
                "desktop": round(random.uniform(0.3, 0.8), 2),
                "mobile": round(random.uniform(0.1, 0.5), 2),
                "tablet": round(random.uniform(0.0, 0.2), 2)
            },
            "multi_device_user": random.choice([True, False])
        },
        "total_sessions": random.randint(1, 200),
        "avg_session_duration": round(random.uniform(5.0, 45.0), 1),
        "features_adopted": random.randint(1, 20),
        "last_active_days": random.randint(0, 30),
        "ui_preferences": {
            "theme": random.choice(["light", "dark", "auto"]),
            "layout_density": random.choice(["compact", "comfortable", "spacious"]),
            "show_tooltips": random.choice([True, False]),
            "keyboard_shortcuts": random.choice([True, False])
        },
        "content_preferences": {
            "preferred_types": random.sample(
                ["tutorials", "advanced", "beginner", "technical", "business"],
                k=random.randint(1, 3)
            ),
            "engagement_distribution": {
                "tutorials": round(random.uniform(0.1, 0.4), 2),
                "advanced": round(random.uniform(0.0, 0.6), 2),
                "beginner": round(random.uniform(0.1, 0.5), 2)
            }
        },
        "notification_preferences": {
            "frequency": random.choice(["low", "medium", "high"]),
            "channels": random.sample(["email", "in_app", "push"], k=random.randint(1, 3)),
            "onboarding_tips": random.choice([True, False]),
            "feature_announcements": random.choice([True, False])
        },
        "predicted_churn_risk": round(random.uniform(0.1, 0.8), 2),
        "lifetime_value_score": round(random.uniform(0.5, 5.0), 2),
        "next_likely_actions": random.sample([
            "complete_profile", "explore_features", "try_advanced_feature",
            "increase_usage", "provide_feedback", "try_integrations"
        ], k=random.randint(2, 4)),
        **kwargs
    }
    
    return await personalization_profile.create_or_update_profile(
        db, user_id=user_id, profile_data=profile_data
    )


async def create_random_personalization_rule(
    db: AsyncSession,
    *,
    personalization_type: Optional[str] = None,
    is_active: bool = True,
    **kwargs
) -> PersonalizationRule:
    """Create a random personalization rule for testing."""
    
    rule_types = [
        "ui_adaptation", "content_filter", "feature_toggle", 
        "workflow_optimization", "navigation_customization"
    ]
    selected_type = personalization_type or random.choice(rule_types)
    
    segments = ["new_user", "casual_user", "feature_explorer", "power_user", "goal_oriented"]
    contexts = ["login", "dashboard", "settings", "onboarding", "features", "mobile"]
    
    # Generate configuration based on type
    configurations = {
        "ui_adaptation": {
            "theme": random.choice(["light", "dark", "simplified"]),
            "layout_density": random.choice(["compact", "comfortable", "spacious"]),
            "show_tooltips": random.choice([True, False]),
            "font_size": random.choice(["small", "medium", "large"]),
            "color_scheme": random.choice(["default", "high_contrast", "colorful"])
        },
        "content_filter": {
            "content_types": random.sample(
                ["tutorials", "advanced", "beginner", "technical", "business"],
                k=random.randint(2, 4)
            ),
            "difficulty_level": random.choice(["beginner", "intermediate", "advanced"]),
            "personalized_recommendations": random.choice([True, False])
        },
        "feature_toggle": {
            "advanced_analytics": {
                "enabled": random.choice([True, False]),
                "min_sessions": random.randint(5, 20),
                "config": {"show_advanced_charts": True}
            },
            "beta_features": {
                "enabled": random.choice([True, False]),
                "required_features": ["analytics", "reports"]
            }
        },
        "workflow_optimization": {
            "simplified_flows": random.choice([True, False]),
            "skip_steps": {
                "tutorial_step_1": 3,
                "tutorial_step_2": 5,
                "onboarding_tour": 10
            },
            "shortcuts": random.choice([True, False])
        },
        "navigation_customization": {
            "menu_order": ["dashboard", "analytics", "reports", "settings"],
            "quick_actions": random.sample(
                ["create_report", "view_analytics", "manage_settings", "help"],
                k=random.randint(2, 4)
            ),
            "sidebar_collapsed": random.choice([True, False])
        }
    }
    
    rule_data = PersonalizationRuleCreate(
        name=f"Test {selected_type.replace('_', ' ').title()} Rule {random.randint(1, 1000)}",
        description=f"Test rule for {selected_type} personalization",
        target_segments=random.sample(segments, k=random.randint(1, 3)),
        target_contexts=random.sample(contexts, k=random.randint(1, 3)),
        conditions={
            "min_sessions": random.choice([None, random.randint(0, 10)]),
            "max_sessions": random.choice([None, random.randint(20, 100)]),
            "min_features_adopted": random.choice([None, random.randint(1, 5)]),
            "device_types": random.choice([None, ["mobile"], ["desktop"], ["mobile", "tablet"]]),
            "time_of_day": random.choice([None, {"start": 9, "end": 17}])
        },
        personalization_type=selected_type,
        configuration=configurations[selected_type],
        priority=random.randint(50, 200),
        is_active=is_active,
        is_ab_test=random.choice([True, False]),
        ab_test_id=str(uuid4()) if random.choice([True, False]) else None,
        starts_at=random.choice([None, datetime.utcnow() - timedelta(days=random.randint(1, 30))]),
        expires_at=random.choice([None, datetime.utcnow() + timedelta(days=random.randint(30, 90))]),
        **kwargs
    )
    
    return await personalization_rule.create_rule(db, obj_in=rule_data)


async def create_random_personalization_interaction(
    db: AsyncSession,
    *,
    user_id: int,
    rule_id: str,
    context: Optional[str] = None,
    **kwargs
) -> PersonalizationInteraction:
    """Create a random personalization interaction for testing."""
    
    contexts = ["login", "dashboard", "settings", "onboarding", "features", "mobile"]
    interaction_types = ["shown", "clicked", "dismissed", "converted", "ignored"]
    outcomes = ["positive", "negative", "neutral"]
    devices = ["desktop", "mobile", "tablet"]
    
    selected_context = context or random.choice(contexts)
    
    interaction_data = PersonalizationInteractionCreate(
        user_id=user_id,
        rule_id=rule_id,
        context=selected_context,
        interaction_type=random.choice(interaction_types),
        personalization_data={
            "element_type": random.choice(["button", "banner", "modal", "tooltip"]),
            "position": random.choice(["top", "bottom", "sidebar", "center"]),
            "variant": random.choice(["A", "B", "control"]),
            "custom_data": {
                "feature_name": random.choice(["analytics", "reports", "settings"]),
                "action_taken": random.choice(["click", "view", "dismiss"])
            }
        },
        user_action=random.choice([
            "clicked_button", "dismissed_modal", "completed_action",
            "viewed_content", "navigated_away", "converted"
        ]),
        outcome=random.choice(outcomes),
        response_time_ms=random.randint(50, 500),
        engagement_score=round(random.uniform(0.1, 1.0), 2),
        session_id=f"session_{random.randint(10000, 99999)}",
        device_type=random.choice(devices),
        **kwargs
    )
    
    return await personalization_interaction.create_interaction(db, obj_in=interaction_data)


def create_sample_personalization_request(
    user_id: int,
    context: str = "dashboard",
    **kwargs
) -> Dict[str, Any]:
    """Create a sample personalization request for testing."""
    
    return {
        "user_id": user_id,
        "context": context,
        "device_type": random.choice(["desktop", "mobile", "tablet"]),
        "session_id": f"test_session_{random.randint(10000, 99999)}",
        "include_ab_tests": random.choice([True, False]),
        "max_rules": random.randint(10, 50),
        **kwargs
    }


def create_sample_rule_conditions() -> Dict[str, Any]:
    """Create sample rule conditions for testing."""
    
    return {
        "min_sessions": random.choice([None, random.randint(1, 10)]),
        "max_sessions": random.choice([None, random.randint(20, 100)]),
        "min_features_adopted": random.choice([None, random.randint(1, 5)]),
        "max_last_active_days": random.choice([None, random.randint(7, 30)]),
        "min_churn_risk": random.choice([None, round(random.uniform(0.1, 0.5), 2)]),
        "max_churn_risk": random.choice([None, round(random.uniform(0.6, 0.9), 2)]),
        "device_types": random.choice([
            None, 
            ["mobile"], 
            ["desktop"], 
            ["mobile", "tablet"],
            ["desktop", "mobile"]
        ]),
        "time_of_day": random.choice([
            None,
            {"start": 9, "end": 17},
            {"start": 18, "end": 23}
        ]),
        "day_of_week": random.choice([
            None,
            [0, 1, 2, 3, 4],  # Weekdays
            [5, 6]  # Weekends
        ]),
        "feature_usage": random.choice([
            None,
            {"analytics": 5, "reports": 3},
            {"dashboard": 10}
        ]),
        "ui_preferences": random.choice([
            None,
            {"theme": "dark"},
            {"layout_density": "compact"}
        ])
    }


async def create_personalization_test_scenario(
    db: AsyncSession,
    *,
    num_users: int = 5,
    num_rules: int = 10,
    num_interactions_per_user: int = 20
) -> Dict[str, Any]:
    """Create a comprehensive test scenario with users, profiles, rules, and interactions."""
    
    from tests.utils.user import create_random_user
    
    scenario_data = {
        "users": [],
        "profiles": [],
        "rules": [],
        "interactions": []
    }
    
    # Create users and profiles
    for i in range(num_users):
        user = await create_random_user(db)
        profile = await create_random_personalization_profile(db, user_id=user.id)
        
        scenario_data["users"].append(user)
        scenario_data["profiles"].append(profile)
    
    # Create rules
    for i in range(num_rules):
        rule = await create_random_personalization_rule(db)
        scenario_data["rules"].append(rule)
    
    # Create interactions
    for user in scenario_data["users"]:
        for i in range(num_interactions_per_user):
            rule = random.choice(scenario_data["rules"])
            interaction = await create_random_personalization_interaction(
                db, user_id=user.id, rule_id=rule.rule_id
            )
            scenario_data["interactions"].append(interaction)
    
    return scenario_data


def assert_personalization_config_valid(config: Dict[str, Any]) -> None:
    """Assert that a personalization configuration is valid."""
    
    required_fields = [
        "user_id", "segment", "active_rules", "ui_adaptations",
        "content_filters", "feature_flags", "navigation_customizations",
        "generated_at", "cache_expires_at"
    ]
    
    for field in required_fields:
        assert field in config, f"Missing required field: {field}"
    
    assert isinstance(config["user_id"], int)
    assert isinstance(config["segment"], str)
    assert isinstance(config["active_rules"], list)
    assert isinstance(config["ui_adaptations"], dict)
    assert isinstance(config["content_filters"], dict)
    assert isinstance(config["feature_flags"], dict)
    assert isinstance(config["navigation_customizations"], dict)


def assert_interaction_tracked_properly(interaction: Dict[str, Any]) -> None:
    """Assert that an interaction was tracked with all required fields."""
    
    required_fields = [
        "interaction_id", "user_id", "rule_id", "context",
        "interaction_type", "created_at"
    ]
    
    for field in required_fields:
        assert field in interaction, f"Missing required field: {field}"
    
    assert isinstance(interaction["user_id"], int)
    assert isinstance(interaction["rule_id"], str)
    assert interaction["context"] in [
        "login", "dashboard", "settings", "onboarding", "features", "mobile"
    ]
    assert interaction["interaction_type"] in [
        "shown", "clicked", "dismissed", "converted", "ignored"
    ]


def assert_rule_applies_to_user(
    rule: Dict[str, Any], 
    profile: Dict[str, Any], 
    context: str
) -> None:
    """Assert that a rule should apply to a user profile in a given context."""
    
    # Check segment targeting
    user_segments = [profile["primary_segment"]]
    if profile.get("secondary_segments"):
        user_segments.extend(profile["secondary_segments"])
    
    assert any(
        segment in rule["target_segments"] 
        for segment in user_segments
    ), "Rule segments don't match user segments"
    
    # Check context targeting
    assert context in rule["target_contexts"], "Rule doesn't target this context"
    
    # Check rule is active
    assert rule["is_active"], "Rule is not active"


def generate_realistic_user_journey(
    user_id: int,
    rule_ids: List[str],
    session_duration_minutes: int = 30
) -> List[Dict[str, Any]]:
    """Generate a realistic user journey with multiple interactions."""
    
    journey = []
    contexts = ["login", "dashboard", "analytics", "settings"]
    
    # Start with login
    journey.append({
        "user_id": user_id,
        "rule_id": random.choice(rule_ids),
        "context": "login",
        "interaction_type": "shown",
        "outcome": "neutral"
    })
    
    # Main activity on dashboard
    for i in range(random.randint(3, 8)):
        journey.append({
            "user_id": user_id,
            "rule_id": random.choice(rule_ids),
            "context": "dashboard",
            "interaction_type": random.choice(["shown", "clicked"]),
            "outcome": random.choice(["positive", "neutral"])
        })
    
    # Explore other sections
    for context in random.sample(contexts[2:], k=random.randint(1, 2)):
        journey.append({
            "user_id": user_id,
            "rule_id": random.choice(rule_ids),
            "context": context,
            "interaction_type": random.choice(["shown", "clicked", "dismissed"]),
            "outcome": random.choice(["positive", "negative", "neutral"])
        })
    
    return journey