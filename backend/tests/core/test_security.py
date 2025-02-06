"""Test security utilities."""
from datetime import datetime, timedelta

import pytest
from jose import jwt, JWTError

from app.core.config import settings
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)


def test_password_hash() -> None:
    """Test password hashing and verification."""
    password = "testpassword123"
    hashed = get_password_hash(password)
    
    # Hash should be different from original password
    assert hashed != password
    
    # Verify should work with correct password
    assert verify_password(password, hashed)
    
    # Verify should fail with wrong password
    assert not verify_password("wrongpassword", hashed)
    
    # Different passwords should have different hashes
    hashed2 = get_password_hash("testpassword123")
    assert hashed != hashed2  # Due to salt


def test_create_access_token() -> None:
    """Test JWT token creation."""
    # Test with default expiration
    token1 = create_access_token("testuser")
    payload1 = jwt.decode(
        token1,
        settings.secret_key,
        algorithms=[settings.algorithm],
    )
    assert payload1["sub"] == "testuser"
    
    # Test with custom expiration
    expires = timedelta(minutes=30)
    token2 = create_access_token("testuser", expires)
    payload2 = jwt.decode(
        token2,
        settings.secret_key,
        algorithms=[settings.algorithm],
    )
    assert payload2["sub"] == "testuser"
    
    # Test expiration
    exp1 = datetime.fromtimestamp(payload1["exp"])
    exp2 = datetime.fromtimestamp(payload2["exp"])
    assert exp2 > exp1


def test_token_expiration() -> None:
    """Test JWT token expiration."""
    # Create token that expires in 1 second
    token = create_access_token("testuser", timedelta(seconds=1))
    
    # Token should be valid initially
    payload = jwt.decode(
        token,
        settings.secret_key,
        algorithms=[settings.algorithm],
    )
    assert payload["sub"] == "testuser"
    
    # Wait for token to expire
    import time
    time.sleep(2)
    
    # Token should be expired
    with pytest.raises(JWTError):
        jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )


def test_invalid_token() -> None:
    """Test JWT token validation."""
    # Test with wrong secret
    wrong_token = jwt.encode(
        {"sub": "testuser"},
        "wrong-secret",
        algorithm=settings.algorithm,
    )
    with pytest.raises(JWTError):
        jwt.decode(
            wrong_token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
    
    # Test with wrong algorithm
    wrong_alg_token = jwt.encode(
        {"sub": "testuser"},
        settings.secret_key,
        algorithm="HS512",  # Wrong algorithm
    )
    with pytest.raises(JWTError):
        jwt.decode(
            wrong_alg_token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
    
    # Test with malformed token
    with pytest.raises(JWTError):
        jwt.decode(
            "not-a-token",
            settings.secret_key,
            algorithms=[settings.algorithm],
        ) 