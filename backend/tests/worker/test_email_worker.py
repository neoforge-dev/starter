"""Test email worker functionality with tracking."""
import asyncio
import pytest
from datetime import datetime, UTC, timedelta
from unittest.mock import patch, MagicMock, AsyncMock, Mock, ANY
from contextlib import asynccontextmanager
from unittest import mock
import pytest_asyncio
from fastapi import FastAPI

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy import select

from app.core.queue import EmailQueueItem
from app.worker.email_worker import EmailWorker, EmailError
from app.models.email_tracking import EmailStatus, EmailTracking
from app.crud.email_tracking import email_tracking
from app.schemas.email_tracking import EmailTrackingCreate, EmailEventCreate
from app.core.email import EmailContent


@pytest.fixture
def mock_queue():
    """Mock email queue."""
    queue = Mock()
    queue.dequeue = AsyncMock()
    queue.mark_completed = AsyncMock()
    queue.mark_failed = AsyncMock()
    queue.requeue = AsyncMock()
    return queue


@pytest.fixture
def mock_send_email():
    """Mock send_email function."""
    with patch("app.worker.email_worker.send_email") as mock:
        yield mock


@pytest.fixture
def mock_template_validator():
    """Mock template validator."""
    validator = Mock()
    validator.validate_template_data = AsyncMock()
    return validator


@pytest_asyncio.fixture
async def tracking_record(db: AsyncSession) -> EmailTracking:
    """Create a test tracking record.
    
    Returns:
        EmailTracking: The created tracking record, already committed to the database.
    """
    record = await email_tracking.create_with_event(
        db=db,
        obj_in=EmailTrackingCreate(
            email_id="test-queued-1",
            recipient="test@example.com",
            subject="Test Subject",
            template_name="test_email",
            status=EmailStatus.QUEUED,
        ),
        event_type=EmailStatus.QUEUED,
    )
    
    # Ensure the transaction is committed
    await db.commit()
    await db.refresh(record)
    
    return record


@pytest.fixture
def worker(mock_queue, mock_template_validator):
    """Create worker with mocked dependencies."""
    worker = EmailWorker(queue=mock_queue)
    worker.template_validator = mock_template_validator
    return worker


@pytest.fixture
def mock_tracking():
    """Mock tracking record."""
    mock = AsyncMock()
    mock.status = EmailStatus.QUEUED
    mock.tracking_metadata = {}
    
    async def async_lambda(email_id):
        mock.id = 1  # Set ID to match the database record
        mock.email_id = email_id
        return mock
    
    return async_lambda


@pytest_asyncio.fixture
async def tracking_record_for_bounce(db: AsyncSession):
    """Create a real tracking record for bounce test."""
    tracking = EmailTracking(
        id=2,  # Different ID from the other fixture
        email_id="test-bounce-1",  # Different email_id
        recipient="bounce@example.com",  # Different recipient
        subject="Test Bounce Subject",
        template_name="test_template",
        status=EmailStatus.QUEUED
    )
    db.add(tracking)
    await db.commit()
    await db.refresh(tracking)
    
    yield tracking
    
    # Cleanup
    await db.delete(tracking)
    await db.commit()


@pytest.mark.asyncio
async def test_process_one_success_with_tracking(
    db: AsyncSession,
    mock_queue,
    mock_send_email,
    tracking_record,
    worker,
):
    """Test processing one email successfully with tracking."""
    # Setup
    await tracking_record  # Await the tracking record fixture
    
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={},
    )
    mock_queue.dequeue.return_value = ("test-1", email)
    mock_send_email.return_value = None

    # Mock AsyncSessionLocal to return our test session
    @asynccontextmanager
    async def mock_session():
        yield db

    with patch("app.worker.email_worker.AsyncSessionLocal", mock_session):
        # Process email
        result = await worker.process_one()

        # Verify
        assert result is True
        mock_queue.mark_completed.assert_called_once_with("test-1")
        mock_queue.mark_failed.assert_not_called()

        # Verify tracking
        tracking = await email_tracking.get_by_email_id(db, email_id="test-1")
        assert tracking is not None
        assert tracking.status == EmailStatus.DELIVERED
        assert tracking.delivered_at is not None
        assert len(tracking.events) == 3  # QUEUED, SENT, and DELIVERED


@pytest.mark.asyncio
async def test_process_one_failure_with_tracking(
    db: AsyncSession,
    mock_queue,
    mock_send_email,
    tracking_record,
    worker,
):
    """Test processing one email with failure and tracking."""
    # Setup
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={},
    )
    mock_queue.dequeue.return_value = ("test-1", email)
    error_msg = "SMTP connection failed: Connection refused"
    mock_send_email.side_effect = Exception(error_msg)

    # tracking_record is already awaited by the fixture
    tracking_record.tracking_metadata = {
        "retry_count": worker.max_retries,
        "max_retries": worker.max_retries,
    }
    await db.commit()

    # Mock AsyncSessionLocal to return our test session
    @asynccontextmanager
    async def mock_session():
        yield db

    with patch("app.worker.email_worker.AsyncSessionLocal", mock_session):
        # Process email
        result = await worker.process_one()

        # Verify
        assert result is False
        mock_queue.mark_completed.assert_not_called()
        mock_queue.mark_failed.assert_called_once()

        # Verify tracking
        tracking = await email_tracking.get_by_email_id(db, email_id="test-1")
        assert tracking is not None
        assert tracking.status == EmailStatus.FAILED
        assert tracking.failed_at is not None
        assert len(tracking.events) == 2  # QUEUED and FAILED
        assert tracking.events[-1].event_type == EmailStatus.FAILED
        assert error_msg in tracking.events[-1].event_metadata.get("error", "")


@pytest.mark.asyncio
async def test_process_one_delivery_with_tracking(
    db: AsyncSession,
    mock_queue,
    mock_send_email,
    tracking_record,
    mock_template_validator,
):
    """Test processing one email with delivery status and tracking."""
    # Setup
    worker = EmailWorker(queue=mock_queue)
    worker.template_validator = mock_template_validator  # Set the mocked validator
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={},
    )
    mock_queue.dequeue.return_value = ("test-1", email)
    mock_send_email.return_value = None

    # Mock AsyncSessionLocal to return our test session
    @asynccontextmanager
    async def mock_session():
        yield db

    with patch("app.worker.email_worker.AsyncSessionLocal", mock_session):
        # Process email
        result = await worker.process_one()

        # Verify
        assert result is True
        mock_queue.mark_completed.assert_called_once_with("test-1")
        mock_queue.mark_failed.assert_not_called()

        # Verify tracking
        tracking = await email_tracking.get_by_email_id(db, email_id="test-1")
        assert tracking is not None
        assert tracking.status == EmailStatus.DELIVERED
        assert tracking.delivered_at is not None
        assert len(tracking.events) == 3  # QUEUED, SENT, and DELIVERED


@pytest.mark.asyncio
async def test_process_one_bounce_with_tracking(
    db: AsyncSession,
    mock_queue,
    mock_send_email,
    tracking_record,
    mock_template_validator,
):
    """Test processing one email with bounce status and tracking."""
    # Setup
    worker = EmailWorker(queue=mock_queue)
    worker.template_validator = mock_template_validator  # Set the mocked validator
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={},
    )
    mock_queue.dequeue.return_value = ("test-queued-1", email)  # Match tracking_record email_id
    mock_send_email.side_effect = Exception("Recipient address bounced")

    # Mock AsyncSessionLocal to return our test session
    @asynccontextmanager
    async def mock_session():
        yield db

    with patch("app.worker.email_worker.AsyncSessionLocal", mock_session):
        # Process email
        result = await worker.process_one()

        # Verify
        assert result is False  # Should return False for failed email
        mock_queue.mark_failed.assert_called_once_with("test-queued-1", "Recipient address bounced")
        mock_queue.mark_completed.assert_not_called()

        # Verify tracking record was updated
        updated_record = await db.get(EmailTracking, tracking_record.id)
        assert updated_record.status == EmailStatus.BOUNCED  # Should be marked as bounced
        assert "Recipient address bounced" in updated_record.error_message
        assert updated_record.tracking_metadata == {"retry_count": 0, "error_type": "bounce"}


@pytest.mark.slow
@pytest.mark.asyncio
async def test_worker_run_with_tracking(
    db: AsyncSession,
    mock_queue,
    mock_send_email,
    mock_template_validator,
):
    """Test worker run loop with tracking."""
    # Setup
    worker = EmailWorker(queue=mock_queue)
    worker.template_validator = mock_template_validator  # Set the mocked validator
    emails = [
        EmailQueueItem(
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
        for i, email in enumerate(emails):
            email_id = f"test-worker-{i}"  # Ensure unique email_id
            
            # Create tracking record before processing
            tracking_record = await email_tracking.create_with_event(
                db=db,
                obj_in=EmailTrackingCreate(
                    email_id=email_id,
                    recipient=email.email_to,
                    subject=email.subject,
                    template_name=email.template_name,
                    status=EmailStatus.QUEUED,
                ),
                event_type=EmailStatus.QUEUED,
            )

            # Setup mock for this iteration
            mock_queue.dequeue.return_value = (email_id, email)  # Use same email_id
            mock_send_email.return_value = None

            # Process one email
            result = await worker.process_one()
            assert result is True

            # Verify tracking record was updated
            tracking = await email_tracking.get_by_email_id(db, email_id=email_id)
            assert tracking is not None
            assert tracking.status == EmailStatus.DELIVERED


@pytest.mark.asyncio
async def test_process_one_success(db: AsyncSession, mock_queue, mock_send_email, mock_template_validator):
    """Test processing one email successfully."""
    # Setup
    worker = EmailWorker(queue=mock_queue)
    worker.template_validator = mock_template_validator  # Set the mocked validator
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={"key": "value"},
    )
    mock_queue.dequeue.return_value = ("test-1", email)  # Use test-1 to match other tests
    mock_send_email.return_value = None

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
        mock_queue.mark_completed.assert_called_once_with("test-1")
        mock_queue.mark_failed.assert_not_called()

        # Verify tracking
        tracking = await email_tracking.get_by_email_id(db, email_id="test-1")
        assert tracking is not None
        assert tracking.status == EmailStatus.DELIVERED
        assert tracking.delivered_at is not None
        assert len(tracking.events) == 3  # QUEUED, SENT, and DELIVERED


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
async def test_process_one_send_failure(db: AsyncSession, mock_queue, mock_send_email, mock_template_validator):
    """Test processing email with send failure."""
    # Setup
    worker = EmailWorker(queue=mock_queue)
    worker.template_validator = mock_template_validator  # Set the mocked validator
    email = EmailQueueItem(
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
        mock_queue.mark_failed.assert_called_once()


@pytest.mark.slow
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


@pytest.mark.asyncio
async def test_process_one_template_validation_error(worker, mock_queue, db):
    """Test handling of template validation errors."""
    # Setup
    email_id = "test_id"
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test",
        template_name="invalid_template",
        template_data={}
    )
    mock_queue.dequeue.return_value = (email_id, email)
    
    # Set up the template validator to raise a ValueError
    error_msg = "Template validation failed: Invalid template"
    worker.template_validator.validate_template_data = Mock(side_effect=ValueError(error_msg))
    
    # Mock AsyncSessionLocal to return our test session
    @asynccontextmanager
    async def mock_session():
        yield db

    with patch("app.worker.email_worker.AsyncSessionLocal", mock_session):
        # Execute
        result = await worker.process_one()

        # Assert
        assert not result
        mock_queue.mark_failed.assert_called_once_with(email_id, error_msg)
        mock_queue.mark_completed.assert_not_called()


@pytest.mark.asyncio
async def test_process_one_smtp_error_retry(worker, mock_queue, db):
    """Test SMTP error handling with retry logic."""
    # Setup
    email_id = "test_id"
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test",
        template_name="valid_template",
        template_data={}
    )
    mock_queue.dequeue.return_value = (email_id, email)
    
    # Mock AsyncSessionLocal to return our test session
    @asynccontextmanager
    async def mock_session():
        yield db

    with patch("app.worker.email_worker.AsyncSessionLocal", mock_session), \
         patch("app.worker.email_worker.send_email", new_callable=AsyncMock) as mock_send:
        mock_send.side_effect = Exception("SMTP connection failed")

        # Execute
        result = await worker.process_one()

        # Assert
        assert not result  # Should return False as email is requeued
        mock_queue.requeue.assert_called_once()
        delay_arg = mock_queue.requeue.call_args[1]["delay"]
        assert isinstance(delay_arg, int)
        assert delay_arg == 2  # First retry delay


@pytest.mark.asyncio
async def test_process_one_bounce_handling(worker, mock_queue, mock_tracking):
    """Test handling of email bounces."""
    # Setup
    email_id = "test_id"
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test",
        template_name="valid_template",
        template_data={}
    )
    mock_queue.dequeue.return_value = (email_id, email)
    await mock_tracking(email_id)
    
    with patch("app.worker.email_worker.send_email", new_callable=AsyncMock) as mock_send:
        mock_send.side_effect = Exception("Recipient address bounced")

        # Execute
        result = await worker.process_one()

        # Assert
        assert not result
        mock_queue.mark_failed.assert_called_once()
        error_msg = mock_queue.mark_failed.call_args[0][1]
        assert "bounce" in error_msg.lower()


@pytest.mark.slow
@pytest.mark.asyncio
async def test_process_one_max_retries(worker, mock_queue, db):
    """Test that emails are not retried after max attempts."""
    # Setup
    email_id = "test_id"
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test",
        template_name="valid_template",
        template_data={}
    )
    mock_queue.dequeue.return_value = (email_id, email)
    
    # Create tracking record with retry count at max
    tracking = EmailTracking(
        email_id=email_id,
        status=EmailStatus.QUEUED,
        tracking_metadata={"retry_count": 3}  # Already retried 3 times (max)
    )

    # Mock AsyncSessionLocal to return our test session
    @asynccontextmanager
    async def mock_session():
        class MockSession:
            @asynccontextmanager
            async def begin(self):
                yield self
        yield MockSession()

    with patch("app.worker.email_worker.send_email", new_callable=AsyncMock) as mock_send, \
         patch("app.worker.email_worker.email_tracking") as mock_tracking_crud, \
         patch("app.worker.email_worker.AsyncSessionLocal", mock_session):
        mock_send.side_effect = Exception("SMTP error: Connection failed")  # SMTP error
        mock_tracking_crud.get_by_email_id = AsyncMock(return_value=tracking)
        mock_tracking_crud.update_status = AsyncMock()
        mock_queue.mark_failed = AsyncMock()

        # Execute
        result = await worker.process_one()

        # Assert
        assert not result  # Should not retry anymore
        mock_queue.mark_failed.assert_called_once_with(email_id, "SMTP error: Connection failed")
        mock_tracking_crud.update_status.assert_called_with(
            db=ANY,
            db_obj=tracking,
            status=EmailStatus.FAILED,
            error_message="SMTP error: Connection failed",
            tracking_metadata={'retry_count': 3, 'error_type': 'smtp_error'}
        )


@pytest.mark.asyncio
async def test_process_one_successful_send(worker, mock_queue, mock_tracking):
    """Test successful email sending."""
    # Setup
    email_id = "test_id"
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test",
        template_name="valid_template",
        template_data={}
    )
    mock_queue.dequeue.return_value = (email_id, email)
    tracking = await mock_tracking(email_id)

    # Mock AsyncSessionLocal to return our test session
    @asynccontextmanager
    async def mock_session():
        class MockSession:
            @asynccontextmanager
            async def begin(self):
                yield self
        yield MockSession()

    with patch("app.worker.email_worker.send_email", new_callable=AsyncMock) as mock_send, \
         patch("app.worker.email_worker.email_tracking") as mock_tracking_crud, \
         patch("app.worker.email_worker.AsyncSessionLocal", mock_session):
        mock_tracking_crud.get_by_email_id = AsyncMock(return_value=tracking)
        mock_tracking_crud.update_status = AsyncMock()

        # Execute
        result = await worker.process_one()

        # Assert
        assert result
        mock_queue.mark_completed.assert_called_once_with(email_id)
        assert not mock_queue.mark_failed.called
        assert not mock_queue.requeue.called
        mock_tracking_crud.update_status.assert_has_calls([
            mock.call(
                db=mock.ANY,
                db_obj=tracking,
                status=EmailStatus.SENT,
            ),
            mock.call(
                db=mock.ANY,
                db_obj=tracking,
                status=EmailStatus.DELIVERED,
            )
        ])


@pytest.mark.asyncio
async def test_retry_delay_calculation(worker):
    """Test exponential backoff delay calculation."""
    assert worker._get_retry_delay(0) == 2  # First retry: 2 seconds
    assert worker._get_retry_delay(1) == 4  # Second retry: 4 seconds
    assert worker._get_retry_delay(2) == 8  # Third retry: 8 seconds
    assert worker._get_retry_delay(3) == 16  # Fourth retry: 16 seconds
    assert worker._get_retry_delay(8) == 300  # Max delay: 5 minutes (capped)


@pytest.mark.asyncio
async def test_error_classification(worker, mock_queue, mock_tracking):
    """Test error type classification."""
    # Setup
    email_id = "test_id"
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test",
        template_name="valid_template",
        template_data={}
    )
    mock_queue.dequeue.return_value = (email_id, email)
    tracking = await mock_tracking(email_id)

    # Mock AsyncSessionLocal to return our test session
    @asynccontextmanager
    async def mock_session():
        class MockSession:
            @asynccontextmanager
            async def begin(self):
                yield self
        yield MockSession()

    test_cases = [
        (Exception("SMTP error: Connection failed"), EmailError.SMTP_ERROR),
        (Exception("Email bounced: Invalid recipient"), EmailError.BOUNCE),
        (ValueError("Template validation failed: Missing required field"), EmailError.TEMPLATE_ERROR),
        (Exception("Unknown error"), EmailError.UNKNOWN),
    ]

    for error, expected_type in test_cases:
        with patch("app.worker.email_worker.send_email", new_callable=AsyncMock) as mock_send, \
             patch("app.worker.email_worker.email_tracking") as mock_tracking_crud, \
             patch("app.worker.email_worker.AsyncSessionLocal", mock_session):
            mock_send.side_effect = error
            mock_tracking_crud.get_by_email_id = AsyncMock(return_value=tracking)
            mock_tracking_crud.update_status = AsyncMock()

            # Execute
            await worker.process_one()

            # Assert error type classification
            if expected_type == EmailError.SMTP_ERROR:
                mock_tracking_crud.update_status.assert_called_with(
                    db=mock.ANY,
                    db_obj=tracking,
                    status=EmailStatus.QUEUED,  # Keep as queued while retrying
                    error_message=mock.ANY,
                    tracking_metadata=mock.ANY
                )
            else:
                status = EmailStatus.BOUNCED if expected_type == EmailError.BOUNCE else EmailStatus.FAILED
                mock_tracking_crud.update_status.assert_called_with(
                    db=mock.ANY,
                    db_obj=tracking,
                    status=status,
                    error_message=mock.ANY,
                    tracking_metadata=mock.ANY
                ) 


@pytest.mark.asyncio
async def test_worker_initialization():
    """Test worker initialization with default values."""
    worker = EmailWorker()
    assert worker.running is False
    assert worker.current_task is None
    assert worker.max_retries == 3


@pytest.mark.asyncio
async def test_worker_initialization_with_custom_queue():
    """Test worker initialization with custom queue."""
    custom_queue = Mock()
    worker = EmailWorker(queue=custom_queue)
    assert worker.queue == custom_queue


@pytest.mark.asyncio
async def test_get_retry_delay():
    """Test retry delay calculation."""
    worker = EmailWorker()
    assert worker._get_retry_delay(0) == 2  # First retry
    assert worker._get_retry_delay(1) == 4  # Second retry
    assert worker._get_retry_delay(2) == 8  # Third retry
    assert worker._get_retry_delay(10) == 300  # Max delay cap


@pytest.mark.asyncio
async def test_classify_error():
    """Test error classification."""
    worker = EmailWorker()
    
    # Test SMTP error
    error_type, msg = worker._classify_error(Exception("SMTP connection failed"))
    assert error_type == EmailError.SMTP_ERROR
    
    # Test bounce error
    error_type, msg = worker._classify_error(Exception("Recipient address bounced"))
    assert error_type == EmailError.BOUNCE
    
    # Test template error
    error_type, msg = worker._classify_error(ValueError("Template validation failed"))
    assert error_type == EmailError.TEMPLATE_ERROR
    
    # Test unknown error
    error_type, msg = worker._classify_error(Exception("Unknown error"))
    assert error_type == EmailError.UNKNOWN


@pytest.mark.asyncio
async def test_validate_template_success(worker):
    """Test successful template validation."""
    worker.template_validator.validate_template_data.return_value = None
    await worker._validate_template("test_template", {"key": "value"})
    worker.template_validator.validate_template_data.assert_called_once_with(
        "test_template",
        {"key": "value"}
    )


@pytest.mark.asyncio
async def test_validate_template_failure(worker):
    """Test template validation failure."""
    error_msg = "Missing required field"
    worker.template_validator.validate_template_data.side_effect = ValueError(error_msg)
    
    with pytest.raises(ValueError) as exc:
        await worker._validate_template("test_template", {})
    assert "Template validation failed" in str(exc.value)
    assert error_msg in str(exc.value)


@pytest.mark.asyncio
async def test_handle_error_smtp_retry(worker, db, mock_tracking):
    """Test handling of SMTP error with retry."""
    tracking = await mock_tracking("test-id")
    error = Exception("SMTP connection failed")
    
    with patch("app.worker.email_worker.email_tracking", new=MagicMock(update_status=AsyncMock())):
        result = await worker._handle_error(
            db=db,
            tracking=tracking,
            email_id="test-id",
            error=error,
            retry_count=0
        )
    
    assert result is False
    worker.queue.requeue.assert_called_once()
    delay_arg = worker.queue.requeue.call_args[1]["delay"]
    assert isinstance(delay_arg, int)
    assert delay_arg == 2  # First retry delay


@pytest.mark.asyncio
async def test_handle_error_max_retries(worker, db, mock_tracking):
    """Test handling error at max retries."""
    tracking = await mock_tracking("test-id")
    error = Exception("SMTP connection failed")
    
    with patch("app.worker.email_worker.email_tracking", new=MagicMock(update_status=AsyncMock())):
        result = await worker._handle_error(
            db=db,
            tracking=tracking,
            email_id="test-id",
            error=error,
            retry_count=worker.max_retries
        )
    
    assert result is False
    worker.queue.mark_failed.assert_called_once()
    worker.queue.requeue.assert_not_called()


@pytest.mark.asyncio
async def test_handle_error_bounce(worker, db, tracking_record_for_bounce):
    """Test handling of bounce error."""
    error = Exception("Recipient address bounced")
    
    result = await worker._handle_error(
        db=db,
        tracking=tracking_record_for_bounce,
        email_id="test-id",
        error=error
    )
    
    assert result is False
    worker.queue.mark_failed.assert_called_once()
    worker.queue.requeue.assert_not_called()
    
    # Verify the database state
    stmt = select(EmailTracking).options(joinedload(EmailTracking.events)).where(EmailTracking.id == tracking_record_for_bounce.id)
    result = await db.execute(stmt)
    updated_tracking = result.unique().scalar_one()
    
    assert updated_tracking.status == EmailStatus.BOUNCED
    assert len(updated_tracking.events) == 1
    assert updated_tracking.events[0].event_type == EmailStatus.BOUNCED


@pytest.mark.asyncio
async def test_process_one_no_tracking_record(
    db: AsyncSession,
    mock_queue,
    mock_send_email,
    worker,
):
    """Test processing email without existing tracking record."""
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={},
    )
    mock_queue.dequeue.return_value = ("new-id", email)
    mock_send_email.return_value = None

    # Mock AsyncSessionLocal
    @asynccontextmanager
    async def mock_session():
        yield db

    with patch("app.worker.email_worker.AsyncSessionLocal", mock_session):
        result = await worker.process_one()
        
        assert result is True
        mock_queue.mark_completed.assert_called_once_with("new-id")
        
        # Verify new tracking record was created
        tracking = await email_tracking.get_by_email_id(db, email_id="new-id")
        assert tracking is not None
        assert tracking.status == EmailStatus.DELIVERED
        assert len(tracking.events) == 3  # QUEUED, SENT, DELIVERED


@pytest.mark.asyncio
async def test_worker_stop_while_running():
    """Test stopping worker while running."""
    worker = EmailWorker()
    worker.start(interval=0.1)
    assert worker.running is True
    assert worker.current_task is not None
    
    worker.stop()
    assert worker.running is False
    await asyncio.sleep(0.2)  # Give time for task to complete
    assert worker.current_task is None 