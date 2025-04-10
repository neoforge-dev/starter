"""Database connection pool and query execution."""
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional, Any
from asyncpg import create_pool
from aiocache import Cache
import hashlib

async def init_db():
    return await create_pool(
        dsn=os.getenv("DB_DSN"),
        min_size=5,
        max_size=20,
        max_queries=50000,
        max_inactive_connection_lifetime=300
    )

cache = Cache(Cache.REDIS, endpoint="redis://localhost")

async def cached_query(pool, query: str, ttl: int = 300):
    key = hashlib.sha256(query.encode()).hexdigest()
    result = await cache.get(key)
    if not result:
        result = await pool.fetch(query)
        await cache.set(key, result, ttl=ttl)
    return result 