import asyncio
import logging
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from app.worker.email_worker import EmailWorker
from redis.asyncio import Redis

from app.core.email import EmailContent
from app.core.queue import EmailQueueItem

logger = logging.getLogger(__name__)


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
        template_data={"key": "value"},
    )
    mock_queue.dequeue.return_value = (email_id, email)

    # Mock send_email function
    with patch("app.worker.email_worker.send_email", AsyncMock(return_value=None)):
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
        template_data={"key": "value"},
    )
    mock_queue.dequeue.return_value = (email_id, email)

    # Mock send_email to raise an exception
    with patch(
        "app.worker.email_worker.send_email",
        AsyncMock(side_effect=Exception("Failed to send email")),
    ):
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
    # Allow event loop to process cancellation
    await asyncio.sleep(0)
    assert worker.processing_task.cancelled()


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
    """Test the processing loop runs, handles side effects, and cancels."""
    # Setup side effects for process_one: success, stop, error, then keep running
    worker.process_one = AsyncMock(
        side_effect=[True, False, Exception("Test error"), True, True]
    )
    worker.processing_interval = 0.01  # Speed up loop for testing
    worker.error_interval = 0.01

    # Start the worker
    worker.is_running = True
    loop_task = asyncio.create_task(worker._process_loop(), name="TestProcessLoop")

    # Allow loop to run through initial side effects
    await asyncio.sleep(0.1)

    # Assert process_one was called at least 3 times (True, False, Exception)
    assert worker.process_one.call_count >= 3

    # Cancel the task directly
    logger.info(f"Test cancelling task {loop_task.get_name()}")
    loop_task.cancel()

    # Wait for the task to finish and confirm it was cancelled
    cancelled_correctly = False
    try:
        await asyncio.wait_for(loop_task, timeout=1.0)
    except asyncio.CancelledError:
        logger.info(f"Task {loop_task.get_name()} successfully cancelled as expected.")
        cancelled_correctly = True
    except asyncio.TimeoutError:
        pytest.fail(f"Task {loop_task.get_name()} did not cancel within timeout.")
    except Exception as e:
        pytest.fail(f"Task {loop_task.get_name()} raised unexpected exception: {e}")

    assert cancelled_correctly, "Loop task should have been cancelled."
    assert (
        not worker.is_running
    ), "Worker should be marked as not running after loop exits/cancels"
