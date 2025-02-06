"""Test configuration and fixtures."""
import asyncio
import os
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import asyncpg

from app.core.config import settings
from app.db.session import get_db
from app.main import app
from app.core.redis import get_redis
from app.db.base import Base

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


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for each test case."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
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
    """Get database session."""
    # Create a new connection
    connection = await engine.connect()
    # Begin a transaction
    transaction = await connection.begin()
    # Begin a nested transaction (savepoint)
    nested = await connection.begin_nested()
    
    # Create session
    session = AsyncSession(
        bind=connection,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    try:
        yield session
    finally:
        await session.close()
        # Roll back the nested transaction
        await nested.rollback()
        # Roll back the transaction
        await transaction.rollback()
        # Close the connection
        await connection.close()


@pytest_asyncio.fixture(scope="function")
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Get test client."""
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        try:
            yield db
        finally:
            pass  # Session is handled by the db fixture

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        try:
            yield client
        finally:
            app.dependency_overrides = {}


@pytest_asyncio.fixture(scope="function")
async def redis() -> AsyncGenerator[Redis, None]:
    """Get Redis connection."""
    async for redis_client in get_redis():
        try:
            await redis_client.flushdb()
            yield redis_client
        finally:
            await redis_client.flushdb()
            await redis_client.aclose() 