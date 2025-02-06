"""Test configuration and fixtures."""
import asyncio
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.base import Base
from app.main import app

# Test database URL
TEST_DATABASE_URL = settings.database_url.replace("/app", "/test")

# Create async engine for tests
engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=True,
    future=True,
)

# Create async session factory
TestingSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for a test."""
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        async with TestingSessionLocal(bind=connection) as session:
            yield session
            await session.rollback()
        await connection.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture(scope="function")
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create a test client for the FastAPI app."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client 