"""Test email queue functionality."""
import json
import pytest
import pytest_asyncio
from unittest import mock
from unittest.mock import patch, MagicMock, AsyncMock
from uuid import UUID
from datetime import datetime

from app.core.queue import email_queue, EmailQueueItem, QueuedEmail


@pytest_asyncio.fixture
async def mock_redis():
    """Mock Redis for testing."""
    mock = AsyncMock()
    mock.incr = AsyncMock(return_value=1)
    mock.hset = AsyncMock(return_value=True)
    mock.zadd = AsyncMock(return_value=1)
    # Return a UUID-like string for zrangebyscore
    mock.zrangebyscore = AsyncMock(return_value=["00000000-0000-0000-0000-000000000001"])
    mock.hget = AsyncMock(return_value=None)
    mock.hdel = AsyncMock(return_value=1)
    mock.zrem = AsyncMock(return_value=1)
    mock.zcard = AsyncMock(return_value=5)

    with patch("app.core.queue.EmailQueue.connect") as mock_connect:
        mock_connect.return_value = None
        email_queue.redis = mock
        yield mock
        email_queue.redis = None


@pytest.mark.asyncio
async def test_enqueue_email(mock_redis):
    """Test enqueueing an email."""
    # Setup
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={"key": "value"},
    )

    # Test
    email_id = await email_queue.enqueue(email)

    # Verify
    # Ensure email_id is a valid UUID
    assert UUID(email_id)
    mock_redis.hset.assert_awaited_once()
    mock_redis.zadd.assert_awaited_once()


@pytest.mark.asyncio
async def test_dequeue_email(mock_redis):
    """Test dequeuing an email."""
    # Setup
    test_uuid = "00000000-0000-0000-0000-000000000001"
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={"key": "value"},
    )
    mock_redis.hget = AsyncMock(return_value=email.model_dump_json().encode())
    mock_redis.zrangebyscore = AsyncMock(return_value=[test_uuid])

    # Test
    result = await email_queue.dequeue()

    # Verify
    assert result is not None
    email_id, queued_email = result
    assert email_id == test_uuid
    assert queued_email.email_to == email.email_to
    assert queued_email.subject == email.subject


@pytest.mark.asyncio
async def test_mark_completed(mock_redis):
    """Test marking an email as completed."""
    # Setup
    test_uuid = "00000000-0000-0000-0000-000000000001"
    email = QueuedEmail(
        id=test_uuid,
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={"key": "value"},
        status="processing",
        created_at=datetime.now(),
    )
    mock_redis.hget = AsyncMock(return_value=email.model_dump_json().encode())

    # Test
    await email_queue.mark_completed(test_uuid)

    # Verify
    mock_redis.hget.assert_awaited_once_with(email_queue.email_data_key, test_uuid)
    mock_redis.hset.assert_awaited_once()  # Updated status
    mock_redis.zrem.assert_awaited_once_with(email_queue.processing_key, test_uuid)
    mock_redis.zadd.assert_awaited_once()  # Added to completed set


@pytest.mark.asyncio
async def test_mark_failed(mock_redis):
    """Test marking an email as failed."""
    # Setup
    test_uuid = "00000000-0000-0000-0000-000000000001"
    email = QueuedEmail(
        id=test_uuid,
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={"key": "value"},
        status="processing",
        created_at=datetime.now(),
    )
    mock_redis.hget = AsyncMock(return_value=email.model_dump_json().encode())

    # Test
    error_msg = "Test error"
    await email_queue.mark_failed(test_uuid, error_msg)

    # Verify
    mock_redis.hget.assert_awaited_once_with(email_queue.email_data_key, test_uuid)
    mock_redis.hset.assert_awaited_once()  # Updated status and error
    mock_redis.zrem.assert_awaited_once_with(email_queue.processing_key, test_uuid)
    mock_redis.zadd.assert_awaited_once()  # Added to failed set


@pytest.mark.asyncio
async def test_retry_failed(mock_redis):
    """Test retrying a failed email."""
    # Setup
    test_uuid = "00000000-0000-0000-0000-000000000001"
    email = QueuedEmail(
        id=test_uuid,
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={"key": "value"},
        status="failed",
        error="Test error",
        created_at=datetime.now(),
    )
    mock_redis.hget = AsyncMock(return_value=email.model_dump_json().encode())

    # Test
    await email_queue.requeue(test_uuid)

    # Verify
    mock_redis.hget.assert_awaited_once_with(email_queue.email_data_key, test_uuid)
    mock_redis.hset.assert_awaited_once()  # Updated status and error
    mock_redis.zrem.assert_has_awaits([
        mock.call(email_queue.processing_key, test_uuid),
        mock.call(email_queue.failed_key, test_uuid),
    ])
    mock_redis.zadd.assert_awaited_once()  # Added back to queue


@pytest.mark.asyncio
async def test_queue_sizes(mock_redis):
    """Test getting queue sizes."""
    # Setup
    mock_redis.zcard = AsyncMock(return_value=5)

    # Test
    queue_size = await email_queue.get_queue_size()
    processing_size = await email_queue.get_processing_size()
    failed_size = await email_queue.get_failed_size()

    # Verify
    assert queue_size == 5
    assert processing_size == 5
    assert failed_size == 5

    # Verify zcard is called with correct keys
    assert mock_redis.zcard.await_count == 3
    mock_redis.zcard.assert_has_awaits([
        mock.call(email_queue.queue_key),
        mock.call(email_queue.processing_key),
        mock.call(email_queue.failed_key),
    ]) 