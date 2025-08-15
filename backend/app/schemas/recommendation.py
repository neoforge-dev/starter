"""Pydantic schemas for recommendation system API."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, validator


class RecommendationType:
    """Recommendation type constants."""
    FEATURE = "feature"
    CONTENT = "content"
    ACTION = "action"
    PERSONALIZATION = "personalization"
    SOCIAL = "social"


class RecommendationStatus:
    """Recommendation status constants."""
    ACTIVE = "active"
    DISMISSED = "dismissed"
    CLICKED = "clicked"
    CONVERTED = "converted"
    EXPIRED = "expired"


# Base schemas
class RecommendationBase(BaseModel):
    """Base schema for recommendations."""
    type: str = Field(..., description="Recommendation type")
    title: str = Field(..., max_length=200, description="Recommendation title")
    description: str = Field(..., description="Detailed description")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="ML confidence score")
    priority_score: float = Field(..., ge=0.0, le=1.0, description="Business priority score")
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="User relevance score")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context data")
    rec_metadata: Optional[Dict[str, Any]] = Field(None, description="Generation metadata")
    expires_at: Optional[datetime] = Field(None, description="Expiration time")
    model_version: str = Field(..., max_length=50, description="ML model version")
    algorithm: str = Field(..., max_length=50, description="Algorithm used")

    @validator('type')
    def validate_type(cls, v):
        """Validate recommendation type."""
        valid_types = [
            RecommendationType.FEATURE,
            RecommendationType.CONTENT,
            RecommendationType.ACTION,
            RecommendationType.PERSONALIZATION,
            RecommendationType.SOCIAL,
        ]
        if v not in valid_types:
            raise ValueError(f"Type must be one of {valid_types}")
        return v


class RecommendationCreate(RecommendationBase):
    """Schema for creating recommendations."""
    user_id: int = Field(..., description="User ID for recommendation")


class RecommendationUpdate(BaseModel):
    """Schema for updating recommendations."""
    status: Optional[str] = Field(None, description="New status")
    impressions: Optional[int] = Field(None, ge=0, description="Impression count")
    clicks: Optional[int] = Field(None, ge=0, description="Click count")
    shown_at: Optional[datetime] = Field(None, description="When shown to user")
    clicked_at: Optional[datetime] = Field(None, description="When clicked by user")
    dismissed_at: Optional[datetime] = Field(None, description="When dismissed by user")

    @validator('status')
    def validate_status(cls, v):
        """Validate recommendation status."""
        if v is not None:
            valid_statuses = [
                RecommendationStatus.ACTIVE,
                RecommendationStatus.DISMISSED,
                RecommendationStatus.CLICKED,
                RecommendationStatus.CONVERTED,
                RecommendationStatus.EXPIRED,
            ]
            if v not in valid_statuses:
                raise ValueError(f"Status must be one of {valid_statuses}")
        return v


class RecommendationInDB(RecommendationBase):
    """Schema for recommendation in database."""
    id: int
    recommendation_id: str
    user_id: int
    status: str
    impressions: int
    clicks: int
    created_at: datetime
    shown_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None

    class Config:
        """Pydantic config."""
        from_attributes = True


class Recommendation(RecommendationInDB):
    """Public schema for recommendations."""
    click_through_rate: Optional[float] = Field(None, description="Calculated CTR")
    is_active: bool = Field(..., description="Whether recommendation is active")
    days_since_created: int = Field(..., description="Days since creation")


# Bulk operations
class RecommendationCreateBulk(BaseModel):
    """Schema for creating multiple recommendations."""
    recommendations: List[RecommendationCreate] = Field(
        ..., 
        min_items=1, 
        max_items=100,
        description="List of recommendations to create"
    )


class RecommendationBulkResponse(BaseModel):
    """Response for bulk recommendation creation."""
    created_count: int = Field(..., description="Number of recommendations created")
    recommendations: List[Recommendation] = Field(..., description="Created recommendations")


# User preferences schemas
class UserPreferencesBase(BaseModel):
    """Base schema for user preferences."""
    feature_interests: Optional[Dict[str, float]] = Field(None, description="Feature interest scores")
    content_preferences: Optional[Dict[str, Any]] = Field(None, description="Content preferences")
    ui_preferences: Optional[Dict[str, Any]] = Field(None, description="UI preferences")
    behavioral_patterns: Optional[Dict[str, Any]] = Field(None, description="Behavioral patterns")
    avg_session_duration: Optional[float] = Field(None, ge=0.0, description="Avg session duration (minutes)")
    weekly_active_days: int = Field(0, ge=0, le=7, description="Active days per week")
    feature_adoption_rate: float = Field(0.0, ge=0.0, le=1.0, description="Feature adoption rate")
    notification_preferences: Optional[Dict[str, Any]] = Field(None, description="Notification preferences")
    max_daily_recommendations: int = Field(5, ge=1, le=50, description="Max daily recommendations")


class UserPreferencesCreate(UserPreferencesBase):
    """Schema for creating user preferences."""
    user_id: int = Field(..., description="User ID")


class UserPreferencesUpdate(UserPreferencesBase):
    """Schema for updating user preferences."""
    pass


class UserPreferencesInDB(UserPreferencesBase):
    """Schema for user preferences in database."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    last_analyzed_at: Optional[datetime] = None

    class Config:
        """Pydantic config."""
        from_attributes = True


class UserPreferences(UserPreferencesInDB):
    """Public schema for user preferences."""
    pass


# Feedback schemas
class RecommendationFeedbackBase(BaseModel):
    """Base schema for recommendation feedback."""
    rating: Optional[int] = Field(None, ge=1, le=5, description="User rating (1-5)")
    feedback_type: str = Field(..., description="Type of feedback")
    action_taken: str = Field(..., description="User action")
    feedback_text: Optional[str] = Field(None, description="Optional feedback text")
    context: Optional[Dict[str, Any]] = Field(None, description="Feedback context")

    @validator('feedback_type')
    def validate_feedback_type(cls, v):
        """Validate feedback type."""
        valid_types = ["explicit", "implicit", "positive", "negative"]
        if v not in valid_types:
            raise ValueError(f"Feedback type must be one of {valid_types}")
        return v

    @validator('action_taken')
    def validate_action_taken(cls, v):
        """Validate action taken."""
        valid_actions = ["clicked", "dismissed", "ignored", "converted"]
        if v not in valid_actions:
            raise ValueError(f"Action taken must be one of {valid_actions}")
        return v


class RecommendationFeedbackCreate(RecommendationFeedbackBase):
    """Schema for creating recommendation feedback."""
    recommendation_id: str = Field(..., description="Recommendation ID")


class RecommendationFeedbackInDB(RecommendationFeedbackBase):
    """Schema for recommendation feedback in database."""
    id: int
    recommendation_id: str
    user_id: int
    created_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True


class RecommendationFeedback(RecommendationFeedbackInDB):
    """Public schema for recommendation feedback."""
    pass


# Similar users schemas
class SimilarUsersBase(BaseModel):
    """Base schema for similar users."""
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Similarity score")
    algorithm: str = Field(..., max_length=50, description="Algorithm used")
    behavioral_similarity: Optional[float] = Field(None, ge=0.0, le=1.0, description="Behavioral similarity")
    preference_similarity: Optional[float] = Field(None, ge=0.0, le=1.0, description="Preference similarity")
    demographic_similarity: Optional[float] = Field(None, ge=0.0, le=1.0, description="Demographic similarity")
    common_features: Optional[Dict[str, Any]] = Field(None, description="Common features")
    expires_at: datetime = Field(..., description="When similarity expires")


class SimilarUsersCreate(SimilarUsersBase):
    """Schema for creating similar user relationships."""
    user_id: int = Field(..., description="Primary user ID")
    similar_user_id: int = Field(..., description="Similar user ID")


class SimilarUsersInDB(SimilarUsersBase):
    """Schema for similar users in database."""
    id: int
    user_id: int
    similar_user_id: int
    computed_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True


class SimilarUsers(SimilarUsersInDB):
    """Public schema for similar users."""
    pass


# API request/response schemas
class RecommendationRequest(BaseModel):
    """Request schema for getting recommendations."""
    user_id: Optional[int] = Field(None, description="User ID (optional for trending)")
    types: Optional[List[str]] = Field(None, description="Recommendation types to include")
    limit: int = Field(10, ge=1, le=100, description="Number of recommendations")
    include_context: bool = Field(True, description="Include context data")
    exclude_dismissed: bool = Field(True, description="Exclude dismissed recommendations")


class RecommendationResponse(BaseModel):
    """Response schema for recommendations."""
    recommendations: List[Recommendation] = Field(..., description="List of recommendations")
    total_count: int = Field(..., description="Total available recommendations")
    user_preferences: Optional[UserPreferences] = Field(None, description="User preferences")
    metadata: Dict[str, Any] = Field(..., description="Response metadata")


class TrendingRecommendationsRequest(BaseModel):
    """Request schema for trending recommendations."""
    types: Optional[List[str]] = Field(None, description="Recommendation types")
    time_window: int = Field(24, ge=1, le=168, description="Time window in hours")
    limit: int = Field(20, ge=1, le=100, description="Number of recommendations")
    min_interactions: int = Field(5, ge=1, description="Minimum interactions required")


class TrendingRecommendationsResponse(BaseModel):
    """Response schema for trending recommendations."""
    trending: List[Dict[str, Any]] = Field(..., description="Trending recommendations")
    time_window: int = Field(..., description="Time window used")
    metadata: Dict[str, Any] = Field(..., description="Response metadata")


class SimilarUsersRequest(BaseModel):
    """Request schema for similar users."""
    user_id: int = Field(..., description="User ID")
    limit: int = Field(10, ge=1, le=50, description="Number of similar users")
    min_similarity: float = Field(0.1, ge=0.0, le=1.0, description="Minimum similarity score")
    algorithm: Optional[str] = Field(None, description="Specific algorithm")


class SimilarUsersResponse(BaseModel):
    """Response schema for similar users."""
    similar_users: List[SimilarUsers] = Field(..., description="Similar users")
    total_count: int = Field(..., description="Total similar users found")
    metadata: Dict[str, Any] = Field(..., description="Response metadata")


class RecommendationAnalytics(BaseModel):
    """Analytics schema for recommendation performance."""
    total_recommendations: int = Field(..., description="Total recommendations")
    active_recommendations: int = Field(..., description="Active recommendations")
    total_impressions: int = Field(..., description="Total impressions")
    total_clicks: int = Field(..., description="Total clicks")
    avg_ctr: float = Field(..., description="Average click-through rate")
    conversion_rate: float = Field(..., description="Conversion rate")
    top_performing_types: List[Dict[str, Any]] = Field(..., description="Top performing types")
    user_engagement: Dict[str, Any] = Field(..., description="User engagement metrics")
    model_performance: Dict[str, Any] = Field(..., description="ML model performance")


class ModelRetrainingRequest(BaseModel):
    """Request schema for model retraining."""
    force_retrain: bool = Field(False, description="Force retraining even if recent")
    include_feedback: bool = Field(True, description="Include user feedback")
    algorithm: Optional[str] = Field(None, description="Specific algorithm to retrain")
    max_training_time: int = Field(600, ge=60, le=3600, description="Max training time in seconds")


class ModelRetrainingResponse(BaseModel):
    """Response schema for model retraining."""
    status: str = Field(..., description="Training status")
    model_version: str = Field(..., description="New model version")
    training_metrics: Dict[str, Any] = Field(..., description="Training performance metrics")
    started_at: datetime = Field(..., description="Training start time")
    completed_at: Optional[datetime] = Field(None, description="Training completion time")
    message: str = Field(..., description="Status message")