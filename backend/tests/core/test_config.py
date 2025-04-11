"""
Test configuration module functionality, focusing on unit validation.
"""

import pytest
from unittest.mock import patch
from pydantic import SecretStr, ValidationError

from app.core.config import (
    Settings,
    Environment,
    parse_bool_str,
    parse_environment,
    get_settings, # Keep import for cache test
)

VALID_SECRET_KEY = "a_valid_secret_key_that_is_at_least_32_characters_long"


def test_parse_bool_str():
    """Test that parse_bool_str correctly parses boolean values from strings."""
    assert parse_bool_str("true") is True
    assert parse_bool_str("false") is False
    assert parse_bool_str(True) is True
    assert parse_bool_str(False) is False
    with pytest.raises(ValueError):
        parse_bool_str("invalid")

def test_parse_environment():
    """Test that parse_environment correctly validates environment values."""
    assert parse_environment("development") == "development"
    assert parse_environment("production") == "production"
    assert parse_environment("test") == "test"
    with pytest.raises(ValueError):
        parse_environment("invalid")

def test_environment_enum():
    """Test that Environment enum has the correct values."""
    assert Environment.DEVELOPMENT == "development"
    assert Environment.TEST == "test"

def test_settings_direct_instantiation():
    """Test direct instantiation with specific values (minimal validation focus)."""
    settings = Settings(
        app_name="DirectApp",
        secret_key=VALID_SECRET_KEY,
        environment=Environment.PRODUCTION,
        debug=True,
        testing=False, # Explicitly False
        cors_origins=["http://direct.com"], # Passed directly
        database_url_for_env="direct_db_url",
        redis_url="redis://direct-redis:6379/2"
    )
    assert settings.app_name == "DirectApp"
    assert settings.secret_key.get_secret_value() == VALID_SECRET_KEY
    assert settings.environment == Environment.PRODUCTION
    assert settings.debug is True
    assert settings.testing is False
    # CORS validator runs, but testing=False and environment=PRODUCTION means it shouldn't clear the list
    # It does add a trailing slash
    assert settings.cors_origins == ["http://direct.com/"] 
    assert settings.database_url_for_env == "direct_db_url"
    assert str(settings.redis_url) == "redis://direct-redis:6379/2"

def test_settings_secret_key_validation():
    """Test secret key validation during instantiation."""
    # Valid key
    Settings(secret_key=VALID_SECRET_KEY)
    # Invalid key (too short)
    with pytest.raises(ValidationError, match="Secret key must be at least 32 characters long"):
        Settings(secret_key="short")

def test_settings_cors_validator_in_test_mode():
    """Test the CORS validator specifically empties list in test mode."""
    # Instantiate with testing=True
    settings_testing = Settings(
        secret_key=VALID_SECRET_KEY, 
        testing=True, 
        cors_origins=["http://should_be_removed.com"]
    )
    assert settings_testing.cors_origins == [], "When testing=True, cors_origins should be empty"

def test_get_settings_caching():
    """Test that get_settings caches the settings (relies on test env)."""
    # Clear cache first via fixture (implicitly applied)
    settings1 = get_settings()
    settings2 = get_settings()
    assert settings1 is settings2 