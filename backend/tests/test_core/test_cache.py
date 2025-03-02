"""
Test cache module functionality.

This test verifies that the cache module works correctly, including:
- Cache initialization
- Get/set/delete operations
- Cache decorators
- Error handling
- Metrics tracking

We use mocking to avoid actual Redis connections.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import json
from datetime import timedelta
from pydantic import BaseModel
from redis.exceptions import RedisError

from app.core.cache import (
    Cache,
    CacheError,
    cached,
    clear_cache,
    CACHE_HITS,
    CACHE_MISSES,
    CACHE_ERRORS,
    CACHE_OPERATION_DURATION,
)


class TestModel(BaseModel):
    """Test model for cache serialization."""
    id: int
    name: str
    active: bool


@pytest.fixture
def mock_redis():
    """Create a mock Redis client."""
    mock = AsyncMock()
    mock.get = AsyncMock(return_value=None)
    mock.set = AsyncMock(return_value=True)
    mock.delete = AsyncMock(return_value=1)
    mock.exists = AsyncMock(return_value=1)
    mock.keys = AsyncMock(return_value=["key1", "key2"])
    mock.incr = AsyncMock(return_value=1)
    mock.flushdb = AsyncMock(return_value=True)
    return mock


@pytest.fixture
def cache(mock_redis):
    """Create a Cache instance with mock Redis."""
    return Cache(redis=mock_redis, prefix="test")


@pytest.mark.asyncio
async def test_cache_init():
    """Test that Cache initializes correctly."""
    mock_redis = AsyncMock()
    cache = Cache(redis=mock_redis, prefix="custom")
    assert cache.redis is mock_redis
    assert cache.prefix == "custom"


@pytest.mark.asyncio
async def test_get_key():
    """Test that _get_key formats keys correctly."""
    mock_redis = AsyncMock()
    cache = Cache(redis=mock_redis, prefix="test")
    
    # Test string key
    assert cache._get_key("user") == "test:user"
    
    # Test integer key
    assert cache._get_key(123) == "test:123"
    
    # Test UUID key
    from uuid import UUID
    uuid = UUID("12345678-1234-5678-1234-567812345678")
    assert cache._get_key(uuid) == "test:12345678-1234-5678-1234-567812345678"


@pytest.mark.asyncio
async def test_get_cache_hit(cache, mock_redis):
    """Test that get returns cached value on cache hit."""
    # Setup mock to return a cached value
    mock_redis.get.return_value = json.dumps({"id": 1, "name": "Test", "active": True})
    
    # Mock metrics
    with patch.object(CACHE_HITS, 'labels') as mock_hits:
        with patch.object(CACHE_OPERATION_DURATION, 'labels') as mock_duration:
            # Setup mocks
            mock_inc = MagicMock()
            mock_observe = MagicMock()
            mock_hits.return_value.inc = mock_inc
            mock_duration.return_value.observe = mock_observe
            
            # Get from cache
            result = await cache.get("test_key")
            
            # Verify result
            assert result == {"id": 1, "name": "Test", "active": True}
            
            # Verify Redis was called
            mock_redis.get.assert_called_once_with("test:test_key")
            
            # Verify metrics were updated
            mock_hits.assert_called_once_with(cache_key="test:test_key")
            mock_inc.assert_called_once()
            mock_duration.assert_called_once_with(operation="get")
            mock_observe.assert_called_once()


@pytest.mark.asyncio
async def test_get_cache_miss(cache, mock_redis):
    """Test that get returns None on cache miss."""
    # Setup mock to return None (cache miss)
    mock_redis.get.return_value = None
    
    # Mock metrics
    with patch.object(CACHE_MISSES, 'labels') as mock_misses:
        with patch.object(CACHE_OPERATION_DURATION, 'labels') as mock_duration:
            # Setup mocks
            mock_inc = MagicMock()
            mock_observe = MagicMock()
            mock_misses.return_value.inc = mock_inc
            mock_duration.return_value.observe = mock_observe
            
            # Get from cache
            result = await cache.get("test_key")
            
            # Verify result
            assert result is None
            
            # Verify Redis was called
            mock_redis.get.assert_called_once_with("test:test_key")
            
            # Verify metrics were updated
            mock_misses.assert_called_once_with(cache_key="test:test_key")
            mock_inc.assert_called_once()
            mock_duration.assert_called_once_with(operation="get")
            mock_observe.assert_called_once()


@pytest.mark.asyncio
async def test_get_with_model(cache, mock_redis):
    """Test that get deserializes to model when model is provided."""
    # Setup mock to return a cached value
    mock_redis.get.return_value = json.dumps({"id": 1, "name": "Test", "active": True})
    
    # Get from cache with model
    result = await cache.get("test_key", model=TestModel)
    
    # Verify result is a TestModel instance
    assert isinstance(result, TestModel)
    assert result.id == 1
    assert result.name == "Test"
    assert result.active is True


@pytest.mark.asyncio
async def test_get_error(cache, mock_redis):
    """Test that get handles errors correctly."""
    # Setup mock to raise an exception
    mock_redis.get.side_effect = RedisError("Connection error")
    
    # Mock metrics
    with patch.object(CACHE_ERRORS, 'labels') as mock_errors:
        with patch.object(CACHE_OPERATION_DURATION, 'labels') as mock_duration:
            # Setup mocks
            mock_inc = MagicMock()
            mock_observe = MagicMock()
            mock_errors.return_value.inc = mock_inc
            mock_duration.return_value.observe = mock_observe
            
            # Get from cache and expect error
            with pytest.raises(CacheError):
                await cache.get("test_key")
            
            # Verify Redis was called
            mock_redis.get.assert_called_once_with("test:test_key")
            
            # Verify metrics were updated
            mock_errors.assert_called_once_with(error_type="RedisError")
            mock_inc.assert_called_once()
            mock_duration.assert_called_once_with(operation="get")
            mock_observe.assert_called_once()


@pytest.mark.asyncio
async def test_set(cache, mock_redis):
    """Test that set stores value in cache."""
    # Mock metrics
    with patch.object(CACHE_OPERATION_DURATION, 'labels') as mock_duration:
        # Setup mocks
        mock_observe = MagicMock()
        mock_duration.return_value.observe = mock_observe
        
        # Set in cache
        result = await cache.set("test_key", {"id": 1, "name": "Test"})
        
        # Verify result
        assert result is True
        
        # Verify Redis was called with correct arguments
        mock_redis.set.assert_called_once()
        args = mock_redis.set.call_args[0]
        assert args[0] == "test:test_key"
        assert json.loads(args[1]) == {"id": 1, "name": "Test"}
        assert args[2] is None  # No expiration
        
        # Verify metrics were updated
        mock_duration.assert_called_once_with(operation="set")
        mock_observe.assert_called_once()


@pytest.mark.asyncio
async def test_set_with_expiration(cache, mock_redis):
    """Test that set stores value with expiration."""
    # Set in cache with expiration
    expire = timedelta(seconds=60)
    result = await cache.set("test_key", "test_value", expire=expire)
    
    # Verify result
    assert result is True
    
    # Verify Redis was called with correct arguments
    mock_redis.set.assert_called_once()
    args = mock_redis.set.call_args[0]
    kwargs = mock_redis.set.call_args[1]
    assert args[0] == "test:test_key"
    assert json.loads(args[1]) == "test_value"
    assert kwargs["ex"] == 60  # Expiration in seconds


@pytest.mark.asyncio
async def test_set_model(cache, mock_redis):
    """Test that set serializes model correctly."""
    # Create a model instance
    model = TestModel(id=1, name="Test", active=True)
    
    # Set in cache
    result = await cache.set("test_key", model)
    
    # Verify result
    assert result is True
    
    # Verify Redis was called with correct arguments
    mock_redis.set.assert_called_once()
    args = mock_redis.set.call_args[0]
    assert args[0] == "test:test_key"
    assert json.loads(args[1]) == {"id": 1, "name": "Test", "active": True}


@pytest.mark.asyncio
async def test_delete(cache, mock_redis):
    """Test that delete removes value from cache."""
    # Mock metrics
    with patch.object(CACHE_OPERATION_DURATION, 'labels') as mock_duration:
        # Setup mocks
        mock_observe = MagicMock()
        mock_duration.return_value.observe = mock_observe
        
        # Delete from cache
        result = await cache.delete("test_key")
        
        # Verify result
        assert result is True
        
        # Verify Redis was called
        mock_redis.delete.assert_called_once_with("test:test_key")
        
        # Verify metrics were updated
        mock_duration.assert_called_once_with(operation="delete")
        mock_observe.assert_called_once()


@pytest.mark.asyncio
async def test_exists(cache, mock_redis):
    """Test that exists checks if key exists in cache."""
    # Mock metrics
    with patch.object(CACHE_OPERATION_DURATION, 'labels') as mock_duration:
        # Setup mocks
        mock_observe = MagicMock()
        mock_duration.return_value.observe = mock_observe
        
        # Check if key exists
        result = await cache.exists("test_key")
        
        # Verify result
        assert result is True
        
        # Verify Redis was called
        mock_redis.exists.assert_called_once_with("test:test_key")
        
        # Verify metrics were updated
        mock_duration.assert_called_once_with(operation="exists")
        mock_observe.assert_called_once()


@pytest.mark.asyncio
async def test_clear_prefix(cache, mock_redis):
    """Test that clear_prefix removes keys with prefix."""
    # Setup mock to return keys
    mock_redis.keys.return_value = ["test:prefix:key1", "test:prefix:key2"]
    
    # Mock metrics
    with patch.object(CACHE_OPERATION_DURATION, 'labels') as mock_duration:
        # Setup mocks
        mock_observe = MagicMock()
        mock_duration.return_value.observe = mock_observe
        
        # Clear keys with prefix
        result = await cache.clear_prefix("prefix")
        
        # Verify result
        assert result == 2
        
        # Verify Redis was called
        mock_redis.keys.assert_called_once_with("test:prefix:*")
        mock_redis.delete.assert_called_once()
        
        # Verify metrics were updated
        mock_duration.assert_called_once_with(operation="clear_prefix")
        mock_observe.assert_called_once()


@pytest.mark.asyncio
async def test_increment(cache, mock_redis):
    """Test that increment increases counter in cache."""
    # Mock metrics
    with patch.object(CACHE_OPERATION_DURATION, 'labels') as mock_duration:
        # Setup mocks
        mock_observe = MagicMock()
        mock_duration.return_value.observe = mock_observe
        
        # Increment counter
        result = await cache.increment("counter", amount=5)
        
        # Verify result
        assert result == 1  # Mock returns 1
        
        # Verify Redis was called
        mock_redis.incr.assert_called_once_with("test:counter", 5)
        
        # Verify metrics were updated
        mock_duration.assert_called_once_with(operation="increment")
        mock_observe.assert_called_once()


@pytest.mark.asyncio
async def test_clear_cache(cache, mock_redis):
    """Test that clear_cache flushes the cache."""
    # Mock metrics
    with patch.object(CACHE_OPERATION_DURATION, 'labels') as mock_duration:
        # Setup mocks
        mock_observe = MagicMock()
        mock_duration.return_value.observe = mock_observe
        
        # Clear cache
        result = await cache.clear_cache()
        
        # Verify result
        assert result is True
        
        # Verify Redis was called
        mock_redis.flushdb.assert_called_once()
        
        # Verify metrics were updated
        mock_duration.assert_called_once_with(operation="clear_cache")
        mock_observe.assert_called_once()


@pytest.mark.asyncio
async def test_cached_decorator():
    """Test that cached decorator caches function results."""
    # Create mock Redis and Cache
    mock_redis = AsyncMock()
    mock_redis.get.return_value = None  # First call: cache miss
    mock_redis.set.return_value = True
    
    # Create a test function with the cached decorator
    with patch('app.core.cache.Cache') as MockCache:
        # Setup mock cache instance
        mock_cache = AsyncMock()
        mock_cache.get.return_value = None  # First call: cache miss
        mock_cache.set.return_value = True
        MockCache.return_value = mock_cache
        
        # Define a cached function
        @cached(expire=60)
        async def test_func(a, b):
            return a + b
        
        # Call the function
        with patch('app.core.cache.Redis.from_url', return_value=mock_redis):
            result = await test_func(1, 2)
            
            # Verify result
            assert result == 3
            
            # Verify cache was checked
            mock_cache.get.assert_called_once()
            
            # Verify result was cached
            mock_cache.set.assert_called_once()
            
            # Set up mock for second call (cache hit)
            mock_cache.get.reset_mock()
            mock_cache.set.reset_mock()
            mock_cache.get.return_value = 3  # Second call: cache hit
            
            # Call the function again
            result = await test_func(1, 2)
            
            # Verify result
            assert result == 3
            
            # Verify cache was checked
            mock_cache.get.assert_called_once()
            
            # Verify result was not cached again
            mock_cache.set.assert_not_called()


@pytest.mark.asyncio
async def test_global_clear_cache():
    """Test that global clear_cache function works."""
    # Create mock Redis
    mock_redis = AsyncMock()
    mock_redis.flushdb.return_value = True
    
    # Call the function
    with patch('app.core.cache.Redis.from_url', return_value=mock_redis):
        result = await clear_cache()
        
        # Verify result
        assert result is True
        
        # Verify Redis was called
        mock_redis.flushdb.assert_called_once() 