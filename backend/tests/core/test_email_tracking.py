import pytest
import pytest_asyncio
from datetime import datetime
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.email_tracking import EmailTracking
from app.crud.email_tracking import email_tracking

@pytest_asyncio.fixture
async def tracking_record(db: AsyncSession) -> AsyncGenerator[EmailTracking, None]:
    """Create test email tracking entry."""
    return await email_tracking.create(
        db,
        obj_in={
            "email_id": "test-id",
            "status": "sent",
            "sent_at": datetime.utcnow(),
            "recipient": "test@example.com"
        }
    )


@pytest.mark.asyncio
async def test_update_status(db: AsyncSession, tracking_record: EmailTracking) -> None:
    """Test updating email status."""
    # Update status
    updated = await email_tracking.update_status(
        db=db,
        db_obj=tracking_record,
        status=EmailStatus.SENT,
    )

    # Verify
    assert updated.status == EmailStatus.SENT
    assert updated.sent_at is not None
    assert len(updated.events) == 2  # QUEUED and SENT
    assert updated.events[-1].event_type == EmailStatus.SENT


@pytest.mark.asyncio
async def test_get_by_email_id(db: AsyncSession, tracking_record: EmailTracking) -> None:
    """Test getting tracking by email ID."""
    # Get tracking
    obj = await email_tracking.get_by_email_id(db, email_id=tracking_record.email_id)

    # Verify
    assert obj is not None
    assert obj.id == tracking_record.id
    assert obj.email_id == tracking_record.email_id

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
            status="sent"
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

@pytest_asyncio.fixture
async def test_email_tracking(db_session):
    """Create test email tracking entry."""
    return await email_tracking.create(
        db_session,
        obj_in={
            "email_id": "test-id",
            "status": "sent",
            "sent_at": datetime.utcnow(),
            "recipient": "test@example.com"
        }
    ) 