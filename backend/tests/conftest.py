import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from redis.asyncio import Redis

from app.main import app
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.core.security import create_access_token
from tests.factories import UserFactory

# Test database URL - use the same database but with _test suffix
TEST_DATABASE_URL = settings.database_url_for_env.replace("/dbname", "/dbname_test")

@pytest_asyncio.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session")
async def engine():
    """Create a test database engine."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    yield engine
    await engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def db(engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
        await session.rollback()

@pytest_asyncio.fixture(scope="function")
async def redis() -> AsyncGenerator[Redis, None]:
    """Create a test Redis connection."""
    redis = Redis.from_url(settings.redis_url, decode_responses=True)
    yield redis
    await redis.close()

@pytest_asyncio.fixture(scope="function")
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create a test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture(scope="function")
async def regular_user(db: AsyncSession):
    """Create a regular test user."""
    user = await UserFactory.create(session=db)
    return user

@pytest_asyncio.fixture(scope="function")
async def superuser(db: AsyncSession):
    """Create a superuser test user."""
    user = await UserFactory.create(session=db, is_superuser=True)
    return user

@pytest_asyncio.fixture(scope="function")
async def regular_user_headers(regular_user) -> dict:
    """Get headers for regular user authentication."""
    access_token = create_access_token(subject=str(regular_user.id))
    return {"Authorization": f"Bearer {access_token}"}

@pytest_asyncio.fixture(scope="function")
async def superuser_headers(superuser) -> dict:
    """Get headers for superuser authentication."""
    access_token = create_access_token(subject=str(superuser.id))
    return {"Authorization": f"Bearer {access_token}"} 