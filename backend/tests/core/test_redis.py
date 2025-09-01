"""
Test Redis module functionality.

This test verifies that the Redis module works correctly, including:
- Connection pooling
- Monitoring and metrics
- Error handling
- Health checks

We use mocking to avoid actual Redis connections.
"""

import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Import the base class for patching
from redis.asyncio import Redis as AsyncRedis
from redis.exceptions import ConnectionError, TimeoutError

from app.core.redis import (
    REDIS_ERRORS,
    REDIS_OPERATION_DURATION,
    REDIS_OPERATIONS,
    MonitoredRedis,
    check_redis_health,
    get_redis,
    redis_client,
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
    # Mock the base Redis class's execute_command method
    with patch.object(
        AsyncRedis, "execute_command", new_callable=AsyncMock
    ) as mock_base_execute:
        mock_base_execute.return_value = "OK"

        # Mock the metric objects directly
        with patch(
            "app.core.redis.REDIS_OPERATIONS", new_callable=MagicMock
        ) as mock_ops_counter, patch(
            "app.core.redis.REDIS_ERRORS", new_callable=MagicMock
        ) as mock_err_counter, patch(
            "app.core.redis.REDIS_OPERATION_DURATION", new_callable=MagicMock
        ) as mock_duration_hist:
            # Setup return values for the chained metric calls
            mock_ops_labeled = MagicMock()
            mock_ops_counter.labels.return_value = mock_ops_labeled
            mock_duration_labeled = MagicMock()
            mock_duration_hist.labels.return_value = mock_duration_labeled

            # Instantiate MonitoredRedis
            monitored_client = MonitoredRedis(connection_pool=MagicMock())

            # Call the method under test on the instance
            # This will call the *real* MonitoredRedis.execute_command,
            # which in turn calls the *mocked* base_execute
            result = await monitored_client.execute_command("GET", "key")
            assert result == "OK"  # Check return value

            # Verify the base class method was called
            mock_base_execute.assert_called_once_with("GET", "key")

            # Verify metrics were interacted with correctly
            mock_ops_counter.labels.assert_called_once_with(operation="GET")
            mock_ops_labeled.inc.assert_called_once()
            mock_duration_hist.labels.assert_called_once_with(operation="GET")
            mock_duration_labeled.observe.assert_called_once()
            mock_err_counter.labels.assert_not_called()


@pytest.mark.asyncio
async def test_monitored_redis_execute_command_error():
    """Test that MonitoredRedis.execute_command increments error metrics on failure."""
    # Mock the base class method to raise an error
    test_exception = ConnectionError("Connection refused")
    with patch.object(
        AsyncRedis, "execute_command", new_callable=AsyncMock
    ) as mock_base_execute:
        mock_base_execute.side_effect = test_exception

        # Mock the metric objects directly
        with patch(
            "app.core.redis.REDIS_OPERATIONS", new_callable=MagicMock
        ) as mock_ops_counter, patch(
            "app.core.redis.REDIS_ERRORS", new_callable=MagicMock
        ) as mock_err_counter, patch(
            "app.core.redis.REDIS_OPERATION_DURATION", new_callable=MagicMock
        ) as mock_duration_hist:
            # Setup return values for the chained metric calls
            mock_err_labeled = MagicMock()
            mock_err_counter.labels.return_value = mock_err_labeled
            mock_duration_labeled = MagicMock()
            mock_duration_hist.labels.return_value = mock_duration_labeled

            # Instantiate MonitoredRedis
            monitored_client = MonitoredRedis(connection_pool=MagicMock())

            # Call the method and expect an exception
            with pytest.raises(ConnectionError):
                # This will call the *real* MonitoredRedis.execute_command,
                # which in turn calls the *mocked* base_execute
                await monitored_client.execute_command("SET", "key", "value")

            # Verify the base class method was called
            mock_base_execute.assert_called_once_with("SET", "key", "value")

            # Verify error metrics were incremented
            mock_err_counter.labels.assert_called_once_with(
                error_type="ConnectionError"
            )
            mock_err_labeled.inc.assert_called_once()
            mock_duration_hist.labels.assert_called_once_with(operation="SET")
            mock_duration_labeled.observe.assert_called_once()
            mock_ops_counter.labels.assert_not_called()


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
