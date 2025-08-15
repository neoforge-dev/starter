"""Content suggestion schemas for API request/response validation."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from app.models.content_suggestion import (
    ContentType,
    ContentCategory,
    SuggestionType,
    ContentSuggestionStatus,
)


# Content Item Schemas
class ContentItemBase(BaseModel):
    """Base content item schema."""
    title: str = Field(..., min_length=1, max_length=500, description="Content title")
    description: Optional[str] = Field(None, description="Content description")
    content_type: ContentType = Field(..., description="Type of content")
    category: ContentCategory = Field(..., description="Content category")
    url: Optional[str] = Field(None, max_length=2048, description="Content URL")
    author: Optional[str] = Field(None, max_length=200, description="Content author")
    source: Optional[str] = Field(None, max_length=200, description="Content source")
    published_at: Optional[datetime] = Field(None, description="Original publication date")


class ContentItemCreate(ContentItemBase):
    """Schema for creating content items."""
    pass


class ContentItemUpdate(BaseModel):
    """Schema for updating content items."""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    content_type: Optional[ContentType] = None
    category: Optional[ContentCategory] = None
    url: Optional[str] = Field(None, max_length=2048)
    author: Optional[str] = Field(None, max_length=200)
    source: Optional[str] = Field(None, max_length=200)
    published_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class ContentItem(ContentItemBase):
    """Content item response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    content_id: str = Field(..., description="Unique content identifier")
    quality_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="AI quality score")
    relevance_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Relevance score")
    engagement_prediction: Optional[float] = Field(None, ge=0.0, le=1.0, description="Predicted engagement")
    sentiment_score: Optional[float] = Field(None, ge=-1.0, le=1.0, description="Sentiment score")
    topics: Optional[Dict[str, Any]] = Field(None, description="Extracted topics")
    ai_analysis: Optional[Dict[str, Any]] = Field(None, description="AI analysis results")
    optimization_suggestions: Optional[Dict[str, Any]] = Field(None, description="Optimization suggestions")
    view_count: int = Field(0, description="Number of views")
    click_count: int = Field(0, description="Number of clicks")
    share_count: int = Field(0, description="Number of shares")
    engagement_rate: float = Field(0.0, description="Overall engagement rate")
    is_active: bool = Field(True, description="Whether content is active")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    analyzed_at: Optional[datetime] = Field(None, description="Last AI analysis timestamp")


# Content Suggestion Schemas
class ContentSuggestionBase(BaseModel):
    """Base content suggestion schema."""
    suggestion_type: SuggestionType = Field(..., description="Type of suggestion")
    title: str = Field(..., min_length=1, max_length=300, description="Suggestion title")
    description: str = Field(..., min_length=1, description="Suggestion description")
    call_to_action: Optional[str] = Field(None, max_length=100, description="Call to action")


class ContentSuggestionCreate(ContentSuggestionBase):
    """Schema for creating content suggestions."""
    user_id: int = Field(..., gt=0, description="Target user ID")
    content_id: str = Field(..., description="Suggested content ID")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="AI confidence score")
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="Relevance score")
    priority_score: float = Field(..., ge=0.0, le=1.0, description="Priority score")
    personalization_score: float = Field(..., ge=0.0, le=1.0, description="Personalization score")
    context: Optional[Dict[str, Any]] = Field(None, description="Suggestion context")
    ai_reasoning: Optional[Dict[str, Any]] = Field(None, description="AI reasoning")
    personalization_factors: Optional[Dict[str, Any]] = Field(None, description="Personalization factors")
    model_version: str = Field(..., description="AI model version")
    algorithm: str = Field(..., description="Algorithm used")
    expires_at: Optional[datetime] = Field(None, description="Expiration timestamp")


class ContentSuggestionUpdate(BaseModel):
    """Schema for updating content suggestions."""
    status: Optional[ContentSuggestionStatus] = None
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    description: Optional[str] = Field(None, min_length=1)
    call_to_action: Optional[str] = Field(None, max_length=100)
    expires_at: Optional[datetime] = None


class ContentSuggestion(ContentSuggestionBase):
    """Content suggestion response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    suggestion_id: str = Field(..., description="Unique suggestion identifier")
    user_id: int = Field(..., description="Target user ID")
    content_id: str = Field(..., description="Suggested content ID")
    confidence_score: float = Field(..., description="AI confidence score")
    relevance_score: float = Field(..., description="Relevance score")
    priority_score: float = Field(..., description="Priority score")
    personalization_score: float = Field(..., description="Personalization score")
    context: Optional[Dict[str, Any]] = Field(None, description="Suggestion context")
    ai_reasoning: Optional[Dict[str, Any]] = Field(None, description="AI reasoning")
    personalization_factors: Optional[Dict[str, Any]] = Field(None, description="Personalization factors")
    status: ContentSuggestionStatus = Field(..., description="Suggestion status")
    impression_count: int = Field(0, description="Number of impressions")
    click_count: int = Field(0, description="Number of clicks")
    model_version: str = Field(..., description="AI model version")
    algorithm: str = Field(..., description="Algorithm used")
    created_at: datetime = Field(..., description="Creation timestamp")
    expires_at: Optional[datetime] = Field(None, description="Expiration timestamp")
    first_shown_at: Optional[datetime] = Field(None, description="First shown timestamp")
    last_shown_at: Optional[datetime] = Field(None, description="Last shown timestamp")
    clicked_at: Optional[datetime] = Field(None, description="Click timestamp")
    dismissed_at: Optional[datetime] = Field(None, description="Dismissal timestamp")
    
    # Computed properties
    is_active: bool = Field(False, description="Whether suggestion is active")
    click_through_rate: float = Field(0.0, description="Click-through rate")
    engagement_score: float = Field(0.0, description="Overall engagement score")
    
    # Related content item
    content_item: Optional[ContentItem] = Field(None, description="Associated content item")


# Content Suggestion Feedback Schemas
class ContentSuggestionFeedbackBase(BaseModel):
    """Base content suggestion feedback schema."""
    rating: Optional[int] = Field(None, ge=1, le=5, description="User rating (1-5 stars)")
    feedback_type: str = Field(..., description="Type of feedback")
    action_taken: str = Field(..., description="User action taken")
    feedback_text: Optional[str] = Field(None, description="Optional text feedback")
    context: Optional[Dict[str, Any]] = Field(None, description="Feedback context")
    session_data: Optional[Dict[str, Any]] = Field(None, description="Session data")


class ContentSuggestionFeedbackCreate(ContentSuggestionFeedbackBase):
    """Schema for creating content suggestion feedback."""
    suggestion_id: str = Field(..., description="Suggestion ID")


class ContentSuggestionFeedback(ContentSuggestionFeedbackBase):
    """Content suggestion feedback response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(..., description="Feedback ID")
    suggestion_id: str = Field(..., description="Suggestion ID")
    user_id: int = Field(..., description="User ID")
    created_at: datetime = Field(..., description="Creation timestamp")


# Content Analysis Job Schemas
class ContentAnalysisJobBase(BaseModel):
    """Base content analysis job schema."""
    job_type: str = Field(..., description="Type of analysis job")


class ContentAnalysisJobCreate(ContentAnalysisJobBase):
    """Schema for creating content analysis jobs."""
    content_id: str = Field(..., description="Content to analyze")


class ContentAnalysisJob(ContentAnalysisJobBase):
    """Content analysis job response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    job_id: str = Field(..., description="Job identifier")
    content_id: str = Field(..., description="Content being analyzed")
    status: str = Field(..., description="Job status")
    progress: float = Field(0.0, description="Job progress")
    results: Optional[Dict[str, Any]] = Field(None, description="Analysis results")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    ai_model_used: Optional[str] = Field(None, description="AI model used")
    processing_time_seconds: Optional[float] = Field(None, description="Processing time")
    tokens_used: Optional[int] = Field(None, description="Tokens consumed")
    cost_usd: Optional[float] = Field(None, description="Analysis cost")
    created_at: datetime = Field(..., description="Creation timestamp")
    started_at: Optional[datetime] = Field(None, description="Start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Completion timestamp")


# Request/Response Schemas for API Endpoints
class PersonalizedSuggestionsRequest(BaseModel):
    """Request for personalized content suggestions."""
    suggestion_types: Optional[List[SuggestionType]] = Field(None, description="Types of suggestions")
    categories: Optional[List[ContentCategory]] = Field(None, description="Content categories")
    limit: int = Field(10, ge=1, le=100, description="Number of suggestions")
    include_context: bool = Field(True, description="Include AI reasoning and context")
    exclude_dismissed: bool = Field(True, description="Exclude dismissed suggestions")
    min_confidence: float = Field(0.5, ge=0.0, le=1.0, description="Minimum confidence score")


class PersonalizedSuggestionsResponse(BaseModel):
    """Response for personalized content suggestions."""
    suggestions: List[ContentSuggestion] = Field(..., description="Content suggestions")
    total_count: int = Field(..., description="Total number of suggestions")
    user_id: int = Field(..., description="User ID")
    metadata: Dict[str, Any] = Field(..., description="Response metadata")


class GenerateContentSuggestionsRequest(BaseModel):
    """Request for generating content suggestions."""
    content_ids: Optional[List[str]] = Field(None, description="Specific content IDs to analyze")
    user_ids: Optional[List[int]] = Field(None, description="Specific user IDs to generate for")
    categories: Optional[List[ContentCategory]] = Field(None, description="Content categories")
    force_regenerate: bool = Field(False, description="Force regeneration of existing suggestions")
    max_suggestions_per_user: int = Field(5, ge=1, le=20, description="Max suggestions per user")


class GenerateContentSuggestionsResponse(BaseModel):
    """Response for content suggestion generation."""
    generated_count: int = Field(..., description="Number of suggestions generated")
    user_count: int = Field(..., description="Number of users processed")
    processing_time_seconds: float = Field(..., description="Processing time")
    metadata: Dict[str, Any] = Field(..., description="Generation metadata")


class TrendingContentRequest(BaseModel):
    """Request for trending content."""
    categories: Optional[List[ContentCategory]] = Field(None, description="Content categories")
    time_window_hours: int = Field(24, ge=1, le=168, description="Time window in hours")
    min_engagement_rate: float = Field(0.01, ge=0.0, le=1.0, description="Minimum engagement rate")
    limit: int = Field(20, ge=1, le=100, description="Number of trending items")


class TrendingContentResponse(BaseModel):
    """Response for trending content."""
    trending_content: List[ContentItem] = Field(..., description="Trending content items")
    time_window_hours: int = Field(..., description="Time window used")
    metadata: Dict[str, Any] = Field(..., description="Response metadata")


class ContentOptimizationRequest(BaseModel):
    """Request for content optimization suggestions."""
    content_id: str = Field(..., description="Content to optimize")
    optimization_types: Optional[List[str]] = Field(None, description="Types of optimization")
    target_audience: Optional[str] = Field(None, description="Target audience")
    business_goals: Optional[List[str]] = Field(None, description="Business goals")


class ContentOptimizationResponse(BaseModel):
    """Response for content optimization."""
    content_id: str = Field(..., description="Content ID")
    optimization_suggestions: Dict[str, Any] = Field(..., description="Optimization suggestions")
    improvement_score: float = Field(..., description="Potential improvement score")
    implementation_complexity: str = Field(..., description="Implementation complexity")
    estimated_impact: Dict[str, Any] = Field(..., description="Estimated impact metrics")
    ai_analysis: Dict[str, Any] = Field(..., description="Detailed AI analysis")


class ContentSuggestionAnalyticsRequest(BaseModel):
    """Request for content suggestion analytics."""
    user_id: Optional[int] = Field(None, description="Specific user ID")
    suggestion_types: Optional[List[SuggestionType]] = Field(None, description="Suggestion types")
    start_date: Optional[datetime] = Field(None, description="Start date")
    end_date: Optional[datetime] = Field(None, description="End date")
    groupby: Optional[str] = Field(None, description="Group by field")


class ContentSuggestionAnalyticsResponse(BaseModel):
    """Response for content suggestion analytics."""
    total_suggestions: int = Field(..., description="Total suggestions generated")
    active_suggestions: int = Field(..., description="Currently active suggestions")
    total_impressions: int = Field(..., description="Total impressions")
    total_clicks: int = Field(..., description="Total clicks")
    avg_ctr: float = Field(..., description="Average click-through rate")
    conversion_rate: float = Field(..., description="Conversion rate")
    top_performing_types: List[Dict[str, Any]] = Field(..., description="Top performing suggestion types")
    engagement_metrics: Dict[str, Any] = Field(..., description="Engagement metrics")
    ai_model_performance: Dict[str, Any] = Field(..., description="AI model performance metrics")
    time_series_data: Optional[List[Dict[str, Any]]] = Field(None, description="Time series analytics")


class BulkContentSuggestionCreate(BaseModel):
    """Schema for creating multiple content suggestions."""
    suggestions: List[ContentSuggestionCreate] = Field(..., description="List of suggestions to create")
    notify_users: bool = Field(False, description="Whether to notify users of new suggestions")
    batch_processing: bool = Field(True, description="Whether to process in batches")


class BulkContentSuggestionResponse(BaseModel):
    """Response for bulk content suggestion creation."""
    created_count: int = Field(..., description="Number of suggestions created")
    failed_count: int = Field(0, description="Number of failed creations")
    suggestions: List[ContentSuggestion] = Field(..., description="Created suggestions")
    errors: Optional[List[str]] = Field(None, description="Error messages for failed creations")


class ContentCategoryAnalysisResponse(BaseModel):
    """Response for content category analysis."""
    categories: List[Dict[str, Any]] = Field(..., description="Category analysis results")
    top_performing_categories: List[str] = Field(..., description="Top performing categories")
    category_trends: Dict[str, Any] = Field(..., description="Category trend analysis")
    user_preferences: Dict[str, Any] = Field(..., description="User preference distribution")
    recommendations: List[str] = Field(..., description="Category recommendations")


class UserContentPreferencesUpdate(BaseModel):
    """Schema for updating user content preferences."""
    preferred_categories: Optional[List[ContentCategory]] = Field(None, description="Preferred categories")
    content_types: Optional[List[ContentType]] = Field(None, description="Preferred content types")
    notification_frequency: Optional[str] = Field(None, description="Notification frequency")
    max_daily_suggestions: Optional[int] = Field(None, ge=1, le=50, description="Max daily suggestions")
    quality_threshold: Optional[float] = Field(None, ge=0.0, le=1.0, description="Quality threshold")
    personalization_level: Optional[str] = Field(None, description="Personalization level")


class UserContentPreferences(BaseModel):
    """User content preferences response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    user_id: int = Field(..., description="User ID")
    preferred_categories: List[ContentCategory] = Field(..., description="Preferred categories")
    content_types: List[ContentType] = Field(..., description="Preferred content types")
    notification_frequency: str = Field(..., description="Notification frequency")
    max_daily_suggestions: int = Field(..., description="Max daily suggestions")
    quality_threshold: float = Field(..., description="Quality threshold")
    personalization_level: str = Field(..., description="Personalization level")
    engagement_history: Dict[str, Any] = Field(..., description="Engagement history")
    last_updated: datetime = Field(..., description="Last update timestamp")