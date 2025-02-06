"""Redis connection module."""
from typing import AsyncGenerator

from redis.asyncio import Redis
from redis.asyncio.connection import ConnectionPool

from app.core.config import settings

# Create a connection pool
pool = ConnectionPool.from_url(
    settings.redis_url,
    decode_responses=True,
)

async def get_redis() -> AsyncGenerator[Redis, None]:
    """
    Get Redis connection from pool.
    
    Yields:
        Redis connection
    """
    async with Redis.from_pool(pool) as redis:
        yield redis 