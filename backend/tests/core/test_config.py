"""
Test configuration module functionality.

This test verifies that the configuration module works correctly, including:
- Settings validation
- Default values
- Environment variable parsing
- Settings caching
"""

import pytest
import os
from unittest.mock import patch
from pydantic import SecretStr, ValidationError

from app.core.config import (
    Settings,
    Environment,
    parse_bool_str,
    parse_environment,
    get_settings,
)


def test_parse_bool_str():
    """Test that parse_bool_str correctly parses boolean values from strings."""
    # Test string values
    assert parse_bool_str("true") is True
    assert parse_bool_str("True") is True
    assert parse_bool_str("1") is True
    assert parse_bool_str("false") is False
    assert parse_bool_str("False") is False
    assert parse_bool_str("0") is False
    
    # Test boolean values
    assert parse_bool_str(True) is True
    assert parse_bool_str(False) is False
    
    # Test invalid values
    with pytest.raises(ValueError):
        parse_bool_str("invalid")


def test_parse_environment():
    """Test that parse_environment correctly validates environment values."""
    # Test valid values
    assert parse_environment("development") == "development"
    assert parse_environment("staging") == "staging"
    assert parse_environment("production") == "production"
    assert parse_environment("test") == "test"
    
    # Test invalid values
    with pytest.raises(ValueError):
        parse_environment("invalid")


def test_environment_enum():
    """Test that Environment enum has the correct values."""
    assert Environment.DEVELOPMENT == "development"
    assert Environment.STAGING == "staging"
    assert Environment.PRODUCTION == "production"
    assert Environment.TEST == "test"


def test_settings_default_values():
    """Test that Settings has the correct default values."""
    # Create settings with default values
    settings = Settings(secret_key="test_secret")
    
    # Verify default values
    assert settings.app_name == "TestApp"
    assert settings.version == "0.1.0"
    assert settings.frontend_url == "http://localhost:3000"
    assert settings.algorithm == "HS256"
    assert settings.rate_limit_requests == 100
    assert settings.rate_limit_window == 60
    assert settings.api_v1_str == "/api/v1"
    assert settings.database_url_for_env == "postgresql+asyncpg://postgres:postgres@db:5432/app"
    assert settings.debug is False
    assert settings.testing is False
    assert settings.redis_url == "redis://redis:6379/0"
    assert settings.environment == Environment.DEVELOPMENT
    assert settings.cors_origins == ["http://localhost:3000"]
    assert settings.access_token_expire_minutes == 10080  # 7 days


def test_settings_custom_values():
    """Test that Settings accepts custom values."""
    # Create settings with custom values
    settings = Settings(
        app_name="CustomApp",
        version="1.0.0",
        frontend_url="https://example.com",
        secret_key="custom_secret",
        algorithm="RS256",
        rate_limit_requests=200,
        rate_limit_window=120,
        api_v1_str="/api/v2",
        database_url_for_env="postgresql+asyncpg://user:pass@host:5432/db",
        debug=True,
        testing=True,
        redis_url="redis://custom:6379/1",
        environment=Environment.PRODUCTION,
        cors_origins=["https://example.com", "https://api.example.com"],
        access_token_expire_minutes=1440,  # 1 day
    )
    
    # Verify custom values
    assert settings.app_name == "CustomApp"
    assert settings.version == "1.0.0"
    assert settings.frontend_url == "https://example.com"
    assert settings.secret_key.get_secret_value() == "custom_secret"
    assert settings.algorithm == "RS256"
    assert settings.rate_limit_requests == 200
    assert settings.rate_limit_window == 120
    assert settings.api_v1_str == "/api/v2"
    assert settings.database_url_for_env == "postgresql+asyncpg://user:pass@host:5432/db"
    assert settings.debug is True
    assert settings.testing is True
    assert settings.redis_url == "redis://custom:6379/1"
    assert settings.environment == Environment.PRODUCTION
    assert settings.cors_origins == ["https://example.com", "https://api.example.com"]
    assert settings.access_token_expire_minutes == 1440


def test_settings_environment_validation():
    """Test that Settings validates environment values."""
    # Valid environment
    settings = Settings(secret_key="test_secret", environment="production")
    assert settings.environment == Environment.PRODUCTION
    
    # Invalid environment
    with pytest.raises(ValidationError):
        Settings(secret_key="test_secret", environment="invalid")


def test_settings_cors_origins_validation():
    """Test that Settings validates CORS origins."""
    # String value
    settings = Settings(secret_key="test_secret", cors_origins="https://example.com")
    assert settings.cors_origins == ["https://example.com"]
    
    # List value
    settings = Settings(secret_key="test_secret", cors_origins=["https://example.com", "https://api.example.com"])
    assert settings.cors_origins == ["https://example.com", "https://api.example.com"]
    
    # JSON string value
    settings = Settings(secret_key="test_secret", cors_origins='["https://example.com", "https://api.example.com"]')
    assert settings.cors_origins == ["https://example.com", "https://api.example.com"]


def test_settings_debug_validation():
    """Test that Settings validates debug values."""
    # String values
    settings = Settings(secret_key="test_secret", debug="true")
    assert settings.debug is True
    
    settings = Settings(secret_key="test_secret", debug="false")
    assert settings.debug is False
    
    # Boolean values
    settings = Settings(secret_key="test_secret", debug=True)
    assert settings.debug is True
    
    settings = Settings(secret_key="test_secret", debug=False)
    assert settings.debug is False


def test_settings_testing_validation():
    """Test that Settings validates testing values."""
    # String values
    settings = Settings(secret_key="test_secret", testing="true")
    assert settings.testing is True
    
    settings = Settings(secret_key="test_secret", testing="false")
    assert settings.testing is False
    
    # Boolean values
    settings = Settings(secret_key="test_secret", testing=True)
    assert settings.testing is True
    
    settings = Settings(secret_key="test_secret", testing=False)
    assert settings.testing is False


def test_get_settings_caching():
    """Test that get_settings caches the settings."""
    # Call get_settings twice
    settings1 = get_settings()
    settings2 = get_settings()
    
    # Verify that the same object is returned
    assert settings1 is settings2


@patch.dict(os.environ, {"APP_NAME": "EnvApp", "SECRET_KEY": "env_secret"})
def test_settings_from_environment():
    """Test that Settings loads values from environment variables."""
    # Create settings
    settings = Settings()
    
    # Verify values from environment
    assert settings.app_name == "EnvApp"
    assert settings.secret_key.get_secret_value() == "env_secret" 