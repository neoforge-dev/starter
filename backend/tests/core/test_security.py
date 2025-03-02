"""
Test security module functionality.

This test verifies that the security module works correctly, including:
- JWT token creation
- Token validation
- User authentication

We use mocking to avoid actual database access.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta, UTC
from jose import jwt
from fastapi import HTTPException

from app.core.security import (
    create_access_token,
    get_current_user,
    oauth2_scheme,
)
from app.core.config import settings


def test_create_access_token():
    """Test that create_access_token creates a valid JWT token."""
    # Create a token with a specific subject
    subject = "test_user_123"
    token = create_access_token(subject=subject)
    
    # Decode the token and verify its contents
    payload = jwt.decode(
        token,
        settings.secret_key.get_secret_value(),
        algorithms=[settings.algorithm],
    )
    
    # Verify the subject
    assert payload["sub"] == subject
    
    # Verify the expiration time (should be about 15 minutes from now)
    exp_time = datetime.fromtimestamp(payload["exp"], tz=UTC)
    now = datetime.now(UTC)
    assert (exp_time - now).total_seconds() > 14 * 60  # At least 14 minutes
    assert (exp_time - now).total_seconds() < 16 * 60  # At most 16 minutes


def test_create_access_token_with_expiration():
    """Test that create_access_token respects custom expiration time."""
    # Create a token with a specific subject and expiration
    subject = "test_user_123"
    expires_delta = timedelta(hours=1)
    token = create_access_token(subject=subject, expires_delta=expires_delta)
    
    # Decode the token and verify its contents
    payload = jwt.decode(
        token,
        settings.secret_key.get_secret_value(),
        algorithms=[settings.algorithm],
    )
    
    # Verify the subject
    assert payload["sub"] == subject
    
    # Verify the expiration time (should be about 1 hour from now)
    exp_time = datetime.fromtimestamp(payload["exp"], tz=UTC)
    now = datetime.now(UTC)
    assert (exp_time - now).total_seconds() > 59 * 60  # At least 59 minutes
    assert (exp_time - now).total_seconds() < 61 * 60  # At most 61 minutes


@pytest.mark.asyncio
async def test_get_current_user_valid_token():
    """Test that get_current_user returns the user when token is valid."""
    # Create a mock user
    mock_user = MagicMock()
    mock_user.id = 123
    
    # Create a valid token
    token = create_access_token(subject=mock_user.id)
    
    # Mock the database session and user_crud.get
    mock_db = AsyncMock()
    
    with patch("app.core.security.user_crud.get") as mock_get:
        # Configure mock to return our mock user
        mock_get.return_value = mock_user
        
        # Call the function
        user = await get_current_user(db=mock_db, token=token)
        
        # Verify the result
        assert user is mock_user
        
        # Verify user_crud.get was called with correct arguments
        mock_get.assert_called_once_with(mock_db, id=mock_user.id)


@pytest.mark.asyncio
async def test_get_current_user_invalid_token():
    """Test that get_current_user raises HTTPException when token is invalid."""
    # Create an invalid token
    token = "invalid_token"
    
    # Mock the database session
    mock_db = AsyncMock()
    
    # Call the function and expect an exception
    with pytest.raises(HTTPException) as excinfo:
        await get_current_user(db=mock_db, token=token)
    
    # Verify the exception
    assert excinfo.value.status_code == 401
    assert excinfo.value.detail == "Could not validate credentials"
    assert excinfo.value.headers == {"WWW-Authenticate": "Bearer"}


@pytest.mark.asyncio
async def test_get_current_user_missing_subject():
    """Test that get_current_user raises HTTPException when subject is missing."""
    # Create a token without a subject
    token = jwt.encode(
        {"exp": datetime.now(UTC) + timedelta(minutes=15)},  # No 'sub' field
        settings.secret_key.get_secret_value(),
        algorithm=settings.algorithm,
    )
    
    # Mock the database session
    mock_db = AsyncMock()
    
    # Call the function and expect an exception
    with pytest.raises(HTTPException) as excinfo:
        await get_current_user(db=mock_db, token=token)
    
    # Verify the exception
    assert excinfo.value.status_code == 401
    assert excinfo.value.detail == "Could not validate credentials"


@pytest.mark.asyncio
async def test_get_current_user_user_not_found():
    """Test that get_current_user raises HTTPException when user is not found."""
    # Create a valid token
    token = create_access_token(subject=123)
    
    # Mock the database session and user_crud.get
    mock_db = AsyncMock()
    
    with patch("app.core.security.user_crud.get") as mock_get:
        # Configure mock to return None (user not found)
        mock_get.return_value = None
        
        # Call the function and expect an exception
        with pytest.raises(HTTPException) as excinfo:
            await get_current_user(db=mock_db, token=token)
        
        # Verify the exception
        assert excinfo.value.status_code == 401
        assert excinfo.value.detail == "Could not validate credentials"
        
        # Verify user_crud.get was called
        mock_get.assert_called_once() 