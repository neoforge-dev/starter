"""Conversion funnel models for analytics and UX optimization."""
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from uuid import UUID, uuid4

from app.db.base_class import Base
from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .event import Event
    from .user import User


class ConversionFunnel(Base):
    """Conversion funnel configuration model for multi-step analytics.

    Defines the structure of a conversion funnel with multiple steps and
    provides metadata for analytics calculations and optimization.
    """

    __tablename__ = "conversion_funnels"

    # Funnel identification
    name: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
        comment="Human-readable funnel name for identification",
    )
    slug: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
        comment="URL-friendly identifier for the funnel",
    )

    # Funnel metadata
    description: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="Detailed description of the funnel purpose and goals",
    )
    category: Mapped[str] = mapped_column(
        String(50),
        default="general",
        index=True,
        comment="Funnel category: acquisition, activation, retention, revenue",
    )

    # Configuration
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
        comment="Whether funnel is currently active for tracking",
    )
    track_anonymous_users: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        comment="Whether to include anonymous users in funnel analysis",
    )

    # Time-based settings
    funnel_window_hours: Mapped[int] = mapped_column(
        Integer,
        default=24,
        comment="Maximum time window (hours) for completing the entire funnel",
    )
    step_timeout_minutes: Mapped[int] = mapped_column(
        Integer,
        default=60,
        comment="Maximum time between steps before considering funnel abandoned",
    )

    # Analytics settings
    minimum_sample_size: Mapped[int] = mapped_column(
        Integer,
        default=100,
        comment="Minimum events needed before analytics are considered statistically significant",
    )
    confidence_level: Mapped[float] = mapped_column(
        Float,
        default=0.95,
        comment="Confidence level for statistical analysis (0.0-1.0)",
    )

    # Metadata
    created_by_user_id: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, comment="User who created this funnel configuration"
    )

    # Additional configuration as JSON
    config: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True, comment="Additional funnel configuration options as JSON"
    )

    # Relationships
    steps: Mapped[List["FunnelStep"]] = relationship(
        "FunnelStep",
        back_populates="funnel",
        cascade="all, delete-orphan",
        order_by="FunnelStep.step_order",
    )

    # Database indexes for query optimization
    __table_args__ = (
        Index("idx_funnels_active_category", "is_active", "category"),
        Index("idx_funnels_created_by", "created_by_user_id", "created_at"),
        # Index("idx_funnels_config_gin", "config", postgresql_using="gin"),  # Temporarily disabled
    )

    def __repr__(self) -> str:
        """String representation of funnel."""
        return (
            f"<ConversionFunnel(id={self.id}, name='{self.name}', "
            f"slug='{self.slug}', active={self.is_active})>"
        )

    @property
    def step_count(self) -> int:
        """Get the number of steps in this funnel."""
        return len(self.steps) if self.steps else 0

    @property
    def is_multi_step(self) -> bool:
        """Check if this funnel has multiple steps."""
        return self.step_count > 1

    def get_step_by_order(self, order: int) -> Optional["FunnelStep"]:
        """Get funnel step by order number."""
        if not self.steps:
            return None
        return next((step for step in self.steps if step.step_order == order), None)

    def get_ordered_steps(self) -> List["FunnelStep"]:
        """Get funnel steps in order."""
        if not self.steps:
            return []
        return sorted(self.steps, key=lambda x: x.step_order)


class FunnelStep(Base):
    """Individual step within a conversion funnel.

    Each step defines the criteria for progression through the funnel
    and includes configuration for event matching and analytics.
    """

    __tablename__ = "funnel_steps"

    # Step identification
    name: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="Human-readable step name"
    )
    step_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Order of this step in the funnel (starting from 1)",
    )

    # Funnel relationship
    funnel_id: Mapped[int] = mapped_column(
        ForeignKey("conversion_funnels.id", ondelete="CASCADE"),
        nullable=False,
        comment="Reference to parent funnel",
    )

    # Event matching criteria
    event_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        comment="Event type that triggers this step (from Event.event_type)",
    )
    event_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True,
        comment="Specific event name to match (optional for broader matching)",
    )

    # Advanced matching criteria
    page_url_pattern: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="URL pattern to match (supports wildcards and regex)",
    )
    required_properties: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True, comment="Required event properties for step completion"
    )
    property_filters: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True, comment="Advanced property filters (ranges, lists, etc.)"
    )

    # Step configuration
    is_optional: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="Whether this step is optional in the funnel progression",
    )
    can_repeat: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="Whether users can complete this step multiple times",
    )

    # Goal and value tracking
    goal_value: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Target value for this step (revenue, engagement score, etc.)",
    )
    weight: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        comment="Relative importance weight of this step in funnel analysis",
    )

    # Time constraints
    min_time_from_previous_seconds: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Minimum time required since previous step (prevents bot behavior)",
    )
    max_time_from_previous_seconds: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, comment="Maximum time allowed since previous step"
    )

    # Analytics metadata
    description: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="Detailed description of what this step measures",
    )
    success_message: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True, comment="Message displayed when step is completed"
    )

    # Relationships
    funnel: Mapped["ConversionFunnel"] = relationship(
        "ConversionFunnel", back_populates="steps"
    )

    # Database indexes for query optimization
    __table_args__ = (
        Index("idx_funnel_steps_funnel_order", "funnel_id", "step_order"),
        Index("idx_funnel_steps_event_matching", "event_type", "event_name"),
        # Index(
        #     "idx_funnel_steps_properties_gin",
        #     "required_properties",
        #     postgresql_using="gin",
        # ),
        # Index(
        #     "idx_funnel_steps_filters_gin", "property_filters", postgresql_using="gin"
        # ),
        # Unique constraint to prevent duplicate step orders within a funnel
        Index("idx_funnel_steps_unique_order", "funnel_id", "step_order", unique=True),
    )

    def __repr__(self) -> str:
        """String representation of funnel step."""
        return (
            f"<FunnelStep(id={self.id}, name='{self.name}', "
            f"funnel_id={self.funnel_id}, order={self.step_order})>"
        )

    @property
    def is_first_step(self) -> bool:
        """Check if this is the first step in the funnel."""
        return self.step_order == 1

    @property
    def is_final_step(self) -> bool:
        """Check if this is the final step in the funnel."""
        if not self.funnel or not self.funnel.steps:
            return False
        max_order = max(step.step_order for step in self.funnel.steps)
        return self.step_order == max_order

    def matches_event(self, event: "Event") -> bool:
        """Check if an event matches this funnel step criteria."""
        # Basic event type matching
        if event.event_type != self.event_type:
            return False

        # Event name matching (if specified)
        if self.event_name and event.event_name != self.event_name:
            return False

        # URL pattern matching (if specified)
        if self.page_url_pattern and event.page_url:
            import re

            if not re.match(self.page_url_pattern, event.page_url):
                return False

        # Required properties matching
        if self.required_properties and event.properties:
            for key, expected_value in self.required_properties.items():
                if key not in event.properties:
                    return False
                if event.properties[key] != expected_value:
                    return False

        # Property filters (advanced matching)
        if self.property_filters and event.properties:
            if not self._evaluate_property_filters(event.properties):
                return False

        return True

    def _evaluate_property_filters(self, event_properties: Dict[str, Any]) -> bool:
        """Evaluate advanced property filters against event properties."""
        if not self.property_filters:
            return True

        for filter_key, filter_config in self.property_filters.items():
            if filter_key not in event_properties:
                return False

            event_value = event_properties[filter_key]

            # Handle different filter types
            if isinstance(filter_config, dict):
                # Range filter
                if "min" in filter_config and event_value < filter_config["min"]:
                    return False
                if "max" in filter_config and event_value > filter_config["max"]:
                    return False

                # List filter
                if "in" in filter_config and event_value not in filter_config["in"]:
                    return False

                # Regex filter
                if "regex" in filter_config:
                    import re

                    if not re.match(filter_config["regex"], str(event_value)):
                        return False
            else:
                # Direct value comparison
                if event_value != filter_config:
                    return False

        return True


class FunnelUserJourney(Base):
    """Track individual user journeys through conversion funnels.

    This model stores the progression of users through funnel steps,
    enabling detailed journey analysis and drop-off point identification.
    """

    __tablename__ = "funnel_user_journeys"

    # Journey identification
    journey_id: Mapped[str] = mapped_column(
        String(36),
        default=lambda: str(uuid4()),
        unique=True,
        index=True,
        comment="Unique identifier for this user journey",
    )

    # Funnel and user association
    funnel_id: Mapped[int] = mapped_column(
        ForeignKey("conversion_funnels.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Reference to the funnel",
    )
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, index=True, comment="User ID (null for anonymous users)"
    )
    session_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        index=True,
        comment="Session identifier for anonymous user tracking",
    )

    # Journey status
    current_step: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Current step number in the funnel (0 = not started)",
    )
    completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        index=True,
        comment="Whether the user completed the entire funnel",
    )
    abandoned: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        index=True,
        comment="Whether the user abandoned the funnel",
    )

    # Timing information
    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
        comment="When the user started the funnel",
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        index=True,
        comment="When the user completed the funnel",
    )
    abandoned_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        index=True,
        comment="When the user abandoned the funnel",
    )
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
        comment="Last time the user progressed in the funnel",
    )

    # Journey metadata
    total_steps_completed: Mapped[int] = mapped_column(
        Integer, default=0, comment="Total number of steps completed by the user"
    )
    total_value: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True, comment="Total value generated through this journey"
    )
    source: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True,
        comment="Source of the journey (web, mobile, etc.)",
    )

    # Additional journey data
    journey_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True, comment="Additional journey-specific data and context"
    )

    # Relationships
    funnel: Mapped["ConversionFunnel"] = relationship(
        "ConversionFunnel", lazy="selectin"
    )

    # Database indexes for query optimization
    __table_args__ = (
        Index("idx_journeys_funnel_status", "funnel_id", "completed", "abandoned"),
        Index("idx_journeys_user_funnel", "user_id", "funnel_id", "started_at"),
        Index("idx_journeys_session_funnel", "session_id", "funnel_id", "started_at"),
        Index("idx_journeys_timing", "started_at", "completed_at", "abandoned_at"),
        Index("idx_journeys_current_step", "funnel_id", "current_step"),
        # Index("idx_journeys_data_gin", "journey_data", postgresql_using="gin"),  # Temporarily disabled
    )

    def __repr__(self) -> str:
        """String representation of user journey."""
        return (
            f"<FunnelUserJourney(id={self.id}, journey_id='{self.journey_id}', "
            f"funnel_id={self.funnel_id}, current_step={self.current_step})>"
        )

    @property
    def duration_minutes(self) -> Optional[float]:
        """Calculate journey duration in minutes."""
        if not self.completed_at and not self.abandoned_at:
            return None

        end_time = self.completed_at or self.abandoned_at or datetime.utcnow()
        duration = end_time - self.started_at
        return duration.total_seconds() / 60

    @property
    def conversion_rate(self) -> float:
        """Calculate individual conversion rate (percentage of funnel completed)."""
        if not self.funnel or not self.funnel.steps:
            return 0.0

        total_steps = len(self.funnel.steps)
        return (self.total_steps_completed / total_steps) * 100

    @property
    def is_in_progress(self) -> bool:
        """Check if journey is currently in progress."""
        return not self.completed and not self.abandoned

    def advance_to_step(self, step_number: int, value: Optional[float] = None) -> None:
        """Advance the journey to a specific step."""
        if step_number > self.current_step:
            self.current_step = step_number
            self.total_steps_completed = max(self.total_steps_completed, step_number)

            if value:
                self.total_value = (self.total_value or 0) + value

            self.last_activity_at = datetime.utcnow()

            # Check if this completes the funnel
            if self.funnel and step_number >= len(self.funnel.steps):
                self.complete_journey()

    def complete_journey(self) -> None:
        """Mark the journey as completed."""
        self.completed = True
        self.completed_at = datetime.utcnow()
        self.last_activity_at = self.completed_at

    def abandon_journey(self) -> None:
        """Mark the journey as abandoned."""
        self.abandoned = True
        self.abandoned_at = datetime.utcnow()
        self.last_activity_at = self.abandoned_at
