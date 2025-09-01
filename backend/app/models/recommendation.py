"""Recommendation system models for smart ML-powered suggestions."""
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from uuid import uuid4

from app.db.base_class import Base
from sqlalchemy import (
    JSON,
    Boolean,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .user import User


class RecommendationType(str):
    """Recommendation type constants."""

    FEATURE = "feature"  # New feature recommendations
    CONTENT = "content"  # Content suggestions
    ACTION = "action"  # Next best action recommendations
    PERSONALIZATION = "personalization"  # UI/UX customizations
    SOCIAL = "social"  # Social recommendations based on similar users


class RecommendationStatus(str):
    """Recommendation status constants."""

    ACTIVE = "active"  # Currently active recommendation
    DISMISSED = "dismissed"  # User dismissed the recommendation
    CLICKED = "clicked"  # User clicked/engaged with recommendation
    CONVERTED = "converted"  # User completed recommended action
    EXPIRED = "expired"  # Recommendation expired


class Recommendation(Base):
    """Core recommendation model storing ML-generated suggestions."""

    __tablename__ = "recommendations"

    # Recommendation identification
    recommendation_id: Mapped[str] = mapped_column(
        String(36),
        default=lambda: str(uuid4()),
        unique=True,
        index=True,
        comment="Unique recommendation identifier",
    )

    # User association
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        comment="User receiving the recommendation",
    )

    # Recommendation details
    type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
        comment="Type of recommendation: feature, content, action, personalization, social",
    )
    title: Mapped[str] = mapped_column(
        String(200), nullable=False, comment="Recommendation title/headline"
    )
    description: Mapped[str] = mapped_column(
        Text, nullable=False, comment="Detailed recommendation description"
    )

    # Recommendation scoring
    confidence_score: Mapped[float] = mapped_column(
        Float, nullable=False, index=True, comment="ML model confidence score (0.0-1.0)"
    )
    priority_score: Mapped[float] = mapped_column(
        Float, nullable=False, index=True, comment="Business priority score for ranking"
    )
    relevance_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        index=True,
        comment="Relevance score based on user behavior",
    )

    # Recommendation context
    context: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        comment="Additional context data (target URL, feature flags, etc.)",
    )
    rec_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True, comment="Metadata about how recommendation was generated"
    )

    # Tracking and status
    status: Mapped[str] = mapped_column(
        String(20),
        default=RecommendationStatus.ACTIVE,
        index=True,
        nullable=False,
        comment="Current recommendation status",
    )
    impressions: Mapped[int] = mapped_column(
        Integer, default=0, comment="Number of times recommendation was shown"
    )
    clicks: Mapped[int] = mapped_column(
        Integer, default=0, comment="Number of clicks on recommendation"
    )

    # Timing
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
        comment="When recommendation was generated",
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True, index=True, comment="When recommendation expires"
    )
    shown_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True, comment="When recommendation was first shown to user"
    )
    clicked_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True, comment="When user clicked on recommendation"
    )
    dismissed_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True, comment="When user dismissed recommendation"
    )

    # ML model information
    model_version: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Version of ML model that generated recommendation",
    )
    algorithm: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Algorithm used: collaborative_filtering, content_based, hybrid",
    )

    # Relationships
    user: Mapped["User"] = relationship("User", lazy="selectin")

    feedback_entries: Mapped[List["RecommendationFeedback"]] = relationship(
        "RecommendationFeedback",
        back_populates="recommendation",
        cascade="all, delete-orphan",
        lazy="select",
    )

    # Database indexes for performance
    __table_args__ = (
        # Query optimization indexes
        Index("idx_recommendations_user_status", "user_id", "status"),
        Index("idx_recommendations_user_type_status", "user_id", "type", "status"),
        Index(
            "idx_recommendations_priority_confidence",
            "priority_score",
            "confidence_score",
        ),
        Index("idx_recommendations_created_expires", "created_at", "expires_at"),
        Index("idx_recommendations_performance", "type", "status", "created_at"),
        # Unique constraint to prevent duplicate recommendations
        UniqueConstraint(
            "user_id", "type", "recommendation_id", name="uq_user_type_recommendation"
        ),
        # JSONB indexing for context and metadata (PostgreSQL specific) - temporarily disabled
        # Index("idx_recommendations_context_gin", "context", postgresql_using="gin"),
        # Index(
        #     "idx_recommendations_metadata_gin", "rec_metadata", postgresql_using="gin"
        # ),
    )

    def __repr__(self) -> str:
        """String representation of recommendation."""
        return (
            f"<Recommendation(id={self.recommendation_id}, "
            f"user_id={self.user_id}, type='{self.type}', "
            f"confidence={self.confidence_score:.2f})>"
        )

    @property
    def is_active(self) -> bool:
        """Check if recommendation is currently active."""
        if self.status != RecommendationStatus.ACTIVE:
            return False
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return False
        return True

    @property
    def click_through_rate(self) -> float:
        """Calculate click-through rate."""
        if self.impressions == 0:
            return 0.0
        return self.clicks / self.impressions

    @property
    def days_since_created(self) -> int:
        """Days since recommendation was created."""
        return (datetime.utcnow() - self.created_at).days


class UserPreferences(Base):
    """User preferences and behavior patterns for personalized recommendations."""

    __tablename__ = "user_preferences"

    # User association
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
        comment="User for these preferences",
    )

    # Preference categories
    feature_interests: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True, comment="Interest scores for different features (0.0-1.0)"
    )
    content_preferences: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True, comment="Content type preferences and engagement patterns"
    )
    ui_preferences: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True, comment="UI/UX preferences and customizations"
    )
    behavioral_patterns: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True, comment="Behavioral patterns and usage analytics"
    )

    # Engagement metrics
    avg_session_duration: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True, comment="Average session duration in minutes"
    )
    weekly_active_days: Mapped[int] = mapped_column(
        Integer, default=0, comment="Number of active days per week"
    )
    feature_adoption_rate: Mapped[float] = mapped_column(
        Float, default=0.0, comment="Rate of adopting new features (0.0-1.0)"
    )

    # Recommendation settings
    notification_preferences: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True, comment="How user wants to receive recommendations"
    )
    max_daily_recommendations: Mapped[int] = mapped_column(
        Integer, default=5, comment="Maximum recommendations per day"
    )

    # Timing
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        onupdate=lambda: datetime.utcnow(),
        nullable=False,
    )
    last_analyzed_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True, comment="When preferences were last analyzed from event data"
    )

    # Relationships
    user: Mapped["User"] = relationship("User", lazy="selectin")

    # Database indexes
    __table_args__ = (
        Index("idx_user_preferences_updated", "updated_at"),
        Index("idx_user_preferences_analyzed", "last_analyzed_at"),
        Index("idx_user_preferences_adoption", "feature_adoption_rate"),
        # JSONB indexing for preference data
        # Index(
        #     "idx_user_preferences_features_gin",
        #     "feature_interests",
        #     postgresql_using="gin",
        # ),  # Temporarily disabled
        # Index(
        #     "idx_user_preferences_content_gin",
        #     "content_preferences",
        #     postgresql_using="gin",
        # ),  # Temporarily disabled
        # Index(
        #     "idx_user_preferences_behavior_gin",
        #     "behavioral_patterns",
        #     postgresql_using="gin",
        # ),  # Temporarily disabled
    )


class RecommendationFeedback(Base):
    """User feedback on recommendations for model improvement."""

    __tablename__ = "recommendation_feedback"

    # Recommendation association
    recommendation_id: Mapped[str] = mapped_column(
        ForeignKey("recommendations.recommendation_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        comment="Recommendation this feedback is for",
    )

    # User association
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        comment="User providing feedback",
    )

    # Feedback details
    rating: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, comment="Explicit rating (1-5 stars, null if implicit)"
    )
    feedback_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="Type of feedback: explicit, implicit, positive, negative",
    )
    action_taken: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="User action: clicked, dismissed, ignored, converted",
    )

    # Feedback context
    feedback_text: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="Optional text feedback from user"
    )
    context: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True, comment="Context when feedback was provided"
    )

    # Timing
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
        comment="When feedback was provided",
    )

    # Relationships
    recommendation: Mapped["Recommendation"] = relationship(
        "Recommendation", back_populates="feedback_entries", lazy="selectin"
    )
    user: Mapped["User"] = relationship("User", lazy="selectin")

    # Database indexes
    __table_args__ = (
        Index("idx_recommendation_feedback_rec_user", "recommendation_id", "user_id"),
        Index(
            "idx_recommendation_feedback_type_action", "feedback_type", "action_taken"
        ),
        Index("idx_recommendation_feedback_rating", "rating"),
        Index("idx_recommendation_feedback_created", "created_at"),
        # Unique constraint to prevent duplicate feedback
        UniqueConstraint(
            "recommendation_id", "user_id", name="uq_recommendation_user_feedback"
        ),
        # JSONB indexing for context - temporarily disabled
        # Index(
        #     "idx_recommendation_feedback_context_gin", "context", postgresql_using="gin"
        # ),
    )


class SimilarUsers(Base):
    """Precomputed similar users for collaborative filtering."""

    __tablename__ = "similar_users"

    # User associations
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        comment="Primary user",
    )
    similar_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        comment="Similar user",
    )

    # Similarity metrics
    similarity_score: Mapped[float] = mapped_column(
        Float, nullable=False, index=True, comment="Similarity score (0.0-1.0)"
    )
    algorithm: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="Algorithm used to compute similarity"
    )

    # Similarity dimensions
    behavioral_similarity: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True, comment="Behavioral pattern similarity score"
    )
    preference_similarity: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True, comment="Preference similarity score"
    )
    demographic_similarity: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True, comment="Demographic similarity score (if available)"
    )

    # Metadata
    common_features: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True, comment="Features both users have used"
    )

    # Timing
    computed_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
        comment="When similarity was computed",
    )
    expires_at: Mapped[datetime] = mapped_column(
        nullable=False, comment="When similarity computation expires"
    )

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], lazy="selectin")
    similar_user: Mapped["User"] = relationship(
        "User", foreign_keys=[similar_user_id], lazy="selectin"
    )

    # Database indexes
    __table_args__ = (
        # Primary lookup indexes
        Index("idx_similar_users_user_score", "user_id", "similarity_score"),
        Index("idx_similar_users_similarity_expires", "similar_user_id", "expires_at"),
        # Performance indexes
        Index("idx_similar_users_score_computed", "similarity_score", "computed_at"),
        Index("idx_similar_users_algorithm", "algorithm"),
        Index("idx_similar_users_expires", "expires_at"),
        # Ensure no duplicate pairs
        UniqueConstraint("user_id", "similar_user_id", name="uq_user_similar_pair"),
        # JSONB indexing for common features - temporarily disabled
        # Index(
        #     "idx_similar_users_features_gin", "common_features", postgresql_using="gin"
        # ),
    )
