"""Email tracking CRUD operations."""
import logging
from datetime import UTC, datetime
from typing import Dict, List, Optional, Union

from app.crud.base import CRUDBase
from app.models.email_tracking import EmailEvent, EmailStatus, EmailTracking
from app.schemas.email_tracking import (
    EmailEventCreate,
    EmailTrackingCreate,
    EmailTrackingStats,
)
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

logger = logging.getLogger(__name__)

# Status transition rules - defines which transitions are valid
VALID_STATUS_TRANSITIONS = {
    EmailStatus.QUEUED: [EmailStatus.SENT, EmailStatus.FAILED, EmailStatus.BOUNCED],
    EmailStatus.SENT: [
        EmailStatus.DELIVERED,
        EmailStatus.BOUNCED,
        EmailStatus.FAILED,
        EmailStatus.SPAM,
        EmailStatus.OPENED,
        EmailStatus.CLICKED,
    ],
    EmailStatus.DELIVERED: [EmailStatus.OPENED, EmailStatus.CLICKED, EmailStatus.SPAM],
    EmailStatus.OPENED: [EmailStatus.CLICKED],
    EmailStatus.CLICKED: [],  # Terminal status for engagement
    EmailStatus.BOUNCED: [],  # Terminal status
    EmailStatus.FAILED: [],  # Terminal status
    EmailStatus.SPAM: [],  # Terminal status
}

# Status priority for handling concurrent updates
STATUS_PRIORITY = {
    EmailStatus.QUEUED: 1,
    EmailStatus.SENT: 2,
    EmailStatus.DELIVERED: 3,
    EmailStatus.OPENED: 4,
    EmailStatus.CLICKED: 5,
    EmailStatus.BOUNCED: 6,
    EmailStatus.FAILED: 7,
    EmailStatus.SPAM: 8,
}


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
        elif obj_in.status in [
            EmailStatus.FAILED,
            EmailStatus.BOUNCED,
            EmailStatus.SPAM,
        ]:
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

    def _is_valid_status_transition(
        self, current_status: EmailStatus, new_status: EmailStatus
    ) -> bool:
        """
        Check if status transition is valid.

        Args:
            current_status: Current email status
            new_status: Proposed new status

        Returns:
            True if transition is valid, False otherwise
        """
        if current_status == new_status:
            return True  # Same status is always valid (idempotency)

        allowed_transitions = VALID_STATUS_TRANSITIONS.get(current_status, [])
        return new_status in allowed_transitions

    def _should_update_status(
        self, current_status: EmailStatus, new_status: EmailStatus
    ) -> bool:
        """
        Determine if status should be updated based on priority and validity.

        Args:
            current_status: Current email status
            new_status: Proposed new status

        Returns:
            True if status should be updated, False otherwise
        """
        # Always allow valid transitions
        if self._is_valid_status_transition(current_status, new_status):
            return True

        # For invalid transitions, only allow if new status has higher priority
        # This handles edge cases where events arrive out of order
        current_priority = STATUS_PRIORITY.get(current_status, 0)
        new_priority = STATUS_PRIORITY.get(new_status, 0)

        should_update = new_priority > current_priority
        if should_update:
            logger.warning(
                f"Invalid status transition allowed due to priority: "
                f"{current_status} -> {new_status}"
            )

        return should_update

    async def update_status(
        self,
        db: AsyncSession,
        *,
        db_obj: EmailTracking,
        status: EmailStatus,
        error_message: Optional[str] = None,
        tracking_metadata: Optional[Dict] = None,
    ) -> EmailTracking:
        """Update email tracking status with validation."""
        # Validate status transition
        current_status = db_obj.status
        if not self._should_update_status(current_status, status):
            logger.warning(
                f"Rejected invalid status transition for email {db_obj.id}: "
                f"{current_status} -> {status}"
            )
            # Return the object unchanged
            await db.refresh(db_obj, ["events"])
            return db_obj

        # Log status change
        if current_status != status:
            logger.info(
                f"Status transition for email {db_obj.id}: "
                f"{current_status} -> {status}"
            )

        # Update status and tracking metadata
        db_obj.status = status
        if tracking_metadata:
            db_obj.tracking_metadata = tracking_metadata

        # Update timestamp based on status (only if not already set)
        timestamp = datetime.now(UTC)
        if status == EmailStatus.SENT and not db_obj.sent_at:
            db_obj.sent_at = timestamp
        elif status == EmailStatus.DELIVERED and not db_obj.delivered_at:
            db_obj.delivered_at = timestamp
        elif status == EmailStatus.OPENED and not db_obj.opened_at:
            db_obj.opened_at = timestamp
        elif status == EmailStatus.CLICKED and not db_obj.clicked_at:
            db_obj.clicked_at = timestamp
        elif (
            status in [EmailStatus.FAILED, EmailStatus.BOUNCED, EmailStatus.SPAM]
            and not db_obj.failed_at
        ):
            db_obj.failed_at = timestamp
            if error_message:
                db_obj.error_message = error_message

        # Create event metadata
        event_metadata = tracking_metadata or {}
        if error_message and status in [
            EmailStatus.FAILED,
            EmailStatus.BOUNCED,
            EmailStatus.SPAM,
        ]:
            event_metadata = {**event_metadata, "error": error_message}

        # Add event
        event = EmailEvent(
            email_id=db_obj.id,
            event_type=status,
            event_metadata=event_metadata,
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

    async def find_by_email_and_recipient(
        self,
        db: AsyncSession,
        *,
        email_id: Optional[str] = None,
        recipient: str,
        timestamp: Optional[datetime] = None,
        time_window_hours: int = 24,
    ) -> Optional[EmailTracking]:
        """
        Find email tracking by multiple criteria with fallback strategies.

        First tries exact email_id match, then falls back to recipient+timestamp matching.

        Args:
            email_id: Primary email ID to search for
            recipient: Recipient email address
            timestamp: Event timestamp for temporal matching
            time_window_hours: Time window for recipient matching (default 24h)

        Returns:
            EmailTracking record or None
        """
        # Strategy 1: Exact email_id match
        if email_id:
            tracking = await self.get_by_email_id(db, email_id=email_id)
            if tracking:
                return tracking

        # Strategy 2: Recipient + timestamp window matching
        if timestamp:
            # Calculate time window
            from datetime import timedelta

            start_time = timestamp - timedelta(hours=time_window_hours)
            end_time = timestamp + timedelta(hours=time_window_hours)

            result = await db.execute(
                select(EmailTracking)
                .where(
                    EmailTracking.recipient == recipient,
                    EmailTracking.created_at >= start_time,
                    EmailTracking.created_at <= end_time,
                )
                .options(joinedload(EmailTracking.events))
                .order_by(EmailTracking.created_at.desc())  # Most recent first
            )
            return result.unique().scalars().first()

        # Strategy 3: Most recent email to recipient (last resort)
        result = await db.execute(
            select(EmailTracking)
            .where(EmailTracking.recipient == recipient)
            .options(joinedload(EmailTracking.events))
            .order_by(EmailTracking.created_at.desc())
            .limit(1)
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
