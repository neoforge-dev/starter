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

from app.main import app
from app.core.config import Settings, settings
from app.db.session import AsyncSessionLocal
from app.db.base import Base
from app.core.security import create_access_token
from app.models.user import User
from tests.factories import UserFactory
from app.api.middleware.validation import RequestValidationMiddleware

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
    """Create test settings with test environment."""
    test_settings = Settings(
        environment="test",
        testing=True,
        database_url_for_env=TEST_DATABASE_URL,
        secret_key="test_secret_key_replace_in_production_7e1a34bd93b148f0",
        cors_origins=[],  # Empty list is allowed in test environment
        redis_url="redis://redis:6379/1",  # Use different Redis DB for tests
        debug=False,  # Ensure debug is False in tests
        access_token_expire_minutes=60 * 24 * 7  # 7 days
    )
    
    # Override global settings for tests
    import app.core.config
    app.core.config.settings = test_settings
    app.core.config.get_settings = lambda: test_settings
    
    return test_settings

@pytest_asyncio.fixture(scope="session")
async def engine(test_settings):
    """Create a test database engine."""
    engine = create_async_engine(
        test_settings.database_url_for_env,
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
    """Create a test Redis connection."""
    redis = Redis.from_url(test_settings.redis_url, decode_responses=True)
    try:
        # Test connection
        await redis.ping()
        # Clear test database
        await redis.flushdb()
        yield redis
    except (ConnectionError, TimeoutError) as e:
        # In test environment, we want to handle Redis errors gracefully
        yield None
    finally:
        try:
            await redis.close()
        except:
            pass

@pytest_asyncio.fixture(scope="function")
async def client(test_settings) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client."""
    logging.basicConfig(level=logging.DEBUG)
    logger = logging.getLogger(__name__)
    
    # Import FastAPI app
    from app.main import app as fastapi_app
    from app.core.config import Settings
    
    logger.debug("Setting up test client with app routes:")
    for route in fastapi_app.routes:
        logger.debug(f"Route: {route.path}, methods: {getattr(route, 'methods', None)}")
    
    # Override app settings with test settings
    if not hasattr(fastapi_app, "dependency_overrides"):
        fastapi_app.dependency_overrides = {}
    fastapi_app.dependency_overrides[Settings] = lambda: test_settings
    logger.debug(f"Override settings: {test_settings}")
    
    # Override get_settings in all modules that might use it
    import app.core.config
    app.core.config.settings = test_settings
    app.core.config.get_settings = lambda: test_settings
    
    transport = ASGITransport(app=fastapi_app)
    logger.debug("Creating AsyncClient with transport")
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        logger.debug("AsyncClient created")
        yield ac
    
    # Clear dependency overrides after test
    if hasattr(fastapi_app, "dependency_overrides"):
        fastapi_app.dependency_overrides.clear()
    logger.debug("Test client cleanup completed")

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
    await db.refresh(user)  # Ensure we have the latest state
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
    await db.refresh(user)  # Ensure we have the latest state
    return user

@pytest_asyncio.fixture(scope="function")
async def regular_user_headers(regular_user: User, test_settings: Settings) -> dict:
    """Get headers for regular user authentication."""
    access_token = create_access_token(
        subject=regular_user.id,
        expires_delta=timedelta(minutes=test_settings.access_token_expire_minutes)
    )
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

@pytest_asyncio.fixture(scope="function")
async def superuser_headers(superuser: User, test_settings: Settings) -> dict:
    """Get headers for superuser authentication."""
    access_token = create_access_token(
        subject=superuser.id,
        expires_delta=timedelta(minutes=test_settings.access_token_expire_minutes)
    )
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

@pytest.fixture
def app_with_validation() -> FastAPI:
    """Create a FastAPI app with validation middleware for testing."""
    app = FastAPI()
    
    @app.post("/test-post")
    async def test_post():
        return {"detail": [{"msg": "application/json"}]}
    
    app.add_middleware(RequestValidationMiddleware)
    return app 