"""Test API dependencies."""
import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from typing import AsyncGenerator, Dict
import logging

from fastapi import HTTPException, Depends, FastAPI
from httpx import AsyncClient, ASGITransport
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.api.deps import get_current_user, get_current_admin, get_current_active_user
from app.core.config import Settings, get_settings
from app.core.security import create_access_token
from app.main import app
from app.models.user import User
from app.models.admin import Admin, AdminRole
from app.schemas.user import UserResponse
from app.schemas.auth import Token
from app.schemas.admin import AdminWithUser
from tests.factories import UserFactory, AdminFactory
from tests.utils.admin import create_random_admin
from app.crud import user as user_crud

# Configure logger for this module
logger = logging.getLogger(__name__)

# Define a fixture for the test app specific to this module
@pytest.fixture(scope="module") # Use module scope for efficiency
def deps_test_app() -> FastAPI:
    """Create a FastAPI instance with the test endpoint for dependency tests."""
    test_app = FastAPI()
    
    @test_app.get("/test-deps/current-user", response_model=UserResponse)
    async def read_current_user_test_endpoint(
        current_user: User = Depends(get_current_user)
    ):
        return current_user
        
    @test_app.get("/test-deps/current-admin", response_model=AdminWithUser)
    async def read_current_admin_test_endpoint(
        current_admin: Admin = Depends(get_current_admin),
    ):
        """Test endpoint for get_current_admin dependency."""
        return current_admin
        
    return test_app

@pytest_asyncio.fixture(scope="function")
async def deps_test_client(deps_test_app: FastAPI, db: AsyncSession, test_settings: Settings) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client configured specifically for the deps_test_app."""
    # Import the specific get_db to override
    from app.api.deps import get_db as app_get_db
    
    # Override settings and db for this specific app instance
    deps_test_app.dependency_overrides[get_settings] = lambda: test_settings
    deps_test_app.dependency_overrides[app_get_db] = lambda: db # Add db override
    
    transport = ASGITransport(app=deps_test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    
    # Clean up overrides for the specific app instance
    deps_test_app.dependency_overrides.clear()


pytestmark = pytest.mark.asyncio


async def test_get_db(db: AsyncSession):
    """Test database session dependency."""
    assert isinstance(db, AsyncSession)


# Use the specialized client for these tests
async def test_get_current_user_valid_token(
    db: AsyncSession,
    test_settings: Settings,
    test_user_email: str,
    test_user_password: str
) -> None:
    """Test get_current_user with a valid token."""
    # Create a test user
    user = await UserFactory.create(
        session=db,
        email=test_user_email,
        password=test_user_password,
        is_active=True
    )
    await db.commit()
    await db.refresh(user)

    # Create a valid token for the user
    access_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=test_settings.access_token_expire_minutes),
        settings=test_settings
    )

    # Get the user using the token
    current_user = await get_current_user(
        db=db,
        token=access_token,
        settings=test_settings
    )

    # Verify the user is returned correctly
    assert current_user is not None
    assert current_user.id == user.id
    assert current_user.email == user.email
    assert current_user.is_active is True

    # Cleanup
    await db.delete(user)
    await db.commit()


async def test_get_current_user_invalid_token(deps_test_client: AsyncClient):
    """Test getting current user with invalid token via endpoint."""
    headers = {
        "Authorization": "Bearer invalid-token",
        "User-Agent": "pytest-test-client",
        "Accept": "application/json"
    }
    response = await deps_test_client.get("/test-deps/current-user", headers=headers)
    assert response.status_code == 401
    assert "Could not validate credentials" in response.json()["detail"]


async def test_get_current_user_nonexistent_user(deps_test_client: AsyncClient, db: AsyncSession, test_settings: Settings):
    """Test getting current user with token for nonexistent user via endpoint."""
    token = jwt.encode(
        {"sub": "999999"},  # Non-existent user ID
        test_settings.secret_key.get_secret_value(),
        algorithm=test_settings.algorithm
    )
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "pytest-test-client",
        "Accept": "application/json"
    }
    
    response = await deps_test_client.get("/test-deps/current-user", headers=headers)
    assert response.status_code == 404


async def test_get_current_user_inactive_user(deps_test_client: AsyncClient, db: AsyncSession, test_settings: Settings):
    """Test getting current user with inactive user via endpoint."""
    user = await UserFactory.create(session=db, is_active=False)
    await db.refresh(user)
    await db.commit()

    token = jwt.encode(
        {"sub": str(user.id)},
        test_settings.secret_key.get_secret_value(),
        algorithm=test_settings.algorithm
    )
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "pytest-test-client",
        "Accept": "application/json"
    }
    
    # Add logging before making the request
    logger.info(f"Getting current user for inactive user ID: {user.id}")
    existing_user = await user_crud.get(db, id=user.id)
    if existing_user:
        logger.info(f"Inactive user {user.id} found in DB before client call.")
    else:
        logger.warning(f"Inactive user {user.id} NOT found in DB before client call.")

    response = await deps_test_client.get("/test-deps/current-user", headers=headers)
    # get_current_user should find the user even if inactive.
    # The get_current_active_user dependency would raise an error, but /test-deps/current-user doesn't use that.
    logger.info(f"Inactive user response status: {response.status_code}")
    logger.info(f"Inactive user response body: {response.text}")
    assert response.status_code == 200, f"Expected 200, got {response.status_code} with body: {response.text}"
    data = response.json()
    assert data["id"] == user.id
    assert not data["is_active"]


async def test_get_current_active_user(client: AsyncClient, db: AsyncSession, normal_user_token_headers: tuple[dict[str, str], User], test_settings: Settings):
    """Test getting current active user via endpoint."""
    headers, user_from_fixture = normal_user_token_headers # Unpack the tuple
    
    response = await client.get(f"{test_settings.api_v1_str}/users/me", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code} with body: {response.text}"
    data = response.json()
    
    # Assert against the user returned by the fixture that generated the token
    assert data["id"] == user_from_fixture.id, f"Expected ID {user_from_fixture.id}, got {data['id']}"
    assert data["email"] == user_from_fixture.email


async def test_get_current_active_user_inactive(client: AsyncClient, db: AsyncSession, test_settings: Settings):
    """Test getting current active user when user is inactive."""
    user = await UserFactory.create(session=db, is_active=False)
    await db.commit()
    await db.refresh(user)
    
    token = jwt.encode(
        {"sub": str(user.id)}, 
        test_settings.secret_key.get_secret_value(), 
        algorithm=test_settings.algorithm
    )
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "pytest-test-client",
        "Accept": "application/json"
    }
    
    # Use the /users/me endpoint which depends on get_current_active_user
    response = await client.get(f"{test_settings.api_v1_str}/users/me", headers=headers)
    assert response.status_code == 400
    assert "Inactive user" in response.json()["detail"]


async def test_get_current_active_superuser(db: AsyncSession):
    """Test getting current active superuser."""
    user = await UserFactory.create(session=db, is_superuser=True)
    superuser = await deps.get_current_active_superuser(current_user=user)
    assert superuser == user


async def test_get_current_active_superuser_not_superuser(db: AsyncSession):
    """Test getting current active superuser with non-superuser."""
    user = await UserFactory.create(session=db, is_superuser=False)
    with pytest.raises(HTTPException) as exc_info:
        await deps.get_current_active_superuser(current_user=user)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "The user doesn't have enough privileges"


async def test_get_current_admin(
    client: AsyncClient,
    admin_user_token_headers: tuple[Dict[str, str], Admin], # Use the updated fixture return type
    test_settings: Settings
):
    """Test getting current admin user via endpoint."""
    headers, admin_from_fixture = admin_user_token_headers # Unpack headers and the correct admin object
    
    response = await client.get(f"{test_settings.api_v1_str}/admin/me", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code} with body: {response.text}"
    data = response.json()
    assert data["id"] == admin_from_fixture.id # Compare against the admin from the fixture
    assert data["user_id"] == admin_from_fixture.user_id
    assert data["role"] == admin_from_fixture.role.value
    # Add other relevant assertions if needed


async def test_get_current_admin_not_admin(
    deps_test_client: AsyncClient, # Use test client
    normal_user_token_headers: tuple[Dict[str, str], User], # Change fixture name and type
    db: AsyncSession # Keep db fixture
):
    """Test getting current admin with non-admin user via endpoint."""
    headers, _ = normal_user_token_headers # Unpack headers from correct fixture
    # User is created by the fixture providing normal_user_token_headers
    # The user associated with normal_user_token_headers is NOT an admin

    # Hit the test endpoint that requires get_current_admin
    response = await deps_test_client.get("/test-deps/current-admin", headers=headers) # Use unpacked headers

    # Expect a 403 Forbidden because the user is not an admin
    assert response.status_code == 403, f"Expected 403, got {response.status_code} with body: {response.text}"
    assert "The user is not an admin" in response.text # Corrected expected detail message


async def test_get_current_admin_inactive(
    deps_test_client: AsyncClient,
    db: AsyncSession,
    test_settings: Settings
):
    """Test getting current admin with inactive admin user via endpoint."""
    # Create an inactive user and admin using the utility
    admin = await create_random_admin(db, role=AdminRole.USER_ADMIN)
    # Set the admin and user as inactive
    admin.is_active = False
    admin.user.is_active = False
    await db.commit()

    # Generate token for the inactive user
    access_token = create_access_token(
        subject=str(admin.user.id),
        settings=test_settings
    )
    headers = {"Authorization": f"Bearer {access_token}"}

    # Hit the test endpoint that requires get_current_admin
    response = await deps_test_client.get("/test-deps/current-admin", headers=headers)

    # Expect a 403 Forbidden because the user is inactive, even if they are an admin
    # The check for admin happens first, then the activity check within get_current_admin logic
    assert response.status_code == 403, f"Expected 403 for inactive admin, got {response.status_code} with body: {response.text}"
    assert "Inactive admin user" in response.text # Detail comes from get_current_admin check


async def test_get_current_active_admin(db: AsyncSession):
    """Test getting current active admin."""
    # Create an active admin user using the utility
    admin = await create_random_admin(db, role=AdminRole.SUPER_ADMIN)
    await db.commit()
    
    # Test the dependency directly
    current_admin = await deps.get_current_active_admin(current_admin=admin)
    assert current_admin == admin 