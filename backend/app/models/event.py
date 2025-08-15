"""Event tracking model for analytics and UX optimization."""
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from .user import User


class Event(Base):
    """Event tracking model for comprehensive user analytics.
    
    Supports various event types including user interactions, performance metrics,
    business events, and custom events with flexible JSONB properties.
    
    Privacy-compliant design with optional user association and data retention policies.
    """

    __tablename__ = "events"

    # Event identification
    event_id: Mapped[str] = mapped_column(
        String, 
        default=lambda: str(uuid4()), 
        unique=True, 
        index=True,
        comment="Unique event identifier for deduplication"
    )
    
    # Event classification
    event_type: Mapped[str] = mapped_column(
        String(50), 
        index=True, 
        nullable=False,
        comment="Event category: interaction, performance, business, error, custom"
    )
    event_name: Mapped[str] = mapped_column(
        String(100), 
        index=True, 
        nullable=False,
        comment="Specific event name: page_view, button_click, api_response_time, conversion"
    )
    
    # User association (optional for privacy)
    user_id: Mapped[Optional[int]] = mapped_column(
        nullable=True, 
        index=True,
        comment="Optional user association - can be null for anonymous events"
    )
    session_id: Mapped[Optional[str]] = mapped_column(
        String(64), 
        nullable=True, 
        index=True,
        comment="Session identifier for user journey tracking"
    )
    
    # Event context
    source: Mapped[str] = mapped_column(
        String(50), 
        default="web", 
        index=True,
        comment="Event source: web, mobile, api, system"
    )
    page_url: Mapped[Optional[str]] = mapped_column(
        String(500), 
        nullable=True,
        comment="Page URL where event occurred (for web events)"
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        String(500), 
        nullable=True,
        comment="User agent string (truncated for storage efficiency)"
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45), 
        nullable=True,
        comment="IP address (IPv4/IPv6) for geo-analytics and fraud detection"
    )
    
    # Event data and metrics
    properties: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, 
        nullable=True,
        comment="Flexible JSONB field for event-specific properties and metrics"
    )
    value: Mapped[Optional[float]] = mapped_column(
        nullable=True,
        comment="Numeric value for performance metrics, conversion values, etc."
    )
    
    # Timing
    timestamp: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        server_default=text("CURRENT_TIMESTAMP"),
        index=True,
        nullable=False,
        comment="Event occurrence timestamp (UTC)"
    )
    
    # Privacy and data management
    anonymized: Mapped[bool] = mapped_column(
        default=False,
        index=True,
        comment="Flag indicating if event has been anonymized for privacy compliance"
    )
    retention_date: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        index=True,
        comment="Date when event should be deleted for data retention compliance"
    )

    # Relationship to user (optional)
    user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="events",
        lazy="selectin",
    )

    # Database indexes for query optimization
    __table_args__ = (
        # Composite indexes for common query patterns
        Index('idx_events_type_timestamp', 'event_type', 'timestamp'),
        Index('idx_events_name_timestamp', 'event_name', 'timestamp'),
        Index('idx_events_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_events_session_timestamp', 'session_id', 'timestamp'),
        Index('idx_events_source_timestamp', 'source', 'timestamp'),
        
        # Analytics query optimization
        Index('idx_events_analytics', 'event_type', 'event_name', 'timestamp', 'user_id'),
        Index('idx_events_performance', 'event_type', 'value', 'timestamp'),
        
        # Privacy and data management
        Index('idx_events_retention', 'retention_date', 'anonymized'),
        
        # JSONB indexing for properties (PostgreSQL specific)
        Index('idx_events_properties_gin', 'properties', postgresql_using='gin'),
    )

    def __repr__(self) -> str:
        """String representation of event."""
        return (
            f"<Event(id={self.id}, event_type='{self.event_type}', "
            f"event_name='{self.event_name}', timestamp='{self.timestamp}')>"
        )

    @property
    def is_user_event(self) -> bool:
        """Check if event is associated with a specific user."""
        return self.user_id is not None

    @property
    def is_anonymous(self) -> bool:
        """Check if event is anonymous or anonymized."""
        return self.user_id is None or self.anonymized

    def anonymize(self) -> None:
        """Anonymize event by removing personally identifiable information."""
        self.user_id = None
        self.ip_address = None
        self.user_agent = None
        self.session_id = None
        self.anonymized = True
        
        # Remove PII from properties if present
        if self.properties:
            pii_fields = ['email', 'name', 'phone', 'address', 'user_id']
            for field in pii_fields:
                self.properties.pop(field, None)