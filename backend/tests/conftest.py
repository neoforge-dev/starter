import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator, Dict, Optional
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import event
from redis.asyncio import Redis
from redis.exceptions import ConnectionError, TimeoutError
from datetime import timedelta
from sqlalchemy import select
from fastapi import FastAPI
import logging
from pydantic import BaseModel
import uuid
import contextvars # Import contextvars

from app.main import app
from app.core.config import Settings, get_settings
from app.db.session import AsyncSessionLocal, engine
from app.db.base import Base
from app.core.security import create_access_token
from app.models.user import User
from app.models.admin import Admin
from tests.factories import UserFactory
from app.api.middleware.validation import RequestValidationMiddleware
from app.crud.user import user as user_crud
from app.crud.admin import admin
from app.schemas.user import UserCreate
from app.schemas.admin import AdminCreate, AdminCreateWithoutUser, AdminRole
from app.api.deps import get_db
from app.core.config import get_settings as core_get_settings
from tests.utils.user import authentication_token_from_email, create_random_user
from tests.utils.admin import create_random_admin

# Import get_settings specifically for cache clearing
from app.core.config import get_settings as core_get_settings

# Import the context variable from the new file
from tests.session_context import current_test_session 

# Import event listeners from query_monitor
from app.db.query_monitor import before_cursor_execute, after_cursor_execute

# Get a logger instance for conftest
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO) # Configure basic logging

# Test database URL - use test database from docker-compose
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@db:5432/test_db"

# Get settings instance
settings = get_settings()

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
    settings = get_settings()
    # Make sure it's a Settings instance, not a function
    assert isinstance(settings, Settings), "test_settings should return a Settings instance"
    return settings

@pytest_asyncio.fixture(scope="session")
async def engine(test_settings):
    """Create a test database engine (session scope)."""
    try:
        db_url = test_settings.database_url_for_env
        logger.info(f"Creating test engine with URL: {db_url}")
        test_engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)
        
        # Test the connection to ensure database is available
        async with test_engine.begin() as conn:
            await conn.execute(select(1))
        
        # Register query monitor listeners on the test engine's sync_engine
        # logger.info("Registering query monitor listeners on test engine")
        # event.listen(test_engine.sync_engine, "before_cursor_execute", before_cursor_execute)
        # event.listen(test_engine.sync_engine, "after_cursor_execute", after_cursor_execute)
        # ^^^ Moved listener attachment to the 'db' fixture below ^^^ 

        yield test_engine
        await test_engine.dispose()
        logger.info("Test engine disposed")
    except Exception as e:
        logger.error(f"Database engine creation failed: {e}")
        pytest.skip("Database not available - skipping database-dependent tests")

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database(engine):
    """Create and drop database schema once per session (autouse)."""
    try:
        logger.info("Attempting to create database schema...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema created.")
        yield
        logger.info("Dropping database schema...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        logger.info("Database schema dropped.")
    except Exception as e:
        logger.error(f"Database setup failed: {e}")
        logger.info("Skipping database tests - database not available")
        # If database setup fails, we'll skip all database-dependent tests
        pytest.skip("Database not available - skipping database-dependent tests")

@pytest_asyncio.fixture(scope="function")
async def db(engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session with rollback (function scope)."""
    async_session_factory = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    async with engine.connect() as connection:
        # Attach listeners directly to the connection used by this test session
        logger.info("Attaching query monitor listeners to test connection")
        event.listen(connection.sync_connection, "before_cursor_execute", before_cursor_execute)
        event.listen(connection.sync_connection, "after_cursor_execute", after_cursor_execute)
        
        transaction = await connection.begin()
        async with async_session_factory(bind=connection) as session:
            # Set the context variable before yielding
            token = current_test_session.set(session)
            try:
                yield session
            finally:
                # Reset the context variable
                current_test_session.reset(token)
                await transaction.rollback()
                
        # Detach listeners after use to avoid potential leaks or side effects
        logger.info("Detaching query monitor listeners from test connection")
        try:
            event.remove(connection.sync_connection, "before_cursor_execute", before_cursor_execute)
            event.remove(connection.sync_connection, "after_cursor_execute", after_cursor_execute)
        except Exception as e:
             logger.warning(f"Could not detach event listeners: {e}") # Log warning if removal fails

@pytest_asyncio.fixture(scope="function")
async def redis(test_settings) -> AsyncGenerator[Redis, None]:
    """Create a test Redis connection using settings from the environment."""
    # Convert RedisDsn to string before passing to from_url
    redis_url = str(test_settings.redis_url) 
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
async def client(db: AsyncSession, test_settings: Settings) -> AsyncClient:
    """Create a standard test client using the main application."""
    logging.basicConfig(level=logging.DEBUG)
    logger = logging.getLogger(__name__)

    # Import the main app instance directly
    from app.main import app as fastapi_app
    # Import the dependency functions to override
    from app.core.config import get_settings as app_get_settings
    from app.api.deps import get_db as app_api_get_db # Renamed for clarity
    from app.db.session import get_db as app_session_get_db # Import the one used by security

    logger.debug("Setting up standard test client with main app routes:")
    for route in fastapi_app.routes:
        logger.debug(f"Route: {route.path}, methods: {getattr(route, 'methods', None)}")

    # Ensure dependency overrides are clean before applying
    if hasattr(fastapi_app, "dependency_overrides"):
        fastapi_app.dependency_overrides.clear()
    else:
        fastapi_app.dependency_overrides = {}

    # Store test session in app state
    fastapi_app.state._test_session = db
    logger.debug(f"Stored test session {id(db)} in fastapi_app.state._test_session")

    # Override get_settings
    fastapi_app.dependency_overrides[app_get_settings] = lambda: test_settings
    # Dependency overrides for get_db are no longer needed; session is passed via app.state
    # fastapi_app.dependency_overrides[app_api_get_db] = lambda: db 
    # fastapi_app.dependency_overrides[app_session_get_db] = lambda: db 

    logger.debug(f"Overriding get_settings for main app. Effective settings: {test_settings}")
    # logger.debug(f"Overriding get_db... using app.state instead") # Updated comment

    transport = ASGITransport(app=fastapi_app)
    logger.debug("Creating AsyncClient with transport for main app")
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        logger.debug("Standard AsyncClient created")
        yield ac

    # Clean up dependency overrides after the test run
    if hasattr(fastapi_app, "dependency_overrides"):
        fastapi_app.dependency_overrides.clear()
    
    # Clean up app state
    if hasattr(fastapi_app.state, "_test_session"):
        del fastapi_app.state._test_session
        logger.debug("Removed _test_session from fastapi_app.state")
        
    logger.debug("Standard test client dependency overrides cleared")

@pytest_asyncio.fixture(scope="function")
async def super_admin_user(db: AsyncSession) -> User:
    """Fixture to create a super admin user."""
    email = f"super_admin_{uuid.uuid4()}@example.com"
    password = "supersecret"
    user_in = UserCreate(email=email, password=password, is_superuser=True)
    user = await user_crud.create(db=db, obj_in=user_in)
    await db.flush()
    await db.refresh(user)
    logger.info(f"Created super admin user {user.email} with ID {user.id}")
    return user

@pytest_asyncio.fixture(scope="function")
async def admin_user(db: AsyncSession) -> Admin:
    """Fixture to create a regular admin user and associated user record."""
    # 1. Create the User record first
    email = f"admin_{uuid.uuid4()}@example.com"
    password = "adminpassword"
    user_in = UserCreate(
        email=email,
        password=password,
        password_confirm=password,
        full_name="Admin User Name",
        is_superuser=False # Regular admin is not a superuser by default
    )
    user_obj = await user_crud.create(db=db, obj_in=user_in)
    await db.flush()
    await db.refresh(user_obj)
    logger.info(f"Created underlying user {user_obj.email} with ID {user_obj.id} for admin")

    # 2. Create the Admin record, linking it to the user
    admin_in = AdminCreateWithoutUser(role=AdminRole.USER_ADMIN, is_active=True)
    admin_obj = await admin.create(db=db, obj_in=admin_in, actor_id=user_obj.id, user_id=user_obj.id)
    await db.flush()
    await db.refresh(admin_obj)
    logger.info(f"Created admin record {admin_obj.id} linked to user {user_obj.id}")

    # Attach the user object to the admin object for convenience in tests
    # This assumes the relationship is loaded or accessible; adjust if needed
    admin_obj.user = user_obj

    return admin_obj

@pytest_asyncio.fixture(scope="function")
async def readonly_admin_user(db: AsyncSession) -> Admin:
    """Fixture to create a read-only admin user."""
    email = f"readonly_admin_{uuid.uuid4()}@example.com"
    password = "readonlypassword"
    user_in = UserCreate(email=email, password=password, is_superuser=False)
    user = await user_crud.create(db=db, obj_in=user_in)
    await db.flush()
    await db.refresh(user)
    # Ensure AdminRole is imported or defined
    from app.schemas.admin import AdminRole # Assuming AdminRole is here
    admin_in = AdminCreate(user_id=user.id, role=AdminRole.READ_ONLY)
    # Corrected usage: admin_crud.create_admin -> admin.create
    # Pass actor_id=user.id assuming the user creates their own admin profile initially
    admin_obj = await admin_crud.create(db=db, obj_in=admin_in, actor_id=user.id, user_id=user.id)
    await db.flush()
    await db.refresh(admin_obj)
    logger.info(f"Created read-only admin user {user.email} with ID {admin_obj.id}, User ID {admin_obj.user_id}")
    return admin_obj # Return the created admin object

@pytest_asyncio.fixture(scope="function")
async def test_user(db: AsyncSession) -> User:
    """Fixture to create a standard test user."""
    email = f"testuser_{uuid.uuid4()}@example.com"
    password = "testpassword"
    user_in = UserCreate(
        email=email, 
        password=password, 
        password_confirm=password, # Add confirmation
        full_name="Test User Name", # Add full name
        is_superuser=False
    )
    user_obj = await user_crud.create(db=db, obj_in=user_in)
    await db.flush()
    await db.refresh(user_obj)
    logger.info(f"Created test user {user_obj.email} with ID {user_obj.id}")
    user_obj.password = password # Add plaintext password for test use
    return user_obj

@pytest.fixture
def app_with_validation(test_settings: Settings) -> FastAPI:
    """Create a FastAPI app with validation middleware for testing."""
    app = FastAPI()
    
    # Define a simple model for the test endpoint body
    class TestPostBody(BaseModel):
        message: str
        
    @app.post("/test-post")
    # Expect the model in the body to trigger content-type validation
    async def test_post(body: TestPostBody):
        return {"received": body.model_dump()}
    
    # Pass settings to the middleware
    app.add_middleware(RequestValidationMiddleware, settings=test_settings)
    return app

@pytest.fixture(autouse=True)
def clear_settings_cache():
    """Fixture to automatically clear the get_settings cache before each test."""
    core_get_settings.cache_clear()
    logger.debug("Cleared get_settings() cache")

@pytest_asyncio.fixture(scope="function")
async def superuser_token_headers(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> dict[str, str]:
    """Fixture to provide superuser token headers for authenticated requests."""
    # Create a superuser using the UserFactory
    superuser = await UserFactory.create(session=db, is_superuser=True)
    await db.flush()
    await db.refresh(superuser)
    await db.commit()
    logger.info(f"Created superuser {superuser.email} with ID {superuser.id}")
    
    # Generate access token directly
    access_token = create_access_token(
        subject=str(superuser.id),
        settings=test_settings,
        expires_delta=timedelta(minutes=60)
    )
    
    # Return the auth headers
    return {"Authorization": f"Bearer {access_token}"}

@pytest_asyncio.fixture(scope="function")
async def normal_user_token_headers(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> tuple[Dict[str, str], User]:
    """
    Fixture to provide normal user token headers and the user object.

    Args:
        client: The test client.
        db: The database session.
        test_settings: The application settings.

    Returns:
        A tuple containing:
            - A dictionary with the Authorization header.
            - The created normal User object.
    """
    logger.info("Generating normal user token headers and user object for testing.")
    # Create a regular user using UserFactory
    regular_user = await UserFactory.create(session=db, is_superuser=False)
    await db.flush()
    await db.refresh(regular_user)
    logger.info(f"Created normal user {regular_user.email} with ID {regular_user.id}")
    
    # Generate access token directly
    access_token = create_access_token(
        subject=str(regular_user.id),
        settings=test_settings,
        expires_delta=timedelta(minutes=60)
    )
    
    headers = {"Authorization": f"Bearer {access_token}"}
    return headers, regular_user # Return both headers and user object

@pytest_asyncio.fixture(scope="function")
async def admin_user_token_headers(
    client: AsyncClient, db: AsyncSession, test_settings: Settings
) -> tuple[Dict[str, str], Admin]: # Return tuple: headers and the created Admin object
    """Generate admin user token headers for testing."""
    logger.info("Generating admin user token headers for testing.")
    # Use the utility function which handles user creation via factory
    admin_user_obj = await create_random_admin(db, role=AdminRole.USER_ADMIN)
    # Refresh the admin object AND its user relationship eagerly within the async fixture context
    await db.refresh(admin_user_obj, attribute_names=['user'])
    
    # Now it's safe to access the user relationship
    user_id_for_token = str(admin_user_obj.user.id)
    logger.info(f"Created admin user {admin_user_obj.user.email} with Admin ID {admin_user_obj.id} for token generation")

    access_token_expires = timedelta(minutes=test_settings.access_token_expire_minutes)
    token = create_access_token(
        subject=user_id_for_token, 
        settings=test_settings, # Pass the whole settings object
        expires_delta=access_token_expires
    )
    headers = {"Authorization": f"Bearer {token}"}
    logger.info(f"Generated token headers for admin user ID {user_id_for_token} (Admin ID {admin_user_obj.id})")
    return headers, admin_user_obj # Return both

@pytest.fixture(scope="function")
def test_user_email() -> str:
    """Return a test user email."""
    return f"test_user_{uuid.uuid4()}@example.com"

@pytest.fixture(scope="function")
def test_user_password() -> str:
    """Return a test user password."""
    return "test_password123"