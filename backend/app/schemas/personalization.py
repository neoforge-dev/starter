"""Personalization system Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, validator


# Base schemas
class PersonalizationBase(BaseModel):
    """Base personalization schema with common configuration."""

    model_config = ConfigDict(from_attributes=True)


class PersonalizationProfileBase(PersonalizationBase):
    """Base personalization profile schema."""

    primary_segment: str = Field(..., description="Primary user segment")
    secondary_segments: Optional[List[str]] = Field(
        None, description="Additional user segments"
    )
    segment_confidence: float = Field(
        0.5, ge=0.0, le=1.0, description="Segment assignment confidence"
    )
    usage_patterns: Optional[Dict[str, Any]] = Field(
        None, description="Usage patterns analysis"
    )
    feature_usage: Optional[Dict[str, Any]] = Field(
        None, description="Feature usage patterns"
    )
    navigation_patterns: Optional[Dict[str, Any]] = Field(
        None, description="Navigation preferences"
    )
    device_preferences: Optional[Dict[str, Any]] = Field(
        None, description="Device usage patterns"
    )
    ui_preferences: Optional[Dict[str, Any]] = Field(
        None, description="UI customization preferences"
    )
    content_preferences: Optional[Dict[str, Any]] = Field(
        None, description="Content preferences"
    )
    notification_preferences: Optional[Dict[str, Any]] = Field(
        None, description="Notification preferences"
    )


class PersonalizationRuleBase(PersonalizationBase):
    """Base personalization rule schema."""

    name: str = Field(..., max_length=200, description="Human-readable rule name")
    description: str = Field(..., description="Rule description and purpose")
    target_segments: List[str] = Field(
        ..., description="User segments this rule applies to"
    )
    target_contexts: List[str] = Field(
        ..., description="Contexts where rule is applied"
    )
    conditions: Dict[str, Any] = Field(
        ..., description="Conditions for rule activation"
    )
    personalization_type: str = Field(..., description="Type of personalization")
    configuration: Dict[str, Any] = Field(
        ..., description="Personalization configuration"
    )
    priority: int = Field(100, description="Rule priority (lower = higher priority)")
    is_active: bool = Field(True, description="Whether rule is active")
    is_ab_test: bool = Field(False, description="Whether this is an A/B test rule")
    ab_test_id: Optional[str] = Field(None, description="Associated A/B test ID")
    starts_at: Optional[datetime] = Field(None, description="When rule becomes active")
    expires_at: Optional[datetime] = Field(None, description="When rule expires")


class PersonalizationInteractionBase(PersonalizationBase):
    """Base personalization interaction schema."""

    context: str = Field(..., description="Context where personalization was shown")
    interaction_type: str = Field(..., description="Type of interaction")
    personalization_data: Optional[Dict[str, Any]] = Field(
        None, description="Personalization data"
    )
    user_action: Optional[str] = Field(None, description="Specific user action taken")
    outcome: Optional[str] = Field(None, description="Interaction outcome")
    session_id: Optional[str] = Field(None, description="Session identifier")
    device_type: Optional[str] = Field(None, description="Device type")


# Create schemas
class PersonalizationProfileCreate(PersonalizationProfileBase):
    """Schema for creating personalization profile."""

    pass


class PersonalizationRuleCreate(PersonalizationRuleBase):
    """Schema for creating personalization rule."""

    @validator("target_segments", "target_contexts")
    def validate_non_empty_lists(cls, v):
        if not v:
            raise ValueError("Lists cannot be empty")
        return v

    @validator("personalization_type")
    def validate_personalization_type(cls, v):
        valid_types = {
            "ui_adaptation",
            "content_filter",
            "feature_toggle",
            "workflow_optimization",
            "navigation_customization",
        }
        if v not in valid_types:
            raise ValueError(
                f"Invalid personalization type. Must be one of: {valid_types}"
            )
        return v


class PersonalizationInteractionCreate(PersonalizationInteractionBase):
    """Schema for creating personalization interaction."""

    user_id: int = Field(..., description="User who interacted")
    rule_id: str = Field(..., description="Rule that was applied")
    response_time_ms: Optional[int] = Field(
        None, ge=0, description="Response time in milliseconds"
    )
    engagement_score: Optional[float] = Field(
        None, ge=0.0, le=1.0, description="Engagement score"
    )


# Update schemas
class PersonalizationProfileUpdate(PersonalizationBase):
    """Schema for updating personalization profile."""

    primary_segment: Optional[str] = None
    secondary_segments: Optional[List[str]] = None
    segment_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    usage_patterns: Optional[Dict[str, Any]] = None
    feature_usage: Optional[Dict[str, Any]] = None
    navigation_patterns: Optional[Dict[str, Any]] = None
    device_preferences: Optional[Dict[str, Any]] = None
    ui_preferences: Optional[Dict[str, Any]] = None
    content_preferences: Optional[Dict[str, Any]] = None
    notification_preferences: Optional[Dict[str, Any]] = None
    predicted_churn_risk: Optional[float] = Field(None, ge=0.0, le=1.0)
    lifetime_value_score: Optional[float] = None
    next_likely_actions: Optional[List[str]] = None


class PersonalizationRuleUpdate(PersonalizationBase):
    """Schema for updating personalization rule."""

    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    target_segments: Optional[List[str]] = None
    target_contexts: Optional[List[str]] = None
    conditions: Optional[Dict[str, Any]] = None
    personalization_type: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    is_ab_test: Optional[bool] = None
    ab_test_id: Optional[str] = None
    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


# Response schemas
class PersonalizationProfile(PersonalizationProfileBase):
    """Full personalization profile response schema."""

    user_id: int
    total_sessions: int
    avg_session_duration: Optional[float]
    features_adopted: int
    last_active_days: int
    predicted_churn_risk: Optional[float]
    lifetime_value_score: Optional[float]
    next_likely_actions: Optional[List[str]]
    created_at: datetime
    updated_at: datetime
    last_analyzed_at: Optional[datetime]


class PersonalizationRule(PersonalizationRuleBase):
    """Full personalization rule response schema."""

    rule_id: str
    applications_count: int
    success_rate: Optional[float]
    avg_improvement: Optional[float]
    created_at: datetime
    updated_at: datetime


class PersonalizationInteraction(PersonalizationInteractionBase):
    """Full personalization interaction response schema."""

    interaction_id: str
    user_id: int
    rule_id: str
    response_time_ms: Optional[int]
    engagement_score: Optional[float]
    created_at: datetime


# Configuration response schemas
class PersonalizationConfig(PersonalizationBase):
    """User-specific personalization configuration."""

    user_id: int
    segment: str
    active_rules: List[Dict[str, Any]]
    ui_adaptations: Dict[str, Any]
    content_filters: Dict[str, Any]
    feature_flags: Dict[str, Any]
    navigation_customizations: Dict[str, Any]
    generated_at: datetime
    cache_expires_at: datetime


# Analytics schemas
class PersonalizationAnalytics(PersonalizationBase):
    """Personalization performance analytics."""

    total_rules: int
    active_rules: int
    total_interactions: int
    avg_response_time_ms: float
    success_rate: float
    conversion_improvement: float
    segment_performance: Dict[str, Dict[str, Any]]
    top_performing_rules: List[Dict[str, Any]]
    improvement_opportunities: List[str]
    period_start: datetime
    period_end: datetime


class SegmentAnalytics(PersonalizationBase):
    """User segment analytics."""

    segment: str
    total_users: int
    active_users: int
    avg_session_duration: Optional[float]
    conversion_rate: Optional[float]
    personalization_effectiveness: Optional[float]
    top_performing_rules: Optional[List[str]]
    improvement_opportunities: Optional[List[str]]
    period_start: datetime
    period_end: datetime


# Request schemas for specific operations
class PersonalizationRequest(PersonalizationBase):
    """Request for generating personalized configuration."""

    user_id: int
    context: str = Field(..., description="Context for personalization")
    device_type: Optional[str] = Field(None, description="Device type")
    session_id: Optional[str] = Field(None, description="Session identifier")
    include_ab_tests: bool = Field(
        True, description="Whether to include A/B test rules"
    )
    max_rules: int = Field(50, ge=1, le=100, description="Maximum rules to apply")


class RuleOptimizationRequest(PersonalizationBase):
    """Request for optimizing personalization rules."""

    rule_ids: Optional[List[str]] = Field(
        None, description="Specific rules to optimize"
    )
    segments: Optional[List[str]] = Field(None, description="Segments to optimize for")
    min_interactions: int = Field(
        100, ge=10, description="Minimum interactions for optimization"
    )
    optimization_goal: str = Field("conversion", description="Optimization goal")


class BulkInteractionCreate(PersonalizationBase):
    """Schema for creating multiple interactions."""

    interactions: List[PersonalizationInteractionCreate] = Field(
        ..., min_items=1, max_items=1000, description="List of interactions to create"
    )


# Complex response schemas
class PersonalizationInsights(PersonalizationBase):
    """Advanced personalization insights for a user."""

    user_id: int
    segment: str
    segment_confidence: float
    behavioral_insights: Dict[str, Any]
    predicted_actions: List[Dict[str, Any]]
    optimization_recommendations: List[Dict[str, Any]]
    churn_risk_factors: Optional[List[str]]
    engagement_opportunities: List[Dict[str, Any]]
    generated_at: datetime


class RulePerformanceReport(PersonalizationBase):
    """Detailed rule performance report."""

    rule_id: str
    rule_name: str
    performance_metrics: Dict[str, Any]
    segment_breakdown: Dict[str, Dict[str, Any]]
    interaction_timeline: List[Dict[str, Any]]
    optimization_suggestions: List[str]
    a_b_test_results: Optional[Dict[str, Any]]
    report_period: Dict[str, datetime]


# List response schemas
class PersonalizationProfileList(PersonalizationBase):
    """List of personalization profiles with pagination."""

    profiles: List[PersonalizationProfile]
    total: int
    page: int
    size: int
    pages: int


class PersonalizationRuleList(PersonalizationBase):
    """List of personalization rules with pagination."""

    rules: List[PersonalizationRule]
    total: int
    page: int
    size: int
    pages: int


class PersonalizationInteractionList(PersonalizationBase):
    """List of personalization interactions with pagination."""

    interactions: List[PersonalizationInteraction]
    total: int
    page: int
    size: int
    pages: int


# Error schemas
class PersonalizationError(PersonalizationBase):
    """Personalization error response."""

    error_code: str
    error_message: str
    error_details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Export commonly used schemas
__all__ = [
    # Base schemas
    "PersonalizationProfileBase",
    "PersonalizationRuleBase",
    "PersonalizationInteractionBase",
    # Create schemas
    "PersonalizationProfileCreate",
    "PersonalizationRuleCreate",
    "PersonalizationInteractionCreate",
    "BulkInteractionCreate",
    # Update schemas
    "PersonalizationProfileUpdate",
    "PersonalizationRuleUpdate",
    # Response schemas
    "PersonalizationProfile",
    "PersonalizationRule",
    "PersonalizationInteraction",
    "PersonalizationConfig",
    "PersonalizationAnalytics",
    "SegmentAnalytics",
    "PersonalizationInsights",
    "RulePerformanceReport",
    # List schemas
    "PersonalizationProfileList",
    "PersonalizationRuleList",
    "PersonalizationInteractionList",
    # Request schemas
    "PersonalizationRequest",
    "RuleOptimizationRequest",
    # Error schemas
    "PersonalizationError",
]
