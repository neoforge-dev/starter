"""Tests for recommendation system API endpoints."""
import json
from datetime import datetime, timedelta
from typing import Dict, List

import pytest
from app.crud import recommendation as crud_recommendation
from app.models.recommendation import (
    Recommendation,
    RecommendationFeedback,
    UserPreferences,
)
from app.models.user import User
from app.schemas.recommendation import (
    RecommendationCreate,
    RecommendationFeedbackCreate,
    RecommendationStatus,
    RecommendationType,
    UserPreferencesUpdate,
)
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings


class TestRecommendationEndpoints:
    """Test recommendation API endpoints."""

    @pytest.fixture
    async def sample_user_preferences(
        self, db: AsyncSession, normal_user: User
    ) -> UserPreferences:
        """Create sample user preferences."""
        preferences = UserPreferencesUpdate(
            feature_interests={"analytics": 0.8, "dashboard": 0.6, "api": 0.4},
            content_preferences={"tutorials": 0.7, "documentation": 0.5},
            ui_preferences={"preferred_theme": "dark"},
            behavioral_patterns={
                "avg_events_per_session": 15,
                "preferred_time_of_day": 14,
                "interaction_diversity": 8,
                "session_frequency": 0.8,
            },
            avg_session_duration=25.5,
            weekly_active_days=5,
            feature_adoption_rate=0.7,
            max_daily_recommendations=10,
        )

        return await crud_recommendation.user_preferences.create_or_update(
            db, user_id=normal_user.id, obj_in=preferences
        )

    @pytest.fixture
    async def sample_recommendations(
        self, db: AsyncSession, normal_user: User
    ) -> List[Recommendation]:
        """Create sample recommendations."""
        recommendations_data = [
            RecommendationCreate(
                user_id=normal_user.id,
                type=RecommendationType.FEATURE,
                title="Try Advanced Analytics",
                description="Based on your usage patterns, you might benefit from our advanced analytics features.",
                confidence_score=0.85,
                priority_score=0.7,
                relevance_score=0.8,
                context={"feature_name": "advanced_analytics"},
                model_version="v1.0.0",
                algorithm="hybrid",
            ),
            RecommendationCreate(
                user_id=normal_user.id,
                type=RecommendationType.CONTENT,
                title="Learn API Integration",
                description="Explore our comprehensive API integration guide.",
                confidence_score=0.75,
                priority_score=0.6,
                relevance_score=0.7,
                context={"content_type": "tutorial"},
                model_version="v1.0.0",
                algorithm="content_based",
            ),
            RecommendationCreate(
                user_id=normal_user.id,
                type=RecommendationType.ACTION,
                title="Complete Your Profile",
                description="Finish setting up your profile for better personalization.",
                confidence_score=0.9,
                priority_score=0.8,
                relevance_score=0.85,
                context={"action": "complete_profile"},
                model_version="v1.0.0",
                algorithm="content_based",
            ),
        ]

        recommendations = []
        for rec_data in recommendations_data:
            rec = await crud_recommendation.recommendation.create(db, obj_in=rec_data)
            recommendations.append(rec)

        return recommendations

    async def test_get_user_recommendations(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user: User,
        sample_recommendations: List[Recommendation],
        normal_user_token_headers: Dict[str, str],
    ):
        """Test getting user recommendations."""
        response = await client.get(
            f"{settings.API_V1_STR}/recommendations/user/{normal_user.id}",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 200
        data = response.json()

        assert "recommendations" in data
        assert "total_count" in data
        assert "metadata" in data

        recommendations = data["recommendations"]
        assert len(recommendations) == 3
        assert (
            recommendations[0]["confidence_score"]
            >= recommendations[1]["confidence_score"]
        )  # Sorted by score

        # Verify recommendation structure
        rec = recommendations[0]
        assert "recommendation_id" in rec
        assert "type" in rec
        assert "title" in rec
        assert "description" in rec
        assert "confidence_score" in rec
        assert "is_active" in rec
        assert "click_through_rate" in rec

    async def test_get_user_recommendations_filtered_by_type(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user: User,
        sample_recommendations: List[Recommendation],
        normal_user_token_headers: Dict[str, str],
    ):
        """Test getting filtered user recommendations."""
        response = await client.get(
            f"{settings.API_V1_STR}/recommendations/user/{normal_user.id}",
            headers=normal_user_token_headers,
            params={"types": [RecommendationType.FEATURE, RecommendationType.ACTION]},
        )

        assert response.status_code == 200
        data = response.json()

        recommendations = data["recommendations"]
        assert len(recommendations) == 2  # Only feature and action recommendations

        types = [rec["type"] for rec in recommendations]
        assert RecommendationType.FEATURE in types
        assert RecommendationType.ACTION in types
        assert RecommendationType.CONTENT not in types

    async def test_get_user_recommendations_unauthorized(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user: User,
        superuser: User,
        normal_user_token_headers: Dict[str, str],
    ):
        """Test getting recommendations for different user (unauthorized)."""
        response = await client.get(
            f"{settings.API_V1_STR}/recommendations/user/{superuser.id}",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 403

    async def test_get_trending_recommendations(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user: User,
        sample_recommendations: List[Recommendation],
        normal_user_token_headers: Dict[str, str],
    ):
        """Test getting trending recommendations."""
        # Update some recommendations with interaction data
        rec = sample_recommendations[0]
        await crud_recommendation.recommendation.update_engagement(
            db,
            recommendation_id=rec.recommendation_id,
            action="shown",
            increment_impressions=True,
        )
        await crud_recommendation.recommendation.update_engagement(
            db,
            recommendation_id=rec.recommendation_id,
            action="clicked",
            increment_clicks=True,
        )

        response = await client.get(
            f"{settings.API_V1_STR}/recommendations/trending",
            headers=normal_user_token_headers,
            params={"time_window": 24, "limit": 10, "min_interactions": 1},
        )

        assert response.status_code == 200
        data = response.json()

        assert "trending" in data
        assert "time_window" in data
        assert "metadata" in data
        assert data["time_window"] == 24

    async def test_submit_recommendation_feedback(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user: User,
        sample_recommendations: List[Recommendation],
        normal_user_token_headers: Dict[str, str],
    ):
        """Test submitting recommendation feedback."""
        recommendation = sample_recommendations[0]

        feedback_data = {
            "recommendation_id": recommendation.recommendation_id,
            "rating": 4,
            "feedback_type": "explicit",
            "action_taken": "clicked",
            "feedback_text": "This was a helpful recommendation!",
            "context": {"source": "dashboard"},
        }

        response = await client.post(
            f"{settings.API_V1_STR}/recommendations/feedback",
            headers=normal_user_token_headers,
            json=feedback_data,
        )

        assert response.status_code == 200
        data = response.json()

        assert data["rating"] == 4
        assert data["feedback_type"] == "explicit"
        assert data["action_taken"] == "clicked"
        assert data["recommendation_id"] == recommendation.recommendation_id

        # Verify recommendation was updated
        updated_rec = await crud_recommendation.recommendation.get_by_recommendation_id(
            db, recommendation_id=recommendation.recommendation_id
        )
        assert updated_rec.status == RecommendationStatus.CLICKED
        assert updated_rec.clicks == 1

    async def test_submit_feedback_nonexistent_recommendation(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user: User,
        normal_user_token_headers: Dict[str, str],
    ):
        """Test submitting feedback for non-existent recommendation."""
        feedback_data = {
            "recommendation_id": "nonexistent-id",
            "rating": 4,
            "feedback_type": "explicit",
            "action_taken": "clicked",
        }

        response = await client.post(
            f"{settings.API_V1_STR}/recommendations/feedback",
            headers=normal_user_token_headers,
            json=feedback_data,
        )

        assert response.status_code == 404

    async def test_get_similar_users(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user: User,
        superuser: User,
        normal_user_token_headers: Dict[str, str],
    ):
        """Test getting similar users."""
        # Create a sample similar user relationship
        from app.schemas.recommendation import SimilarUsersCreate

        similar_user_create = SimilarUsersCreate(
            user_id=normal_user.id,
            similar_user_id=superuser.id,
            similarity_score=0.75,
            algorithm="cosine",
            behavioral_similarity=0.8,
            preference_similarity=0.7,
            expires_at=datetime.utcnow() + timedelta(days=7),
        )

        await crud_recommendation.similar_users.create(db, obj_in=similar_user_create)

        response = await client.get(
            f"{settings.API_V1_STR}/recommendations/similar-users/{normal_user.id}",
            headers=normal_user_token_headers,
            params={"limit": 10, "min_similarity": 0.5},
        )

        assert response.status_code == 200
        data = response.json()

        assert "similar_users" in data
        assert "total_count" in data
        assert len(data["similar_users"]) == 1
        assert data["similar_users"][0]["similarity_score"] == 0.75

    async def test_update_recommendation_engagement(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user: User,
        sample_recommendations: List[Recommendation],
        normal_user_token_headers: Dict[str, str],
    ):
        """Test updating recommendation engagement."""
        recommendation = sample_recommendations[0]

        response = await client.put(
            f"{settings.API_V1_STR}/recommendations/{recommendation.recommendation_id}/engagement",
            headers=normal_user_token_headers,
            params={"action": "shown"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["impressions"] == 1
        assert data["shown_at"] is not None

    async def test_get_user_preferences(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user: User,
        sample_user_preferences: UserPreferences,
        normal_user_token_headers: Dict[str, str],
    ):
        """Test getting user preferences."""
        response = await client.get(
            f"{settings.API_V1_STR}/recommendations/preferences/{normal_user.id}",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 200
        data = response.json()

        assert data["user_id"] == normal_user.id
        assert data["weekly_active_days"] == 5
        assert data["feature_adoption_rate"] == 0.7
        assert "analytics" in data["feature_interests"]

    async def test_update_user_preferences(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user: User,
        normal_user_token_headers: Dict[str, str],
    ):
        """Test updating user preferences."""
        preferences_data = {
            "feature_interests": {"new_feature": 0.9, "dashboard": 0.8},
            "weekly_active_days": 6,
            "max_daily_recommendations": 8,
            "notification_preferences": {"frequency": "daily"},
        }

        response = await client.put(
            f"{settings.API_V1_STR}/recommendations/preferences/{normal_user.id}",
            headers=normal_user_token_headers,
            json=preferences_data,
        )

        assert response.status_code == 200
        data = response.json()

        assert data["weekly_active_days"] == 6
        assert data["max_daily_recommendations"] == 8
        assert data["feature_interests"]["new_feature"] == 0.9

    async def test_superuser_analytics_access(
        self,
        client: AsyncClient,
        db: AsyncSession,
        superuser: User,
        sample_recommendations: List[Recommendation],
        superuser_token_headers: Dict[str, str],
    ):
        """Test superuser access to analytics."""
        response = await client.get(
            f"{settings.API_V1_STR}/recommendations/analytics",
            headers=superuser_token_headers,
        )

        assert response.status_code == 200
        data = response.json()

        assert "total_recommendations" in data
        assert "avg_ctr" in data
        assert "conversion_rate" in data
        assert "top_performing_types" in data
        assert "model_performance" in data

    async def test_normal_user_analytics_forbidden(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user: User,
        normal_user_token_headers: Dict[str, str],
    ):
        """Test normal user cannot access analytics."""
        response = await client.get(
            f"{settings.API_V1_STR}/recommendations/analytics",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 403

    async def test_bulk_recommendations_creation(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user: User,
        superuser: User,
        superuser_token_headers: Dict[str, str],
    ):
        """Test bulk recommendation creation (superuser only)."""
        bulk_data = {
            "recommendations": [
                {
                    "user_id": normal_user.id,
                    "type": RecommendationType.FEATURE,
                    "title": "Bulk Recommendation 1",
                    "description": "Test bulk creation",
                    "confidence_score": 0.7,
                    "priority_score": 0.6,
                    "relevance_score": 0.65,
                    "model_version": "v1.0.0",
                    "algorithm": "bulk_test",
                },
                {
                    "user_id": superuser.id,
                    "type": RecommendationType.CONTENT,
                    "title": "Bulk Recommendation 2",
                    "description": "Another test bulk creation",
                    "confidence_score": 0.8,
                    "priority_score": 0.7,
                    "relevance_score": 0.75,
                    "model_version": "v1.0.0",
                    "algorithm": "bulk_test",
                },
            ]
        }

        response = await client.post(
            f"{settings.API_V1_STR}/recommendations/bulk",
            headers=superuser_token_headers,
            json=bulk_data,
        )

        assert response.status_code == 200
        data = response.json()

        assert data["created_count"] == 2
        assert len(data["recommendations"]) == 2

    async def test_model_retraining_trigger(
        self,
        client: AsyncClient,
        db: AsyncSession,
        superuser: User,
        superuser_token_headers: Dict[str, str],
    ):
        """Test triggering model retraining (superuser only)."""
        retrain_data = {
            "force_retrain": True,
            "include_feedback": True,
            "algorithm": "cosine",
            "max_training_time": 300,
        }

        response = await client.post(
            f"{settings.API_V1_STR}/recommendations/retrain",
            headers=superuser_token_headers,
            json=retrain_data,
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "started"
        assert "model_version" in data
        assert "started_at" in data
        assert "message" in data

    async def test_generate_new_recommendations(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user: User,
        normal_user_token_headers: Dict[str, str],
    ):
        """Test generating new recommendations for a user."""
        # First, check if there are existing recommendations
        existing_response = await client.get(
            f"{settings.API_V1_STR}/recommendations/user/{normal_user.id}",
            headers=normal_user_token_headers,
        )

        # Request new recommendations
        response = await client.get(
            f"{settings.API_V1_STR}/recommendations/user/{normal_user.id}",
            headers=normal_user_token_headers,
            params={"generate_new": True, "limit": 5},
        )

        assert response.status_code == 200
        data = response.json()

        assert "recommendations" in data
        assert len(data["recommendations"]) <= 5
        assert data["metadata"]["cache_hit"] == False

    async def test_recommendation_with_context_filtering(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user: User,
        sample_recommendations: List[Recommendation],
        normal_user_token_headers: Dict[str, str],
    ):
        """Test getting recommendations with context data filtering."""
        # Without context
        response_no_context = await client.get(
            f"{settings.API_V1_STR}/recommendations/user/{normal_user.id}",
            headers=normal_user_token_headers,
            params={"include_context": False},
        )

        assert response_no_context.status_code == 200
        data_no_context = response_no_context.json()

        if data_no_context["recommendations"]:
            assert data_no_context["recommendations"][0]["context"] is None
            assert data_no_context["recommendations"][0]["metadata"] is None

        # With context
        response_with_context = await client.get(
            f"{settings.API_V1_STR}/recommendations/user/{normal_user.id}",
            headers=normal_user_token_headers,
            params={"include_context": True},
        )

        assert response_with_context.status_code == 200
        data_with_context = response_with_context.json()

        if data_with_context["recommendations"]:
            rec = data_with_context["recommendations"][0]
            assert rec["context"] is not None or rec["context"] == {}

    async def test_recommendation_expiration_handling(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user: User,
        normal_user_token_headers: Dict[str, str],
    ):
        """Test handling of expired recommendations."""
        # Create an expired recommendation
        expired_rec_create = RecommendationCreate(
            user_id=normal_user.id,
            type=RecommendationType.FEATURE,
            title="Expired Recommendation",
            description="This recommendation should be expired",
            confidence_score=0.6,
            priority_score=0.5,
            relevance_score=0.55,
            expires_at=datetime.utcnow() - timedelta(hours=1),  # Expired 1 hour ago
            model_version="v1.0.0",
            algorithm="test",
        )

        await crud_recommendation.recommendation.create(db, obj_in=expired_rec_create)

        response = await client.get(
            f"{settings.API_V1_STR}/recommendations/user/{normal_user.id}",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 200
        data = response.json()

        # Expired recommendations should not be included by default
        recommendations = data["recommendations"]
        for rec in recommendations:
            if rec["expires_at"]:
                expires_at = datetime.fromisoformat(
                    rec["expires_at"].replace("Z", "+00:00")
                )
                assert expires_at > datetime.utcnow().replace(tzinfo=expires_at.tzinfo)


class TestRecommendationCRUDOperations:
    """Test CRUD operations for recommendation system."""

    async def test_recommendation_crud_basic_operations(
        self, db: AsyncSession, normal_user: User
    ):
        """Test basic CRUD operations for recommendations."""
        # Create
        rec_create = RecommendationCreate(
            user_id=normal_user.id,
            type=RecommendationType.FEATURE,
            title="Test Recommendation",
            description="Test description",
            confidence_score=0.8,
            priority_score=0.7,
            relevance_score=0.75,
            model_version="v1.0.0",
            algorithm="test",
        )

        created_rec = await crud_recommendation.recommendation.create(
            db, obj_in=rec_create
        )
        assert created_rec.title == "Test Recommendation"
        assert created_rec.user_id == normal_user.id
        assert created_rec.recommendation_id is not None

        # Read
        found_rec = await crud_recommendation.recommendation.get_by_recommendation_id(
            db, recommendation_id=created_rec.recommendation_id
        )
        assert found_rec is not None
        assert found_rec.id == created_rec.id

        # Update engagement
        updated_rec = await crud_recommendation.recommendation.update_engagement(
            db, recommendation_id=created_rec.recommendation_id, action="shown"
        )
        assert updated_rec.impressions == 1
        assert updated_rec.shown_at is not None

    async def test_user_preferences_crud_operations(
        self, db: AsyncSession, normal_user: User
    ):
        """Test CRUD operations for user preferences."""
        preferences_update = UserPreferencesUpdate(
            feature_interests={"test_feature": 0.9},
            weekly_active_days=4,
            feature_adoption_rate=0.6,
        )

        # Create
        created_prefs = await crud_recommendation.user_preferences.create_or_update(
            db, user_id=normal_user.id, obj_in=preferences_update
        )
        assert created_prefs.user_id == normal_user.id
        assert created_prefs.weekly_active_days == 4

        # Update
        preferences_update2 = UserPreferencesUpdate(
            weekly_active_days=5,
            max_daily_recommendations=15,
        )

        updated_prefs = await crud_recommendation.user_preferences.create_or_update(
            db, user_id=normal_user.id, obj_in=preferences_update2
        )
        assert updated_prefs.weekly_active_days == 5
        assert updated_prefs.max_daily_recommendations == 15
        assert updated_prefs.feature_interests == {"test_feature": 0.9}  # Preserved

    async def test_recommendation_feedback_crud(
        self, db: AsyncSession, normal_user: User
    ):
        """Test CRUD operations for recommendation feedback."""
        # Create a recommendation first
        rec_create = RecommendationCreate(
            user_id=normal_user.id,
            type=RecommendationType.CONTENT,
            title="Test for Feedback",
            description="Test description",
            confidence_score=0.7,
            priority_score=0.6,
            relevance_score=0.65,
            model_version="v1.0.0",
            algorithm="test",
        )

        recommendation = await crud_recommendation.recommendation.create(
            db, obj_in=rec_create
        )

        # Create feedback
        feedback_create = RecommendationFeedbackCreate(
            recommendation_id=recommendation.recommendation_id,
            rating=5,
            feedback_type="explicit",
            action_taken="converted",
            feedback_text="Excellent recommendation!",
        )

        feedback = await crud_recommendation.recommendation_feedback.create(
            db, obj_in=feedback_create, user_id=normal_user.id
        )

        assert feedback.rating == 5
        assert feedback.feedback_type == "explicit"
        assert feedback.user_id == normal_user.id
        assert feedback.recommendation_id == recommendation.recommendation_id

    async def test_bulk_recommendation_creation(
        self, db: AsyncSession, normal_user: User
    ):
        """Test bulk recommendation creation."""
        from app.schemas.recommendation import RecommendationCreateBulk

        bulk_data = RecommendationCreateBulk(
            recommendations=[
                RecommendationCreate(
                    user_id=normal_user.id,
                    type=RecommendationType.FEATURE,
                    title=f"Bulk Recommendation {i}",
                    description=f"Test bulk creation {i}",
                    confidence_score=0.6 + i * 0.1,
                    priority_score=0.5 + i * 0.1,
                    relevance_score=0.55 + i * 0.1,
                    model_version="v1.0.0",
                    algorithm="bulk_test",
                )
                for i in range(3)
            ]
        )

        recommendations = await crud_recommendation.recommendation.create_bulk(
            db, obj_in=bulk_data
        )

        assert len(recommendations) == 3
        for i, rec in enumerate(recommendations):
            assert rec.title == f"Bulk Recommendation {i}"
            assert rec.confidence_score == 0.6 + i * 0.1

    async def test_recommendation_performance_analytics(
        self, db: AsyncSession, normal_user: User
    ):
        """Test recommendation performance analytics."""
        # Create recommendations with different performance metrics
        recommendations_data = [
            ("High CTR", 100, 20, RecommendationType.FEATURE),
            ("Medium CTR", 50, 8, RecommendationType.CONTENT),
            ("Low CTR", 30, 1, RecommendationType.ACTION),
        ]

        for title, impressions, clicks, rec_type in recommendations_data:
            rec_create = RecommendationCreate(
                user_id=normal_user.id,
                type=rec_type,
                title=title,
                description="Analytics test",
                confidence_score=0.7,
                priority_score=0.6,
                relevance_score=0.65,
                model_version="v1.0.0",
                algorithm="analytics_test",
            )

            rec = await crud_recommendation.recommendation.create(db, obj_in=rec_create)

            # Update with performance metrics
            from app.models.recommendation import Recommendation
            from sqlalchemy import update

            await db.execute(
                update(Recommendation)
                .where(Recommendation.id == rec.id)
                .values(impressions=impressions, clicks=clicks)
            )

        await db.commit()

        # Get analytics
        analytics = await crud_recommendation.recommendation.get_performance_analytics(
            db, user_id=normal_user.id
        )

        assert analytics["total_recommendations"] == 3
        assert analytics["total_impressions"] == 180
        assert analytics["total_clicks"] == 29
        assert len(analytics["top_performing_types"]) > 0

    async def test_expired_recommendation_cleanup(
        self, db: AsyncSession, normal_user: User
    ):
        """Test cleanup of expired recommendations."""
        # Create expired recommendation
        expired_rec_create = RecommendationCreate(
            user_id=normal_user.id,
            type=RecommendationType.FEATURE,
            title="Expired Test",
            description="Should be expired",
            confidence_score=0.6,
            priority_score=0.5,
            relevance_score=0.55,
            expires_at=datetime.utcnow() - timedelta(hours=1),
            model_version="v1.0.0",
            algorithm="test",
        )

        expired_rec = await crud_recommendation.recommendation.create(
            db, obj_in=expired_rec_create
        )

        # Run expiration cleanup
        expired_count = (
            await crud_recommendation.recommendation.expire_old_recommendations(db)
        )

        assert expired_count >= 1

        # Verify recommendation status was updated
        updated_rec = await crud_recommendation.recommendation.get(
            db, id=expired_rec.id
        )
        assert updated_rec.status == RecommendationStatus.EXPIRED
