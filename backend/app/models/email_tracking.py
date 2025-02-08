"""Email tracking models."""
from datetime import datetime, UTC
from enum import Enum
from typing import Optional

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class EmailStatus(str, Enum):
    """Email status enumeration."""
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"
    FAILED = "failed"
    SPAM = "spam"


class EmailTracking(Base):
    """Email tracking model."""
    __tablename__ = "email_tracking"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(String, unique=True, index=True)  # ID from email queue
    recipient = Column(String, nullable=False, index=True)
    subject = Column(String, nullable=False)
    template_name = Column(String, nullable=False)
    status = Column(SQLEnum(EmailStatus), nullable=False, default=EmailStatus.QUEUED)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    opened_at = Column(DateTime(timezone=True), nullable=True)
    clicked_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(String, nullable=True)
    tracking_metadata = Column(JSON, nullable=True)  # Additional tracking data
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    events = relationship("EmailEvent", back_populates="email", cascade="all, delete-orphan")


class EmailEvent(Base):
    """Email event model for detailed tracking."""
    __tablename__ = "email_events"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("email_tracking.id"), nullable=False)
    event_type = Column(SQLEnum(EmailStatus), nullable=False)
    occurred_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    user_agent = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    location = Column(String, nullable=True)
    event_metadata = Column(JSON, nullable=True)  # Additional event data
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    email = relationship("EmailTracking", back_populates="events") 