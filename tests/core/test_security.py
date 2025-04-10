import pytest
from fastapi import HTTPException, status
from pydantic import SecretStr
from datetime import datetime, timezone, timedelta
import jwt
from unittest.mock import AsyncMock, patch, MagicMock
from app.core.security import create_access_token, get_current_user
from app.core.config import Settings

# Mock user_crud for tests
class MockUserCrud:
    async def get(self, db, *, id):
        # Simulate user retrieval or not found
        if id == 123: # Assuming user ID 123 exists for testing
            mock_user = MagicMock()
            mock_user.id = 123
            mock_user.is_active = True # Assume user is active
            return mock_user
        return None

user_crud = MockUserCrud()

# Provide a dummy TokenPayload for validation within get_current_user if needed
class TokenPayload(MagicMock):
    sub: int | None = None

@pytest.mark.asyncio
async def test_create_access_token():
    settings = Settings(secret_key=SecretStr("testsecretkey"*3))
    subject = "testuser"
    token = create_access_token(subject=subject, settings=settings)
    payload = jwt.decode(
        token,
        settings.secret_key.get_secret_value(),
        algorithms=[settings.algorithm],
    )
    assert payload["sub"] == subject
    assert "exp" in payload

@pytest.mark.asyncio
async def test_create_access_token_with_expiration():
    settings = Settings(secret_key=SecretStr("testsecretkey"*3))
    subject = "testuser"
    expires_delta = timedelta(minutes=30)
    token = create_access_token(
        subject=subject, settings=settings, expires_delta=expires_delta
    )
    payload = jwt.decode(
        token,
        settings.secret_key.get_secret_value(),
        algorithms=[settings.algorithm],
    )
    assert payload["sub"] == subject
    expire_time = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    assert expire_time > datetime.now(timezone.utc)
    assert expire_time < datetime.now(timezone.utc) + expires_delta + timedelta(seconds=5)

@pytest.mark.asyncio
async def test_get_current_user_valid_token(test_settings: Settings):
    """Test get_current_user returns user for a valid token."""
    # Mock user setup
    mock_user = MagicMock()
    mock_user.id = 123
    mock_user.is_active = True

    token = create_access_token(subject=mock_user.id, settings=test_settings)
    mock_db = AsyncMock()

    # Patch the actual user_crud used within get_current_user
    with patch("app.core.security.user_crud", new=user_crud):
        # Pass the resolved test_settings fixture explicitly
        user = await get_current_user(db=mock_db, token=token, settings=test_settings)

    assert user is not None
    assert user.id == mock_user.id

@pytest.mark.asyncio
async def test_get_current_user_invalid_token(test_settings: Settings):
    """Test get_current_user raises HTTPException for an invalid token."""
    token = "invalid.token.string"
    mock_db = AsyncMock()
    with patch("app.core.security.user_crud", new=user_crud):
        with pytest.raises(HTTPException) as excinfo:
            # Pass the resolved test_settings fixture explicitly
            await get_current_user(db=mock_db, token=token, settings=test_settings)

    assert excinfo.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert excinfo.value.detail == "Could not validate credentials"

@pytest.mark.asyncio
async def test_get_current_user_missing_subject(test_settings: Settings):
    """Test get_current_user raises HTTPException if 'sub' is missing."""
    token_payload = {"exp": datetime.now(timezone.utc) + timedelta(minutes=15)}
    token = jwt.encode(token_payload, test_settings.secret_key.get_secret_value(), algorithm=test_settings.algorithm)
    mock_db = AsyncMock()
    with patch("app.core.security.user_crud", new=user_crud):
        with pytest.raises(HTTPException) as excinfo:
            # Pass the resolved test_settings fixture explicitly
            await get_current_user(db=mock_db, token=token, settings=test_settings)

    assert excinfo.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert excinfo.value.detail == "Could not validate credentials"

@pytest.mark.asyncio
async def test_get_current_user_user_not_found(test_settings: Settings):
    """Test get_current_user raises HTTPException when user is not found."""
    token = create_access_token(subject=999, settings=test_settings) # Use ID known not to exist
    mock_db = AsyncMock()

    with patch("app.core.security.user_crud", new=user_crud) as mock_crud_patch:
         # Mock the get method within the patched object
        mock_crud_patch.get = AsyncMock(return_value=None) 
        
        with pytest.raises(HTTPException) as excinfo:
            # Pass the resolved test_settings fixture explicitly
            await get_current_user(db=mock_db, token=token, settings=test_settings)

    assert excinfo.value.status_code == status.HTTP_401_UNAUTHORIZED # Changed from 404 to 401 as per function logic
    # The detail might still be "Could not validate credentials" as the function raises the same exception
    assert excinfo.value.detail == "Could not validate credentials"
    # Verify the mocked get was called
    mock_crud_patch.get.assert_called_once_with(mock_db, id=999)

@pytest.mark.asyncio
async def test_get_current_user_inactive_user(test_settings: Settings):
    """Test get_current_user raises HTTPException for an inactive user."""
    # Mock user setup
    inactive_user_mock = MagicMock()
    inactive_user_mock.id = 456
    inactive_user_mock.is_active = False

    token = create_access_token(subject=inactive_user_mock.id, settings=test_settings)
    mock_db = AsyncMock()

    class InactiveUserCrud:
        async def get(self, db, *, id):
            if id == 456:
                return inactive_user_mock
            return None

    with patch("app.core.security.user_crud", new=InactiveUserCrud()):
        with pytest.raises(HTTPException) as excinfo:
            await get_current_user(db=mock_db, token=token, settings=test_settings)

    assert excinfo.value.status_code == status.HTTP_400_BAD_REQUEST # Check for inactive user status code
    assert excinfo.value.detail == "Inactive user" # Check for inactive user detail 