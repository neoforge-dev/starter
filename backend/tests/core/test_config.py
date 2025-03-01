"""Test configuration settings."""
import os
from typing import Dict, Any
import pytest
from pydantic import ValidationError
import structlog

from app.core.config import Settings

logger = structlog.get_logger()

@pytest.fixture
def valid_env_vars() -> Dict[str, Any]:
    """Valid environment variables for testing."""
    return {
        "APP_NAME": "TestApp",
        "APP_VERSION": "0.1.0",
        "FRONTEND_URL": "http://localhost:3000",
        "SECRET_KEY": "test_secret_key_replace_in_production_7e1a34bd93b148f0",
        "JWT_ALGORITHM": "HS256",
        "RATE_LIMIT_REQUESTS": "100",
        "RATE_LIMIT_WINDOW": "60",
        "API_V1_STR": "/api/v1",
        "DATABASE_URL": "postgresql+asyncpg://postgres:postgres@db:5432/test_db",
        "DEBUG": "false",
        "TESTING": "false",
        "REDIS_URL": "redis://redis:6379/0",
        "ENVIRONMENT": "development",
        "CORS_ORIGINS": '["http://localhost:3000"]',
        "ACCESS_TOKEN_EXPIRE_MINUTES": "10080",
    }

@pytest.fixture(autouse=True)
def clean_env():
    """Clean environment variables before and after each test."""
    # Store original environment
    original_env = dict(os.environ)
    
    # Log environment state before cleanup
    logger.info("environment_before_cleanup", env_vars={k: v for k, v in os.environ.items() if k.isupper()})
    
    # Clean up environment variables first
    for key in list(os.environ.keys()):
        if key.isupper():  # Only remove uppercase env vars (our settings)
            del os.environ[key]
    
    yield
    
    # Log environment state before restoration
    logger.info("environment_before_restore", env_vars={k: v for k, v in os.environ.items() if k.isupper()})
    
    # Restore original environment
    os.environ.clear()
    os.environ.update(original_env)
    
    # Log final environment state
    logger.info("environment_after_restore", env_vars={k: v for k, v in os.environ.items() if k.isupper()})

def test_valid_settings(valid_env_vars: Dict[str, Any]):
    """Test valid settings configuration."""
    # Log test start
    logger.info("test_valid_settings_start", env_vars=valid_env_vars)
    
    # Set environment variables
    for key, value in valid_env_vars.items():
        os.environ[key] = value
    
    # Log environment after setting variables
    logger.info("environment_after_setup", env_vars={k: v for k, v in os.environ.items() if k.isupper()})
    
    settings = Settings()
    
    # Log actual settings values
    logger.info(
        "settings_values",
        app_name=settings.app_name,
        version=settings.version,
        frontend_url=settings.frontend_url,
        environment=settings.environment,
        debug=settings.debug,
        testing=settings.testing,
        cors_origins=settings.cors_origins
    )
    
    # Check basic settings
    assert settings.app_name == "TestApp"
    assert settings.version == "0.1.0"
    assert settings.frontend_url == "http://localhost:3000"
    assert settings.environment == "development"
    assert settings.debug is False
    assert settings.testing is False
    assert settings.cors_origins == ["http://localhost:3000"]

def test_invalid_environment(valid_env_vars: Dict[str, Any]):
    """Test invalid environment setting."""
    env_vars = valid_env_vars.copy()
    env_vars["ENVIRONMENT"] = "invalid"
    
    logger.info("test_invalid_environment_start", modified_env_vars=env_vars)
    
    # Set environment variables
    for key, value in env_vars.items():
        os.environ[key] = value
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    logger.info("validation_error", error=str(exc_info.value))
    assert "Environment must be one of: development, staging, production, test" in str(exc_info.value)

def test_invalid_secret_key(valid_env_vars: Dict[str, Any]):
    """Test invalid secret key."""
    env_vars = valid_env_vars.copy()
    env_vars["SECRET_KEY"] = "short"
    
    # Set environment variables
    for key, value in env_vars.items():
        os.environ[key] = value
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    assert "Secret key must be at least 32 characters long" in str(exc_info.value)

def test_empty_cors_origins_in_testing(valid_env_vars: Dict[str, Any]):
    """Test empty CORS origins in testing environment."""
    env_vars = valid_env_vars.copy()
    env_vars["TESTING"] = "true"
    env_vars["ENVIRONMENT"] = "test"
    env_vars["CORS_ORIGINS"] = "[]"
    
    logger.info("test_empty_cors_origins_start", env_vars=env_vars)
    
    # Set environment variables
    for key, value in env_vars.items():
        os.environ[key] = value
    
    # Log environment after setting variables
    logger.info("environment_before_settings", env_vars={k: v for k, v in os.environ.items() if k.isupper()})
    
    settings = Settings()
    
    # Log actual settings values
    logger.info(
        "settings_values",
        cors_origins=settings.cors_origins,
        environment=settings.environment,
        debug=settings.debug,
        testing=settings.testing
    )
    
    assert settings.cors_origins == []
    assert settings.environment == "test"
    assert settings.debug is False

def test_smtp_password_required_with_user(valid_env_vars: Dict[str, Any]):
    """Test SMTP password is required when SMTP user is set."""
    env_vars = valid_env_vars.copy()
    env_vars["SMTP_USER"] = "test@example.com"
    env_vars["SMTP_PASSWORD"] = None
    
    # Set environment variables
    for key, value in env_vars.items():
        if value is not None:
            os.environ[key] = value
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    assert "SMTP password is required when SMTP user is set" in str(exc_info.value) 