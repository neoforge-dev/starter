import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from app.worker.email_worker import EmailWorker
from app.core.email import EmailContent
from app.core.queue import EmailQueueItem
from redis.asyncio import Redis
import asyncio

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
async def worker(mock_queue):
    """Create an email worker with mocked dependencies."""
    worker = EmailWorker(queue=mock_queue)
    return worker

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
async def test_process_one_successful(worker, mock_queue):
    """Test successful email processing."""
    # Setup
    email_id = "test_id"
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test",
        template_name="valid_template",
        template_data={"key": "value"}
    )
    mock_queue.dequeue.return_value = (email_id, email)
    
    # Mock send_email function
    with patch('app.worker.email_worker.send_email', AsyncMock(return_value=None)):
        result = await worker.process_one()
        
        # Verify results
        assert result
        mock_queue.mark_completed.assert_called_once_with(email_id)
        mock_queue.mark_failed.assert_not_called()

@pytest.mark.asyncio
async def test_process_one_send_error(worker, mock_queue):
    """Test handling of email sending errors."""
    # Setup
    email_id = "test_id"
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test",
        template_name="valid_template",
        template_data={"key": "value"}
    )
    mock_queue.dequeue.return_value = (email_id, email)
    
    # Mock send_email to raise an exception
    with patch('app.worker.email_worker.send_email', AsyncMock(side_effect=Exception("Failed to send email"))):
        result = await worker.process_one()
        
        # Verify results
        assert not result
        mock_queue.mark_failed.assert_called_once_with(email_id, "Failed to send email")
        mock_queue.mark_completed.assert_not_called()

@pytest.mark.asyncio
async def test_start_stop(worker):
    """Test starting and stopping the worker."""
    # Mock the _process_loop method
    worker._process_loop = AsyncMock()
    
    # Test starting
    worker.start()
    assert worker.is_running
    assert worker.processing_task is not None
    
    # Test stopping
    worker.stop()
    assert not worker.is_running
    assert worker.processing_task.cancel.called

@pytest.mark.asyncio
async def test_start_with_no_queue(worker):
    """Test starting the worker with no queue."""
    # Remove the queue
    worker.queue = None
    
    # Mock the _process_loop method
    worker._process_loop = AsyncMock()
    
    # Test starting
    worker.start()
    assert not worker.is_running
    assert worker.processing_task is None

@pytest.mark.asyncio
async def test_process_loop(worker, mock_queue):
    """Test the processing loop."""
    # Setup
    worker.process_one = AsyncMock(side_effect=[True, False, Exception("Test error"), asyncio.CancelledError()])
    
    # Start the worker
    worker.is_running = True
    
    # Run the process loop with a timeout
    with pytest.raises(asyncio.CancelledError):
        await asyncio.wait_for(worker._process_loop(), timeout=1.0)
    
    # Verify the process_one method was called multiple times
    assert worker.process_one.call_count >= 2 