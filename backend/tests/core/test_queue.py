"""
Test queue module functionality.

This test verifies that the queue module works correctly, including:
- Email queue initialization
- Enqueuing emails
- Dequeuing emails
- Marking emails as completed or failed
- Requeuing emails
- Queue size tracking

All tests use mocking to avoid actual Redis connections.
"""

import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
import uuid

from app.core.queue import (
    EmailQueue,
    EmailQueueItem,
    QueuedEmail,
    email_queue,
)


@pytest.fixture
def mock_redis():
    """Create a mock Redis client."""
    redis_mock = AsyncMock()
    # Setup common mock methods
    redis_mock.hset = AsyncMock()
    redis_mock.hget = AsyncMock()
    redis_mock.zadd = AsyncMock()
    redis_mock.zrem = AsyncMock()
    redis_mock.zrangebyscore = AsyncMock()
    redis_mock.zcard = AsyncMock()
    redis_mock.close = AsyncMock()
    return redis_mock


@pytest.fixture
def email_queue_instance(mock_redis):
    """Create an EmailQueue instance with a mock Redis client."""
    queue = EmailQueue(redis=mock_redis)
    return queue


@pytest.fixture
def sample_email_item():
    """Create a sample EmailQueueItem."""
    return EmailQueueItem(
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_template",
        template_data={"name": "Test User"},
        cc=["cc@example.com"],
        bcc=["bcc@example.com"],
        reply_to=["reply@example.com"],
    )


@pytest.fixture
def sample_queued_email():
    """Create a sample QueuedEmail."""
    return QueuedEmail(
        id="test-id-123",
        email_to="test@example.com",
        subject="Test Subject",
        template_name="test_template",
        template_data={"name": "Test User"},
        cc=["cc@example.com"],
        bcc=["bcc@example.com"],
        reply_to=["reply@example.com"],
        created_at=datetime.now(),
        scheduled_for=None,
        status="queued",
        error=None,
    )


@pytest.mark.asyncio
async def test_email_queue_init():
    """Test that EmailQueue initializes correctly."""
    # Create queue with default Redis client
    queue = EmailQueue()
    
    # Verify queue keys
    assert queue.queue_key == "email:queue"
    assert queue.processing_key == "email:processing"
    assert queue.completed_key == "email:completed"
    assert queue.failed_key == "email:failed"
    assert queue.email_data_key == "email:data"


@pytest.mark.asyncio
async def test_enqueue(email_queue_instance, mock_redis, sample_email_item):
    """Test enqueuing an email."""
    # Define a fixed timestamp
    fixed_time = datetime(2024, 1, 1, 12, 0, 0)
    expected_ts_int = int(fixed_time.timestamp() * 1000000)
    expected_uuid = str(uuid.UUID(int=expected_ts_int))
    
    # Mock datetime.now() used for ID generation and timestamping
    with patch('app.core.queue.datetime') as mock_dt:
        mock_dt.now.return_value = fixed_time
        mock_dt.timestamp.side_effect = lambda: fixed_time.timestamp() # Ensure timestamp() method works

        # Enqueue email
        email_id = await email_queue_instance.enqueue(sample_email_item)
    
        # Verify email ID uses the fixed time
        assert email_id == expected_uuid 
        
        # Verify Redis calls
        # Check hset call (data storage)
        mock_redis.hset.assert_called_once()
        hset_args = mock_redis.hset.call_args[0]
        assert hset_args[0] == email_queue_instance.email_data_key # Check key name
        assert hset_args[1] == email_id # Check email ID
        # Decode the stored JSON data to verify content
        stored_data = json.loads(hset_args[2])
        assert stored_data['id'] == email_id
        assert stored_data['subject'] == sample_email_item.subject
        assert stored_data['status'] == 'queued'
        assert stored_data['created_at'] == fixed_time.isoformat() # Check timestamp
        
        # Check zadd call (queue ordering)
        mock_redis.zadd.assert_called_once_with(
            email_queue_instance.queue_key, 
            {email_id: fixed_time.timestamp()}
        )


@pytest.mark.asyncio
async def test_enqueue_with_delay(email_queue_instance, mock_redis, sample_email_item):
    """Test enqueuing an email with delay using datetime patching."""
    # Define fixed times
    now_fixed = datetime(2024, 1, 1, 12, 0, 0)
    delay = timedelta(minutes=5)
    scheduled_fixed = now_fixed + delay
    expected_ts_int = int(now_fixed.timestamp() * 1000000)
    expected_uuid = str(uuid.UUID(int=expected_ts_int))
    
    # Mock datetime.now() for consistent ID generation and scheduling base
    with patch('app.core.queue.datetime') as mock_dt:
        mock_dt.now.return_value = now_fixed
        mock_dt.timestamp.side_effect = lambda: now_fixed.timestamp() # Ensure timestamp() method works
        
        # Enqueue email with delay
        email_id = await email_queue_instance.enqueue(sample_email_item, delay=delay)
        
        # Verify email ID uses the fixed time
        assert email_id == expected_uuid
        
        # Verify Redis hset call (data check - optional but good)
        mock_redis.hset.assert_called_once()
        stored_data = json.loads(mock_redis.hset.call_args[0][2])
        assert stored_data['id'] == email_id
        assert stored_data['scheduled_for'] == scheduled_fixed.isoformat()

        # Verify Redis zadd call (queue ordering)
        mock_redis.zadd.assert_called_once()
        zadd_args = mock_redis.zadd.call_args[0]
        assert zadd_args[0] == email_queue_instance.queue_key # Queue name
        # Check the score matches the *scheduled* time
        assert list(zadd_args[1].keys())[0] == email_id # Check the member is the email ID
        assert list(zadd_args[1].values())[0] == scheduled_fixed.timestamp() # Check the score


@pytest.mark.asyncio
async def test_dequeue(email_queue_instance, mock_redis):
    """Test dequeuing an email."""
    # Setup mock Redis response
    email_id = "test-id-123"
    mock_redis.zrangebyscore.return_value = [email_id]
    
    email_data = {
        "id": email_id,
        "email_to": "test@example.com",
        "subject": "Test Subject",
        "template_name": "test_template",
        "template_data": {"name": "Test User"},
        "cc": ["cc@example.com"],
        "bcc": ["bcc@example.com"],
        "reply_to": ["reply@example.com"],
        "status": "queued",
        "created_at": datetime.now().isoformat(),
        "scheduled_for": None,
        "error": None,
    }
    mock_redis.hget.return_value = json.dumps(email_data)
    
    # Dequeue email
    result = await email_queue_instance.dequeue()
    
    # Verify result
    assert result is not None
    dequeued_id, dequeued_item = result
    assert dequeued_id == email_id
    assert dequeued_item.email_to == "test@example.com"
    assert dequeued_item.subject == "Test Subject"
    assert dequeued_item.template_name == "test_template"
    
    # Verify Redis calls
    mock_redis.zrangebyscore.assert_called_once()
    mock_redis.hget.assert_called_once_with("email:data", email_id)
    mock_redis.zrem.assert_called_once_with("email:queue", email_id)
    mock_redis.zadd.assert_called_once()


@pytest.mark.asyncio
async def test_dequeue_empty_queue(email_queue_instance, mock_redis):
    """Test dequeuing from an empty queue."""
    # Setup mock Redis response for empty queue
    mock_redis.zrangebyscore.return_value = []
    
    # Dequeue email
    result = await email_queue_instance.dequeue()
    
    # Verify result is None
    assert result is None
    
    # Verify Redis calls
    mock_redis.zrangebyscore.assert_called_once()
    mock_redis.hget.assert_not_called()


@pytest.mark.asyncio
async def test_dequeue_missing_data(email_queue_instance, mock_redis):
    """Test dequeuing an email with missing data."""
    # Setup mock Redis response
    email_id = "test-id-123"
    mock_redis.zrangebyscore.return_value = [email_id]
    mock_redis.hget.return_value = None
    
    # Dequeue email
    result = await email_queue_instance.dequeue()
    
    # Verify result is None
    assert result is None
    
    # Verify Redis calls
    mock_redis.zrangebyscore.assert_called_once()
    mock_redis.hget.assert_called_once_with("email:data", email_id)
    mock_redis.zrem.assert_called_once_with("email:queue", email_id)


@pytest.mark.asyncio
async def test_mark_completed(email_queue_instance, mock_redis):
    """Test marking an email as completed."""
    # Setup mock Redis response
    email_id = "test-id-123"
    email_data = {
        "id": email_id,
        "email_to": "test@example.com",
        "subject": "Test Subject",
        "template_name": "test_template",
        "status": "processing",
    }
    mock_redis.hget.return_value = json.dumps(email_data)
    
    # Mark email as completed
    await email_queue_instance.mark_completed(email_id)
    
    # Verify Redis calls
    mock_redis.hget.assert_called_once_with("email:data", email_id)
    
    # Verify status update
    hset_call_args = mock_redis.hset.call_args[0]
    assert hset_call_args[0] == "email:data"
    assert hset_call_args[1] == email_id
    updated_data = json.loads(hset_call_args[2])
    assert updated_data["status"] == "completed"
    
    # Verify moved from processing to completed
    mock_redis.zrem.assert_called_once_with("email:processing", email_id)
    mock_redis.zadd.assert_called_once()
    zadd_call_args = mock_redis.zadd.call_args[0]
    assert zadd_call_args[0] == "email:completed"


@pytest.mark.asyncio
async def test_mark_failed(email_queue_instance, mock_redis):
    """Test marking an email as failed."""
    # Setup mock Redis response
    email_id = "test-id-123"
    email_data = {
        "id": email_id,
        "email_to": "test@example.com",
        "subject": "Test Subject",
        "template_name": "test_template",
        "status": "processing",
    }
    mock_redis.hget.return_value = json.dumps(email_data)
    
    # Mark email as failed
    error_message = "Test error message"
    await email_queue_instance.mark_failed(email_id, error_message)
    
    # Verify Redis calls
    mock_redis.hget.assert_called_once_with("email:data", email_id)
    
    # Verify status and error update
    hset_call_args = mock_redis.hset.call_args[0]
    assert hset_call_args[0] == "email:data"
    assert hset_call_args[1] == email_id
    updated_data = json.loads(hset_call_args[2])
    assert updated_data["status"] == "failed"
    assert updated_data["error"] == error_message
    
    # Verify moved from processing to failed
    mock_redis.zrem.assert_called_once_with("email:processing", email_id)
    mock_redis.zadd.assert_called_once()
    zadd_call_args = mock_redis.zadd.call_args[0]
    assert zadd_call_args[0] == "email:failed"


@pytest.mark.asyncio
async def test_requeue(email_queue_instance, mock_redis):
    """Test requeuing a failed email."""
    # Setup mock Redis response
    email_id = "test-id-123"
    email_data = {
        "id": email_id,
        "email_to": "test@example.com",
        "subject": "Test Subject",
        "template_name": "test_template",
        "status": "failed",
        "error": "Previous error",
    }
    mock_redis.hget.return_value = json.dumps(email_data)
    
    # Requeue email
    await email_queue_instance.requeue(email_id)
    
    # Verify Redis calls
    mock_redis.hget.assert_called_once_with("email:data", email_id)
    
    # Verify status and error update
    hset_call_args = mock_redis.hset.call_args[0]
    assert hset_call_args[0] == "email:data"
    assert hset_call_args[1] == email_id
    updated_data = json.loads(hset_call_args[2])
    assert updated_data["status"] == "queued"
    assert updated_data["error"] is None
    
    # Verify removed from failed and added to queue
    assert mock_redis.zrem.call_count == 2
    mock_redis.zrem.assert_any_call("email:processing", email_id)
    mock_redis.zrem.assert_any_call("email:failed", email_id)
    mock_redis.zadd.assert_called_once()
    zadd_call_args = mock_redis.zadd.call_args[0]
    assert zadd_call_args[0] == "email:queue"


@pytest.mark.asyncio
async def test_requeue_with_delay(email_queue_instance, mock_redis):
    """Test requeuing a failed email with delay."""
    # Setup mock Redis response
    email_id = "test-id-123"
    email_data = {
        "id": email_id,
        "email_to": "test@example.com",
        "subject": "Test Subject",
        "template_name": "test_template",
        "status": "failed",
        "error": "Previous error",
    }
    mock_redis.hget.return_value = json.dumps(email_data)
    
    # Requeue email with delay
    delay = timedelta(minutes=5)
    await email_queue_instance.requeue(email_id, delay=delay)
    
    # Verify Redis calls
    mock_redis.hget.assert_called_once_with("email:data", email_id)
    
    # Verify status and error update
    hset_call_args = mock_redis.hset.call_args[0]
    updated_data = json.loads(hset_call_args[2])
    assert updated_data["status"] == "queued"
    
    # Verify scheduled time in the future
    zadd_call_args = mock_redis.zadd.call_args[0]
    assert zadd_call_args[0] == "email:queue"


@pytest.mark.asyncio
async def test_get_queue_size(email_queue_instance, mock_redis):
    """Test getting queue size."""
    # Setup mock Redis response
    mock_redis.zcard.return_value = 5
    
    # Get queue size
    size = await email_queue_instance.get_queue_size()
    
    # Verify result
    assert size == 5
    
    # Verify Redis calls
    mock_redis.zcard.assert_called_once_with("email:queue")


@pytest.mark.asyncio
async def test_get_processing_size(email_queue_instance, mock_redis):
    """Test getting processing size."""
    # Setup mock Redis response
    mock_redis.zcard.return_value = 3
    
    # Get processing size
    size = await email_queue_instance.get_processing_size()
    
    # Verify result
    assert size == 3
    
    # Verify Redis calls
    mock_redis.zcard.assert_called_once_with("email:processing")


@pytest.mark.asyncio
async def test_get_completed_size(email_queue_instance, mock_redis):
    """Test getting completed size."""
    # Setup mock Redis response
    mock_redis.zcard.return_value = 10
    
    # Get completed size
    size = await email_queue_instance.get_completed_size()
    
    # Verify result
    assert size == 10
    
    # Verify Redis calls
    mock_redis.zcard.assert_called_once_with("email:completed")


@pytest.mark.asyncio
async def test_get_failed_size(email_queue_instance, mock_redis):
    """Test getting failed size."""
    # Setup mock Redis response
    mock_redis.zcard.return_value = 2
    
    # Get failed size
    size = await email_queue_instance.get_failed_size()
    
    # Verify result
    assert size == 2
    
    # Verify Redis calls
    mock_redis.zcard.assert_called_once_with("email:failed")


@pytest.mark.asyncio
async def test_global_email_queue_instance():
    """Test that the global email_queue instance is created correctly."""
    assert isinstance(email_queue, EmailQueue)
    assert email_queue.queue_key == "email:queue"
    assert email_queue.processing_key == "email:processing"
    assert email_queue.completed_key == "email:completed"
    assert email_queue.failed_key == "email:failed"
    assert email_queue.email_data_key == "email:data" 