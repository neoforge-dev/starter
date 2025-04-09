import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from redis.asyncio import Redis
from redis.exceptions import ConnectionError, TimeoutError
from datetime import timedelta
from sqlalchemy import select
from fastapi import FastAPI
import logging
from pydantic import BaseModel

from app.main import app
from app.core.config import Settings, get_settings
from app.db.session import AsyncSessionLocal
from app.db.base import Base
from app.core.security import create_access_token
from app.models.user import User
from tests.factories import UserFactory
from app.api.middleware.validation import RequestValidationMiddleware

# Get a logger instance for conftest
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO) # Configure basic logging

# Test database URL - use test database from docker-compose
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@db:5432/test_db"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
def test_settings() -> Settings:
    """
    Return the application settings loaded from environment variables 
    (primarily set in docker-compose.dev.yml for the test service).
    This ensures tests use the config defined for the container environment.
    """
    return get_settings()

@pytest_asyncio.fixture(scope="session")
async def engine(test_settings):
    """Create a test database engine."""
    # Ensure the correct DB URL is used (loaded by test_settings)
    db_url = test_settings.database_url_for_env
    logger.info(f"Creating test engine with URL: {db_url}")
    engine = create_async_engine(
        db_url,
        echo=False,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=0
    )
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Drop all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
    logger.info("Test engine disposed")

@pytest_asyncio.fixture(scope="function")
async def db(engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )

    async with async_session() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()

@pytest_asyncio.fixture(scope="function")
async def redis(test_settings) -> AsyncGenerator[Redis, None]:
    """Create a test Redis connection using settings from the environment."""
    redis_url = test_settings.redis_url
    logger.info(f"Connecting to test Redis at: {redis_url}")
    redis = Redis.from_url(redis_url, decode_responses=True)
    try:
        # Test connection
        await redis.ping()
        logger.info("Redis connection successful, flushing test DB")
        # Clear test database
        await redis.flushdb()
        yield redis
    except (ConnectionError, TimeoutError) as e:
        logger.error(f"Redis connection error: {e}", exc_info=True)
        # In test environment, we want to handle Redis errors gracefully
        yield None # Allow tests to proceed if Redis isn't critical
    finally:
        if 'redis' in locals() and redis:
            try:
                await redis.close()
                logger.info("Redis connection closed")
            except Exception as close_exc:
                logger.error(f"Error closing Redis connection: {close_exc}", exc_info=True)

@pytest_asyncio.fixture(scope="function")
async def client(test_settings: Settings) -> AsyncGenerator[AsyncClient, None]:
    """Create a standard test client using the main application."""
    logging.basicConfig(level=logging.DEBUG)
    logger = logging.getLogger(__name__)
    
    # Import the main app instance directly
    from app.main import app as fastapi_app
    from app.core.config import get_settings as app_get_settings
    
    logger.debug("Setting up standard test client with main app routes:")
    for route in fastapi_app.routes:
        logger.debug(f"Route: {route.path}, methods: {getattr(route, 'methods', None)}")
    
    # Ensure dependency overrides are clean before applying
    if hasattr(fastapi_app, "dependency_overrides"):
        fastapi_app.dependency_overrides.clear()
    else:
        fastapi_app.dependency_overrides = {}

    # Override the get_settings dependency to use the environment-loaded settings
    fastapi_app.dependency_overrides[app_get_settings] = lambda: test_settings

    logger.debug(f"Overriding get_settings for main app. Effective settings: {test_settings}")
    
    transport = ASGITransport(app=fastapi_app)
    logger.debug("Creating AsyncClient with transport for main app")
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        logger.debug("Standard AsyncClient created")
        yield ac
    
    # Clean up dependency overrides after the test run
    if hasattr(fastapi_app, "dependency_overrides"):
        fastapi_app.dependency_overrides.clear()
    logger.debug("Standard test client dependency overrides cleared")

@pytest_asyncio.fixture(scope="function")
async def regular_user(db: AsyncSession) -> User:
    """Create a regular test user."""
    # Check if user already exists
    result = await db.execute(
        select(User).where(User.email == "regular@example.com")
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        await db.delete(existing_user)
        await db.commit()
    
    user = await UserFactory.create(
        session=db,
        email="regular@example.com",
        password="regular123",
        is_active=True
    )
    await db.commit()
    await db.refresh(user)  # Ensure we have the latest state including ID
    return user

@pytest_asyncio.fixture(scope="function")
async def superuser(db: AsyncSession) -> User:
    """Create a superuser test user."""
    # Check if user already exists
    result = await db.execute(
        select(User).where(User.email == "admin@example.com")
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        await db.delete(existing_user)
        await db.commit()
    
    user = await UserFactory.create(
        session=db,
        email="admin@example.com",
        password="admin123",
        is_superuser=True,
        is_active=True
    )
    await db.commit()
    await db.refresh(user)  # Ensure we have the latest state including ID
    return user

@pytest_asyncio.fixture(scope="function")
async def regular_user_headers(regular_user: User, test_settings: Settings) -> dict:
    """Get headers for regular user authentication."""
    access_token = create_access_token(
        subject=regular_user.id,
        settings=test_settings,
        expires_delta=timedelta(minutes=test_settings.access_token_expire_minutes)
    )
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "pytest-test-client"
    }

@pytest_asyncio.fixture(scope="function")
async def superuser_headers(superuser: User, test_settings: Settings) -> dict:
    """Get headers for superuser authentication."""
    access_token = create_access_token(
        subject=superuser.id,
        settings=test_settings,
        expires_delta=timedelta(minutes=test_settings.access_token_expire_minutes)
    )
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "pytest-test-client"
    }

@pytest.fixture
def app_with_validation() -> FastAPI:
    """Create a FastAPI app with validation middleware for testing."""
    app = FastAPI()
    
    # Define a simple model for the test endpoint body
    class TestPostBody(BaseModel):
        message: str
        
    @app.post("/test-post")
    # Expect the model in the body to trigger content-type validation
    async def test_post(body: TestPostBody):
        return {"received": body.model_dump()}
    
    app.add_middleware(RequestValidationMiddleware)
    return app 