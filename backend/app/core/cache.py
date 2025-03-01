"""Redis caching module with advanced features."""
import json
from datetime import timedelta
from functools import wraps
from typing import Any, Callable, Optional, TypeVar, Union, cast
from uuid import UUID

from fastapi import HTTPException, status
from pydantic import BaseModel
from redis.asyncio import Redis
import structlog
from prometheus_client import Counter, Histogram

from app.core.config import settings

logger = structlog.get_logger()

# Type variables for generic caching
T = TypeVar("T")
CacheableType = Union[str, int, float, bool, dict, list, BaseModel]

# Metrics
CACHE_HITS = Counter(
    "cache_hits_total",
    "Total number of cache hits",
    labelnames=["cache_key"],
)

CACHE_MISSES = Counter(
    "cache_misses_total",
    "Total number of cache misses",
    labelnames=["cache_key"],
)

CACHE_ERRORS = Counter(
    "cache_errors_total",
    "Total number of cache errors",
    labelnames=["error_type"],
)

CACHE_OPERATION_DURATION = Histogram(
    "cache_operation_duration_seconds",
    "Duration of cache operations",
    labelnames=["operation"],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0),
)


class CacheError(Exception):
    """Base exception for cache-related errors."""
    pass


class Cache:
    """Advanced Redis caching implementation."""

    def __init__(self, redis: Redis, prefix: str = "cache"):
        """Initialize cache with Redis connection and optional prefix."""
        self.redis = redis
        self.prefix = prefix

    def _get_key(self, key: Union[str, int, UUID]) -> str:
        """Generate prefixed cache key."""
        return f"{self.prefix}:{str(key)}"

    async def get(self, key: Union[str, int, UUID], model: Optional[type[BaseModel]] = None) -> Any:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            model: Optional Pydantic model to deserialize the cached value
            
        Returns:
            Cached value or None if not found
        """
        try:
            with CACHE_OPERATION_DURATION.labels("get").time():
                cached = await self.redis.get(self._get_key(key))

            if cached is None:
                CACHE_MISSES.labels(cache_key=str(key)).inc()
                return None

            CACHE_HITS.labels(cache_key=str(key)).inc()
            value = json.loads(cached)

            if model and isinstance(value, dict):
                return model.model_validate(value)
            return value

        except Exception as e:
            CACHE_ERRORS.labels(error_type=type(e).__name__).inc()
            logger.error(
                "cache_get_error",
                key=key,
                error=str(e),
                error_type=type(e).__name__,
            )
            return None

    async def set(
        self,
        key: Union[str, int, UUID],
        value: CacheableType,
        expire: Optional[Union[int, timedelta]] = None,
    ) -> bool:
        """
        Set value in cache with optional expiration.
        
        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)
            expire: Optional expiration time in seconds or timedelta
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if isinstance(value, BaseModel):
                value = value.model_dump()

            with CACHE_OPERATION_DURATION.labels("set").time():
                if expire:
                    if isinstance(expire, timedelta):
                        expire = int(expire.total_seconds())
                    await self.redis.setex(
                        self._get_key(key),
                        expire,
                        json.dumps(value),
                    )
                else:
                    await self.redis.set(self._get_key(key), json.dumps(value))
            return True

        except Exception as e:
            CACHE_ERRORS.labels(error_type=type(e).__name__).inc()
            logger.error(
                "cache_set_error",
                key=key,
                error=str(e),
                error_type=type(e).__name__,
            )
            return False

    async def delete(self, key: Union[str, int, UUID]) -> bool:
        """Delete value from cache."""
        try:
            with CACHE_OPERATION_DURATION.labels("delete").time():
                return bool(await self.redis.delete(self._get_key(key)))
        except Exception as e:
            CACHE_ERRORS.labels(error_type=type(e).__name__).inc()
            logger.error(
                "cache_delete_error",
                key=key,
                error=str(e),
                error_type=type(e).__name__,
            )
            return False

    async def exists(self, key: Union[str, int, UUID]) -> bool:
        """Check if key exists in cache."""
        try:
            with CACHE_OPERATION_DURATION.labels("exists").time():
                return bool(await self.redis.exists(self._get_key(key)))
        except Exception as e:
            CACHE_ERRORS.labels(error_type=type(e).__name__).inc()
            logger.error(
                "cache_exists_error",
                key=key,
                error=str(e),
                error_type=type(e).__name__,
            )
            return False

    async def clear_prefix(self, prefix: str) -> int:
        """Clear all keys with given prefix."""
        try:
            with CACHE_OPERATION_DURATION.labels("clear_prefix").time():
                keys = await self.redis.keys(f"{self.prefix}:{prefix}:*")
                if keys:
                    return await self.redis.delete(*keys)
                return 0
        except Exception as e:
            CACHE_ERRORS.labels(error_type=type(e).__name__).inc()
            logger.error(
                "cache_clear_prefix_error",
                prefix=prefix,
                error=str(e),
                error_type=type(e).__name__,
            )
            return 0

    async def increment(self, key: Union[str, int, UUID], amount: int = 1) -> Optional[int]:
        """Increment value in cache."""
        try:
            with CACHE_OPERATION_DURATION.labels("increment").time():
                return await self.redis.incrby(self._get_key(key), amount)
        except Exception as e:
            CACHE_ERRORS.labels(error_type=type(e).__name__).inc()
            logger.error(
                "cache_increment_error",
                key=key,
                amount=amount,
                error=str(e),
                error_type=type(e).__name__,
            )
            return None

    async def clear_cache(self) -> bool:
        """Clear all keys from Redis."""
        try:
            with CACHE_OPERATION_DURATION.labels("clear_all").time():
                await self.redis.flushdb()
            return True
        except Exception as e:
            CACHE_ERRORS.labels(error_type=type(e).__name__).inc()
            logger.error(
                "cache_clear_all_error",
                error=str(e),
                error_type=type(e).__name__,
            )
            return False


def cached(
    expire: Optional[Union[int, timedelta]] = None,
    prefix: Optional[str] = None,
    key_builder: Optional[Callable[..., Union[str, int, UUID]]] = None,
) -> Callable:
    """
    Cache decorator for FastAPI endpoint results.
    
    Args:
        expire: Optional expiration time in seconds or timedelta
        prefix: Optional prefix for cache key
        key_builder: Optional function to build cache key from function arguments
        
    Example:
        @router.get("/items/{item_id}")
        @cached(expire=300)  # Cache for 5 minutes
        async def get_item(item_id: int) -> Item:
            return await get_item_from_db(item_id)
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            from app.core.redis import get_redis

            # Get Redis connection
            redis = await anext(get_redis())
            cache = Cache(redis, prefix or settings.app_name.lower())

            # Build cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # Default key from function name and arguments
                key_parts = [func.__name__]
                key_parts.extend(str(arg) for arg in args)
                key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
                cache_key = ":".join(key_parts)

            try:
                # Try to get from cache
                cached_value = await cache.get(cache_key)
                if cached_value is not None:
                    return cached_value

                # If not in cache, call function
                result = await func(*args, **kwargs)

                # Cache the result
                await cache.set(cache_key, result, expire)
                return result

            except Exception as e:
                logger.error(
                    "cache_decorator_error",
                    function=func.__name__,
                    error=str(e),
                    error_type=type(e).__name__,
                )
                # On cache error, just execute the function
                return await func(*args, **kwargs)

        return wrapper
    return decorator


async def clear_cache() -> bool:
    """Clear all keys from Redis."""
    from app.core.redis import get_redis
    redis = await anext(get_redis())
    cache = Cache(redis)
    return await cache.clear_cache() 