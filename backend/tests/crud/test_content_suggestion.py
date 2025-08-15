"""Test CRUD operations for content suggestions."""
import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.models.content_suggestion import (
    ContentType, ContentCategory, SuggestionType, ContentSuggestionStatus
)
from app.schemas.content_suggestion import (
    ContentItemCreate, ContentItemUpdate,
    ContentSuggestionCreate, ContentSuggestionUpdate,
    ContentSuggestionFeedbackCreate, ContentAnalysisJobCreate
)
from tests.factories import UserFactory


class TestContentItemCRUD:
    """Test CRUD operations for content items."""

    @pytest.fixture
    async def sample_content_data(self) -> ContentItemCreate:
        """Sample content item data."""
        return ContentItemCreate(
            title="Understanding Machine Learning",
            description="A comprehensive guide to ML fundamentals",
            content_type=ContentType.ARTICLE,
            category=ContentCategory.EDUCATIONAL,
            url="https://example.com/ml-guide",
            author="Dr. AI Smith",
            source="AI Weekly",
        )

    async def test_create_content_item(
        self, db: AsyncSession, sample_content_data: ContentItemCreate
    ):
        """Test creating a content item."""
        content_item = await crud.content_suggestion.content_item.create(
            db, obj_in=sample_content_data
        )
        
        assert content_item.id is not None
        assert content_item.content_id is not None
        assert content_item.title == sample_content_data.title
        assert content_item.description == sample_content_data.description
        assert content_item.content_type == sample_content_data.content_type
        assert content_item.category == sample_content_data.category
        assert content_item.url == sample_content_data.url
        assert content_item.author == sample_content_data.author
        assert content_item.source == sample_content_data.source
        assert content_item.is_active is True
        assert content_item.view_count == 0
        assert content_item.click_count == 0
        assert content_item.engagement_rate == 0.0
        assert content_item.created_at is not None

    async def test_get_content_item_by_id(
        self, db: AsyncSession, sample_content_data: ContentItemCreate
    ):
        """Test getting content item by ID."""
        content_item = await crud.content_suggestion.content_item.create(
            db, obj_in=sample_content_data
        )
        
        retrieved = await crud.content_suggestion.content_item.get(db, id=content_item.id)
        assert retrieved is not None
        assert retrieved.id == content_item.id
        assert retrieved.title == content_item.title

    async def test_get_content_item_by_content_id(
        self, db: AsyncSession, sample_content_data: ContentItemCreate
    ):
        """Test getting content item by content_id."""
        content_item = await crud.content_suggestion.content_item.create(
            db, obj_in=sample_content_data
        )
        
        retrieved = await crud.content_suggestion.content_item.get_by_content_id(
            db, content_id=content_item.content_id
        )
        assert retrieved is not None
        assert retrieved.content_id == content_item.content_id
        assert retrieved.title == content_item.title

    async def test_get_content_items_by_category(
        self, db: AsyncSession, sample_content_data: ContentItemCreate
    ):
        """Test getting content items by category."""
        # Create multiple items in same category
        for i in range(3):
            data = sample_content_data.model_copy()
            data.title = f"Test Article {i}"
            await crud.content_suggestion.content_item.create(db, obj_in=data)
        
        # Create item in different category
        other_data = sample_content_data.model_copy()
        other_data.category = ContentCategory.TECHNICAL
        other_data.title = "Technical Article"
        await crud.content_suggestion.content_item.create(db, obj_in=other_data)
        
        # Get items by category
        educational_items = await crud.content_suggestion.content_item.get_multi_by_category(
            db, category=ContentCategory.EDUCATIONAL, limit=10
        )
        
        assert len(educational_items) == 3
        for item in educational_items:
            assert item.category == ContentCategory.EDUCATIONAL

    async def test_get_content_items_by_type(
        self, db: AsyncSession, sample_content_data: ContentItemCreate
    ):
        """Test getting content items by type."""
        # Create items of same type
        for i in range(2):
            data = sample_content_data.model_copy()
            data.title = f"Article {i}"
            await crud.content_suggestion.content_item.create(db, obj_in=data)
        
        # Create item of different type
        other_data = sample_content_data.model_copy()
        other_data.content_type = ContentType.VIDEO
        other_data.title = "Video Content"
        await crud.content_suggestion.content_item.create(db, obj_in=other_data)
        
        # Get items by type
        articles = await crud.content_suggestion.content_item.get_multi_by_type(
            db, content_type=ContentType.ARTICLE, limit=10
        )
        
        assert len(articles) == 2
        for item in articles:
            assert item.content_type == ContentType.ARTICLE

    async def test_search_content(
        self, db: AsyncSession, sample_content_data: ContentItemCreate
    ):
        """Test content search functionality."""
        # Create searchable content
        content_item = await crud.content_suggestion.content_item.create(
            db, obj_in=sample_content_data
        )
        
        # Search by title
        results = await crud.content_suggestion.content_item.search_content(
            db, search_query="Machine Learning", limit=10
        )
        
        assert len(results) >= 1
        found = any(item.content_id == content_item.content_id for item in results)
        assert found

    async def test_update_engagement_metrics(
        self, db: AsyncSession, sample_content_data: ContentItemCreate
    ):
        """Test updating engagement metrics."""
        content_item = await crud.content_suggestion.content_item.create(
            db, obj_in=sample_content_data
        )
        
        # Update metrics
        updated = await crud.content_suggestion.content_item.update_engagement_metrics(
            db,
            content_id=content_item.content_id,
            increment_views=10,
            increment_clicks=3,
            increment_shares=1,
        )
        
        assert updated is not None
        assert updated.view_count == 10
        assert updated.click_count == 3
        assert updated.share_count == 1
        assert updated.engagement_rate > 0  # Should be calculated

    async def test_update_ai_analysis(
        self, db: AsyncSession, sample_content_data: ContentItemCreate
    ):
        """Test updating AI analysis results."""
        content_item = await crud.content_suggestion.content_item.create(
            db, obj_in=sample_content_data
        )
        
        # Update AI analysis
        ai_analysis = {
            "quality_analysis": {"score": 0.85, "strengths": ["clear writing"]},
            "topics": ["machine learning", "AI"],
        }
        
        updated = await crud.content_suggestion.content_item.update_ai_analysis(
            db,
            content_id=content_item.content_id,
            quality_score=0.85,
            sentiment_score=0.2,
            topics={"main_topics": ["ML", "AI"]},
            ai_analysis=ai_analysis,
        )
        
        assert updated is not None
        assert updated.quality_score == 0.85
        assert updated.sentiment_score == 0.2
        assert updated.topics == {"main_topics": ["ML", "AI"]}
        assert updated.ai_analysis == ai_analysis
        assert updated.analyzed_at is not None

    async def test_get_content_needing_analysis(
        self, db: AsyncSession, sample_content_data: ContentItemCreate
    ):
        """Test getting content that needs analysis."""
        # Create content without analysis
        content_item = await crud.content_suggestion.content_item.create(
            db, obj_in=sample_content_data
        )
        
        # Get items needing analysis
        needing_analysis = await crud.content_suggestion.content_item.get_content_needing_analysis(
            db, analysis_age_hours=24, limit=10
        )
        
        assert len(needing_analysis) >= 1
        found = any(item.content_id == content_item.content_id for item in needing_analysis)
        assert found
        
        # Update with analysis
        await crud.content_suggestion.content_item.update_ai_analysis(
            db,
            content_id=content_item.content_id,
            quality_score=0.8,
        )
        
        # Should not appear in results anymore (unless analysis is old)
        recent_analysis = await crud.content_suggestion.content_item.get_content_needing_analysis(
            db, analysis_age_hours=1, limit=10
        )
        found_after_analysis = any(
            item.content_id == content_item.content_id for item in recent_analysis
        )
        assert not found_after_analysis


class TestContentSuggestionCRUD:
    """Test CRUD operations for content suggestions."""

    @pytest.fixture
    async def content_and_user(self, db: AsyncSession):
        """Create content item and user for testing."""
        # Create user
        user = await UserFactory.create_async(db)
        
        # Create content item
        content_data = ContentItemCreate(
            title="Python Best Practices",
            description="Learn Python coding standards",
            content_type=ContentType.TUTORIAL,
            category=ContentCategory.TECHNICAL,
        )
        content_item = await crud.content_suggestion.content_item.create(
            db, obj_in=content_data
        )
        
        return user, content_item

    @pytest.fixture
    async def sample_suggestion_data(self, content_and_user) -> ContentSuggestionCreate:
        """Sample content suggestion data."""
        user, content_item = content_and_user
        
        return ContentSuggestionCreate(
            user_id=user.id,
            content_id=content_item.content_id,
            suggestion_type=SuggestionType.CONTENT_DISCOVERY,
            title="Perfect for Your Coding Journey!",
            description="This tutorial matches your Python learning interests",
            confidence_score=0.85,
            relevance_score=0.90,
            priority_score=0.80,
            personalization_score=0.75,
            context={"source": "user_profile", "trigger": "interest_match"},
            ai_reasoning={"factors": ["python_interest", "tutorial_preference"]},
            model_version="v1.0.0",
            algorithm="ai_content_analyzer",
            expires_at=datetime.utcnow() + timedelta(days=7),
        )

    async def test_create_content_suggestion(
        self, db: AsyncSession, sample_suggestion_data: ContentSuggestionCreate
    ):
        """Test creating a content suggestion."""
        suggestion = await crud.content_suggestion.content_suggestion.create_suggestion(
            db, obj_in=sample_suggestion_data
        )
        
        assert suggestion.id is not None
        assert suggestion.suggestion_id is not None
        assert suggestion.user_id == sample_suggestion_data.user_id
        assert suggestion.content_id == sample_suggestion_data.content_id
        assert suggestion.suggestion_type == sample_suggestion_data.suggestion_type
        assert suggestion.title == sample_suggestion_data.title
        assert suggestion.confidence_score == sample_suggestion_data.confidence_score
        assert suggestion.status == ContentSuggestionStatus.ACTIVE
        assert suggestion.impression_count == 0
        assert suggestion.click_count == 0

    async def test_create_duplicate_suggestion_prevention(
        self, db: AsyncSession, sample_suggestion_data: ContentSuggestionCreate
    ):
        """Test that duplicate suggestions are prevented."""
        # Create first suggestion
        suggestion1 = await crud.content_suggestion.content_suggestion.create_suggestion(
            db, obj_in=sample_suggestion_data
        )
        
        # Try to create duplicate
        suggestion2 = await crud.content_suggestion.content_suggestion.create_suggestion(
            db, obj_in=sample_suggestion_data
        )
        
        # Should return the existing suggestion
        assert suggestion1.suggestion_id == suggestion2.suggestion_id

    async def test_get_suggestion_by_suggestion_id(
        self, db: AsyncSession, sample_suggestion_data: ContentSuggestionCreate
    ):
        """Test getting suggestion by suggestion_id."""
        suggestion = await crud.content_suggestion.content_suggestion.create_suggestion(
            db, obj_in=sample_suggestion_data
        )
        
        retrieved = await crud.content_suggestion.content_suggestion.get_by_suggestion_id(
            db, suggestion_id=suggestion.suggestion_id
        )
        
        assert retrieved is not None
        assert retrieved.suggestion_id == suggestion.suggestion_id
        assert retrieved.content_item is not None  # Should load related content

    async def test_get_user_suggestions(
        self, db: AsyncSession, sample_suggestion_data: ContentSuggestionCreate
    ):
        """Test getting suggestions for a user."""
        # Create suggestions
        suggestion1 = await crud.content_suggestion.content_suggestion.create_suggestion(
            db, obj_in=sample_suggestion_data
        )
        
        # Create another suggestion with different type
        data2 = sample_suggestion_data.model_copy()
        data2.suggestion_type = SuggestionType.TRENDING_CONTENT
        data2.title = "Trending Content for You"
        suggestion2 = await crud.content_suggestion.content_suggestion.create_suggestion(
            db, obj_in=data2
        )
        
        # Get all suggestions for user
        user_suggestions = await crud.content_suggestion.content_suggestion.get_user_suggestions(
            db, user_id=sample_suggestion_data.user_id, limit=10
        )
        
        assert len(user_suggestions) == 2
        suggestion_ids = [s.suggestion_id for s in user_suggestions]
        assert suggestion1.suggestion_id in suggestion_ids
        assert suggestion2.suggestion_id in suggestion_ids

    async def test_get_user_suggestions_with_filters(
        self, db: AsyncSession, sample_suggestion_data: ContentSuggestionCreate
    ):
        """Test getting user suggestions with filters."""
        # Create suggestions
        await crud.content_suggestion.content_suggestion.create_suggestion(
            db, obj_in=sample_suggestion_data
        )
        
        # Get with type filter
        filtered_suggestions = await crud.content_suggestion.content_suggestion.get_user_suggestions(
            db,
            user_id=sample_suggestion_data.user_id,
            suggestion_types=[SuggestionType.CONTENT_DISCOVERY],
            min_confidence=0.8,
            limit=10
        )
        
        assert len(filtered_suggestions) == 1
        assert filtered_suggestions[0].suggestion_type == SuggestionType.CONTENT_DISCOVERY
        assert filtered_suggestions[0].confidence_score >= 0.8

    async def test_update_suggestion_engagement(
        self, db: AsyncSession, sample_suggestion_data: ContentSuggestionCreate
    ):
        """Test updating suggestion engagement."""
        suggestion = await crud.content_suggestion.content_suggestion.create_suggestion(
            db, obj_in=sample_suggestion_data
        )
        
        # Update with "shown" action
        updated = await crud.content_suggestion.content_suggestion.update_engagement(
            db, suggestion_id=suggestion.suggestion_id, action="shown"
        )
        
        assert updated is not None
        assert updated.impression_count == 1
        assert updated.last_shown_at is not None
        assert updated.status == ContentSuggestionStatus.SHOWN
        
        # Update with "clicked" action
        clicked = await crud.content_suggestion.content_suggestion.update_engagement(
            db, suggestion_id=suggestion.suggestion_id, action="clicked"
        )
        
        assert clicked.click_count == 1
        assert clicked.clicked_at is not None
        assert clicked.status == ContentSuggestionStatus.CLICKED

    async def test_expire_old_suggestions(
        self, db: AsyncSession, sample_suggestion_data: ContentSuggestionCreate
    ):
        """Test expiring old suggestions."""
        # Create suggestion that's "old"
        old_data = sample_suggestion_data.model_copy()
        old_data.expires_at = datetime.utcnow() - timedelta(days=1)  # Already expired
        
        suggestion = await crud.content_suggestion.content_suggestion.create_suggestion(
            db, obj_in=old_data
        )
        
        # Expire old suggestions
        expired_count = await crud.content_suggestion.content_suggestion.expire_old_suggestions(
            db, max_age_days=3
        )
        
        assert expired_count >= 1
        
        # Check that suggestion is now expired
        updated_suggestion = await crud.content_suggestion.content_suggestion.get_by_suggestion_id(
            db, suggestion_id=suggestion.suggestion_id
        )
        assert updated_suggestion.status == ContentSuggestionStatus.EXPIRED

    async def test_get_suggestion_analytics(
        self, db: AsyncSession, sample_suggestion_data: ContentSuggestionCreate
    ):
        """Test getting suggestion analytics."""
        # Create suggestions with different engagement
        suggestion1 = await crud.content_suggestion.content_suggestion.create_suggestion(
            db, obj_in=sample_suggestion_data
        )
        
        # Update engagement
        await crud.content_suggestion.content_suggestion.update_engagement(
            db, suggestion_id=suggestion1.suggestion_id, action="shown"
        )
        await crud.content_suggestion.content_suggestion.update_engagement(
            db, suggestion_id=suggestion1.suggestion_id, action="clicked"
        )
        
        # Get analytics
        analytics = await crud.content_suggestion.content_suggestion.get_suggestion_analytics(
            db, user_id=sample_suggestion_data.user_id
        )
        
        assert analytics["total_suggestions"] >= 1
        assert analytics["total_impressions"] >= 1
        assert analytics["total_clicks"] >= 1
        assert analytics["avg_ctr"] > 0
        assert len(analytics["top_performing_types"]) >= 0

    async def test_create_bulk_suggestions(
        self, db: AsyncSession, content_and_user
    ):
        """Test creating suggestions in bulk."""
        user, content_item = content_and_user
        
        # Create multiple suggestion data
        suggestions_data = []
        for i in range(3):
            data = ContentSuggestionCreate(
                user_id=user.id,
                content_id=content_item.content_id,
                suggestion_type=SuggestionType.CONTENT_DISCOVERY,
                title=f"Suggestion {i}",
                description=f"Description {i}",
                confidence_score=0.8 + (i * 0.05),
                relevance_score=0.7,
                priority_score=0.6,
                personalization_score=0.5,
                model_version="v1.0.0",
                algorithm="test_algorithm",
            )
            suggestions_data.append(data)
        
        # Create in bulk
        created, errors = await crud.content_suggestion.content_suggestion.create_bulk_suggestions(
            db, suggestions=suggestions_data
        )
        
        assert len(created) == 1  # Only first one should be created due to duplicate prevention
        assert len(errors) == 2  # Other two should be prevented as duplicates


class TestContentSuggestionFeedbackCRUD:
    """Test CRUD operations for content suggestion feedback."""

    @pytest.fixture
    async def suggestion_and_user(self, db: AsyncSession):
        """Create suggestion and user for testing."""
        # Create user
        user = await UserFactory.create_async(db)
        
        # Create content item
        content_data = ContentItemCreate(
            title="Test Content",
            description="Test description",
            content_type=ContentType.ARTICLE,
            category=ContentCategory.TECHNICAL,
        )
        content_item = await crud.content_suggestion.content_item.create(
            db, obj_in=content_data
        )
        
        # Create suggestion
        suggestion_data = ContentSuggestionCreate(
            user_id=user.id,
            content_id=content_item.content_id,
            suggestion_type=SuggestionType.CONTENT_DISCOVERY,
            title="Test Suggestion",
            description="Test description",
            confidence_score=0.8,
            relevance_score=0.7,
            priority_score=0.6,
            personalization_score=0.5,
            model_version="v1.0.0",
            algorithm="test",
        )
        suggestion = await crud.content_suggestion.content_suggestion.create_suggestion(
            db, obj_in=suggestion_data
        )
        
        return suggestion, user

    async def test_create_feedback(self, db: AsyncSession, suggestion_and_user):
        """Test creating feedback."""
        suggestion, user = suggestion_and_user
        
        feedback_data = ContentSuggestionFeedbackCreate(
            suggestion_id=suggestion.suggestion_id,
            rating=5,
            feedback_type="explicit",
            action_taken="clicked",
            feedback_text="Very helpful!",
            context={"source": "homepage"},
        )
        
        feedback = await crud.content_suggestion.content_suggestion_feedback.create_feedback(
            db, obj_in=feedback_data, user_id=user.id
        )
        
        assert feedback.id is not None
        assert feedback.suggestion_id == suggestion.suggestion_id
        assert feedback.user_id == user.id
        assert feedback.rating == 5
        assert feedback.feedback_type == "explicit"
        assert feedback.action_taken == "clicked"
        assert feedback.feedback_text == "Very helpful!"

    async def test_get_suggestion_feedback(self, db: AsyncSession, suggestion_and_user):
        """Test getting feedback for a suggestion."""
        suggestion, user = suggestion_and_user
        
        # Create feedback
        feedback_data = ContentSuggestionFeedbackCreate(
            suggestion_id=suggestion.suggestion_id,
            rating=4,
            feedback_type="explicit",
            action_taken="clicked",
        )
        
        await crud.content_suggestion.content_suggestion_feedback.create_feedback(
            db, obj_in=feedback_data, user_id=user.id
        )
        
        # Get feedback
        feedback_list = await crud.content_suggestion.content_suggestion_feedback.get_suggestion_feedback(
            db, suggestion_id=suggestion.suggestion_id
        )
        
        assert len(feedback_list) == 1
        assert feedback_list[0].suggestion_id == suggestion.suggestion_id
        assert feedback_list[0].rating == 4


class TestContentAnalysisJobCRUD:
    """Test CRUD operations for content analysis jobs."""

    @pytest.fixture
    async def content_item(self, db: AsyncSession):
        """Create content item for testing."""
        content_data = ContentItemCreate(
            title="Content for Analysis",
            description="This content needs analysis",
            content_type=ContentType.ARTICLE,
            category=ContentCategory.TECHNICAL,
        )
        return await crud.content_suggestion.content_item.create(db, obj_in=content_data)

    async def test_create_analysis_job(self, db: AsyncSession, content_item):
        """Test creating an analysis job."""
        job = await crud.content_suggestion.content_analysis_job.create_analysis_job(
            db, content_id=content_item.content_id, job_type="full_analysis"
        )
        
        assert job.id is not None
        assert job.job_id is not None
        assert job.content_id == content_item.content_id
        assert job.job_type == "full_analysis"
        assert job.status == "pending"
        assert job.progress == 0.0

    async def test_get_job_by_job_id(self, db: AsyncSession, content_item):
        """Test getting job by job_id."""
        job = await crud.content_suggestion.content_analysis_job.create_analysis_job(
            db, content_id=content_item.content_id, job_type="topic_extraction"
        )
        
        retrieved = await crud.content_suggestion.content_analysis_job.get_by_job_id(
            db, job_id=job.job_id
        )
        
        assert retrieved is not None
        assert retrieved.job_id == job.job_id
        assert retrieved.content_item is not None  # Should load related content

    async def test_update_job_status(self, db: AsyncSession, content_item):
        """Test updating job status."""
        job = await crud.content_suggestion.content_analysis_job.create_analysis_job(
            db, content_id=content_item.content_id, job_type="sentiment_analysis"
        )
        
        # Update to running
        updated = await crud.content_suggestion.content_analysis_job.update_job_status(
            db,
            job_id=job.job_id,
            status="running",
            progress=0.5,
            ai_model_used="gpt-4",
        )
        
        assert updated is not None
        assert updated.status == "running"
        assert updated.progress == 0.5
        assert updated.ai_model_used == "gpt-4"
        assert updated.started_at is not None
        
        # Update to completed
        results = {"sentiment_score": 0.8, "confidence": 0.9}
        completed = await crud.content_suggestion.content_analysis_job.update_job_status(
            db,
            job_id=job.job_id,
            status="completed",
            progress=1.0,
            results=results,
            processing_time_seconds=15.5,
            tokens_used=1500,
            cost_usd=0.05,
        )
        
        assert completed.status == "completed"
        assert completed.progress == 1.0
        assert completed.results == results
        assert completed.processing_time_seconds == 15.5
        assert completed.tokens_used == 1500
        assert completed.cost_usd == 0.05
        assert completed.completed_at is not None

    async def test_get_pending_jobs(self, db: AsyncSession, content_item):
        """Test getting pending jobs."""
        # Create some jobs
        job1 = await crud.content_suggestion.content_analysis_job.create_analysis_job(
            db, content_id=content_item.content_id, job_type="quality_analysis"
        )
        
        job2 = await crud.content_suggestion.content_analysis_job.create_analysis_job(
            db, content_id=content_item.content_id, job_type="topic_extraction"
        )
        
        # Update one to running
        await crud.content_suggestion.content_analysis_job.update_job_status(
            db, job_id=job2.job_id, status="running"
        )
        
        # Get pending jobs
        pending = await crud.content_suggestion.content_analysis_job.get_pending_jobs(
            db, limit=10
        )
        
        assert len(pending) >= 1
        pending_job_ids = [j.job_id for j in pending]
        assert job1.job_id in pending_job_ids
        assert job2.job_id not in pending_job_ids  # Should not include running job