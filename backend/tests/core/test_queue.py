"""Test email queue functionality."""
import json
import pytest
import pytest_asyncio
from unittest import mock
from unittest.mock import patch, MagicMock, AsyncMock

from app.core.queue import email_queue, QueuedEmail


@pytest_asyncio.fixture
async def mock_redis():
    """Mock Redis for testing."""
    mock = AsyncMock()
    mock.incr = AsyncMock(return_value=1)
    mock.hset = AsyncMock(return_value=True)
    mock.zadd = AsyncMock(return_value=1)
    mock.zrevrange = AsyncMock(return_value=[b"1"])
    mock.hget = AsyncMock(return_value=None)
    mock.hdel = AsyncMock(return_value=1)
    mock.zrem = AsyncMock(return_value=1)
    mock.hlen = AsyncMock(return_value=5)

    with patch("app.core.queue.EmailQueue.connect") as mock_connect:
        mock_connect.return_value = None
        email_queue.redis = mock
        yield mock
        email_queue.redis = None


@pytest.mark.asyncio
async def test_enqueue_email(mock_redis):
    """Test enqueueing an email."""
    # Setup
    email = QueuedEmail(
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={"key": "value"},
        priority=1,
    )

    # Test
    email_id = await email_queue.enqueue(email)

    # Verify
    assert email_id == "1"
    mock_redis.hset.assert_awaited_once()
    mock_redis.zadd.assert_awaited_once()


@pytest.mark.asyncio
async def test_dequeue_email(mock_redis):
    """Test dequeuing an email."""
    # Setup
    email = QueuedEmail(
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={"key": "value"},
    )
    mock_redis.hget = AsyncMock(return_value=email.model_dump_json().encode())

    # Test
    result = await email_queue.dequeue()

    # Verify
    assert result is not None
    email_id, queued_email = result
    assert email_id == "1"
    assert queued_email.email_to == email.email_to
    assert queued_email.subject == email.subject


@pytest.mark.asyncio
async def test_mark_completed(mock_redis):
    """Test marking an email as completed."""
    # Test
    await email_queue.mark_completed("1")

    # Verify
    mock_redis.hdel.assert_awaited_once_with(email_queue.processing_key, "1")


@pytest.mark.asyncio
async def test_mark_failed(mock_redis):
    """Test marking an email as failed."""
    # Setup
    email = QueuedEmail(
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={"key": "value"},
    )
    email_data = email.model_dump_json()
    mock_redis.hget = AsyncMock(return_value=email_data.encode())

    # Test
    error_msg = "Test error"
    await email_queue.mark_failed("1", error_msg)

    # Verify
    mock_redis.hdel.assert_awaited_once_with(email_queue.processing_key, "1")
    mock_redis.hset.assert_awaited_once()


@pytest.mark.asyncio
async def test_retry_failed(mock_redis):
    """Test retrying a failed email."""
    # Setup
    email = QueuedEmail(
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_email",
        template_data={"key": "value"},
        priority=1,
    )
    email_data = {
        **json.loads(email.model_dump_json()),
        "error": "Test error",
        "failed_at": "now()",
    }
    mock_redis.hget = AsyncMock(return_value=json.dumps(email_data).encode())

    # Test
    result = await email_queue.retry_failed("1")

    # Verify
    assert result is True
    mock_redis.hdel.assert_awaited_once_with(email_queue.failed_key, "1")
    mock_redis.hset.assert_awaited_once()
    mock_redis.zadd.assert_awaited_once()


@pytest.mark.asyncio
async def test_queue_sizes(mock_redis):
    """Test getting queue sizes."""
    # Setup
    mock_redis.hlen = AsyncMock(return_value=5)

    # Test
    queue_size = await email_queue.get_queue_size()
    processing_size = await email_queue.get_processing_size()
    failed_size = await email_queue.get_failed_size()

    # Verify
    assert queue_size == 5
    assert processing_size == 5
    assert failed_size == 5

    # Verify hlen is called with correct keys
    assert mock_redis.hlen.await_count == 3
    mock_redis.hlen.assert_has_awaits([
        mock.call(email_queue.queue_key),
        mock.call(email_queue.processing_key),
        mock.call(email_queue.failed_key),
    ]) 