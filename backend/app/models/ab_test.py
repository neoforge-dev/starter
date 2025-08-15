"""A/B Testing models for experiment management and statistical analysis."""
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, JSON, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from .user import User
    from .event import Event


class AbTest(Base):
    """A/B Test experiment model for managing conversion optimization tests.
    
    Supports multi-variant testing (A/B/C/D...) with traffic allocation,
    statistical significance tracking, and automated test lifecycle management.
    """

    __tablename__ = "ab_tests"

    # Test identification and metadata
    test_key: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
        comment="Unique test identifier for code integration"
    )
    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        comment="Human-readable test name"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Detailed test description and hypothesis"
    )
    
    # Test configuration
    status: Mapped[str] = mapped_column(
        String(20),
        default="draft",
        index=True,
        nullable=False,
        comment="Test status: draft, active, paused, completed, archived"
    )
    traffic_allocation: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        nullable=False,
        comment="Percentage of users to include in test (0.0-1.0)"
    )
    
    # Test lifecycle dates
    start_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="Test start date and time"
    )
    end_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="Test end date and time"
    )
    
    # Success metrics configuration
    primary_metric: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Primary conversion metric to optimize (event_name)"
    )
    secondary_metrics: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Additional metrics to track (event names and configurations)"
    )
    
    # Statistical configuration
    confidence_level: Mapped[float] = mapped_column(
        Float,
        default=0.95,
        nullable=False,
        comment="Required confidence level for statistical significance (0.8-0.99)"
    )
    minimum_detectable_effect: Mapped[float] = mapped_column(
        Float,
        default=0.05,
        nullable=False,
        comment="Minimum effect size to detect (5% = 0.05)"
    )
    minimum_sample_size: Mapped[int] = mapped_column(
        Integer,
        default=1000,
        nullable=False,
        comment="Minimum sample size per variant before considering results"
    )
    
    # Targeting and segmentation
    targeting_rules: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="User targeting rules (geography, attributes, segments)"
    )
    
    # Test results and statistics
    is_statistically_significant: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether test has reached statistical significance"
    )
    significance_reached_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="When statistical significance was first reached"
    )
    winner_variant_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("ab_test_variants.id"),
        nullable=True,
        comment="ID of winning variant (if test is concluded)"
    )
    
    # Metadata
    created_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        comment="User who created the test"
    )
    
    # Relationships
    variants: Mapped[List["AbTestVariant"]] = relationship(
        "AbTestVariant",
        back_populates="test",
        cascade="all, delete-orphan",
        lazy="selectin",
        foreign_keys="AbTestVariant.test_id"
    )
    
    assignments: Mapped[List["AbTestAssignment"]] = relationship(
        "AbTestAssignment",
        back_populates="test",
        cascade="all, delete-orphan",
        lazy="select"
    )
    
    creator: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="created_ab_tests",
        lazy="selectin"
    )
    
    winner_variant: Mapped[Optional["AbTestVariant"]] = relationship(
        "AbTestVariant",
        foreign_keys=[winner_variant_id],
        lazy="selectin",
        post_update=True
    )

    # Database indexes for query optimization
    __table_args__ = (
        Index('idx_ab_tests_status_dates', 'status', 'start_date', 'end_date'),
        Index('idx_ab_tests_active', 'status', 'start_date', 'end_date'),
        Index('idx_ab_tests_creator', 'created_by', 'created_at'),
        Index('idx_ab_tests_significance', 'is_statistically_significant', 'status'),
    )

    def __repr__(self) -> str:
        """String representation of A/B test."""
        return (
            f"<AbTest(id={self.id}, test_key='{self.test_key}', "
            f"status='{self.status}', variants={len(self.variants)})>"
        )

    @property
    def is_active(self) -> bool:
        """Check if test is currently active."""
        if self.status != "active":
            return False
            
        now = datetime.utcnow()
        
        if self.start_date and now < self.start_date:
            return False
            
        if self.end_date and now > self.end_date:
            return False
            
        return True

    @property
    def total_assignments(self) -> int:
        """Get total number of user assignments."""
        return len(self.assignments)

    def get_variant_by_key(self, variant_key: str) -> Optional["AbTestVariant"]:
        """Get variant by its key."""
        for variant in self.variants:
            if variant.variant_key == variant_key:
                return variant
        return None


class AbTestVariant(Base):
    """A/B Test variant model for different test versions."""

    __tablename__ = "ab_test_variants"

    # Variant identification
    test_id: Mapped[int] = mapped_column(
        ForeignKey("ab_tests.id"),
        nullable=False,
        comment="Reference to parent A/B test"
    )
    variant_key: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Variant identifier (control, variant_a, variant_b, etc.)"
    )
    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        comment="Human-readable variant name"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Variant description and changes"
    )
    
    # Traffic allocation
    traffic_allocation: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Percentage of test traffic allocated to this variant (0.0-1.0)"
    )
    
    # Variant configuration
    is_control: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether this is the control/baseline variant"
    )
    
    # Variant content and settings
    configuration: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Variant-specific configuration and content"
    )
    
    # Performance metrics (calculated fields)
    total_users: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Total users assigned to this variant"
    )
    total_conversions: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Total conversions for primary metric"
    )
    conversion_rate: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        comment="Calculated conversion rate (conversions/users)"
    )
    
    # Statistical metrics
    confidence_interval_lower: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Lower bound of confidence interval"
    )
    confidence_interval_upper: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Upper bound of confidence interval"
    )
    p_value: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="P-value compared to control variant"
    )
    
    # Relationships
    test: Mapped["AbTest"] = relationship(
        "AbTest",
        back_populates="variants",
        lazy="selectin"
    )
    
    assignments: Mapped[List["AbTestAssignment"]] = relationship(
        "AbTestAssignment",
        back_populates="variant",
        cascade="all, delete-orphan",
        lazy="select"
    )

    # Database indexes
    __table_args__ = (
        Index('idx_ab_test_variants_test_key', 'test_id', 'variant_key'),
        Index('idx_ab_test_variants_performance', 'test_id', 'conversion_rate'),
        # Ensure unique variant keys within a test
        Index('uq_ab_test_variants_test_key', 'test_id', 'variant_key', unique=True),
    )

    def __repr__(self) -> str:
        """String representation of variant."""
        return (
            f"<AbTestVariant(id={self.id}, test_id={self.test_id}, "
            f"variant_key='{self.variant_key}', conversion_rate={self.conversion_rate:.3f})>"
        )

    @property
    def conversion_rate_percentage(self) -> float:
        """Get conversion rate as percentage."""
        return self.conversion_rate * 100

    def update_metrics(self, users: int, conversions: int) -> None:
        """Update variant metrics and calculate conversion rate."""
        self.total_users = users
        self.total_conversions = conversions
        self.conversion_rate = conversions / users if users > 0 else 0.0


class AbTestAssignment(Base):
    """User assignment to A/B test variants for consistent experience."""

    __tablename__ = "ab_test_assignments"

    # Assignment identification
    test_id: Mapped[int] = mapped_column(
        ForeignKey("ab_tests.id"),
        nullable=False,
        comment="Reference to A/B test"
    )
    variant_id: Mapped[int] = mapped_column(
        ForeignKey("ab_test_variants.id"),
        nullable=False,
        comment="Reference to assigned variant"
    )
    
    # User identification (supports both authenticated and anonymous users)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        comment="Authenticated user ID (if logged in)"
    )
    session_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        index=True,
        comment="Session ID for anonymous users"
    )
    user_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
        comment="Consistent hash for user assignment (based on ID or session)"
    )
    
    # Assignment metadata
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.utcnow(),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
        comment="When user was assigned to variant"
    )
    
    # Conversion tracking
    converted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether user converted on primary metric"
    )
    converted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="When conversion occurred"
    )
    conversion_value: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Monetary or numeric value of conversion"
    )
    
    # Additional tracking
    first_exposure_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="When user first saw the variant"
    )
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="Last time user interacted with test"
    )
    
    # Context and targeting
    context: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Assignment context (user agent, location, etc.)"
    )

    # Relationships
    test: Mapped["AbTest"] = relationship(
        "AbTest",
        back_populates="assignments",
        lazy="selectin"
    )
    
    variant: Mapped["AbTestVariant"] = relationship(
        "AbTestVariant",
        back_populates="assignments",
        lazy="selectin"
    )
    
    user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="ab_test_assignments",
        lazy="selectin"
    )

    # Database indexes for query optimization
    __table_args__ = (
        # Unique assignment per user per test
        Index('uq_ab_test_assignments_user', 'test_id', 'user_id', unique=True, 
              postgresql_where=text("user_id IS NOT NULL")),
        Index('uq_ab_test_assignments_session', 'test_id', 'session_id', unique=True,
              postgresql_where=text("session_id IS NOT NULL")),
        Index('uq_ab_test_assignments_hash', 'test_id', 'user_hash', unique=True),
        
        # Performance indexes
        Index('idx_ab_test_assignments_test_variant', 'test_id', 'variant_id'),
        Index('idx_ab_test_assignments_conversion', 'test_id', 'converted', 'converted_at'),
        Index('idx_ab_test_assignments_user_hash', 'user_hash', 'test_id'),
        Index('idx_ab_test_assignments_session', 'session_id', 'test_id'),
    )

    def __repr__(self) -> str:
        """String representation of assignment."""
        user_ref = f"user_id={self.user_id}" if self.user_id else f"session_id={self.session_id}"
        return (
            f"<AbTestAssignment(id={self.id}, test_id={self.test_id}, "
            f"variant_id={self.variant_id}, {user_ref}, converted={self.converted})>"
        )

    @property
    def is_anonymous(self) -> bool:
        """Check if assignment is for anonymous user."""
        return self.user_id is None

    def mark_conversion(self, value: Optional[float] = None) -> None:
        """Mark assignment as converted."""
        if not self.converted:
            self.converted = True
            self.converted_at = datetime.utcnow()
            if value is not None:
                self.conversion_value = value

    def update_exposure(self) -> None:
        """Update exposure tracking."""
        now = datetime.utcnow()
        if self.first_exposure_at is None:
            self.first_exposure_at = now
        self.last_seen_at = now