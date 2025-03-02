"""
Test Redis module functionality.

This test verifies that the Redis module works correctly, including:
- Connection pooling
- Monitoring and metrics
- Error handling
- Health checks

We use mocking to avoid actual Redis connections.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import time
from redis.exceptions import ConnectionError, TimeoutError

from app.core.redis import (
    MonitoredRedis,
    get_redis,
    check_redis_health,
    redis_client,
    REDIS_OPERATIONS,
    REDIS_ERRORS,
    REDIS_OPERATION_DURATION,
)


@pytest.fixture
def mock_redis():
    """Create a mock Redis client."""
    mock = AsyncMock()
    mock.ping = AsyncMock(return_value=True)
    return mock


@pytest.mark.asyncio
async def test_monitored_redis_execute_command_success():
    """Test that MonitoredRedis.execute_command increments metrics on success."""
    # Create a mock Redis client
    mock_super_execute = AsyncMock(return_value="OK")
    
    # Create a MonitoredRedis instance with mocked super().execute_command
    with patch.object(MonitoredRedis, 'execute_command', return_value=mock_super_execute):
        with patch.object(REDIS_OPERATIONS, 'labels') as mock_labels:
            with patch.object(REDIS_OPERATION_DURATION, 'labels') as mock_duration_labels:
                # Setup mocks
                mock_inc = AsyncMock()
                mock_observe = AsyncMock()
                mock_labels.return_value.inc = mock_inc
                mock_duration_labels.return_value.observe = mock_observe
                
                # Call the method
                result = await redis_client.execute_command("GET", "key")
                
                # Verify metrics were incremented
                mock_labels.assert_called_once_with(operation="GET")
                mock_inc.assert_called_once()
                mock_duration_labels.assert_called_once_with(operation="GET")
                mock_observe.assert_called_once()


@pytest.mark.asyncio
async def test_monitored_redis_execute_command_error():
    """Test that MonitoredRedis.execute_command increments error metrics on failure."""
    # Create a mock Redis client that raises an exception
    mock_super_execute = AsyncMock(side_effect=ConnectionError("Connection refused"))
    
    # Create a MonitoredRedis instance with mocked super().execute_command
    with patch.object(MonitoredRedis, 'execute_command', side_effect=ConnectionError("Connection refused")):
        with patch.object(REDIS_ERRORS, 'labels') as mock_error_labels:
            with patch.object(REDIS_OPERATION_DURATION, 'labels') as mock_duration_labels:
                # Setup mocks
                mock_inc = AsyncMock()
                mock_observe = AsyncMock()
                mock_error_labels.return_value.inc = mock_inc
                mock_duration_labels.return_value.observe = mock_observe
                
                # Call the method and expect an exception
                with pytest.raises(ConnectionError):
                    await redis_client.execute_command("GET", "key")
                
                # Verify error metrics were incremented
                mock_error_labels.assert_called_once_with(error_type="ConnectionError")
                mock_inc.assert_called_once()
                mock_duration_labels.assert_called_once_with(operation="GET")
                mock_observe.assert_called_once()


@pytest.mark.asyncio
async def test_get_redis():
    """Test that get_redis yields a Redis client."""
    # Use the generator
    async for redis in get_redis():
        # Verify we got the global redis_client
        assert redis is redis_client
        break


@pytest.mark.asyncio
async def test_check_redis_health_success(mock_redis):
    """Test that check_redis_health returns True when Redis is healthy."""
    # Call the function
    is_healthy, error = await check_redis_health(mock_redis)
    
    # Verify the result
    assert is_healthy is True
    assert error is None
    mock_redis.ping.assert_called_once()


@pytest.mark.asyncio
async def test_check_redis_health_failure(mock_redis):
    """Test that check_redis_health returns False when Redis is unhealthy."""
    # Make the ping method raise an exception
    mock_redis.ping.side_effect = ConnectionError("Connection refused")
    
    # Call the function
    is_healthy, error = await check_redis_health(mock_redis)
    
    # Verify the result
    assert is_healthy is False
    assert error == "Connection refused"
    mock_redis.ping.assert_called_once() 