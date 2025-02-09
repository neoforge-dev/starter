"""Test configuration and fixtures."""
import os
from urllib.parse import urlparse

# Set test environment variables before imports
os.environ.update({
    "TESTING": "true",
    "ENVIRONMENT": "test",
    "SECRET_KEY": "x" * 32,  # 32-char test key
    "DATABASE_URL": "postgresql+asyncpg://postgres:postgres@db:5432/test",
    "REDIS_URL": "redis://redis:6379/0",
    # Email settings for testing
    "SMTP_TLS": "true",
    "SMTP_PORT": "587",
    "SMTP_HOST": "smtp.gmail.com",
    "SMTP_USER": "test@example.com",
    "SMTP_PASSWORD": "test-password",
    "EMAILS_FROM_EMAIL": "test@example.com",
    "EMAILS_FROM_NAME": "Test",
})

import asyncio
from typing import AsyncGenerator, Dict, Generator
from uuid import uuid4

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import asyncpg
from asyncio import AbstractEventLoop
from fastapi.testclient import TestClient
from prometheus_client import REGISTRY

from app.core.config import settings
from app.db.base import Base
from app.main import app
from app.models.user import User
from app.core.security import get_password_hash, create_access_token
from app.db.session import get_db
from app.core.redis import get_redis
from tests.factories import UserFactory

# Override settings for testing
settings.testing = True
settings.environment = "test"
settings.debug = True

# Parse database URL for test database setup
db_url = urlparse(str(settings.database_url))
DB_USER = db_url.username
DB_PASSWORD = db_url.password
DB_HOST = db_url.hostname
DB_NAME = db_url.path.lstrip("/")

# Create async engine for testing
engine = create_async_engine(
    settings.database_url_for_env,
    echo=False,
    future=True,
    poolclass=NullPool,
)

# Create async session factory
async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

@pytest.fixture(autouse=True)
def clear_metrics():
    """Clear Prometheus registry before each test."""
    collectors = list(REGISTRY._collector_to_names.keys())
    for collector in collectors:
        REGISTRY.unregister(collector)
    
    # Initialize metrics after clearing
    from app.core.metrics import get_metrics
    get_metrics()
    
    yield

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
    
    try:
        # Connect to default database
        conn = await asyncpg.connect(**conn_params)
        
        # Drop test database if it exists
        await conn.execute(f'DROP DATABASE IF EXISTS "{DB_NAME}"')
        
        # Create test database
        await conn.execute(f'CREATE DATABASE "{DB_NAME}"')
        
        await conn.close()
        
    except Exception as e:
        logger.error(f"Error creating test database: {e}")
        raise


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
    async with async_session() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client."""
    # Initialize metrics
    from app.core.metrics import get_metrics
    metrics = get_metrics()
    
    # Create test client
    transport = ASGITransport(app=app)  # Use the main app
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Make a request to ensure middleware is initialized
        await ac.get("/health")
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

@pytest.fixture
def superuser_headers(superuser_token: str) -> dict:
    """Create headers with superuser token."""
    return {"Authorization": f"Bearer {superuser_token}"}

@pytest.fixture
def regular_user_headers(user_token: str) -> dict:
    """Create headers with regular user token."""
    return {"Authorization": f"Bearer {user_token}"}

@pytest.fixture
async def regular_user(db: AsyncSession) -> User:
    """Create a regular test user."""
    return await UserFactory.create(session=db)

@pytest.fixture
def user_token(regular_user: User) -> str:
    """Create a token for the regular test user."""
    return create_access_token(subject=regular_user.id)

@pytest.fixture
def regular_user_headers(user_token: str) -> dict:
    """Headers for regular user authentication."""
    return {"Authorization": f"Bearer {user_token}"}

@pytest.fixture
def superuser_token(superuser: User) -> str:
    """Create a token for the superuser."""
    return create_access_token(subject=superuser.id)

@pytest.fixture
def superuser_headers(superuser_token: str) -> dict:
    """Headers for superuser authentication."""
    return {"Authorization": f"Bearer {superuser_token}"} 