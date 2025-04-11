"""Simple test file for security module that doesn't depend on any fixtures."""
from datetime import datetime, timedelta, UTC, timezone
from jose import jwt

from app.core.config import get_settings
from app.core.security import create_access_token


def test_create_access_token():
    """Test creating a JWT access token."""
    current_settings = get_settings()
    
    # Test with default expiration
    token = create_access_token(subject="test-user", settings=current_settings)
    payload = jwt.decode(
        token,
        current_settings.secret_key.get_secret_value(),
        algorithms=[current_settings.algorithm],
    )
    assert payload["sub"] == "test-user"
    # Verify expiration is set and is in the future
    assert "exp" in payload
    exp_datetime = datetime.fromtimestamp(payload["exp"], tz=UTC)
    assert exp_datetime > datetime.now(UTC)
    
    # Test with custom expiration
    custom_expires = timedelta(minutes=30)
    token = create_access_token(subject="test-user", settings=current_settings, expires_delta=custom_expires)
    payload = jwt.decode(
        token,
        current_settings.secret_key.get_secret_value(),
        algorithms=[current_settings.algorithm],
    )
    assert payload["sub"] == "test-user"
    # Verify expiration is set and is in the future
    assert "exp" in payload
    exp_datetime = datetime.fromtimestamp(payload["exp"], tz=UTC)
    assert exp_datetime > datetime.now(UTC)
    # Verify expiration is approximately 30 minutes in the future
    time_diff = exp_datetime - datetime.now(UTC)
    assert timedelta(minutes=29) < time_diff < timedelta(minutes=31)


def test_expired_token():
    """Test validation of expired JWT token."""
    settings = get_settings()
    expired_token = jwt.encode(
        {"sub": "user1", "exp": 1},  # Expired in 1970
        settings.secret_key.get_secret_value(),
        algorithm=settings.algorithm,
    )
    
    # Verify token is expired
    try:
        jwt.decode(
            expired_token,
            settings.secret_key.get_secret_value(),
            algorithms=[settings.algorithm],
        )
        assert False, "Token should be expired"
    except jwt.ExpiredSignatureError:
        assert True 