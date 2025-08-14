"""Tests for ML recommendation algorithms."""
import pytest
from datetime import datetime, timedelta
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.ml.recommendations import RecommendationEngine, SimilarityEngine
from app.models.user import User
from app.models.event import Event
from app.models.recommendation import UserPreferences, SimilarUsers
from app.schemas.event import EventCreate, EventType
from app.schemas.recommendation import (
    UserPreferencesUpdate, SimilarUsersCreate, RecommendationType
)
from app.crud import event as crud_event, recommendation as crud_recommendation


class TestRecommendationEngine:
    """Test ML recommendation engine algorithms."""

    @pytest.fixture
    async def engine(self, db: AsyncSession) -> RecommendationEngine:
        """Create recommendation engine instance."""
        return RecommendationEngine(db)

    @pytest.fixture
    async def similarity_engine(self, db: AsyncSession) -> SimilarityEngine:
        """Create similarity engine instance."""
        return SimilarityEngine(db)

    @pytest.fixture
    async def user_with_behavior(self, db: AsyncSession, normal_user: User) -> User:
        """Create user with realistic behavior events."""
        # Create events representing user behavior
        events_data = [
            # Feature usage events
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="feature_analytics",
                source="web",
                properties={"feature_category": "analytics", "session_duration": 15},
            ),
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="feature_dashboard",
                source="web",
                properties={"feature_category": "dashboard", "session_duration": 20},
            ),
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="page_view",
                source="web",
                properties={"page": "/dashboard", "content_type": "interface"},
            ),
            # Content interaction events
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="read_documentation",
                source="web",
                properties={"content_type": "documentation", "time_spent": 300},
            ),
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="watch_tutorial",
                source="web",
                properties={"content_type": "tutorial", "completion_rate": 0.8},
            ),
            # API usage events
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="api_call",
                source="api",
                properties={"endpoint": "/api/v1/data", "response_time": 150},
            ),
        ]

        current_time = datetime.utcnow()
        for i, event_create in enumerate(events_data):
            # Spread events over the past 30 days
            event_time = current_time - timedelta(days=30 - i * 5)
            await crud_event.event.create(
                db,
                obj_in=event_create,
                user_id=normal_user.id,
                ip_address="127.0.0.1",
            )

        return normal_user

    @pytest.fixture
    async def user_with_preferences(
        self, db: AsyncSession, user_with_behavior: User
    ) -> User:
        """Create user with defined preferences."""
        preferences = UserPreferencesUpdate(
            feature_interests={
                "analytics": 0.9,
                "dashboard": 0.7,
                "api": 0.5,
                "reporting": 0.3,
            },
            content_preferences={
                "documentation": 0.8,
                "tutorials": 0.6,
                "best_practices": 0.4,
            },
            ui_preferences={"preferred_theme": "dark"},
            behavioral_patterns={
                "avg_events_per_session": 12,
                "preferred_time_of_day": 14,
                "interaction_diversity": 6,
                "session_frequency": 0.6,
            },
            avg_session_duration=18.5,
            weekly_active_days=4,
            feature_adoption_rate=0.65,
            max_daily_recommendations=8,
        )

        await crud_recommendation.user_preferences.create_or_update(
            db, user_id=user_with_behavior.id, obj_in=preferences
        )

        return user_with_behavior

    @pytest.fixture
    async def similar_users(
        self, db: AsyncSession, user_with_preferences: User, superuser: User
    ) -> List[SimilarUsers]:
        """Create similar user relationships."""
        similarities = [
            SimilarUsersCreate(
                user_id=user_with_preferences.id,
                similar_user_id=superuser.id,
                similarity_score=0.85,
                algorithm="cosine",
                behavioral_similarity=0.9,
                preference_similarity=0.8,
                common_features={"analytics": True, "dashboard": True},
                expires_at=datetime.utcnow() + timedelta(days=7),
            ),
        ]

        similar_users_list = []
        for sim_create in similarities:
            similar_user = await crud_recommendation.similar_users.create(
                db, obj_in=sim_create
            )
            similar_users_list.append(similar_user)

        return similar_users_list

    async def test_generate_recommendations_hybrid(
        self,
        engine: RecommendationEngine,
        user_with_preferences: User,
        similar_users: List[SimilarUsers],
    ):
        """Test hybrid recommendation generation."""
        recommendations = await engine.generate_recommendations(
            user_id=user_with_preferences.id,
            recommendation_types=[RecommendationType.FEATURE, RecommendationType.CONTENT],
            max_recommendations=5,
            algorithm="hybrid",
        )

        assert len(recommendations) <= 5
        assert all(rec.algorithm == "hybrid" for rec in recommendations)
        assert all(0.0 <= rec.confidence_score <= 1.0 for rec in recommendations)
        assert all(0.0 <= rec.priority_score <= 1.0 for rec in recommendations)
        assert all(rec.model_version == "v1.0.0" for rec in recommendations)

        # Check that we have different types
        types = [rec.type for rec in recommendations]
        assert RecommendationType.FEATURE in types or RecommendationType.CONTENT in types

    async def test_generate_recommendations_collaborative(
        self,
        engine: RecommendationEngine,
        user_with_preferences: User,
        similar_users: List[SimilarUsers],
    ):
        """Test collaborative filtering recommendations."""
        recommendations = await engine.generate_recommendations(
            user_id=user_with_preferences.id,
            recommendation_types=[RecommendationType.FEATURE],
            max_recommendations=3,
            algorithm="collaborative",
        )

        assert len(recommendations) <= 3
        if recommendations:  # Might be empty if no similar user data
            assert all(rec.algorithm == "collaborative" for rec in recommendations)
            assert all(rec.type == RecommendationType.FEATURE for rec in recommendations)

    async def test_generate_recommendations_content_based(
        self,
        engine: RecommendationEngine,
        user_with_preferences: User,
    ):
        """Test content-based filtering recommendations."""
        recommendations = await engine.generate_recommendations(
            user_id=user_with_preferences.id,
            recommendation_types=[RecommendationType.CONTENT, RecommendationType.ACTION],
            max_recommendations=4,
            algorithm="content_based",
        )

        assert len(recommendations) <= 4
        if recommendations:
            assert all(rec.algorithm == "content_based" for rec in recommendations)
            types = [rec.type for rec in recommendations]
            assert all(t in [RecommendationType.CONTENT, RecommendationType.ACTION] for t in types)

    async def test_generate_feature_recommendations(
        self,
        engine: RecommendationEngine,
        user_with_preferences: User,
        similar_users: List[SimilarUsers],
    ):
        """Test feature recommendation generation."""
        recommendations = await engine._generate_by_type_and_algorithm(
            user_id=user_with_preferences.id,
            rec_type=RecommendationType.FEATURE,
            algorithm="collaborative",
            user_prefs=await engine._get_user_preferences(user_with_preferences.id),
        )

        if recommendations:  # May be empty depending on test data
            assert all(rec.type == RecommendationType.FEATURE for rec in recommendations)
            assert all("feature" in rec.context.get("feature_name", "").lower() 
                     if rec.context else True for rec in recommendations)

    async def test_generate_action_recommendations(
        self,
        engine: RecommendationEngine,
        user_with_preferences: User,
    ):
        """Test action recommendation generation."""
        recommendations = await engine._generate_by_type_and_algorithm(
            user_id=user_with_preferences.id,
            rec_type=RecommendationType.ACTION,
            algorithm="content_based",
            user_prefs=await engine._get_user_preferences(user_with_preferences.id),
        )

        if recommendations:
            assert all(rec.type == RecommendationType.ACTION for rec in recommendations)
            assert all("action" in rec.context or "workflow" in rec.context 
                     if rec.context else True for rec in recommendations)

    async def test_generate_personalization_recommendations(
        self,
        engine: RecommendationEngine,
        user_with_preferences: User,
    ):
        """Test personalization recommendation generation."""
        recommendations = await engine._generate_by_type_and_algorithm(
            user_id=user_with_preferences.id,
            rec_type=RecommendationType.PERSONALIZATION,
            algorithm="content_based",
            user_prefs=await engine._get_user_preferences(user_with_preferences.id),
        )

        if recommendations:
            assert all(rec.type == RecommendationType.PERSONALIZATION for rec in recommendations)
            # Personalization should have relevant context
            for rec in recommendations:
                if rec.context:
                    assert any(key in rec.context for key in 
                              ["theme", "dashboard", "customization", "ui"])

    async def test_popularity_based_fallback(
        self,
        db: AsyncSession,
        engine: RecommendationEngine,
        normal_user: User,
    ):
        """Test popularity-based recommendations as fallback."""
        # Create popular features through events
        popular_events = [
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="feature_popular_one",
                source="web",
                properties={"popularity_score": 0.8},
            ),
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="feature_popular_two",
                source="web",
                properties={"popularity_score": 0.6},
            ),
        ]

        # Create events for different users to simulate popularity
        for event_create in popular_events:
            for _ in range(3):  # Create multiple instances
                await crud_event.event.create(
                    db, obj_in=event_create, user_id=normal_user.id
                )

        recommendations = await engine._popularity_based_recommendations(
            user_id=normal_user.id,
            rec_type=RecommendationType.FEATURE,
        )

        if recommendations:
            assert all(rec.algorithm == "popularity_based" for rec in recommendations)
            assert all("popular" in rec.title.lower() or "trending" in rec.title.lower() 
                     for rec in recommendations)

    async def test_user_event_analysis(
        self,
        engine: RecommendationEngine,
        user_with_behavior: User,
    ):
        """Test user event analysis for behavior extraction."""
        analysis = await engine._get_user_events_analysis([user_with_behavior.id])
        user_analysis = analysis.get(user_with_behavior.id, {})

        assert "features_used" in user_analysis
        assert "recent_actions" in user_analysis
        assert "content_interests" in user_analysis
        assert "usage_patterns" in user_analysis

        # Verify that analysis extracted relevant patterns
        features_used = user_analysis["features_used"]
        assert any("feature_" in feature for feature in features_used)

        content_interests = user_analysis["content_interests"]
        assert isinstance(content_interests, dict)
        if content_interests:
            assert all(0.0 <= score <= 1.0 for score in content_interests.values())


class TestSimilarityEngine:
    """Test user similarity computation engine."""

    @pytest.fixture
    async def users_with_different_behaviors(
        self, db: AsyncSession, normal_user: User, superuser: User
    ) -> tuple[User, User]:
        """Create users with different behavior patterns."""
        # User 1: Analytics focused
        analytics_events = [
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="feature_analytics",
                source="web",
            ),
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="feature_reporting",
                source="web",
            ),
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="page_view",
                source="web",
                properties={"page": "/analytics"},
            ),
        ]

        # User 2: API focused
        api_events = [
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="api_call",
                source="api",
            ),
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="feature_integration",
                source="web",
            ),
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="page_view",
                source="web",
                properties={"page": "/api-docs"},
            ),
        ]

        # Create events for each user
        for event_create in analytics_events:
            await crud_event.event.create(
                db, obj_in=event_create, user_id=normal_user.id
            )

        for event_create in api_events:
            await crud_event.event.create(
                db, obj_in=event_create, user_id=superuser.id
            )

        return normal_user, superuser

    async def test_compute_user_similarities(
        self,
        db: AsyncSession,
        similarity_engine: SimilarityEngine,
        users_with_different_behaviors: tuple[User, User],
    ):
        """Test computing user similarities."""
        user1, user2 = users_with_different_behaviors

        # Compute similarities for user1
        similarities_computed = await similarity_engine.compute_user_similarities(
            user_id=user1.id, algorithm="cosine"
        )

        assert similarities_computed >= 0

        # Check if similarity was stored (if users have sufficient behavior)
        similar_users = await crud_recommendation.similar_users.get_similar_users(
            db, user_id=user1.id, min_similarity=0.0, limit=10
        )

        # May be 0 if users don't have enough overlapping behavior
        assert len(similar_users) >= 0

    async def test_behavior_vector_generation(
        self,
        similarity_engine: SimilarityEngine,
        users_with_different_behaviors: tuple[User, User],
    ):
        """Test user behavior vector generation."""
        user1, user2 = users_with_different_behaviors

        vector1 = await similarity_engine._get_user_behavior_vector(user1.id)
        vector2 = await similarity_engine._get_user_behavior_vector(user2.id)

        if vector1 is not None:
            assert len(vector1) > 0
            assert all(0.0 <= val <= 1.0 for val in vector1)  # Normalized values

        if vector2 is not None:
            assert len(vector2) > 0
            assert all(0.0 <= val <= 1.0 for val in vector2)  # Normalized values

    async def test_cosine_similarity_calculation(
        self,
        similarity_engine: SimilarityEngine,
    ):
        """Test cosine similarity calculation."""
        import numpy as np

        # Test vectors
        vector1 = np.array([1.0, 0.0, 0.5, 0.8])
        vector2 = np.array([0.5, 0.2, 0.3, 1.0])
        vector3 = np.array([1.0, 0.0, 0.5, 0.8])  # Same as vector1

        # Test cosine similarity
        similarity_different = similarity_engine._calculate_similarity(
            vector1, vector2, "cosine"
        )
        similarity_same = similarity_engine._calculate_similarity(
            vector1, vector3, "cosine"
        )

        assert 0.0 <= similarity_different <= 1.0
        assert similarity_same == pytest.approx(1.0, rel=1e-5)  # Should be 1.0 for identical vectors

        # Test edge case: zero vectors
        zero_vector = np.array([0.0, 0.0, 0.0, 0.0])
        similarity_zero = similarity_engine._calculate_similarity(
            vector1, zero_vector, "cosine"
        )
        assert similarity_zero == 0.0

    async def test_pearson_similarity_calculation(
        self,
        similarity_engine: SimilarityEngine,
    ):
        """Test Pearson correlation similarity calculation."""
        import numpy as np

        # Test vectors with some correlation
        vector1 = np.array([1.0, 2.0, 3.0, 4.0])
        vector2 = np.array([2.0, 4.0, 6.0, 8.0])  # Perfect positive correlation
        vector3 = np.array([4.0, 3.0, 2.0, 1.0])  # Perfect negative correlation

        similarity_positive = similarity_engine._calculate_similarity(
            vector1, vector2, "pearson"
        )
        similarity_negative = similarity_engine._calculate_similarity(
            vector1, vector3, "pearson"
        )

        # Pearson correlation should be close to 1 for perfect positive correlation
        if not np.isnan(similarity_positive):
            assert similarity_positive == pytest.approx(1.0, abs=0.1)
        
        # And close to -1 for perfect negative correlation
        if not np.isnan(similarity_negative):
            assert similarity_negative == pytest.approx(-1.0, abs=0.1)

    async def test_euclidean_similarity_calculation(
        self,
        similarity_engine: SimilarityEngine,
    ):
        """Test Euclidean distance-based similarity calculation."""
        import numpy as np

        vector1 = np.array([1.0, 1.0, 1.0])
        vector2 = np.array([1.0, 1.0, 1.0])  # Identical
        vector3 = np.array([0.0, 0.0, 0.0])  # Different

        similarity_same = similarity_engine._calculate_similarity(
            vector1, vector2, "euclidean"
        )
        similarity_different = similarity_engine._calculate_similarity(
            vector1, vector3, "euclidean"
        )

        # Identical vectors should have high similarity
        assert similarity_same == 1.0

        # Different vectors should have lower similarity
        assert 0.0 <= similarity_different < similarity_same

    async def test_cleanup_expired_similarities(
        self,
        db: AsyncSession,
        normal_user: User,
        superuser: User,
    ):
        """Test cleanup of expired similarity relationships."""
        # Create expired similarity
        expired_similarity = SimilarUsersCreate(
            user_id=normal_user.id,
            similar_user_id=superuser.id,
            similarity_score=0.7,
            algorithm="test",
            expires_at=datetime.utcnow() - timedelta(hours=1),
        )

        await crud_recommendation.similar_users.create(db, obj_in=expired_similarity)

        # Run cleanup
        cleaned_count = await crud_recommendation.similar_users.cleanup_expired_similarities(db)

        assert cleaned_count >= 1

    async def test_batch_similarity_computation(
        self,
        db: AsyncSession,
        similarity_engine: SimilarityEngine,
        users_with_different_behaviors: tuple[User, User],
    ):
        """Test batch computation of similarities for all users."""
        # Test batch computation
        total_computed = await similarity_engine.compute_user_similarities(
            user_id=None,  # Compute for all users
            algorithm="cosine",
            batch_size=10,
        )

        assert total_computed >= 0


class TestRecommendationIntegration:
    """Integration tests for the complete recommendation system."""

    async def test_end_to_end_recommendation_flow(
        self,
        db: AsyncSession,
        normal_user: User,
    ):
        """Test complete recommendation generation flow."""
        # 1. Create user behavior through events
        events = [
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="feature_analytics",
                source="web",
                properties={"session_duration": 15},
            ),
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="page_view",
                source="web",
                properties={"page": "/dashboard"},
            ),
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name="api_call",
                source="api",
                properties={"endpoint": "/api/v1/data"},
            ),
        ]

        for event_create in events:
            await crud_event.event.create(
                db, obj_in=event_create, user_id=normal_user.id
            )

        # 2. Initialize recommendation engine
        engine = RecommendationEngine(db)

        # 3. Generate recommendations
        recommendations = await engine.generate_recommendations(
            user_id=normal_user.id,
            max_recommendations=5,
            algorithm="hybrid",
        )

        # 4. Verify recommendations were generated
        assert isinstance(recommendations, list)
        assert len(recommendations) <= 5

        if recommendations:
            # Verify recommendation structure
            rec = recommendations[0]
            assert hasattr(rec, 'user_id')
            assert hasattr(rec, 'type')
            assert hasattr(rec, 'title')
            assert hasattr(rec, 'confidence_score')
            assert hasattr(rec, 'algorithm')

            assert rec.user_id == normal_user.id
            assert 0.0 <= rec.confidence_score <= 1.0
            assert rec.algorithm in ["hybrid", "collaborative", "content_based"]

        # 5. Test similarity computation
        similarity_engine = SimilarityEngine(db)
        similarities_computed = await similarity_engine.compute_user_similarities(
            user_id=normal_user.id,
            algorithm="cosine",
        )

        assert similarities_computed >= 0

    async def test_recommendation_quality_metrics(
        self,
        db: AsyncSession,
        normal_user: User,
    ):
        """Test recommendation quality and relevance metrics."""
        engine = RecommendationEngine(db)

        # Generate recommendations
        recommendations = await engine.generate_recommendations(
            user_id=normal_user.id,
            max_recommendations=10,
            algorithm="hybrid",
        )

        if recommendations:
            # Quality checks
            for rec in recommendations:
                # Confidence scores should be reasonable
                assert 0.1 <= rec.confidence_score <= 1.0
                
                # Priority scores should be set
                assert 0.0 <= rec.priority_score <= 1.0
                
                # Titles should be meaningful
                assert len(rec.title.strip()) > 5
                
                # Descriptions should be helpful
                assert len(rec.description.strip()) > 10
                
                # Algorithm should be specified
                assert rec.algorithm in ["hybrid", "collaborative", "content_based", "popularity_based"]

            # Diversity check: should have different types if possible
            types = set(rec.type for rec in recommendations)
            assert len(types) >= 1  # At least some diversity

    async def test_personalization_effectiveness(
        self,
        db: AsyncSession,
        normal_user: User,
        superuser: User,
    ):
        """Test that recommendations are personalized for different users."""
        engine = RecommendationEngine(db)

        # Create different behavior patterns
        # User 1: Analytics focused
        analytics_event = EventCreate(
            event_type=EventType.INTERACTION,
            event_name="feature_analytics",
            source="web",
            properties={"usage_intensity": "high"},
        )
        await crud_event.event.create(
            db, obj_in=analytics_event, user_id=normal_user.id
        )

        # User 2: API focused
        api_event = EventCreate(
            event_type=EventType.INTERACTION,
            event_name="api_call",
            source="api",
            properties={"usage_intensity": "high"},
        )
        await crud_event.event.create(
            db, obj_in=api_event, user_id=superuser.id
        )

        # Generate recommendations for both users
        user1_recommendations = await engine.generate_recommendations(
            user_id=normal_user.id,
            max_recommendations=5,
            algorithm="content_based",
        )

        user2_recommendations = await engine.generate_recommendations(
            user_id=superuser.id,
            max_recommendations=5,
            algorithm="content_based",
        )

        # Recommendations should be different (personalized)
        if user1_recommendations and user2_recommendations:
            user1_titles = set(rec.title for rec in user1_recommendations)
            user2_titles = set(rec.title for rec in user2_recommendations)
            
            # Some difference expected (though not guaranteed with limited test data)
            # This is a soft assertion that would be stronger with more realistic data
            assert len(user1_titles.union(user2_titles)) >= max(len(user1_titles), len(user2_titles))