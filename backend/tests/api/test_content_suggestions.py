"""Test content suggestions API endpoints."""
import json
from datetime import datetime, timedelta
from typing import Any, Dict

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.core.config import get_settings
from app.models.content_suggestion import (
    ContentType, ContentCategory, SuggestionType, ContentSuggestionStatus
)
from app.schemas.content_suggestion import (
    ContentItemCreate, ContentSuggestionCreate, ContentSuggestionFeedbackCreate
)
from tests.factories import UserFactory


class TestContentSuggestionsAPI:
    """Test content suggestions API endpoints."""

    @pytest.fixture
    def api_v1_str(self) -> str:
        """Get API v1 string."""
        return get_settings().api_v1_str

    @pytest.fixture
    async def sample_content_item(self, db: AsyncSession) -> Dict[str, Any]:
        """Create a sample content item for testing."""
        content_data = ContentItemCreate(
            title="Test AI Tutorial",
            description="A comprehensive guide to AI implementation",
            content_type=ContentType.TUTORIAL,
            category=ContentCategory.TECHNICAL,
            url="https://example.com/ai-tutorial",
            author="Jane Smith",
            source="TechBlog",
        )
        
        content_item = await crud.content_suggestion.content_item.create(
            db, obj_in=content_data
        )
        return {
            "id": content_item.id,
            "content_id": content_item.content_id,
            "title": content_item.title,
            "description": content_item.description,
            "content_type": content_item.content_type,
            "category": content_item.category,
        }

    @pytest.fixture
    async def sample_content_suggestion(
        self, db: AsyncSession, normal_user_token_headers: Dict[str, str]
    ) -> Dict[str, Any]:
        """Create a sample content suggestion for testing."""
        # Create user first
        user = await UserFactory.create_async(db)
        
        # Create content item
        content_data = ContentItemCreate(
            title="Machine Learning Basics",
            description="Introduction to machine learning concepts",
            content_type=ContentType.ARTICLE,
            category=ContentCategory.EDUCATIONAL,
        )
        content_item = await crud.content_suggestion.content_item.create(
            db, obj_in=content_data
        )
        
        # Create suggestion
        suggestion_data = ContentSuggestionCreate(
            user_id=user.id,
            content_id=content_item.content_id,
            suggestion_type=SuggestionType.CONTENT_DISCOVERY,
            title="Perfect for Your Learning Journey!",
            description="This article matches your interest in AI and machine learning",
            confidence_score=0.85,
            relevance_score=0.90,
            priority_score=0.80,
            personalization_score=0.75,
            model_version="v1.0.0",
            algorithm="ai_content_analyzer",
        )
        suggestion = await crud.content_suggestion.content_suggestion.create_suggestion(
            db, obj_in=suggestion_data
        )
        
        return {
            "id": suggestion.id,
            "suggestion_id": suggestion.suggestion_id,
            "user_id": suggestion.user_id,
            "content_id": suggestion.content_id,
            "title": suggestion.title,
            "confidence_score": suggestion.confidence_score,
        }

    async def test_get_personalized_suggestions_unauthorized(
        self, client: TestClient, api_v1_str: str
    ):
        """Test getting suggestions without authentication."""
        response = client.get(f"{api_v1_str}/content-suggestions/1")
        assert response.status_code == 401

    async def test_get_personalized_suggestions_success(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
        sample_content_suggestion: Dict[str, Any],
    ):
        """Test successful retrieval of personalized suggestions."""
        user_id = sample_content_suggestion["user_id"]
        
        response = client.get(
            f"{api_v1_str}/content-suggestions/{user_id}",
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "suggestions" in data
        assert "total_count" in data
        assert "user_id" in data
        assert "metadata" in data
        assert data["user_id"] == user_id
        assert len(data["suggestions"]) >= 1
        
        # Check suggestion structure
        suggestion = data["suggestions"][0]
        assert "suggestion_id" in suggestion
        assert "title" in suggestion
        assert "confidence_score" in suggestion
        assert "relevance_score" in suggestion
        assert "content_item" in suggestion or suggestion["content_item"] is None

    async def test_get_personalized_suggestions_with_filters(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
        sample_content_suggestion: Dict[str, Any],
    ):
        """Test getting suggestions with filters."""
        user_id = sample_content_suggestion["user_id"]
        
        response = client.get(
            f"{api_v1_str}/content-suggestions/{user_id}",
            params={
                "suggestion_types": ["content_discovery"],
                "categories": ["educational"],
                "min_confidence": 0.7,
                "limit": 5,
                "include_context": True,
            },
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_count"] >= 0
        if data["suggestions"]:
            suggestion = data["suggestions"][0]
            assert suggestion["confidence_score"] >= 0.7
            assert suggestion["suggestion_type"] == "content_discovery"

    async def test_get_suggestions_forbidden_other_user(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
        sample_content_suggestion: Dict[str, Any],
    ):
        """Test that users cannot access other users' suggestions."""
        other_user_id = sample_content_suggestion["user_id"] + 999
        
        response = client.get(
            f"{api_v1_str}/content-suggestions/{other_user_id}",
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 403

    async def test_generate_content_suggestions_admin_only(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
    ):
        """Test that suggestion generation requires admin privileges."""
        response = client.post(
            f"{api_v1_str}/content-suggestions/generate",
            json={
                "max_suggestions_per_user": 5,
                "force_regenerate": False,
            },
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 403

    async def test_generate_content_suggestions_success(
        self,
        client: TestClient,
        superuser_token_headers: Dict[str, str],
        sample_content_item: Dict[str, Any],
    ):
        """Test successful content suggestion generation."""
        response = client.post(
            f"{api_v1_str}/content-suggestions/generate",
            json={
                "content_ids": [sample_content_item["content_id"]],
                "max_suggestions_per_user": 3,
                "force_regenerate": True,
            },
            headers=superuser_token_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "generated_count" in data
        assert "user_count" in data
        assert "processing_time_seconds" in data
        assert "metadata" in data
        assert data["metadata"]["status"] == "started"

    async def test_get_trending_content(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
        sample_content_item: Dict[str, Any],
    ):
        """Test getting trending content."""
        response = client.get(
            f"{api_v1_str}/content-suggestions/trending",
            params={
                "categories": ["technical"],
                "time_window_hours": 48,
                "min_engagement_rate": 0.01,
                "limit": 10,
            },
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "trending_content" in data
        assert "time_window_hours" in data
        assert "metadata" in data
        assert data["time_window_hours"] == 48
        assert isinstance(data["trending_content"], list)

    async def test_optimize_content_not_found(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
    ):
        """Test content optimization with non-existent content."""
        response = client.post(
            f"{api_v1_str}/content-suggestions/optimize",
            json={
                "content_id": "non-existent-id",
                "target_audience": "developers",
                "business_goals": ["engagement", "conversion"],
            },
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 404

    async def test_optimize_content_success(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
        sample_content_item: Dict[str, Any],
    ):
        """Test successful content optimization."""
        response = client.post(
            f"{api_v1_str}/content-suggestions/optimize",
            json={
                "content_id": sample_content_item["content_id"],
                "target_audience": "software engineers",
                "business_goals": ["engagement", "knowledge_transfer"],
                "optimization_types": ["seo", "engagement"],
            },
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "content_id" in data
        assert "optimization_suggestions" in data
        assert "improvement_score" in data
        assert "implementation_complexity" in data
        assert "estimated_impact" in data
        assert "ai_analysis" in data
        
        assert data["content_id"] == sample_content_item["content_id"]
        assert 0.0 <= data["improvement_score"] <= 1.0

    async def test_submit_feedback_unauthorized(
        self, client: TestClient, sample_content_suggestion: Dict[str, Any]
    ):
        """Test submitting feedback without authentication."""
        response = client.post(
            f"{api_v1_str}/content-suggestions/feedback",
            json={
                "suggestion_id": sample_content_suggestion["suggestion_id"],
                "rating": 5,
                "feedback_type": "explicit",
                "action_taken": "clicked",
            },
        )
        
        assert response.status_code == 401

    async def test_submit_feedback_not_found(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
    ):
        """Test submitting feedback for non-existent suggestion."""
        response = client.post(
            f"{api_v1_str}/content-suggestions/feedback",
            json={
                "suggestion_id": "non-existent-id",
                "rating": 4,
                "feedback_type": "explicit",
                "action_taken": "clicked",
            },
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 404

    async def test_submit_feedback_success(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
        sample_content_suggestion: Dict[str, Any],
    ):
        """Test successful feedback submission."""
        response = client.post(
            f"{api_v1_str}/content-suggestions/feedback",
            json={
                "suggestion_id": sample_content_suggestion["suggestion_id"],
                "rating": 4,
                "feedback_type": "explicit",
                "action_taken": "clicked",
                "feedback_text": "Very helpful content!",
                "context": {"source": "homepage", "time_spent": 120},
            },
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "suggestion_id" in data
        assert "user_id" in data
        assert "rating" in data
        assert "feedback_type" in data
        assert "action_taken" in data
        
        assert data["suggestion_id"] == sample_content_suggestion["suggestion_id"]
        assert data["rating"] == 4
        assert data["action_taken"] == "clicked"

    async def test_analyze_content_categories(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
        sample_content_item: Dict[str, Any],
    ):
        """Test content category analysis."""
        response = client.get(
            f"{api_v1_str}/content-suggestions/categories",
            params={"time_window_hours": 72},
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "categories" in data
        assert "top_performing_categories" in data
        assert "category_trends" in data
        assert "user_preferences" in data
        assert "recommendations" in data
        
        assert isinstance(data["categories"], list)
        assert isinstance(data["top_performing_categories"], list)
        assert isinstance(data["recommendations"], list)

    async def test_get_analytics_admin_only(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
    ):
        """Test that analytics require admin privileges."""
        response = client.get(
            f"{api_v1_str}/content-suggestions/analytics",
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 403

    async def test_get_analytics_success(
        self,
        client: TestClient,
        superuser_token_headers: Dict[str, str],
        sample_content_suggestion: Dict[str, Any],
    ):
        """Test successful analytics retrieval."""
        response = client.get(
            f"{api_v1_str}/content-suggestions/analytics",
            params={
                "suggestion_types": ["content_discovery"],
                "start_date": (datetime.utcnow() - timedelta(days=7)).isoformat(),
                "end_date": datetime.utcnow().isoformat(),
            },
            headers=superuser_token_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_suggestions" in data
        assert "active_suggestions" in data
        assert "total_impressions" in data
        assert "total_clicks" in data
        assert "avg_ctr" in data
        assert "conversion_rate" in data
        assert "top_performing_types" in data
        assert "engagement_metrics" in data
        assert "ai_model_performance" in data
        
        assert data["total_suggestions"] >= 0
        assert 0.0 <= data["avg_ctr"] <= 1.0
        assert 0.0 <= data["conversion_rate"] <= 1.0

    async def test_create_bulk_suggestions_admin_only(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
    ):
        """Test that bulk creation requires admin privileges."""
        response = client.post(
            f"{api_v1_str}/content-suggestions/bulk",
            json={"suggestions": [], "notify_users": False},
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 403

    async def test_update_suggestion_engagement_not_found(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
    ):
        """Test updating engagement for non-existent suggestion."""
        response = client.put(
            f"{api_v1_str}/content-suggestions/non-existent-id/engagement",
            params={"action": "shown"},
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 404

    async def test_update_suggestion_engagement_invalid_action(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
        sample_content_suggestion: Dict[str, Any],
    ):
        """Test updating engagement with invalid action."""
        response = client.put(
            f"{api_v1_str}/content-suggestions/{sample_content_suggestion['suggestion_id']}/engagement",
            params={"action": "invalid_action"},
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 400

    async def test_update_suggestion_engagement_success(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
        sample_content_suggestion: Dict[str, Any],
    ):
        """Test successful engagement update."""
        response = client.put(
            f"{api_v1_str}/content-suggestions/{sample_content_suggestion['suggestion_id']}/engagement",
            params={"action": "shown"},
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "suggestion_id" in data
        assert "impression_count" in data
        assert "status" in data
        
        assert data["suggestion_id"] == sample_content_suggestion["suggestion_id"]
        assert data["impression_count"] >= 1

    async def test_create_content_item_admin_only(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
    ):
        """Test that content creation requires admin privileges."""
        response = client.post(
            f"{api_v1_str}/content-suggestions/content",
            json={
                "title": "New Tutorial",
                "description": "Test description",
                "content_type": "tutorial",
                "category": "technical",
            },
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 403

    async def test_create_content_item_success(
        self,
        client: TestClient,
        superuser_token_headers: Dict[str, str],
    ):
        """Test successful content item creation."""
        response = client.post(
            f"{api_v1_str}/content-suggestions/content",
            json={
                "title": "Advanced Python Programming",
                "description": "Deep dive into Python advanced concepts",
                "content_type": "course",
                "category": "educational",
                "url": "https://example.com/python-course",
                "author": "Dr. Python",
                "source": "Python Academy",
            },
            headers=superuser_token_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "content_id" in data
        assert "title" in data
        assert "content_type" in data
        assert "category" in data
        assert "created_at" in data
        
        assert data["title"] == "Advanced Python Programming"
        assert data["content_type"] == "course"
        assert data["category"] == "educational"

    async def test_get_content_item_not_found(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
    ):
        """Test getting non-existent content item."""
        response = client.get(
            f"{api_v1_str}/content-suggestions/content/non-existent-id",
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 404

    async def test_get_content_item_success(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
        sample_content_item: Dict[str, Any],
    ):
        """Test successful content item retrieval."""
        response = client.get(
            f"{api_v1_str}/content-suggestions/content/{sample_content_item['content_id']}",
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "content_id" in data
        assert "title" in data
        assert "content_type" in data
        assert "category" in data
        
        assert data["content_id"] == sample_content_item["content_id"]
        assert data["title"] == sample_content_item["title"]

    async def test_analyze_content_item_admin_only(
        self,
        client: TestClient,
        normal_user_token_headers: Dict[str, str],
        sample_content_item: Dict[str, Any],
    ):
        """Test that content analysis requires admin privileges."""
        response = client.post(
            f"{api_v1_str}/content-suggestions/content/{sample_content_item['content_id']}/analyze",
            params={"analysis_types": ["quality", "topics"]},
            headers=normal_user_token_headers,
        )
        
        assert response.status_code == 403

    async def test_analyze_content_item_success(
        self,
        client: TestClient,
        superuser_token_headers: Dict[str, str],
        sample_content_item: Dict[str, Any],
    ):
        """Test successful content analysis."""
        response = client.post(
            f"{api_v1_str}/content-suggestions/content/{sample_content_item['content_id']}/analyze",
            params={"analysis_types": ["quality", "sentiment", "topics"]},
            headers=superuser_token_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "job_id" in data
        assert "content_id" in data
        assert "job_type" in data
        assert "status" in data
        assert "created_at" in data
        
        assert data["content_id"] == sample_content_item["content_id"]
        assert data["status"] == "pending"
        assert "quality,sentiment,topics" in data["job_type"]