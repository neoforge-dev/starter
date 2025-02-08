"""Test Redis functionality."""
import asyncio
from typing import AsyncGenerator

import pytest
from redis.asyncio import Redis
from redis.exceptions import ResponseError

from app.core.redis import get_redis

pytestmark = pytest.mark.asyncio


async def test_redis_connection(redis: Redis) -> None:
    """Test Redis connection and basic operations."""
    # Test ping
    assert await redis.ping()
    
    # Test set/get
    await redis.set("test_key", "test_value")
    value = await redis.get("test_key")
    assert value.decode() == "test_value"
    
    # Test delete
    await redis.delete("test_key")
    value = await redis.get("test_key")
    assert value is None


async def test_redis_expiry(redis: Redis) -> None:
    """Test Redis key expiration."""
    # Set key with 1 second expiry
    await redis.set("expire_key", "expire_value", ex=1)
    
    # Key should exist initially
    value = await redis.get("expire_key")
    assert value.decode() == "expire_value"
    
    # Wait for expiration
    await asyncio.sleep(1.1)
    
    # Key should be gone
    assert await redis.get("expire_key") is None


async def test_redis_pipeline(redis: Redis) -> None:
    """Test Redis pipeline operations."""
    async with redis.pipeline(transaction=True) as pipe:
        await pipe.set("pipe_key1", "value1")
        await pipe.set("pipe_key2", "value2")
        await pipe.get("pipe_key1")
        await pipe.get("pipe_key2")
        results = await pipe.execute()
        
        assert results[0]  # SET returns True
        assert results[1]  # SET returns True
        assert results[2].decode() == "value1"
        assert results[3].decode() == "value2"


async def test_redis_connection_pool() -> None:
    """Test Redis connection pool."""
    async for redis1 in get_redis():
        async for redis2 in get_redis():
            # Both connections should work
            assert await redis1.ping()
            assert await redis2.ping()
            
            # Test they share the same pool
            await redis1.set("pool_test", "value")
            assert await redis2.get("pool_test") == "value"
            
            await redis1.aclose()
            await redis2.aclose()


async def test_redis_error_handling(redis: Redis) -> None:
    """Test Redis error handling."""
    # Test invalid type operation
    await redis.set("string_key", "value")
    with pytest.raises(ResponseError):
        await redis.incr("string_key")
    
    # Test invalid command
    with pytest.raises(ResponseError):
        await redis.execute_command("INVALID_COMMAND")


async def test_redis_list_operations(redis: Redis) -> None:
    """Test Redis list operations."""
    # Push items to list
    await redis.lpush("test_list", "item1", "item2", "item3")
    
    # Check length
    assert await redis.llen("test_list") == 3
    
    # Pop items
    value = await redis.lpop("test_list")
    assert value.decode() == "item3"
    
    # Get range
    values = await redis.lrange("test_list", 0, -1)
    assert [v.decode() for v in values] == ["item2", "item1"]
    
    # Clean up
    await redis.delete("test_list") 