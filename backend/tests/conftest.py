"""Test configuration and fixtures."""
import asyncio
import os
from typing import AsyncGenerator, Generator
from uuid import uuid4

from app.models.user import User
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import asyncpg
from asyncio import AbstractEventLoop
from fastapi import FastAPI

from app.core.config import settings
from app.db.session import get_db
from app.main import app
from app.core.redis import get_redis
from app.db.base import Base
from app.core.security import get_password_hash, create_access_token
from tests.factories import UserFactory
from app.api.middleware import ErrorHandlerMiddleware, RateLimitMiddleware

# Set test settings
settings.testing = True
settings.environment = "test"

# Database configuration
DB_USER = "postgres"
DB_PASSWORD = "postgres"
DB_HOST = "db"
DB_NAME = "test"
DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:5432/{DB_NAME}"

# Create async engine for tests
engine = create_async_engine(
    DATABASE_URL,
    echo=settings.debug,
    future=True,
    pool_pre_ping=True,
    poolclass=NullPool,  # Disable connection pooling in tests
    connect_args={
        "command_timeout": 60,
        "statement_cache_size": 0,  # Disable statement cache in tests
        "server_settings": {
            "timezone": "UTC",
            "application_name": "neoforge-test",
        },
    },
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def create_test_database() -> None:
    """Create test database."""
    conn_params = {
        "user": DB_USER,
        "password": DB_PASSWORD,
        "database": "postgres",
        "host": DB_HOST,
        "command_timeout": 60,
        "server_settings": {
            "timezone": "UTC",
            "application_name": "neoforge-test",
        },
    }
    
    default_conn = await asyncpg.connect(**conn_params)
    
    try:
        await default_conn.execute(f"""
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '{DB_NAME}'
            AND pid <> pg_backend_pid()
        """)
        await default_conn.execute(f'DROP DATABASE IF EXISTS "{DB_NAME}"')
        await default_conn.execute(f'CREATE DATABASE "{DB_NAME}" TEMPLATE template0 LC_COLLATE "C" LC_CTYPE "C"')
        # Set timezone for test database
        await default_conn.execute(f"""
            ALTER DATABASE "{DB_NAME}" SET timezone TO 'UTC'
        """)
    finally:
        await default_conn.close()


async def drop_test_database() -> None:
    """Drop test database."""
    conn_params = {
        "user": DB_USER,
        "password": DB_PASSWORD,
        "database": "postgres",
        "host": DB_HOST,
        "command_timeout": 60,
        "server_settings": {
            "timezone": "UTC",
            "application_name": "neoforge-test",
        },
    }
    
    default_conn = await asyncpg.connect(**conn_params)
    
    try:
        await default_conn.execute(f"""
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '{DB_NAME}'
            AND pid <> pg_backend_pid()
        """)
        await default_conn.execute(f'DROP DATABASE IF EXISTS "{DB_NAME}"')
    finally:
        await default_conn.close()


@pytest_asyncio.fixture(scope="session")
def event_loop() -> Generator[AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for each test case."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db() -> AsyncGenerator[None, None]:
    """Set up test database."""
    await create_test_database()
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Drop database
    await engine.dispose()
    await drop_test_database()


@pytest_asyncio.fixture(scope="function")
async def db() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for a test."""
    async with AsyncSessionLocal() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client."""
    transport = ASGITransport(app=app)  # Use the main app
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def redis() -> AsyncGenerator[Redis, None]:
    """Create test Redis connection."""
    import redis.asyncio as redis
    from app.core.config import settings
    
    # Use Docker service name for Redis in test environment
    redis_url = "redis://redis:6379/0"
    
    try:
        # Create Redis client with retry logic
        for _ in range(3):  # Try 3 times
            try:
                client = redis.Redis.from_url(
                    redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_timeout=5.0,  # 5 second timeout
                    socket_connect_timeout=5.0,
                )
                # Test connection
                await client.ping()
                break
            except (redis.ConnectionError, redis.TimeoutError):
                await asyncio.sleep(1)  # Wait 1 second before retry
        else:
            raise redis.ConnectionError(f"Could not connect to Redis at {redis_url}")
        
        # Clear all keys before test
        await client.flushall()
        
        yield client
        
        # Clear all keys after test
        await client.flushall()
        await client.aclose()
    except Exception as e:
        pytest.skip(f"Redis not available: {str(e)}")


@pytest_asyncio.fixture
async def regular_user_token(db: AsyncSession) -> str:
    """Create a regular user and return their token."""
    user = await UserFactory.create(session=db)
    return create_access_token(user.id)

@pytest_asyncio.fixture
async def regular_user_headers(regular_user_token: str) -> dict:
    """Return headers for regular user authentication."""
    return {"Authorization": f"Bearer {regular_user_token}"}

@pytest_asyncio.fixture
async def superuser_token(db: AsyncSession) -> str:
    """Create a superuser and return their token."""
    user = await UserFactory.create(session=db, is_superuser=True)
    return create_access_token(user.id)

@pytest_asyncio.fixture
async def superuser_headers(superuser_token: str) -> dict:
    """Return headers for superuser authentication."""
    return {"Authorization": f"Bearer {superuser_token}"} 