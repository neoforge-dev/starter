"""Test email tracking functionality."""
import pytest
from datetime import datetime, timedelta, UTC
from unittest.mock import patch, MagicMock

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.email_tracking import email_tracking
from app.models.email_tracking import EmailStatus
from app.schemas.email_tracking import (
    EmailTrackingCreate,
    EmailEventCreate,
    EmailTrackingStats,
)


@pytest.fixture
async def tracking_record(db: AsyncSession):
    """Create a test tracking record."""
    obj_in = EmailTrackingCreate(
        email_id="test-1",
        recipient="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        status=EmailStatus.QUEUED,
    )
    return await email_tracking.create_with_event(
        db=db,
        obj_in=obj_in,
        event_type=EmailStatus.QUEUED,
    )


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
    # Get tracking record
    record = await tracking_record
    
    # Update status
    obj = await email_tracking.update_status(
        db=db,
        db_obj=record,
        status=EmailStatus.SENT,
    )

    # Verify
    assert obj.status == EmailStatus.SENT
    assert obj.sent_at is not None
    assert len(obj.events) == 2
    assert obj.events[-1].event_type == EmailStatus.SENT


@pytest.mark.asyncio
async def test_get_by_email_id(db: AsyncSession, tracking_record):
    """Test getting tracking by email ID."""
    # Get tracking record
    record = await tracking_record
    
    # Get tracking
    obj = await email_tracking.get_by_email_id(db, email_id="test-1")

    # Verify
    assert obj is not None
    assert obj.id == record.id
    assert obj.email_id == "test-1"


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
async def test_get_stats_with_date_range(db: AsyncSession):
    """Test getting email statistics with date range."""
    # Create test data
    now = datetime.utcnow()
    yesterday = now - timedelta(days=1)
    tomorrow = now + timedelta(days=1)

    # Create tracking records
    for i in range(3):
        obj_in = EmailTrackingCreate(
            email_id=f"test-{i}",
            recipient=f"test{i}@example.com",
            subject="Test Subject",
            template_name="test_email",
            status=EmailStatus.SENT,
        )
        await email_tracking.create_with_event(
            db=db,
            obj_in=obj_in,
            event_type=EmailStatus.SENT,
        )

    # Get stats with date range
    stats = await email_tracking.get_stats(
        db,
        start_date=yesterday,
        end_date=tomorrow,
    )

    # Verify
    assert stats.total_sent == 3


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