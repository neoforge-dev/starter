"""Test authentication endpoints."""
import pytest
from typing import Dict
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.core.config import get_settings, Settings
from app.models.user import User
from tests.factories import UserFactory
from app.crud import user as user_crud

pytestmark = pytest.mark.asyncio

logger = logging.getLogger(__name__)


@pytest.fixture
def test_user_email() -> str:
    return "test-auth@example.com"


@pytest.fixture
def test_user_password() -> str:
    return "testpassword123"


@pytest.fixture
async def test_user(db: AsyncSession, test_user_email: str, test_user_password: str) -> User:
    """Create a test user for authentication tests, with cleanup."""
    user = None
    try:
        user = await UserFactory.create(
            session=db,
            email=test_user_email,
            password=test_user_password,
            is_active=True
        )
        # Store the plain password for test use
        setattr(user, 'plain_password', test_user_password)
        # await db.commit() # REVERTED EXPERIMENT: Rely on fixture transaction
        yield user
    finally:
        if user is not None:
            # Use get to fetch potentially detached object
            user_to_delete = await db.get(User, user.id)
            if user_to_delete:
                await db.delete(user_to_delete)
                # No commit needed here, rely on fixture rollback for cleanup


@pytest.fixture
async def test_inactive_user(db: AsyncSession) -> User:
    """Create an inactive test user, with cleanup."""
    user = None
    try:
        user = await UserFactory.create(
            session=db,
            email="inactive@example.com",
            password="inactivepassword",
            is_active=False
        )
        await db.refresh(user)
        yield user # Provide the user to the test
    finally:
        # Cleanup: Delete the user after the test if created
        if user is not None:
            # Re-fetch the user in the current session context for deletion
            user_to_delete = await db.get(User, user.id)
            if user_to_delete:
                await db.delete(user_to_delete)


@pytest.fixture
async def test_user_headers(test_user: User, test_settings: Settings) -> Dict[str, str]:
    """Generate headers for the test user."""
    from app.core.security import create_access_token
    from datetime import timedelta
    
    access_token_expires = timedelta(minutes=test_settings.access_token_expire_minutes)
    access_token = create_access_token(
        subject=str(test_user.id), settings=test_settings, expires_delta=access_token_expires
    )
    return {"Authorization": f"Bearer {access_token}"}


async def test_login_access_token(client: AsyncClient, db: AsyncSession, test_user: User, test_settings: Settings) -> None:
    """Test login with valid credentials."""
    # The test_user fixture now commits, no need for explicit commit here
    login_data = {
        "username": test_user.email,
        "password": test_user.plain_password  # Use the stored plain password
    }
    # Add logging before making the request
    logger.info(f"Attempting login for user: {test_user.email}, PW snippet: {test_user.plain_password[:3]}...")
    existing_user = await user_crud.get_by_email(db, email=test_user.email)
    if existing_user:
        logger.info(f"User {test_user.email} found in DB (ID: {existing_user.id}) before client call.")
        logger.info(f"Stored hash: {existing_user.hashed_password}")
    else:
        logger.warning(f"User {test_user.email} NOT found in DB before client call.")
    
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    logger.info(f"Login response status: {response.status_code}")
    logger.info(f"Login response body: {response.text}")
    assert response.status_code == 200, f"Expected 200, got {response.status_code} with body: {response.text}"
    token = response.json()
    assert "access_token" in token
    assert token["token_type"] == "bearer"


async def test_login_invalid_credentials(client: AsyncClient, db: AsyncSession, test_user: User, test_user_email: str, test_settings: Settings) -> None:
    """Test login with invalid credentials."""
    # Test login with wrong password
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/token", # Corrected path, use test_settings
        data={"username": test_user_email, "password": "wrongpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Incorrect email or password"
    
    # Test login with non-existent user
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/token", # Corrected path, use test_settings
        data={"username": "nonexistent@example.com", "password": "testpassword123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Incorrect email or password"


async def test_login_inactive_user(client: AsyncClient, db: AsyncSession, test_inactive_user: User, test_settings: Settings) -> None:
    """Test login with inactive user."""
    # test_inactive_user fixture creates the user
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/token", # Corrected path, use test_settings
        data={"username": test_inactive_user.email, "password": "inactivepassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    # Assuming authentication failure for inactive users returns the same generic message
    # Adjust if the specific error message for inactive users is different
    assert data["detail"] == "Incorrect email or password"


async def test_read_users_me(client: AsyncClient, db: AsyncSession, test_user_headers: Dict[str, str], test_user: User, test_settings: Settings) -> None:
    """Test getting the current logged-in user's information."""
    response = await client.get(f"{test_settings.api_v1_str}/users/me", headers=test_user_headers) # Use test_settings, corrected endpoint path
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["id"] == test_user.id
    assert "password" not in data


async def test_read_users_me_invalid_token(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test accessing protected route with an invalid token."""
    headers = {"Authorization": "Bearer invalidtoken"}
    response = await client.get(f"{test_settings.api_v1_str}/users/me", headers=headers) # Use test_settings, corrected endpoint path
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Could not validate credentials"


async def test_read_users_me_no_token(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test accessing protected route without a token."""
    response = await client.get(f"{test_settings.api_v1_str}/users/me") # Use test_settings, corrected endpoint path
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Not authenticated"


# Registration tests
async def test_register_user_success(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test successful user registration."""
    registration_data = {
        "email": "newuser@example.com",
        "password": "testpassword123",
        "password_confirm": "testpassword123",
        "full_name": "New Test User"
    }
    
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/register",
        json=registration_data
    )
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code} with body: {response.text}"
    data = response.json()
    
    # Check response structure
    assert "message" in data
    assert data["message"] == "User registered successfully"
    assert "user" in data
    assert "access_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"
    
    # Check user data
    user_data = data["user"]
    assert user_data["email"] == registration_data["email"]
    assert user_data["full_name"] == registration_data["full_name"]
    assert user_data["is_active"] is True
    assert "id" in user_data
    assert "created_at" in user_data
    assert "password" not in user_data  # Password should never be returned
    
    # Verify user was created in database
    from app.crud.user import user as user_crud
    created_user = await user_crud.get_by_email(db, email=registration_data["email"])
    assert created_user is not None
    assert created_user.email == registration_data["email"]
    assert created_user.full_name == registration_data["full_name"]
    assert created_user.is_active is True
    
    # Clean up
    await db.delete(created_user)
    await db.commit()


async def test_register_user_duplicate_email(client: AsyncClient, db: AsyncSession, test_user: User, test_settings: Settings) -> None:
    """Test registration with an already registered email."""
    registration_data = {
        "email": test_user.email,  # Use existing user's email
        "password": "testpassword123",
        "password_confirm": "testpassword123",
        "full_name": "Duplicate User"
    }
    
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/register",
        json=registration_data
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Email already registered"


async def test_register_user_password_mismatch(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test registration with mismatched passwords."""
    registration_data = {
        "email": "mismatch@example.com",
        "password": "testpassword123",
        "password_confirm": "differentpassword",  # Different password
        "full_name": "Mismatch User"
    }
    
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/register",
        json=registration_data
    )
    
    assert response.status_code == 422  # Validation error
    data = response.json()
    assert "detail" in data


async def test_register_user_invalid_email(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test registration with invalid email format."""
    registration_data = {
        "email": "invalid-email",  # Invalid email format
        "password": "testpassword123",
        "password_confirm": "testpassword123",
        "full_name": "Invalid Email User"
    }
    
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/register",
        json=registration_data
    )
    
    assert response.status_code == 422  # Validation error
    data = response.json()
    assert "detail" in data


async def test_register_user_missing_fields(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test registration with missing required fields."""
    registration_data = {
        "email": "incomplete@example.com",
        # Missing password, password_confirm, and full_name
    }
    
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/register",
        json=registration_data
    )
    
    assert response.status_code == 422  # Validation error
    data = response.json()
    assert "detail" in data


async def test_register_user_email_integration(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test that registration triggers welcome email (mocked)."""
    from unittest.mock import patch
    
    registration_data = {
        "email": "emailtest@example.com",
        "password": "testpassword123",
        "password_confirm": "testpassword123",
        "full_name": "Email Test User"
    }
    
    # Mock the email sending function
    with patch('app.api.v1.endpoints.auth.send_new_account_email') as mock_send_email:
        response = await client.post(
            f"{test_settings.api_v1_str}/auth/register",
            json=registration_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "User registered successfully"
        
        # Verify email function was called
        mock_send_email.assert_called_once()
        call_args = mock_send_email.call_args
        assert call_args[1]["email_to"] == registration_data["email"]
        assert call_args[1]["username"] == registration_data["full_name"]
        assert "verification_token" in call_args[1]
        assert call_args[1]["settings"] == test_settings
    
    # Clean up
    from app.crud.user import user as user_crud
    created_user = await user_crud.get_by_email(db, email=registration_data["email"])
    if created_user:
        await db.delete(created_user)
        await db.commit()


async def test_register_user_email_failure_continues_registration(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test that registration completes even if email sending fails."""
    from unittest.mock import patch
    
    registration_data = {
        "email": "emailfail@example.com",
        "password": "testpassword123", 
        "password_confirm": "testpassword123",
        "full_name": "Email Fail User"
    }
    
    # Mock email sending to raise an exception
    with patch('app.api.v1.endpoints.auth.send_new_account_email', side_effect=Exception("Email service down")):
        response = await client.post(
            f"{test_settings.api_v1_str}/auth/register",
            json=registration_data
        )
        
        # Registration should still succeed despite email failure
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "User registered successfully"
        assert "access_token" in data
    
    # Verify user was still created in database
    from app.crud.user import user as user_crud
    created_user = await user_crud.get_by_email(db, email=registration_data["email"])
    assert created_user is not None
    assert created_user.email == registration_data["email"]
    
    # Clean up
    await db.delete(created_user)
    await db.commit()


async def test_register_user_can_login_immediately(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test that a newly registered user can login immediately using the returned token."""
    registration_data = {
        "email": "logintest@example.com",
        "password": "testpassword123",
        "password_confirm": "testpassword123", 
        "full_name": "Login Test User"
    }
    
    # Register user
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/register",
        json=registration_data
    )
    
    assert response.status_code == 200
    data = response.json()
    access_token = data["access_token"]
    
    # Use the token to access a protected endpoint
    headers = {"Authorization": f"Bearer {access_token}"}
    response = await client.get(f"{test_settings.api_v1_str}/users/me", headers=headers)
    
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == registration_data["email"]
    assert user_data["full_name"] == registration_data["full_name"]
    
    # Clean up
    from app.crud.user import user as user_crud
    created_user = await user_crud.get_by_email(db, email=registration_data["email"])
    if created_user:
        await db.delete(created_user)
        await db.commit() 