import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from app.worker.email_worker import EmailWorker
from app.core.email import EmailContent
from app.models.email_tracking import EmailStatus
from redis.asyncio import Redis

@pytest_asyncio.fixture
async def mock_redis():
    """Create a mock Redis client."""
    redis = AsyncMock(spec=Redis)
    redis.rpush = AsyncMock(return_value=1)
    redis.lpop = AsyncMock(return_value=None)
    return redis

@pytest_asyncio.fixture
async def mock_queue(mock_redis):
    """Create a mock email queue."""
    queue = AsyncMock()
    queue.dequeue = AsyncMock(return_value=None)
    queue.mark_completed = AsyncMock()
    queue.mark_failed = AsyncMock()
    queue.requeue = AsyncMock()
    queue.redis = mock_redis
    return queue

@pytest_asyncio.fixture
async def mock_tracking():
    """Create a mock tracking service."""
    async def create_tracking(email_id: str):
        tracking = MagicMock()
        tracking.email_id = email_id
        tracking.status = EmailStatus.QUEUED
        tracking.tracking_metadata = {}
        tracking.error_message = None
        return tracking
    return create_tracking

@pytest_asyncio.fixture
async def worker(mock_queue):
    """Create an email worker with mocked dependencies."""
    worker = EmailWorker(queue=mock_queue)
    worker.template_validator = MagicMock()
    worker.template_validator.validate_template_data = AsyncMock(return_value=True)
    return worker

@pytest.mark.asyncio
async def test_process_one_template_validation_error(worker, mock_queue, mock_tracking):
    """Test handling of template validation errors."""
    # Setup
    email_id = "test_id"
    email = EmailContent(
        to="test@example.com",
        subject="Test",
        template_name="invalid_template",
        template_data={}
    )
    mock_queue.dequeue.return_value = (email_id, email)
    
    # Create tracking record
    tracking_record = await mock_tracking(email_id)
    
    # Mock template validation error
    worker.template_validator.validate_template_data.side_effect = ValueError("Template validation failed: Invalid template")
    
    # Mock email tracking get function
    with patch('app.worker.email_worker.email_tracking.get_by_email_id', return_value=tracking_record):
        result = await worker.process_one()
        
        # Verify results
        assert not result
        mock_queue.mark_failed.assert_called_once_with(email_id)
        mock_queue.mark_completed.assert_not_called()
        mock_queue.requeue.assert_not_called()
        assert tracking_record.status == EmailStatus.FAILED
        assert "Template validation failed" in tracking_record.error_message

@pytest.mark.asyncio
async def test_process_one_empty_queue(worker, mock_queue):
    """Test processing with empty queue."""
    mock_queue.dequeue.return_value = None
    result = await worker.process_one()
    
    assert not result
    mock_queue.dequeue.assert_called_once()
    mock_queue.mark_completed.assert_not_called()
    mock_queue.mark_failed.assert_not_called()

@pytest.mark.asyncio
async def test_process_one_successful(worker, mock_queue, mock_tracking):
    """Test successful email processing."""
    # Setup
    email_id = "test_id"
    email = EmailContent(
        to="test@example.com",
        subject="Test",
        template_name="valid_template",
        template_data={"key": "value"}
    )
    mock_queue.dequeue.return_value = (email_id, email)
    
    # Create tracking record
    tracking_record = await mock_tracking(email_id)
    
    # Mock email tracking get function
    with patch('app.worker.email_worker.email_tracking.get_by_email_id', return_value=tracking_record):
        result = await worker.process_one()
        
        # Verify results
        assert result
        mock_queue.mark_completed.assert_called_once_with(email_id)
        mock_queue.mark_failed.assert_not_called()
        mock_queue.requeue.assert_not_called()
        assert tracking_record.status == EmailStatus.SENT

@pytest.mark.asyncio
async def test_process_one_send_error(worker, mock_queue, mock_tracking):
    """Test handling of email sending errors."""
    # Setup
    email_id = "test_id"
    email = EmailContent(
        to="test@example.com",
        subject="Test",
        template_name="valid_template",
        template_data={"key": "value"}
    )
    mock_queue.dequeue.return_value = (email_id, email)
    
    # Create tracking record
    tracking_record = await mock_tracking(email_id)
    
    # Mock send error
    worker.send_email = AsyncMock(side_effect=Exception("Failed to send email"))
    
    # Mock email tracking get function
    with patch('app.worker.email_worker.email_tracking.get_by_email_id', return_value=tracking_record):
        result = await worker.process_one()
        
        # Verify results
        assert not result
        mock_queue.mark_failed.assert_called_once_with(email_id)
        mock_queue.mark_completed.assert_not_called()
        assert tracking_record.status == EmailStatus.FAILED
        assert "Failed to send email" in tracking_record.error_message 