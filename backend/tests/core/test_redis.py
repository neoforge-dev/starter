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
    assert value == "test_value"  # Redis client is configured with decode_responses=True
    
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
    assert value == "expire_value"  # Redis client is configured with decode_responses=True
    
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
        
    assert results[2:] == ["value1", "value2"]  # Get results from pipeline
    
    # Clean up
    await redis.delete("pipe_key1", "pipe_key2")


async def test_redis_connection_pool() -> None:
    """Test Redis connection pool."""
    # Get Redis connections from pool
    redis1 = await anext(get_redis())
    redis2 = await anext(get_redis())
    
    # Test connections work
    assert await redis1.ping()
    assert await redis2.ping()
    
    # Test they share the same pool
    assert redis1.connection_pool is redis2.connection_pool
    
    # Clean up
    await redis1.aclose()
    await redis2.aclose()


async def test_redis_error_handling(redis: Redis) -> None:
    """Test Redis error handling."""
    # Test invalid command
    with pytest.raises(ResponseError):
        await redis.execute_command("INVALID_COMMAND")
    
    # Test invalid key type
    await redis.set("string_key", "value")
    with pytest.raises(ResponseError):
        await redis.lpush("string_key", "value")  # Try to use string key as list
    
    # Clean up
    await redis.delete("string_key")


async def test_redis_list_operations(redis: Redis) -> None:
    """Test Redis list operations."""
    key = "test_list"
    
    # Test push and pop
    await redis.rpush(key, "item1", "item2", "item3")
    assert await redis.llen(key) == 3
    assert await redis.lpop(key) == "item1"
    assert await redis.rpop(key) == "item3"
    
    # Test range
    await redis.rpush(key, "new1", "new2", "new3")
    items = await redis.lrange(key, 0, -1)
    assert items == ["item2", "new1", "new2", "new3"]
    
    # Clean up
    await redis.delete(key) 