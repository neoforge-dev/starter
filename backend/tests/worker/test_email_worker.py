"""Test email worker functionality with tracking."""
import asyncio
import pytest
from datetime import datetime, UTC
from unittest.mock import patch, MagicMock, AsyncMock
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.queue import QueuedEmail
from app.worker.email_worker import EmailWorker
from app.models.email_tracking import EmailStatus
from app.crud.email_tracking import email_tracking
from app.schemas.email_tracking import EmailTrackingCreate, EmailEventCreate


@pytest.fixture
def mock_queue():
    """Mock email queue."""
    queue = MagicMock()
    queue.dequeue = AsyncMock()
    queue.mark_completed = AsyncMock()
    queue.mark_failed = AsyncMock()
    return queue


@pytest.fixture
def mock_send_email():
    """Mock send_email function."""
    with patch("app.worker.email_worker.send_email") as mock:
        yield mock


@pytest.fixture
async def tracking_record(db: AsyncSession):
    """Create a test tracking record."""
    return await email_tracking.create_with_event(
        db=db,
        obj_in=EmailTrackingCreate(
            email_id="test-1",
            recipient="test@example.com",
            subject="Test Subject",
            template_name="test_email",
            status=EmailStatus.QUEUED,
        ),
        event_type=EmailStatus.QUEUED,
    )


@pytest.mark.asyncio
async def test_process_one_success_with_tracking(
    db: AsyncSession,
    mock_queue,
    mock_send_email,
    tracking_record,
):
    """Test processing one email successfully with tracking."""
    # Setup
    worker = EmailWorker(queue=mock_queue)
    queued_email = QueuedEmail(
        id="test-1",
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={},
    )
    mock_queue.dequeue.return_value = ("test-1", queued_email)
    mock_send_email.return_value = None

    # Mock AsyncSessionLocal to return our test session
    @asynccontextmanager
    async def mock_session():
        yield db

    with patch("app.worker.email_worker.AsyncSessionLocal", mock_session):
        # Process email
        await worker.process_one()

        # Verify tracking
        tracking = await email_tracking.get_by_email_id(db, email_id="test-1")
        assert tracking is not None
        assert tracking.status == EmailStatus.DELIVERED
        assert tracking.delivered_at is not None
        assert len(tracking.events) == 3  # QUEUED, SENT, and DELIVERED
        assert tracking.events[-1].event_type == EmailStatus.DELIVERED


@pytest.mark.asyncio
async def test_process_one_failure_with_tracking(
    db: AsyncSession,
    mock_queue,
    mock_send_email,
    tracking_record,
):
    """Test processing one email with failure and tracking."""
    # Setup
    worker = EmailWorker(queue=mock_queue)
    queued_email = QueuedEmail(
        id="test-1",
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={},
    )
    mock_queue.dequeue.return_value = ("test-1", queued_email)
    error_msg = "SMTP error"
    mock_send_email.side_effect = Exception(error_msg)

    # Mock AsyncSessionLocal to return our test session
    @asynccontextmanager
    async def mock_session():
        yield db

    with patch("app.worker.email_worker.AsyncSessionLocal", mock_session):
        # Process email
        await worker.process_one()

        # Verify tracking
        tracking = await email_tracking.get_by_email_id(db, email_id="test-1")
        assert tracking is not None
        assert tracking.status == EmailStatus.FAILED
        assert tracking.failed_at is not None
        assert len(tracking.events) == 2  # QUEUED and FAILED
        assert tracking.events[-1].event_type == EmailStatus.FAILED
        assert tracking.events[-1].event_metadata.get("error") == error_msg


@pytest.mark.asyncio
async def test_process_one_delivery_with_tracking(
    db: AsyncSession,
    mock_queue,
    mock_send_email,
    tracking_record,
):
    """Test processing one email with delivery status and tracking."""
    # Setup
    worker = EmailWorker(queue=mock_queue)
    queued_email = QueuedEmail(
        id="test-1",
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={},
    )
    mock_queue.dequeue.return_value = ("test-1", queued_email)
    mock_send_email.return_value = None

    # Get tracking record
    record = await tracking_record

    # Mock AsyncSessionLocal to return our test session
    @asynccontextmanager
    async def mock_session():
        yield db

    with patch("app.worker.email_worker.AsyncSessionLocal", mock_session):
        # Process email
        await worker.process_one()

        # Verify tracking
        tracking = await email_tracking.get_by_email_id(db, email_id="test-1")
        assert tracking is not None
        assert tracking.status == EmailStatus.DELIVERED
        assert tracking.delivered_at is not None
        assert len(tracking.events) == 3  # QUEUED, SENT, and DELIVERED
        assert tracking.events[-1].event_type == EmailStatus.DELIVERED


@pytest.mark.asyncio
async def test_process_one_bounce_with_tracking(
    db: AsyncSession,
    mock_queue,
    mock_send_email,
    tracking_record,
):
    """Test processing one email with bounce status and tracking."""
    # Setup
    worker = EmailWorker(queue=mock_queue)
    queued_email = QueuedEmail(
        id="test-1",
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={},
    )
    mock_queue.dequeue.return_value = ("test-1", queued_email)
    mock_send_email.return_value = None

    # Get tracking record
    record = await tracking_record

    # Mock AsyncSessionLocal to return our test session
    @asynccontextmanager
    async def mock_session():
        yield db

    with patch("app.worker.email_worker.AsyncSessionLocal", mock_session):
        # Process email but mock send_email to raise an exception
        mock_send_email.side_effect = Exception("Invalid recipient")
        await worker.process_one()

        # Verify tracking
        tracking = await email_tracking.get_by_email_id(db, email_id="test-1")
        assert tracking is not None
        assert tracking.status == EmailStatus.FAILED
        assert tracking.failed_at is not None
        assert len(tracking.events) == 2  # QUEUED and FAILED
        assert tracking.events[-1].event_type == EmailStatus.FAILED
        assert tracking.events[-1].event_metadata == {"error": "Invalid recipient"}


@pytest.mark.asyncio
async def test_worker_run_with_tracking(
    db: AsyncSession,
    mock_queue,
    mock_send_email,
):
    """Test worker run loop with tracking."""
    # Setup
    worker = EmailWorker(queue=mock_queue)
    queued_emails = [
        QueuedEmail(
            email_to=f"test{i}@example.com",
            subject="Test Subject",
            template_name="test_email",
            template_data={},
        )
        for i in range(3)
    ]

    # Mock AsyncSessionLocal to return our test session
    @asynccontextmanager
    async def mock_session():
        yield db

    with patch("app.worker.email_worker.AsyncSessionLocal", mock_session):
        # Process each email
        for i, email in enumerate(queued_emails):
            # Create tracking record before processing
            tracking_record = await email_tracking.create_with_event(
                db=db,
                obj_in=EmailTrackingCreate(
                    email_id=f"test-{i}",
                    recipient=email.email_to,
                    subject=email.subject,
                    template_name=email.template_name,
                    status=EmailStatus.QUEUED,
                ),
                event_type=EmailStatus.QUEUED,
            )

            # Setup mock for this iteration
            mock_queue.dequeue.return_value = (f"test-{i}", email)
            mock_send_email.return_value = None

            # Process one email
            result = await worker.process_one()
            assert result is True

            # Verify tracking record was updated
            tracking = await email_tracking.get_by_email_id(db, email_id=f"test-{i}")
            assert tracking is not None
            assert tracking.status == EmailStatus.DELIVERED


@pytest.mark.asyncio
async def test_process_one_success(db: AsyncSession, mock_queue, mock_send_email):
    """Test processing one email successfully."""
    # Setup
    worker = EmailWorker(queue=mock_queue)
    email = QueuedEmail(
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={"key": "value"},
    )
    mock_queue.dequeue.return_value = ("1", email)

    # Mock AsyncSessionLocal to return our test session
    @asynccontextmanager
    async def mock_session():
        yield db

    with patch("app.worker.email_worker.AsyncSessionLocal", mock_session):
        # Test
        result = await worker.process_one()

        # Verify
        assert result is True
        mock_send_email.assert_called_once()
        mock_queue.mark_completed.assert_called_once_with("1")
        mock_queue.mark_failed.assert_not_called()


@pytest.mark.asyncio
async def test_process_one_empty_queue(mock_queue, mock_send_email):
    """Test processing empty queue."""
    # Setup
    worker = EmailWorker()
    mock_queue.dequeue.return_value = None

    # Test
    result = await worker.process_one()

    # Verify
    assert result is False
    mock_send_email.assert_not_called()
    mock_queue.mark_completed.assert_not_called()
    mock_queue.mark_failed.assert_not_called()


@pytest.mark.asyncio
async def test_process_one_send_failure(db: AsyncSession, mock_queue, mock_send_email):
    """Test processing email with send failure."""
    # Setup
    worker = EmailWorker(queue=mock_queue)
    email = QueuedEmail(
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={"key": "value"},
    )
    mock_queue.dequeue.return_value = ("1", email)
    mock_send_email.side_effect = Exception("Send failed")

    # Mock AsyncSessionLocal to return our test session
    @asynccontextmanager
    async def mock_session():
        yield db

    with patch("app.worker.email_worker.AsyncSessionLocal", mock_session):
        # Test
        result = await worker.process_one()

        # Verify
        assert result is False
        mock_send_email.assert_called_once()
        mock_queue.mark_completed.assert_not_called()
        mock_queue.mark_failed.assert_called_once_with("1", "Send failed")


@pytest.mark.asyncio
async def test_worker_run_and_stop():
    """Test worker run and stop functionality."""
    # Setup
    worker = EmailWorker()
    processed = []

    async def mock_process_one():
        if len(processed) < 3:  # Process 3 emails then stop
            processed.append(1)
            return True
        worker.stop()
        return False

    worker.process_one = mock_process_one

    # Test
    worker.start(interval=0.1)
    await asyncio.sleep(0.5)  # Give some time for processing

    # Verify
    assert len(processed) == 3
    assert not worker.running
    assert worker.current_task is None


@pytest.mark.asyncio
async def test_worker_error_handling(mock_queue, mock_send_email):
    """Test worker error handling."""
    # Setup
    worker = EmailWorker()
    mock_queue.dequeue.side_effect = Exception("Queue error")

    # Test
    result = await worker.process_one()

    # Verify
    assert result is False
    mock_send_email.assert_not_called()
    mock_queue.mark_completed.assert_not_called()
    mock_queue.mark_failed.assert_not_called()


@pytest.mark.asyncio
async def test_worker_multiple_starts():
    """Test starting worker multiple times."""
    # Setup
    worker = EmailWorker()

    # Test
    worker.start()
    first_task = worker.current_task
    worker.start()  # Try to start again
    second_task = worker.current_task

    # Verify
    assert first_task is second_task  # Should be the same task

    # Cleanup
    worker.stop()
    await asyncio.sleep(0.1)  # Give time for worker to stop 