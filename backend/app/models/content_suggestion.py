"""Content suggestions models for AI-powered content analysis and recommendations."""
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from uuid import uuid4

from sqlalchemy import (
    JSON, Index, Float, String, Text, Boolean, Integer, 
    ForeignKey, UniqueConstraint, text, Enum as SQLEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.db.base_class import Base

if TYPE_CHECKING:
    from .user import User


class ContentType(str, enum.Enum):
    """Content type enumeration."""
    ARTICLE = "article"
    BLOG_POST = "blog_post"
    TUTORIAL = "tutorial"
    DOCUMENTATION = "documentation"
    VIDEO = "video"
    COURSE = "course"
    TOOL = "tool"
    RESOURCE = "resource"
    NEWS = "news"
    ANNOUNCEMENT = "announcement"


class ContentCategory(str, enum.Enum):
    """Content category enumeration."""
    TECHNICAL = "technical"
    BUSINESS = "business"
    EDUCATIONAL = "educational"
    ENTERTAINMENT = "entertainment"
    NEWS = "news"
    PRODUCTIVITY = "productivity"
    HEALTH = "health"
    FINANCE = "finance"
    LIFESTYLE = "lifestyle"
    MARKETING = "marketing"


class SuggestionType(str, enum.Enum):
    """Content suggestion type enumeration."""
    CONTENT_DISCOVERY = "content_discovery"
    NEXT_BEST_ACTION = "next_best_action"
    FEATURE_RECOMMENDATION = "feature_recommendation"
    CONTENT_OPTIMIZATION = "content_optimization"
    SEO_IMPROVEMENT = "seo_improvement"
    ENGAGEMENT_BOOSTER = "engagement_booster"
    TRENDING_CONTENT = "trending_content"
    PERSONALIZED_FEED = "personalized_feed"


class ContentSuggestionStatus(str, enum.Enum):
    """Content suggestion status enumeration."""
    PENDING = "pending"
    ACTIVE = "active"
    SHOWN = "shown"
    CLICKED = "clicked"
    DISMISSED = "dismissed"
    EXPIRED = "expired"
    ARCHIVED = "archived"


class ContentItem(Base):
    """Content item model for tracking all content in the system."""
    
    __tablename__ = "content_items"

    # Content identification
    content_id: Mapped[str] = mapped_column(
        String(36),
        default=lambda: str(uuid4()),
        unique=True,
        index=True,
        nullable=False,
        comment="Unique content identifier"
    )
    
    # Content details
    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        index=True,
        comment="Content title"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Content description or summary"
    )
    content_type: Mapped[ContentType] = mapped_column(
        SQLEnum(ContentType),
        nullable=False,
        index=True,
        comment="Type of content"
    )
    category: Mapped[ContentCategory] = mapped_column(
        SQLEnum(ContentCategory),
        nullable=False,
        index=True,
        comment="Content category"
    )
    
    # Content metadata
    url: Mapped[Optional[str]] = mapped_column(
        String(2048),
        nullable=True,
        comment="Content URL if available"
    )
    author: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
        comment="Content author"
    )
    source: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
        comment="Content source or platform"
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        comment="When content was originally published"
    )
    
    # AI Analysis results
    quality_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        index=True,
        comment="AI-computed quality score (0.0-1.0)"
    )
    relevance_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        index=True,
        comment="Relevance score based on user interests"
    )
    engagement_prediction: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Predicted engagement score"
    )
    sentiment_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Content sentiment analysis (-1.0 to 1.0)"
    )
    
    # Content analysis metadata
    topics: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Extracted topics and keywords"
    )
    ai_analysis: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Complete AI analysis results"
    )
    optimization_suggestions: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="AI-generated optimization suggestions"
    )
    
    # Engagement metrics
    view_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Number of views"
    )
    click_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Number of clicks"
    )
    share_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Number of shares"
    )
    engagement_rate: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        comment="Overall engagement rate"
    )
    
    # Status and timing
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
        comment="Whether content is active"
    )
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
        comment="When content was added to system"
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        onupdate=lambda: datetime.utcnow(),
        nullable=False,
        comment="When content was last updated"
    )
    analyzed_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        comment="When content was last analyzed by AI"
    )

    # Relationships
    suggestions: Mapped[List["ContentSuggestion"]] = relationship(
        "ContentSuggestion",
        back_populates="content_item",
        cascade="all, delete-orphan",
        lazy="select"
    )

    # Database indexes
    __table_args__ = (
        # Query optimization indexes
        Index('idx_content_items_type_category', 'content_type', 'category'),
        Index('idx_content_items_quality_relevance', 'quality_score', 'relevance_score'),
        Index('idx_content_items_engagement', 'engagement_rate', 'view_count'),
        Index('idx_content_items_active_created', 'is_active', 'created_at'),
        Index('idx_content_items_published', 'published_at'),
        
        # Performance indexes
        Index('idx_content_items_search', 'title', 'description', postgresql_using='gin'),
        Index('idx_content_items_topics_gin', 'topics', postgresql_using='gin'),
        Index('idx_content_items_analysis_gin', 'ai_analysis', postgresql_using='gin'),
    )

    def __repr__(self) -> str:
        """String representation of content item."""
        return (
            f"<ContentItem(id={self.content_id}, "
            f"title='{self.title[:50]}...', type='{self.content_type}')>"
        )


class ContentSuggestion(Base):
    """AI-powered content suggestions for users."""
    
    __tablename__ = "content_suggestions"

    # Suggestion identification
    suggestion_id: Mapped[str] = mapped_column(
        String(36),
        default=lambda: str(uuid4()),
        unique=True,
        index=True,
        nullable=False,
        comment="Unique suggestion identifier"
    )
    
    # User and content associations
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        comment="User receiving the suggestion"
    )
    content_id: Mapped[str] = mapped_column(
        ForeignKey("content_items.content_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        comment="Suggested content item"
    )
    
    # Suggestion details
    suggestion_type: Mapped[SuggestionType] = mapped_column(
        SQLEnum(SuggestionType),
        nullable=False,
        index=True,
        comment="Type of suggestion"
    )
    title: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
        comment="Suggestion title/headline"
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Suggestion description and reasoning"
    )
    call_to_action: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Call to action text"
    )
    
    # AI scoring and reasoning
    confidence_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        index=True,
        comment="AI confidence in suggestion (0.0-1.0)"
    )
    relevance_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        index=True,
        comment="Relevance to user's interests (0.0-1.0)"
    )
    priority_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        index=True,
        comment="Business priority score for ranking"
    )
    personalization_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="How personalized this suggestion is"
    )
    
    # Suggestion context and metadata
    context: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Context when suggestion was generated"
    )
    ai_reasoning: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="AI reasoning for this suggestion"
    )
    personalization_factors: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Factors that influenced personalization"
    )
    
    # Tracking and engagement
    status: Mapped[ContentSuggestionStatus] = mapped_column(
        SQLEnum(ContentSuggestionStatus),
        default=ContentSuggestionStatus.ACTIVE,
        index=True,
        nullable=False,
        comment="Current suggestion status"
    )
    impression_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Number of times shown to user"
    )
    click_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Number of clicks by user"
    )
    
    # ML model information
    model_version: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Version of AI model that generated suggestion"
    )
    algorithm: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Algorithm used for suggestion generation"
    )
    
    # Timing
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
        comment="When suggestion was generated"
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        index=True,
        comment="When suggestion expires"
    )
    first_shown_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        comment="When suggestion was first shown"
    )
    last_shown_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        comment="When suggestion was last shown"
    )
    clicked_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        comment="When user clicked suggestion"
    )
    dismissed_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        comment="When user dismissed suggestion"
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        lazy="selectin"
    )
    content_item: Mapped["ContentItem"] = relationship(
        "ContentItem",
        back_populates="suggestions",
        lazy="selectin"
    )
    feedback_entries: Mapped[List["ContentSuggestionFeedback"]] = relationship(
        "ContentSuggestionFeedback",
        back_populates="suggestion",
        cascade="all, delete-orphan",
        lazy="select"
    )

    # Database indexes
    __table_args__ = (
        # Query optimization indexes
        Index('idx_content_suggestions_user_status', 'user_id', 'status'),
        Index('idx_content_suggestions_user_type_status', 'user_id', 'suggestion_type', 'status'),
        Index('idx_content_suggestions_scores', 'confidence_score', 'relevance_score', 'priority_score'),
        Index('idx_content_suggestions_timing', 'created_at', 'expires_at'),
        Index('idx_content_suggestions_engagement', 'impression_count', 'click_count'),
        
        # Performance indexes
        Index('idx_content_suggestions_content_user', 'content_id', 'user_id'),
        Index('idx_content_suggestions_model', 'model_version', 'algorithm'),
        
        # Prevent duplicate suggestions
        UniqueConstraint('user_id', 'content_id', 'suggestion_type', name='uq_user_content_suggestion_type'),
        
        # JSONB indexing
        Index('idx_content_suggestions_context_gin', 'context', postgresql_using='gin'),
        Index('idx_content_suggestions_reasoning_gin', 'ai_reasoning', postgresql_using='gin'),
        Index('idx_content_suggestions_factors_gin', 'personalization_factors', postgresql_using='gin'),
    )

    def __repr__(self) -> str:
        """String representation of content suggestion."""
        return (
            f"<ContentSuggestion(id={self.suggestion_id}, "
            f"user_id={self.user_id}, type='{self.suggestion_type}', "
            f"confidence={self.confidence_score:.2f})>"
        )
    
    @property
    def is_active(self) -> bool:
        """Check if suggestion is currently active."""
        if self.status not in [ContentSuggestionStatus.ACTIVE, ContentSuggestionStatus.SHOWN]:
            return False
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return False
        return True
    
    @property
    def click_through_rate(self) -> float:
        """Calculate click-through rate."""
        if self.impression_count == 0:
            return 0.0
        return self.click_count / self.impression_count
    
    @property
    def engagement_score(self) -> float:
        """Calculate overall engagement score."""
        # Weighted combination of CTR and impression frequency
        ctr = self.click_through_rate
        impression_factor = min(self.impression_count / 10.0, 1.0)  # Normalize to 0-1
        return (ctr * 0.7) + (impression_factor * 0.3)


class ContentSuggestionFeedback(Base):
    """User feedback on content suggestions for model improvement."""
    
    __tablename__ = "content_suggestion_feedback"

    # Suggestion association
    suggestion_id: Mapped[str] = mapped_column(
        ForeignKey("content_suggestions.suggestion_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        comment="Suggestion this feedback is for"
    )
    
    # User association
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        comment="User providing feedback"
    )
    
    # Feedback details
    rating: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Explicit rating (1-5 stars, null if implicit)"
    )
    feedback_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="Type of feedback: explicit, implicit, positive, negative"
    )
    action_taken: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="User action: clicked, dismissed, ignored, converted, shared"
    )
    
    # Feedback context
    feedback_text: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Optional text feedback from user"
    )
    context: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Context when feedback was provided"
    )
    session_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="User session data at time of feedback"
    )
    
    # Timing
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
        comment="When feedback was provided"
    )

    # Relationships
    suggestion: Mapped["ContentSuggestion"] = relationship(
        "ContentSuggestion",
        back_populates="feedback_entries",
        lazy="selectin"
    )
    user: Mapped["User"] = relationship(
        "User",
        lazy="selectin"
    )

    # Database indexes
    __table_args__ = (
        Index('idx_content_feedback_suggestion_user', 'suggestion_id', 'user_id'),
        Index('idx_content_feedback_type_action', 'feedback_type', 'action_taken'),
        Index('idx_content_feedback_rating', 'rating'),
        Index('idx_content_feedback_created', 'created_at'),
        
        # Unique constraint to prevent duplicate feedback
        UniqueConstraint('suggestion_id', 'user_id', name='uq_content_suggestion_user_feedback'),
        
        # JSONB indexing
        Index('idx_content_feedback_context_gin', 'context', postgresql_using='gin'),
        Index('idx_content_feedback_session_gin', 'session_data', postgresql_using='gin'),
    )


class ContentAnalysisJob(Base):
    """Background content analysis job tracking."""
    
    __tablename__ = "content_analysis_jobs"

    # Job identification
    job_id: Mapped[str] = mapped_column(
        String(36),
        default=lambda: str(uuid4()),
        unique=True,
        index=True,
        nullable=False,
        comment="Unique job identifier"
    )
    
    # Content and processing info
    content_id: Mapped[str] = mapped_column(
        ForeignKey("content_items.content_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        comment="Content being analyzed"
    )
    job_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Type of analysis: full_analysis, topic_extraction, sentiment, optimization"
    )
    
    # Job status and results
    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        index=True,
        nullable=False,
        comment="Job status: pending, running, completed, failed"
    )
    progress: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        comment="Job progress (0.0-1.0)"
    )
    
    # Analysis results
    results: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Analysis results"
    )
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Error message if job failed"
    )
    
    # Processing metadata
    ai_model_used: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="AI model used for analysis"
    )
    processing_time_seconds: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Time taken for processing"
    )
    tokens_used: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Number of tokens consumed"
    )
    cost_usd: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Cost of analysis in USD"
    )
    
    # Timing
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
        comment="When job was created"
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        comment="When job started processing"
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        comment="When job completed"
    )

    # Relationships
    content_item: Mapped["ContentItem"] = relationship(
        "ContentItem",
        lazy="selectin"
    )

    # Database indexes
    __table_args__ = (
        Index('idx_content_analysis_jobs_status', 'status'),
        Index('idx_content_analysis_jobs_content_type', 'content_id', 'job_type'),
        Index('idx_content_analysis_jobs_created', 'created_at'),
        Index('idx_content_analysis_jobs_processing_time', 'processing_time_seconds'),
        Index('idx_content_analysis_jobs_cost', 'cost_usd'),
        
        # JSONB indexing
        Index('idx_content_analysis_jobs_results_gin', 'results', postgresql_using='gin'),
    )

    def __repr__(self) -> str:
        """String representation of analysis job."""
        return (
            f"<ContentAnalysisJob(id={self.job_id}, "
            f"content_id={self.content_id}, type='{self.job_type}', "
            f"status='{self.status}')>"
        )