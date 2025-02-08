"""Email tracking CRUD operations."""
from datetime import datetime, UTC
from typing import Dict, List, Optional, Union

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.crud.base import CRUDBase
from app.models.email_tracking import EmailEvent, EmailStatus, EmailTracking
from app.schemas.email_tracking import EmailEventCreate, EmailTrackingCreate, EmailTrackingStats


class CRUDEmailTracking(CRUDBase[EmailTracking, EmailTrackingCreate, None]):
    """CRUD for email tracking."""

    async def create_with_event(
        self,
        db: AsyncSession,
        *,
        obj_in: EmailTrackingCreate,
        event_type: EmailStatus,
        event_metadata: Optional[Dict] = None,
    ) -> EmailTracking:
        """Create email tracking with initial event."""
        # Create tracking record
        db_obj = EmailTracking(
            email_id=obj_in.email_id,
            recipient=obj_in.recipient,
            subject=obj_in.subject,
            template_name=obj_in.template_name,
            status=obj_in.status,
            tracking_metadata=obj_in.tracking_metadata,
        )

        # Set timestamp based on status
        timestamp = datetime.now(UTC)
        if obj_in.status == EmailStatus.SENT:
            db_obj.sent_at = timestamp
        elif obj_in.status == EmailStatus.DELIVERED:
            db_obj.delivered_at = timestamp
        elif obj_in.status == EmailStatus.OPENED:
            db_obj.opened_at = timestamp
        elif obj_in.status == EmailStatus.CLICKED:
            db_obj.clicked_at = timestamp
        elif obj_in.status in [EmailStatus.FAILED, EmailStatus.BOUNCED, EmailStatus.SPAM]:
            db_obj.failed_at = timestamp
            if event_metadata and "error" in event_metadata:
                db_obj.error_message = event_metadata["error"]

        db.add(db_obj)
        await db.flush()

        # Create event
        event = EmailEvent(
            email_id=db_obj.id,
            event_type=event_type,
            event_metadata=event_metadata,
            occurred_at=timestamp,
        )
        db.add(event)
        await db.flush()

        # Refresh the object to load the events relationship
        await db.refresh(db_obj, ["events"])
        return db_obj

    async def add_event(
        self,
        db: AsyncSession,
        *,
        db_obj: EmailTracking,
        event: EmailEventCreate,
    ) -> EmailTracking:
        """Add event to email tracking."""
        db_event = EmailEvent(
            email_id=db_obj.id,
            event_type=event.event_type,
            occurred_at=event.occurred_at,
            user_agent=event.user_agent,
            ip_address=event.ip_address,
            location=event.location,
            event_metadata=event.event_metadata,
        )
        db.add(db_event)
        await db.flush()

        # Refresh the object to load the events relationship
        await db.refresh(db_obj, ["events"])
        return db_obj

    async def update_status(
        self,
        db: AsyncSession,
        *,
        db_obj: EmailTracking,
        status: EmailStatus,
        error_message: Optional[str] = None,
        tracking_metadata: Optional[Dict] = None,
    ) -> EmailTracking:
        """Update email tracking status."""
        # Update status and tracking metadata
        db_obj.status = status
        if tracking_metadata:
            db_obj.tracking_metadata = tracking_metadata

        # Update timestamp based on status
        timestamp = datetime.now(UTC)
        if status == EmailStatus.SENT:
            db_obj.sent_at = timestamp
        elif status == EmailStatus.DELIVERED:
            db_obj.delivered_at = timestamp
        elif status == EmailStatus.OPENED:
            db_obj.opened_at = timestamp
        elif status == EmailStatus.CLICKED:
            db_obj.clicked_at = timestamp
        elif status in [EmailStatus.FAILED, EmailStatus.BOUNCED, EmailStatus.SPAM]:
            db_obj.failed_at = timestamp
            if error_message:
                db_obj.error_message = error_message

        # Add event
        event = EmailEvent(
            email_id=db_obj.id,
            event_type=status,
            event_metadata=tracking_metadata,
            occurred_at=timestamp,
        )
        db.add(event)
        await db.flush()

        # Refresh the object to load the events relationship
        await db.refresh(db_obj, ["events"])
        return db_obj

    async def get_by_email_id(
        self, db: AsyncSession, *, email_id: str
    ) -> Optional[EmailTracking]:
        """Get email tracking by email ID."""
        result = await db.execute(
            select(EmailTracking)
            .where(EmailTracking.email_id == email_id)
            .options(joinedload(EmailTracking.events))
        )
        return result.unique().scalar_one_or_none()

    async def get_stats(
        self,
        db: AsyncSession,
        *,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> EmailTrackingStats:
        """Get email tracking statistics."""
        # Base query
        query = select(EmailTracking)

        # Add date range filter if provided
        if start_date:
            query = query.where(EmailTracking.created_at >= start_date)
        if end_date:
            query = query.where(EmailTracking.created_at <= end_date)

        # Execute query
        result = await db.execute(query)
        records = result.scalars().all()

        # Calculate totals
        total_sent = sum(1 for r in records if r.status == EmailStatus.SENT)
        total_delivered = sum(1 for r in records if r.status == EmailStatus.DELIVERED)
        total_opened = sum(1 for r in records if r.status == EmailStatus.OPENED)
        total_clicked = sum(1 for r in records if r.status == EmailStatus.CLICKED)
        total_failed = sum(1 for r in records if r.status == EmailStatus.FAILED)
        total_bounced = sum(1 for r in records if r.status == EmailStatus.BOUNCED)
        total_spam = sum(1 for r in records if r.status == EmailStatus.SPAM)

        # Calculate rates (avoid division by zero)
        delivery_rate = total_delivered / total_sent if total_sent > 0 else 0.0
        open_rate = total_opened / total_delivered if total_delivered > 0 else 0.0
        click_rate = total_clicked / total_opened if total_opened > 0 else 0.0
        bounce_rate = total_bounced / total_sent if total_sent > 0 else 0.0
        spam_rate = total_spam / total_sent if total_sent > 0 else 0.0

        return EmailTrackingStats(
            total_sent=total_sent,
            total_delivered=total_delivered,
            total_opened=total_opened,
            total_clicked=total_clicked,
            total_failed=total_failed,
            total_bounced=total_bounced,
            total_spam=total_spam,
            delivery_rate=delivery_rate,
            open_rate=open_rate,
            click_rate=click_rate,
            bounce_rate=bounce_rate,
            spam_rate=spam_rate,
        )


email_tracking = CRUDEmailTracking(EmailTracking) 