"""Personalization system models for adaptive user experiences."""
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from uuid import uuid4

from sqlalchemy import (
    JSON, Index, Float, String, Text, Boolean, Integer, 
    ForeignKey, UniqueConstraint, text
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from .user import User


class PersonalizationSegment(str):
    """User segment constants for personalization."""
    NEW_USER = "new_user"                    # First-time users
    POWER_USER = "power_user"                # Highly engaged users
    CASUAL_USER = "casual_user"              # Occasional users
    FEATURE_EXPLORER = "feature_explorer"    # Users who try new features
    GOAL_ORIENTED = "goal_oriented"          # Task-focused users
    SOCIAL_USER = "social_user"              # Users who engage socially
    MOBILE_FIRST = "mobile_first"            # Primarily mobile users
    DESKTOP_FOCUSED = "desktop_focused"      # Primarily desktop users


class PersonalizationContext(str):
    """Context constants for when personalization is applied."""
    LOGIN = "login"                          # User login/dashboard
    NAVIGATION = "navigation"                # Menu and navigation
    FEATURE_DISCOVERY = "feature_discovery" # Feature introductions
    WORKFLOW = "workflow"                    # Task completion flows
    CONTENT = "content"                      # Content recommendations
    SETTINGS = "settings"                    # Settings and preferences
    MOBILE = "mobile"                        # Mobile-specific contexts
    ONBOARDING = "onboarding"               # New user onboarding


class PersonalizationProfile(Base):
    """User personalization profile storing behavior patterns and preferences."""
    
    __tablename__ = "personalization_profiles"

    # User association
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
        comment="User for this personalization profile"
    )
    
    # User segmentation
    primary_segment: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
        default=PersonalizationSegment.NEW_USER,
        comment="Primary user segment for personalization"
    )
    secondary_segments: Mapped[Optional[List[str]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Additional user segments"
    )
    segment_confidence: Mapped[float] = mapped_column(
        Float,
        default=0.5,
        nullable=False,
        comment="Confidence in segment assignment (0.0-1.0)"
    )
    
    # Behavioral patterns
    usage_patterns: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Usage patterns analysis (session times, frequency, etc.)"
    )
    feature_usage: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Feature usage patterns and preferences"
    )
    navigation_patterns: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Navigation preferences and common paths"
    )
    device_preferences: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Device usage patterns and preferences"
    )
    
    # Engagement metrics
    total_sessions: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Total number of user sessions"
    )
    avg_session_duration: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Average session duration in minutes"
    )
    features_adopted: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Number of features user has adopted"
    )
    last_active_days: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Days since last activity"
    )
    
    # Personalization preferences
    ui_preferences: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="UI customization preferences"
    )
    content_preferences: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Content type and format preferences"
    )
    notification_preferences: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Notification timing and channel preferences"
    )
    
    # ML model insights
    predicted_churn_risk: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Predicted churn risk score (0.0-1.0)"
    )
    lifetime_value_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Predicted lifetime value score"
    )
    next_likely_actions: Mapped[Optional[List[str]]] = mapped_column(
        JSON,
        nullable=True,
        comment="ML-predicted next likely user actions"
    )
    
    # Timing
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        onupdate=lambda: datetime.utcnow(),
        nullable=False
    )
    last_analyzed_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        comment="When profile was last analyzed"
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        lazy="selectin"
    )
    
    personalizations: Mapped[List["PersonalizationRule"]] = relationship(
        "PersonalizationRule",
        secondary="user_personalization_rules",
        back_populates="profiles",
        lazy="select"
    )

    # Database indexes
    __table_args__ = (
        Index('idx_personalization_profile_segment', 'primary_segment'),
        Index('idx_personalization_profile_confidence', 'segment_confidence'),
        Index('idx_personalization_profile_updated', 'updated_at'),
        Index('idx_personalization_profile_churn', 'predicted_churn_risk'),
        Index('idx_personalization_profile_value', 'lifetime_value_score'),
        
        # JSONB indexing for pattern data
        Index('idx_personalization_profile_usage_gin', 'usage_patterns', postgresql_using='gin'),
        Index('idx_personalization_profile_features_gin', 'feature_usage', postgresql_using='gin'),
        Index('idx_personalization_profile_ui_gin', 'ui_preferences', postgresql_using='gin'),
    )

    def __repr__(self) -> str:
        """String representation of personalization profile."""
        return (
            f"<PersonalizationProfile(user_id={self.user_id}, "
            f"segment='{self.primary_segment}', "
            f"confidence={self.segment_confidence:.2f})>"
        )


class PersonalizationRule(Base):
    """Dynamic personalization rules for adaptive user experiences."""
    
    __tablename__ = "personalization_rules"

    # Rule identification
    rule_id: Mapped[str] = mapped_column(
        String(36),
        default=lambda: str(uuid4()),
        unique=True,
        index=True,
        comment="Unique rule identifier"
    )
    
    # Rule definition
    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        comment="Human-readable rule name"
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Rule description and purpose"
    )
    
    # Rule targeting
    target_segments: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        comment="User segments this rule applies to"
    )
    target_contexts: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        comment="Contexts where this rule is applied"
    )
    conditions: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        comment="Conditions for rule activation"
    )
    
    # Rule configuration
    personalization_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
        comment="Type: ui_adaptation, content_filter, feature_toggle, workflow_optimization"
    )
    configuration: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        comment="Personalization configuration parameters"
    )
    
    # Rule metadata
    priority: Mapped[int] = mapped_column(
        Integer,
        default=100,
        index=True,
        comment="Rule priority for conflict resolution (lower = higher priority)"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
        comment="Whether rule is currently active"
    )
    is_ab_test: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="Whether this is an A/B test rule"
    )
    ab_test_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        nullable=True,
        comment="Associated A/B test identifier"
    )
    
    # Performance tracking
    applications_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Number of times rule has been applied"
    )
    success_rate: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Success rate of this personalization (0.0-1.0)"
    )
    avg_improvement: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Average improvement metric"
    )
    
    # Timing
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        onupdate=lambda: datetime.utcnow(),
        nullable=False
    )
    starts_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        comment="When rule becomes active"
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        comment="When rule expires"
    )

    # Relationships
    profiles: Mapped[List["PersonalizationProfile"]] = relationship(
        "PersonalizationProfile",
        secondary="user_personalization_rules",
        back_populates="personalizations",
        lazy="select"
    )
    
    interactions: Mapped[List["PersonalizationInteraction"]] = relationship(
        "PersonalizationInteraction",
        back_populates="rule",
        cascade="all, delete-orphan",
        lazy="select"
    )

    # Database indexes
    __table_args__ = (
        Index('idx_personalization_rule_segments_gin', 'target_segments', postgresql_using='gin'),
        Index('idx_personalization_rule_contexts_gin', 'target_contexts', postgresql_using='gin'),
        Index('idx_personalization_rule_type_active', 'personalization_type', 'is_active'),
        Index('idx_personalization_rule_priority_active', 'priority', 'is_active'),
        Index('idx_personalization_rule_ab_test', 'is_ab_test', 'ab_test_id'),
        Index('idx_personalization_rule_performance', 'success_rate', 'applications_count'),
        Index('idx_personalization_rule_timing', 'starts_at', 'expires_at'),
        
        # JSONB indexing for conditions and configuration
        Index('idx_personalization_rule_conditions_gin', 'conditions', postgresql_using='gin'),
        Index('idx_personalization_rule_config_gin', 'configuration', postgresql_using='gin'),
    )

    def __repr__(self) -> str:
        """String representation of personalization rule."""
        return (
            f"<PersonalizationRule(id={self.rule_id}, "
            f"name='{self.name}', type='{self.personalization_type}', "
            f"active={self.is_active})>"
        )


class PersonalizationInteraction(Base):
    """Track user interactions with personalized experiences."""
    
    __tablename__ = "personalization_interactions"

    # Interaction identification
    interaction_id: Mapped[str] = mapped_column(
        String(36),
        default=lambda: str(uuid4()),
        unique=True,
        index=True,
        comment="Unique interaction identifier"
    )
    
    # User and rule association
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        comment="User who interacted"
    )
    rule_id: Mapped[str] = mapped_column(
        ForeignKey("personalization_rules.rule_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        comment="Personalization rule that was applied"
    )
    
    # Interaction details
    context: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
        comment="Context where personalization was shown"
    )
    interaction_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
        comment="Type: shown, clicked, dismissed, converted, ignored"
    )
    
    # Interaction data
    personalization_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Data about the personalization shown"
    )
    user_action: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Specific user action taken"
    )
    outcome: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="Outcome: positive, negative, neutral"
    )
    
    # Performance metrics
    response_time_ms: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Time to generate personalization in milliseconds"
    )
    engagement_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Calculated engagement score for this interaction"
    )
    
    # Session context
    session_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        index=True,
        nullable=True,
        comment="Session identifier"
    )
    device_type: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        comment="Device type: mobile, tablet, desktop"
    )
    
    # Timing
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
        comment="When interaction occurred"
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        lazy="selectin"
    )
    rule: Mapped["PersonalizationRule"] = relationship(
        "PersonalizationRule",
        back_populates="interactions",
        lazy="selectin"
    )

    # Database indexes
    __table_args__ = (
        Index('idx_personalization_interaction_user_rule', 'user_id', 'rule_id'),
        Index('idx_personalization_interaction_context_type', 'context', 'interaction_type'),
        Index('idx_personalization_interaction_outcome', 'outcome'),
        Index('idx_personalization_interaction_session', 'session_id'),
        Index('idx_personalization_interaction_created', 'created_at'),
        Index('idx_personalization_interaction_performance', 'response_time_ms', 'engagement_score'),
        
        # JSONB indexing for personalization data
        Index('idx_personalization_interaction_data_gin', 'personalization_data', postgresql_using='gin'),
    )

    def __repr__(self) -> str:
        """String representation of personalization interaction."""
        return (
            f"<PersonalizationInteraction(id={self.interaction_id}, "
            f"user_id={self.user_id}, type='{self.interaction_type}', "
            f"context='{self.context}')>"
        )


class UserPersonalizationRules(Base):
    """Association table for users and personalization rules."""
    
    __tablename__ = "user_personalization_rules"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("personalization_profiles.user_id", ondelete="CASCADE"),
        primary_key=True,
        comment="User ID"
    )
    rule_id: Mapped[str] = mapped_column(
        ForeignKey("personalization_rules.rule_id", ondelete="CASCADE"),
        primary_key=True,
        comment="Rule ID"
    )
    
    # Association metadata
    assigned_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
        comment="When rule was assigned to user"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        comment="Whether this rule is active for this user"
    )
    override_configuration: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="User-specific rule configuration overrides"
    )

    # Database indexes
    __table_args__ = (
        Index('idx_user_personalization_rules_user', 'user_id'),
        Index('idx_user_personalization_rules_rule', 'rule_id'),
        Index('idx_user_personalization_rules_active', 'is_active'),
        Index('idx_user_personalization_rules_assigned', 'assigned_at'),
    )


class PersonalizationSegmentAnalysis(Base):
    """Aggregate analytics for personalization segments."""
    
    __tablename__ = "personalization_segment_analysis"

    # Analysis identification
    analysis_id: Mapped[str] = mapped_column(
        String(36),
        default=lambda: str(uuid4()),
        primary_key=True,
        comment="Unique analysis identifier"
    )
    
    # Segment analysis
    segment: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
        comment="User segment being analyzed"
    )
    analysis_period: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="Analysis period: daily, weekly, monthly"
    )
    
    # Segment metrics
    total_users: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Total users in segment"
    )
    active_users: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Active users in segment during period"
    )
    avg_session_duration: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Average session duration for segment"
    )
    conversion_rate: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Conversion rate for segment"
    )
    
    # Personalization effectiveness
    personalization_effectiveness: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Overall personalization effectiveness score"
    )
    top_performing_rules: Mapped[Optional[List[str]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Top performing personalization rules for segment"
    )
    improvement_opportunities: Mapped[Optional[List[str]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Identified improvement opportunities"
    )
    
    # Timing
    period_start: Mapped[datetime] = mapped_column(
        nullable=False,
        comment="Start of analysis period"
    )
    period_end: Mapped[datetime] = mapped_column(
        nullable=False,
        comment="End of analysis period"
    )
    computed_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
        comment="When analysis was computed"
    )

    # Database indexes
    __table_args__ = (
        Index('idx_personalization_segment_analysis_segment_period', 'segment', 'analysis_period'),
        Index('idx_personalization_segment_analysis_period', 'period_start', 'period_end'),
        Index('idx_personalization_segment_analysis_effectiveness', 'personalization_effectiveness'),
        Index('idx_personalization_segment_analysis_computed', 'computed_at'),
        
        # JSONB indexing for rules and opportunities
        Index('idx_personalization_segment_analysis_rules_gin', 'top_performing_rules', postgresql_using='gin'),
        Index('idx_personalization_segment_analysis_opportunities_gin', 'improvement_opportunities', postgresql_using='gin'),
    )

    def __repr__(self) -> str:
        """String representation of segment analysis."""
        return (
            f"<PersonalizationSegmentAnalysis(segment='{self.segment}', "
            f"period='{self.analysis_period}', "
            f"effectiveness={self.personalization_effectiveness:.2f})>"
        )