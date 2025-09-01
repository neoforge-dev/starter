"""Email tracking schemas."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.email_tracking import EmailStatus
from pydantic import BaseModel


class EmailEventBase(BaseModel):
    """Base schema for email events."""

    event_type: EmailStatus
    occurred_at: datetime
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None
    event_metadata: Optional[Dict[str, Any]] = None


class EmailEventCreate(EmailEventBase):
    """Schema for creating email events."""

    pass


class EmailEvent(EmailEventBase):
    """Schema for email events."""

    id: int
    email_id: int

    class Config:
        from_attributes = True


class EmailTrackingBase(BaseModel):
    """Base schema for email tracking."""

    email_id: str
    recipient: str
    subject: str
    template_name: str
    status: EmailStatus
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    tracking_metadata: Optional[Dict[str, Any]] = None


class EmailTrackingCreate(EmailTrackingBase):
    """Schema for creating email tracking."""

    pass


class EmailTracking(EmailTrackingBase):
    """Schema for email tracking."""

    id: int
    created_at: datetime
    updated_at: datetime
    events: List[EmailEvent]

    class Config:
        from_attributes = True


class EmailTrackingStats(BaseModel):
    """Schema for email tracking statistics."""

    total_sent: int
    total_delivered: int
    total_opened: int
    total_clicked: int
    total_failed: int
    total_bounced: int
    total_spam: int
    delivery_rate: float  # delivered / sent
    open_rate: float  # opened / delivered
    click_rate: float  # clicked / opened
    bounce_rate: float  # bounced / sent
    spam_rate: float  # spam / sent
