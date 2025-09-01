"""Test email tracking functionality."""
from datetime import UTC, datetime, timedelta
from typing import AsyncGenerator
from unittest.mock import MagicMock, patch

import pytest
import pytest_asyncio
from app.crud.email_tracking import email_tracking
from app.models.email_tracking import EmailStatus, EmailTracking
from app.schemas.email_tracking import (
    EmailEventCreate,
    EmailTrackingCreate,
    EmailTrackingStats,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud

pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture
async def tracking_record(db) -> AsyncGenerator[EmailTracking, None]:
    """Create a test email tracking record."""
    tracking_in = EmailTrackingCreate(
        email_id="test123",
        recipient="test@example.com",
        subject="Test Email",
        template_name="test_template",
        status=EmailStatus.QUEUED,
    )
    tracking = await email_tracking.create_with_event(
        db=db,
        obj_in=tracking_in,
        event_type=EmailStatus.QUEUED,
    )
    yield tracking


@pytest.mark.asyncio
async def test_create_tracking(db: AsyncSession):
    """Test creating email tracking record."""
    # Create tracking
    obj_in = EmailTrackingCreate(
        email_id="test-1",
        recipient="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        status=EmailStatus.QUEUED,
    )
    obj = await email_tracking.create_with_event(
        db=db,
        obj_in=obj_in,
        event_type=EmailStatus.QUEUED,
    )

    # Verify
    assert obj.email_id == "test-1"
    assert obj.status == EmailStatus.QUEUED
    assert len(obj.events) == 1
    assert obj.events[0].event_type == EmailStatus.QUEUED


@pytest.mark.asyncio
async def test_update_status(db: AsyncSession, tracking_record):
    """Test updating email status."""
    # Update status
    obj = await email_tracking.update_status(
        db=db,
        db_obj=tracking_record,
        status=EmailStatus.SENT,
    )

    # Verify
    assert obj.status == EmailStatus.SENT
    assert obj.sent_at is not None
    assert len(obj.events) == 2
    assert obj.events[-1].event_type == EmailStatus.SENT


@pytest.mark.asyncio
async def test_get_by_email_id(db: AsyncSession):
    """Test getting tracking record by email ID."""
    # Create a tracking record
    tracking_in = EmailTrackingCreate(
        email_id="test-get-by-id",
        recipient="test@example.com",
        subject="Test Email",
        template_name="test_template",
        status="queued",
    )
    tracking = await crud.email_tracking.create(db, obj_in=tracking_in)

    # Get by email ID
    obj = await email_tracking.get_by_email_id(db=db, email_id="test-get-by-id")

    # Verify
    assert obj is not None
    assert obj.email_id == "test-get-by-id"
    assert obj.recipient == "test@example.com"


@pytest.mark.asyncio
async def test_get_stats(db: AsyncSession):
    """Test getting email statistics."""
    # Create test data
    statuses = [
        EmailStatus.SENT,
        EmailStatus.DELIVERED,
        EmailStatus.OPENED,
        EmailStatus.CLICKED,
        EmailStatus.FAILED,
        EmailStatus.BOUNCED,
        EmailStatus.SPAM,
    ]

    for i, status in enumerate(statuses):
        obj_in = EmailTrackingCreate(
            email_id=f"test-{i}",
            recipient=f"test{i}@example.com",
            subject="Test Subject",
            template_name="test_email",
            status=status,
        )
        await email_tracking.create_with_event(
            db=db,
            obj_in=obj_in,
            event_type=status,
        )

    # Get stats
    stats = await email_tracking.get_stats(db)

    # Verify
    assert stats.total_sent == 1
    assert stats.total_delivered == 1
    assert stats.total_opened == 1
    assert stats.total_clicked == 1
    assert stats.total_failed == 1
    assert stats.total_bounced == 1
    assert stats.total_spam == 1
    assert stats.delivery_rate == 1.0
    assert stats.open_rate == 1.0
    assert stats.click_rate == 1.0
    assert stats.bounce_rate == 1.0
    assert stats.spam_rate == 1.0


@pytest.mark.asyncio
async def test_get_stats_with_date_range(db):
    """Test getting email stats with date range."""
    now = datetime.now(UTC)
    start_date = now - timedelta(days=7)
    end_date = now + timedelta(days=1)

    # Create some test records
    for i in range(5):
        tracking_in = EmailTrackingCreate(
            email_id=f"test{i}",
            recipient=f"test{i}@example.com",
            subject=f"Test Email {i}",
            template_name="test_template",
            status="sent",
        )
        await email_tracking.create_with_event(
            db=db,
            obj_in=tracking_in,
            event_type=EmailStatus.SENT,
        )

    # Get stats with date range
    stats = await email_tracking.get_stats(
        db=db,
        start_date=start_date,
        end_date=end_date,
    )

    # Verify stats
    assert stats.total_sent == 5
    assert stats.delivery_rate == 0.0  # No delivered emails
    assert stats.open_rate == 0.0  # No opened emails
    assert stats.click_rate == 0.0  # No clicked emails


@pytest.mark.asyncio
async def test_failed_email_tracking(db: AsyncSession):
    """Test tracking failed email."""
    # Create failed tracking
    obj_in = EmailTrackingCreate(
        email_id="test-failed",
        recipient="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        status=EmailStatus.FAILED,
    )
    obj = await email_tracking.create_with_event(
        db=db,
        obj_in=obj_in,
        event_type=EmailStatus.FAILED,
        event_metadata={"error": "Test error"},
    )

    # Verify
    assert obj.status == EmailStatus.FAILED
    assert obj.failed_at is not None
    assert len(obj.events) == 1
    assert obj.events[0].event_type == EmailStatus.FAILED
    assert obj.events[0].event_metadata == {"error": "Test error"}
