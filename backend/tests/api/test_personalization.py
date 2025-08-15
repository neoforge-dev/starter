"""Test personalization API endpoints."""
import pytest
from datetime import datetime, timedelta
from typing import Dict, Any

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.personalization import (
    PersonalizationProfile,
    PersonalizationRule,
    PersonalizationInteraction,
)
from app.schemas.personalization import (
    PersonalizationRequest,
    PersonalizationRuleCreate,
    PersonalizationInteractionCreate,
)
from tests.utils.user import create_random_user
from tests.utils.personalization import (
    create_random_personalization_profile,
    create_random_personalization_rule,
    create_random_personalization_interaction,
)


class TestPersonalizationProfiles:
    """Test personalization profile endpoints."""

    async def test_get_user_profile(self, client: TestClient, db: AsyncSession, normal_user_token_headers: Dict[str, str]):
        """Test getting user personalization profile."""
        # Create user and profile
        user = await create_random_user(db)
        profile = await create_random_personalization_profile(db, user_id=user.id)
        
        response = client.get(
            f"{settings.API_V1_STR}/personalization/profile/{user.id}",
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 200
        content = response.json()
        assert content["user_id"] == user.id
        assert content["primary_segment"] == profile.primary_segment
        assert content["segment_confidence"] == profile.segment_confidence

    async def test_get_profile_unauthorized(self, client: TestClient, db: AsyncSession, normal_user_token_headers: Dict[str, str]):
        """Test getting another user's profile without permission."""
        user1 = await create_random_user(db)
        user2 = await create_random_user(db)
        await create_random_personalization_profile(db, user_id=user2.id)
        
        response = client.get(
            f"{settings.API_V1_STR}/personalization/profile/{user2.id}",
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 403

    async def test_create_or_update_profile(self, client: TestClient, db: AsyncSession, normal_user_token_headers: Dict[str, str]):
        """Test creating or updating personalization profile."""
        user = await create_random_user(db)
        
        profile_data = {
            "primary_segment": "power_user",
            "segment_confidence": 0.9,
            "ui_preferences": {
                "theme": "dark",
                "compact_layout": True
            },
            "content_preferences": {
                "preferred_types": ["technical", "advanced"]
            }
        }
        
        response = client.post(
            f"{settings.API_V1_STR}/personalization/profile/{user.id}",
            headers=normal_user_token_headers,
            json=profile_data,
        )
        
        assert response.status_code == 200
        content = response.json()
        assert content["user_id"] == user.id
        assert content["primary_segment"] == "power_user"
        assert content["segment_confidence"] == 0.9

    async def test_recompute_profile(self, client: TestClient, db: AsyncSession, normal_user_token_headers: Dict[str, str]):
        """Test forcing profile recomputation."""
        user = await create_random_user(db)
        await create_random_personalization_profile(db, user_id=user.id)
        
        response = client.post(
            f"{settings.API_V1_STR}/personalization/profile/{user.id}/recompute",
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 200
        content = response.json()
        assert content["user_id"] == user.id
        assert "last_analyzed_at" in content


class TestPersonalizationConfig:
    """Test personalization configuration endpoints."""

    async def test_get_personalized_config(self, client: TestClient, db: AsyncSession, normal_user_token_headers: Dict[str, str]):
        """Test getting personalized configuration."""
        user = await create_random_user(db)
        profile = await create_random_personalization_profile(db, user_id=user.id)
        rule = await create_random_personalization_rule(db)
        
        request_data = {
            "user_id": user.id,
            "context": "dashboard",
            "device_type": "desktop",
            "session_id": "test_session_123",
            "include_ab_tests": True,
            "max_rules": 10
        }
        
        response = client.post(
            f"{settings.API_V1_STR}/personalization/config",
            headers=normal_user_token_headers,
            json=request_data,
        )
        
        assert response.status_code == 200
        content = response.json()
        assert content["user_id"] == user.id
        assert content["segment"] == profile.primary_segment
        assert "ui_adaptations" in content
        assert "content_filters" in content
        assert "feature_flags" in content
        assert "navigation_customizations" in content
        assert "active_rules" in content

    async def test_get_config_unauthorized(self, client: TestClient, db: AsyncSession, normal_user_token_headers: Dict[str, str]):
        """Test getting config for another user without permission."""
        user1 = await create_random_user(db)
        user2 = await create_random_user(db)
        
        request_data = {
            "user_id": user2.id,
            "context": "dashboard",
        }
        
        response = client.post(
            f"{settings.API_V1_STR}/personalization/config",
            headers=normal_user_token_headers,
            json=request_data,
        )
        
        assert response.status_code == 403

    async def test_get_config_with_caching(self, client: TestClient, db: AsyncSession, normal_user_token_headers: Dict[str, str]):
        """Test that configuration is cached properly."""
        user = await create_random_user(db)
        await create_random_personalization_profile(db, user_id=user.id)
        
        request_data = {
            "user_id": user.id,
            "context": "dashboard",
        }
        
        # First request
        response1 = client.post(
            f"{settings.API_V1_STR}/personalization/config",
            headers=normal_user_token_headers,
            json=request_data,
        )
        
        # Second request (should be cached)
        response2 = client.post(
            f"{settings.API_V1_STR}/personalization/config",
            headers=normal_user_token_headers,
            json=request_data,
        )
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        # Both responses should be identical
        assert response1.json()["generated_at"] == response2.json()["generated_at"]


class TestPersonalizationRules:
    """Test personalization rule management endpoints."""

    async def test_create_rule(self, client: TestClient, db: AsyncSession, superuser_token_headers: Dict[str, str]):
        """Test creating personalization rule."""
        rule_data = {
            "name": "Test UI Adaptation Rule",
            "description": "Test rule for UI adaptations",
            "target_segments": ["new_user", "casual_user"],
            "target_contexts": ["dashboard", "onboarding"],
            "conditions": {
                "min_sessions": 0,
                "max_sessions": 10,
                "device_types": ["mobile", "tablet"]
            },
            "personalization_type": "ui_adaptation",
            "configuration": {
                "theme": "simplified",
                "show_tooltips": True,
                "layout_density": "spacious"
            },
            "priority": 100,
            "is_active": True,
            "is_ab_test": False
        }
        
        response = client.post(
            f"{settings.API_V1_STR}/personalization/rules",
            headers=superuser_token_headers,
            json=rule_data,
        )
        
        assert response.status_code == 200
        content = response.json()
        assert content["name"] == rule_data["name"]
        assert content["personalization_type"] == rule_data["personalization_type"]
        assert content["target_segments"] == rule_data["target_segments"]
        assert "rule_id" in content

    async def test_create_rule_unauthorized(self, client: TestClient, normal_user_token_headers: Dict[str, str]):
        """Test creating rule without admin permissions."""
        rule_data = {
            "name": "Test Rule",
            "description": "Test description",
            "target_segments": ["new_user"],
            "target_contexts": ["dashboard"],
            "conditions": {},
            "personalization_type": "ui_adaptation",
            "configuration": {},
        }
        
        response = client.post(
            f"{settings.API_V1_STR}/personalization/rules",
            headers=normal_user_token_headers,
            json=rule_data,
        )
        
        assert response.status_code == 403

    async def test_list_rules(self, client: TestClient, db: AsyncSession, superuser_token_headers: Dict[str, str]):
        """Test listing personalization rules."""
        # Create test rules
        rule1 = await create_random_personalization_rule(db)
        rule2 = await create_random_personalization_rule(db)
        
        response = client.get(
            f"{settings.API_V1_STR}/personalization/rules",
            headers=superuser_token_headers,
        )
        
        assert response.status_code == 200
        content = response.json()
        assert "rules" in content
        assert "total" in content
        assert "page" in content
        assert len(content["rules"]) >= 2

    async def test_list_rules_with_filters(self, client: TestClient, db: AsyncSession, superuser_token_headers: Dict[str, str]):
        """Test listing rules with filters."""
        # Create test rules with different types
        rule1 = await create_random_personalization_rule(db, personalization_type="ui_adaptation")
        rule2 = await create_random_personalization_rule(db, personalization_type="content_filter")
        
        response = client.get(
            f"{settings.API_V1_STR}/personalization/rules?personalization_type=ui_adaptation",
            headers=superuser_token_headers,
        )
        
        assert response.status_code == 200
        content = response.json()
        
        # Should only return ui_adaptation rules
        for rule in content["rules"]:
            assert rule["personalization_type"] == "ui_adaptation"

    async def test_update_rule(self, client: TestClient, db: AsyncSession, superuser_token_headers: Dict[str, str]):
        """Test updating personalization rule."""
        rule = await create_random_personalization_rule(db)
        
        update_data = {
            "name": "Updated Rule Name",
            "is_active": False,
            "priority": 200,
        }
        
        response = client.put(
            f"{settings.API_V1_STR}/personalization/rules/{rule.rule_id}",
            headers=superuser_token_headers,
            json=update_data,
        )
        
        assert response.status_code == 200
        content = response.json()
        assert content["name"] == "Updated Rule Name"
        assert content["is_active"] is False
        assert content["priority"] == 200

    async def test_delete_rule(self, client: TestClient, db: AsyncSession, superuser_token_headers: Dict[str, str]):
        """Test deleting personalization rule."""
        rule = await create_random_personalization_rule(db)
        
        response = client.delete(
            f"{settings.API_V1_STR}/personalization/rules/{rule.rule_id}",
            headers=superuser_token_headers,
        )
        
        assert response.status_code == 200
        assert "message" in response.json()


class TestPersonalizationInteractions:
    """Test personalization interaction tracking."""

    async def test_track_interaction(self, client: TestClient, db: AsyncSession, normal_user_token_headers: Dict[str, str]):
        """Test tracking personalization interaction."""
        user = await create_random_user(db)
        rule = await create_random_personalization_rule(db)
        
        interaction_data = {
            "user_id": user.id,
            "rule_id": rule.rule_id,
            "context": "dashboard",
            "interaction_type": "clicked",
            "personalization_data": {
                "element": "feature_button",
                "position": "top_right"
            },
            "user_action": "clicked_feature_button",
            "outcome": "positive",
            "session_id": "test_session_123",
            "device_type": "desktop",
            "response_time_ms": 150,
            "engagement_score": 0.8
        }
        
        response = client.post(
            f"{settings.API_V1_STR}/personalization/track-interaction",
            headers=normal_user_token_headers,
            json=interaction_data,
        )
        
        assert response.status_code == 200
        assert "message" in response.json()

    async def test_track_bulk_interactions(self, client: TestClient, db: AsyncSession, normal_user_token_headers: Dict[str, str]):
        """Test tracking multiple interactions."""
        user = await create_random_user(db)
        rule = await create_random_personalization_rule(db)
        
        interactions_data = {
            "interactions": [
                {
                    "user_id": user.id,
                    "rule_id": rule.rule_id,
                    "context": "dashboard",
                    "interaction_type": "shown",
                    "outcome": "neutral"
                },
                {
                    "user_id": user.id,
                    "rule_id": rule.rule_id,
                    "context": "dashboard",
                    "interaction_type": "clicked",
                    "outcome": "positive"
                }
            ]
        }
        
        response = client.post(
            f"{settings.API_V1_STR}/personalization/track-interactions",
            headers=normal_user_token_headers,
            json=interactions_data,
        )
        
        assert response.status_code == 200
        content = response.json()
        assert "2 interactions" in content["message"]

    async def test_get_user_interactions(self, client: TestClient, db: AsyncSession, normal_user_token_headers: Dict[str, str]):
        """Test getting user interactions."""
        user = await create_random_user(db)
        rule = await create_random_personalization_rule(db)
        
        # Create test interactions
        interaction1 = await create_random_personalization_interaction(db, user_id=user.id, rule_id=rule.rule_id)
        interaction2 = await create_random_personalization_interaction(db, user_id=user.id, rule_id=rule.rule_id)
        
        response = client.get(
            f"{settings.API_V1_STR}/personalization/interactions/{user.id}",
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 200
        content = response.json()
        assert "interactions" in content
        assert len(content["interactions"]) >= 2

    async def test_get_interactions_with_filters(self, client: TestClient, db: AsyncSession, normal_user_token_headers: Dict[str, str]):
        """Test getting interactions with context filter."""
        user = await create_random_user(db)
        rule = await create_random_personalization_rule(db)
        
        # Create interactions with different contexts
        await create_random_personalization_interaction(db, user_id=user.id, rule_id=rule.rule_id, context="dashboard")
        await create_random_personalization_interaction(db, user_id=user.id, rule_id=rule.rule_id, context="settings")
        
        response = client.get(
            f"{settings.API_V1_STR}/personalization/interactions/{user.id}?context=dashboard",
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 200
        content = response.json()
        
        # Should only return dashboard interactions
        for interaction in content["interactions"]:
            assert interaction["context"] == "dashboard"


class TestPersonalizationAnalytics:
    """Test personalization analytics endpoints."""

    async def test_get_analytics(self, client: TestClient, db: AsyncSession, superuser_token_headers: Dict[str, str]):
        """Test getting personalization analytics."""
        # Create test data
        user = await create_random_user(db)
        profile = await create_random_personalization_profile(db, user_id=user.id)
        rule = await create_random_personalization_rule(db)
        interaction = await create_random_personalization_interaction(db, user_id=user.id, rule_id=rule.rule_id)
        
        response = client.get(
            f"{settings.API_V1_STR}/personalization/analytics",
            headers=superuser_token_headers,
        )
        
        assert response.status_code == 200
        content = response.json()
        assert "total_rules" in content
        assert "active_rules" in content
        assert "total_interactions" in content
        assert "success_rate" in content
        assert "segment_performance" in content
        assert "top_performing_rules" in content

    async def test_get_segment_analytics(self, client: TestClient, db: AsyncSession, superuser_token_headers: Dict[str, str]):
        """Test getting segment analytics."""
        # Create test data for different segments
        user1 = await create_random_user(db)
        user2 = await create_random_user(db)
        profile1 = await create_random_personalization_profile(db, user_id=user1.id, segment="new_user")
        profile2 = await create_random_personalization_profile(db, user_id=user2.id, segment="power_user")
        
        response = client.get(
            f"{settings.API_V1_STR}/personalization/segments",
            headers=superuser_token_headers,
        )
        
        assert response.status_code == 200
        content = response.json()
        assert isinstance(content, list)
        
        # Should have analytics for different segments
        segments = [item["segment"] for item in content]
        assert len(segments) > 0

    async def test_get_user_insights(self, client: TestClient, db: AsyncSession, normal_user_token_headers: Dict[str, str]):
        """Test getting user personalization insights."""
        user = await create_random_user(db)
        profile = await create_random_personalization_profile(db, user_id=user.id)
        
        response = client.get(
            f"{settings.API_V1_STR}/personalization/insights/{user.id}",
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 200
        content = response.json()
        assert content["user_id"] == user.id
        assert content["segment"] == profile.primary_segment
        assert "behavioral_insights" in content
        assert "predicted_actions" in content
        assert "optimization_recommendations" in content

    async def test_optimize_rules(self, client: TestClient, db: AsyncSession, superuser_token_headers: Dict[str, str]):
        """Test rule optimization endpoint."""
        # Create test rules and interactions
        rule = await create_random_personalization_rule(db)
        user = await create_random_user(db)
        
        # Create enough interactions for optimization
        for i in range(150):  # More than min_interactions threshold
            await create_random_personalization_interaction(db, user_id=user.id, rule_id=rule.rule_id)
        
        optimization_data = {
            "rule_ids": [rule.rule_id],
            "min_interactions": 100,
            "optimization_goal": "conversion"
        }
        
        response = client.post(
            f"{settings.API_V1_STR}/personalization/optimize",
            headers=superuser_token_headers,
            json=optimization_data,
        )
        
        assert response.status_code == 200
        content = response.json()
        assert "optimized_rules" in content
        assert "recommendations" in content

    async def test_get_rule_performance(self, client: TestClient, db: AsyncSession, superuser_token_headers: Dict[str, str]):
        """Test getting rule performance report."""
        rule = await create_random_personalization_rule(db)
        user = await create_random_user(db)
        
        # Create test interactions
        await create_random_personalization_interaction(db, user_id=user.id, rule_id=rule.rule_id)
        
        response = client.get(
            f"{settings.API_V1_STR}/personalization/rules/{rule.rule_id}/performance",
            headers=superuser_token_headers,
        )
        
        assert response.status_code == 200
        content = response.json()
        assert content["rule_id"] == rule.rule_id
        assert content["rule_name"] == rule.name
        assert "performance_metrics" in content
        assert "interaction_timeline" in content
        assert "optimization_suggestions" in content


class TestPersonalizationSecurity:
    """Test personalization security and permissions."""

    async def test_user_can_only_access_own_data(self, client: TestClient, db: AsyncSession, normal_user_token_headers: Dict[str, str]):
        """Test that users can only access their own personalization data."""
        user1 = await create_random_user(db)
        user2 = await create_random_user(db)
        
        profile2 = await create_random_personalization_profile(db, user_id=user2.id)
        
        # Try to access another user's profile
        response = client.get(
            f"{settings.API_V1_STR}/personalization/profile/{user2.id}",
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 403

    async def test_admin_access_required_for_rules(self, client: TestClient, normal_user_token_headers: Dict[str, str]):
        """Test that admin access is required for rule management."""
        rule_data = {
            "name": "Test Rule",
            "description": "Test description",
            "target_segments": ["new_user"],
            "target_contexts": ["dashboard"],
            "conditions": {},
            "personalization_type": "ui_adaptation",
            "configuration": {},
        }
        
        # Try to create rule without admin permissions
        response = client.post(
            f"{settings.API_V1_STR}/personalization/rules",
            headers=normal_user_token_headers,
            json=rule_data,
        )
        
        assert response.status_code == 403

    async def test_admin_access_required_for_analytics(self, client: TestClient, normal_user_token_headers: Dict[str, str]):
        """Test that admin access is required for system analytics."""
        response = client.get(
            f"{settings.API_V1_STR}/personalization/analytics",
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 403


class TestPersonalizationPerformance:
    """Test personalization system performance."""

    async def test_config_generation_performance(self, client: TestClient, db: AsyncSession, normal_user_token_headers: Dict[str, str]):
        """Test that configuration generation is fast."""
        user = await create_random_user(db)
        profile = await create_random_personalization_profile(db, user_id=user.id)
        
        # Create multiple rules to test performance
        for i in range(20):
            await create_random_personalization_rule(db)
        
        request_data = {
            "user_id": user.id,
            "context": "dashboard",
            "max_rules": 50
        }
        
        import time
        start_time = time.time()
        
        response = client.post(
            f"{settings.API_V1_STR}/personalization/config",
            headers=normal_user_token_headers,
            json=request_data,
        )
        
        end_time = time.time()
        response_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        assert response.status_code == 200
        assert response_time < 1000  # Should be under 1 second
        
        content = response.json()
        assert "active_rules" in content

    async def test_bulk_interaction_tracking_performance(self, client: TestClient, db: AsyncSession, normal_user_token_headers: Dict[str, str]):
        """Test bulk interaction tracking performance."""
        user = await create_random_user(db)
        rule = await create_random_personalization_rule(db)
        
        # Create bulk interactions
        interactions_data = {
            "interactions": [
                {
                    "user_id": user.id,
                    "rule_id": rule.rule_id,
                    "context": "dashboard",
                    "interaction_type": "shown",
                    "outcome": "neutral"
                }
                for i in range(100)  # 100 interactions
            ]
        }
        
        import time
        start_time = time.time()
        
        response = client.post(
            f"{settings.API_V1_STR}/personalization/track-interactions",
            headers=normal_user_token_headers,
            json=interactions_data,
        )
        
        end_time = time.time()
        response_time = (end_time - start_time) * 1000
        
        assert response.status_code == 200
        assert response_time < 5000  # Should be under 5 seconds for 100 interactions
        
        content = response.json()
        assert "100 interactions" in content["message"]


class TestPersonalizationIntegration:
    """Test personalization system integration with other components."""

    async def test_integration_with_ab_testing(self, client: TestClient, db: AsyncSession, superuser_token_headers: Dict[str, str]):
        """Test personalization integration with A/B testing."""
        # Create A/B test rule
        rule_data = {
            "name": "A/B Test UI Rule",
            "description": "Testing UI variations",
            "target_segments": ["new_user"],
            "target_contexts": ["dashboard"],
            "conditions": {},
            "personalization_type": "ui_adaptation",
            "configuration": {
                "ab_test_percentage": 50,
                "variant_a": {"theme": "light"},
                "variant_b": {"theme": "dark"}
            },
            "is_ab_test": True,
            "ab_test_id": "test_ab_123"
        }
        
        response = client.post(
            f"{settings.API_V1_STR}/personalization/rules",
            headers=superuser_token_headers,
            json=rule_data,
        )
        
        assert response.status_code == 200
        content = response.json()
        assert content["is_ab_test"] is True
        assert content["ab_test_id"] == "test_ab_123"

    async def test_integration_with_event_tracking(self, client: TestClient, db: AsyncSession, normal_user_token_headers: Dict[str, str]):
        """Test personalization integration with event tracking."""
        user = await create_random_user(db)
        rule = await create_random_personalization_rule(db)
        
        # Track interaction with event data
        interaction_data = {
            "user_id": user.id,
            "rule_id": rule.rule_id,
            "context": "dashboard",
            "interaction_type": "feature_used",
            "personalization_data": {
                "feature_name": "advanced_analytics",
                "event_type": "feature_adoption"
            },
            "outcome": "positive"
        }
        
        response = client.post(
            f"{settings.API_V1_STR}/personalization/track-interaction",
            headers=normal_user_token_headers,
            json=interaction_data,
        )
        
        assert response.status_code == 200
        
        # Verify the interaction was tracked with event context
        interactions_response = client.get(
            f"{settings.API_V1_STR}/personalization/interactions/{user.id}",
            headers=normal_user_token_headers,
        )
        
        assert interactions_response.status_code == 200
        interactions = interactions_response.json()["interactions"]
        
        # Find our tracked interaction
        tracked_interaction = next(
            (i for i in interactions if i["interaction_type"] == "feature_used"),
            None
        )
        
        assert tracked_interaction is not None
        assert tracked_interaction["personalization_data"]["feature_name"] == "advanced_analytics"