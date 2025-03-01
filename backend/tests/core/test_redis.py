"""Test Redis functionality and monitoring."""
import pytest
import asyncio
from typing import AsyncGenerator
from unittest.mock import AsyncMock, patch, MagicMock
from redis.asyncio import Redis, ConnectionPool, BlockingConnectionPool
from redis.exceptions import ConnectionError, TimeoutError, ResponseError
from prometheus_client import REGISTRY

from app.core.redis import (
    get_redis,
    check_redis_health,
    redis_client,
    REDIS_OPERATIONS,
    REDIS_ERRORS,
    REDIS_OPERATION_DURATION,
)
from app.core.config import settings

pytestmark = pytest.mark.asyncio

@pytest.fixture
async def mock_redis():
    """Create a mock Redis client with monitoring."""
    redis = AsyncMock(spec=Redis)
    redis.ping = AsyncMock(return_value=True)
    redis.set = AsyncMock(return_value=True)
    redis.get = AsyncMock(return_value="test_value")
    redis.delete = AsyncMock(return_value=1)
    redis.close = AsyncMock()
    redis.pipeline = AsyncMock()
    return redis

@pytest.fixture(autouse=True)
def clear_metrics():
    """Clear metrics before each test."""
    REDIS_OPERATIONS._metrics.clear()
    REDIS_ERRORS._metrics.clear()
    REDIS_OPERATION_DURATION._metrics.clear()

async def test_redis_connection_success(mock_redis):
    """Test successful Redis connection and basic operations."""
    async for redis in get_redis():
        # Test ping
        assert await redis.ping()
        
        # Test set/get
        await redis.set("test_key", "test_value")
        value = await redis.get("test_key")
        assert value == "test_value"
        
        # Test delete
        await redis.delete("test_key")
        assert await redis.get("test_key") is None
        
        # Verify metrics
        assert REDIS_OPERATIONS.labels(operation="ping")._value.get() == 1
        assert REDIS_OPERATIONS.labels(operation="set")._value.get() == 1
        assert REDIS_OPERATIONS.labels(operation="get")._value.get() == 2
        assert REDIS_OPERATIONS.labels(operation="delete")._value.get() == 1

async def test_redis_connection_error():
    """Test Redis connection error handling."""
    with patch("app.core.redis.redis_client", side_effect=ConnectionError("Connection refused")):
        async for redis in get_redis():
            assert redis is None
            assert REDIS_ERRORS.labels(error_type="ConnectionError")._value.get() == 1

async def test_redis_health_check(mock_redis):
    """Test Redis health check functionality."""
    # Test successful health check
    is_healthy, error = await check_redis_health(mock_redis)
    assert is_healthy
    assert error is None
    
    # Test failed health check
    mock_redis.ping.side_effect = ConnectionError("Connection refused")
    is_healthy, error = await check_redis_health(mock_redis)
    assert not is_healthy
    assert "Connection refused" in error

async def test_redis_pipeline(mock_redis):
    """Test Redis pipeline operations."""
    # Setup mock pipeline
    mock_pipeline = AsyncMock()
    mock_pipeline.execute = AsyncMock(return_value=["value1", "value2"])
    mock_redis.pipeline.return_value.__aenter__.return_value = mock_pipeline
    
    async with mock_redis.pipeline(transaction=True) as pipe:
        await pipe.set("key1", "value1")
        await pipe.set("key2", "value2")
        results = await pipe.execute()
    
    assert results == ["value1", "value2"]
    assert REDIS_OPERATIONS.labels(operation="pipeline")._value.get() == 1

async def test_redis_retry_strategy():
    """Test Redis retry strategy configuration."""
    pool = BlockingConnectionPool.from_url(
        settings.redis_url,
        decode_responses=True,
        max_connections=5,
        timeout=5,
        retry_on_timeout=True,
        health_check_interval=5
    )
    
    assert pool.max_connections == 5
    assert pool.timeout == 5
    assert pool.health_check_interval == 5

async def test_redis_metrics_recording(mock_redis):
    """Test Redis metrics recording."""
    # Perform operations
    await mock_redis.set("key", "value")
    await mock_redis.get("key")
    await mock_redis.delete("key")
    
    # Verify operation counts
    assert REDIS_OPERATIONS.labels(operation="set")._value.get() == 1
    assert REDIS_OPERATIONS.labels(operation="get")._value.get() == 1
    assert REDIS_OPERATIONS.labels(operation="delete")._value.get() == 1
    
    # Verify duration metrics exist
    duration_samples = REGISTRY.get_sample_values("redis_operation_duration_seconds_bucket")
    assert len(duration_samples) > 0

async def test_redis_error_metrics(mock_redis):
    """Test Redis error metrics recording."""
    # Simulate various errors
    mock_redis.set.side_effect = ConnectionError("Connection refused")
    mock_redis.get.side_effect = TimeoutError("Operation timed out")
    mock_redis.delete.side_effect = ResponseError("Invalid operation")
    
    # Perform operations that will fail
    with pytest.raises(ConnectionError):
        await mock_redis.set("key", "value")
    with pytest.raises(TimeoutError):
        await mock_redis.get("key")
    with pytest.raises(ResponseError):
        await mock_redis.delete("key")
    
    # Verify error metrics
    assert REDIS_ERRORS.labels(error_type="ConnectionError")._value.get() == 1
    assert REDIS_ERRORS.labels(error_type="TimeoutError")._value.get() == 1
    assert REDIS_ERRORS.labels(error_type="ResponseError")._value.get() == 1

async def test_redis_concurrent_operations(mock_redis):
    """Test Redis concurrent operations handling."""
    # Setup concurrent operations
    async def perform_operation(key: str):
        await mock_redis.set(key, "value")
        await mock_redis.get(key)
        await mock_redis.delete(key)
    
    # Execute concurrent operations
    await asyncio.gather(*[
        perform_operation(f"key{i}")
        for i in range(5)
    ])
    
    # Verify metrics for concurrent operations
    assert REDIS_OPERATIONS.labels(operation="set")._value.get() == 5
    assert REDIS_OPERATIONS.labels(operation="get")._value.get() == 5
    assert REDIS_OPERATIONS.labels(operation="delete")._value.get() == 5

async def test_redis_pool_cleanup():
    """Test Redis connection pool cleanup."""
    pool = BlockingConnectionPool.from_url(
        settings.redis_url,
        decode_responses=True,
        max_connections=5
    )
    
    # Create and close Redis client
    redis = Redis.from_pool(pool)
    await redis.close()
    
    # Verify pool is cleaned up
    assert pool.max_connections == 5
    assert len(pool._available_connections) == 0
    assert len(pool._in_use_connections) == 0 