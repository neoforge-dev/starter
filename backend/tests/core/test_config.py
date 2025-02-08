"""Test configuration validation."""
import os
from typing import Dict, Any

import pytest
from pydantic import ValidationError, SecretStr

from app.core.config import Settings


@pytest.fixture
def valid_env_vars() -> Dict[str, Any]:
    """Valid environment variables for testing."""
    return {
        "APP_NAME": "TestApp",
        "PROJECT_NAME": "TestProject",
        "VERSION": "0.1.0",
        "DEBUG": "false",
        "ENVIRONMENT": "development",
        "TESTING": "false",
        "API_V1_STR": "/api/v1",
        "SERVER_HOST": "http://localhost:8000",
        "SECRET_KEY": "a" * 32,  # 32 character string
        "ALGORITHM": "HS256",
        "ACCESS_TOKEN_EXPIRE_MINUTES": "11520",
        "CORS_ORIGINS": '["http://localhost:3000"]',
        "DATABASE_URL": "postgresql+asyncpg://postgres:postgres@db:5432/app",
        "REDIS_URL": "redis://redis:6379/0",
    }


def test_valid_settings(valid_env_vars: Dict[str, Any]):
    """Test valid settings configuration."""
    # Set environment variables
    for key, value in valid_env_vars.items():
        os.environ[key] = value

    try:
        settings = Settings()
        
        # Check basic settings
        assert settings.app_name == "TestApp"
        assert settings.environment == "development"
        assert settings.debug is False
        assert settings.testing is False
        
        # Check security settings
        assert isinstance(settings.secret_key, SecretStr)
        assert len(settings.secret_key.get_secret_value()) >= 32
        assert settings.algorithm == "HS256"
        assert settings.cors_origins == ["http://localhost:3000"]
        
        # Check URLs
        assert str(settings.database_url) == valid_env_vars["DATABASE_URL"]
        assert settings.redis_url == valid_env_vars["REDIS_URL"]
        
    finally:
        # Clean up environment variables
        for key in valid_env_vars:
            os.environ.pop(key, None)


def test_invalid_environment():
    """Test invalid environment setting."""
    env_vars = {
        **valid_env_vars(),
        "ENVIRONMENT": "invalid",
    }
    
    for key, value in env_vars.items():
        os.environ[key] = value
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    error = exc_info.value.errors()[0]
    assert error["loc"] == ("environment",)
    assert "Environment must be one of" in error["msg"]


def test_invalid_secret_key():
    """Test invalid secret key."""
    env_vars = {
        **valid_env_vars(),
        "SECRET_KEY": "short",
    }
    
    for key, value in env_vars.items():
        os.environ[key] = value
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    error = exc_info.value.errors()[0]
    assert error["loc"] == ("secret_key",)
    assert "must be at least 32 characters long" in error["msg"]


def test_empty_cors_origins():
    """Test empty CORS origins in non-testing environment."""
    env_vars = {
        **valid_env_vars(),
        "CORS_ORIGINS": "[]",
        "TESTING": "false",
    }
    
    for key, value in env_vars.items():
        os.environ[key] = value
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    error = exc_info.value.errors()[0]
    assert error["loc"] == ("cors_origins",)
    assert "cannot be empty in non-testing environment" in error["msg"]


def test_empty_cors_origins_in_testing():
    """Test empty CORS origins in testing environment."""
    env_vars = {
        **valid_env_vars(),
        "CORS_ORIGINS": "[]",
        "TESTING": "true",
    }
    
    for key, value in env_vars.items():
        os.environ[key] = value
    
    settings = Settings()
    assert settings.cors_origins == []


def test_invalid_database_url():
    """Test invalid database URL."""
    env_vars = {
        **valid_env_vars(),
        "DATABASE_URL": "invalid-url",
    }
    
    for key, value in env_vars.items():
        os.environ[key] = value
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    error = exc_info.value.errors()[0]
    assert error["loc"] == ("database_url",)
    assert "URL scheme" in error["msg"]


def test_invalid_redis_url():
    """Test invalid Redis URL."""
    env_vars = {
        **valid_env_vars(),
        "REDIS_URL": "invalid://redis:6379",
    }
    
    for key, value in env_vars.items():
        os.environ[key] = value
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    error = exc_info.value.errors()[0]
    assert error["loc"] == ("redis_url",)
    assert "Redis URL must start with redis:// or rediss://" in error["msg"]


def test_smtp_password_required_with_user():
    """Test SMTP password is required when user is set."""
    env_vars = {
        **valid_env_vars(),
        "SMTP_USER": "test@example.com",
        "SMTP_PASSWORD": "",
    }
    
    for key, value in env_vars.items():
        os.environ[key] = value
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    error = exc_info.value.errors()[0]
    assert error["loc"] == ("smtp_password",)
    assert "SMTP password is required when SMTP user is set" in error["msg"]


def test_database_url_for_env():
    """Test database URL modification for testing environment."""
    env_vars = {
        **valid_env_vars(),
        "TESTING": "true",
    }
    
    for key, value in env_vars.items():
        os.environ[key] = value
    
    settings = Settings()
    assert "/test" in settings.database_url_for_env
    assert settings.database_url_for_env != str(settings.database_url) 