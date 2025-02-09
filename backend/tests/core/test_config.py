"""Test configuration validation."""
import os
from typing import Dict, Any

import pytest
from pydantic import ValidationError, SecretStr
from pydantic.networks import PostgresDsn

from app.core.config import Settings, get_settings


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
        settings = Settings(
            app_name=os.getenv("APP_NAME", "NeoForge"),
            project_name=os.getenv("PROJECT_NAME", "NeoForge"),
            environment=os.getenv("ENVIRONMENT", "development"),
            debug=os.getenv("DEBUG", "false").lower() == "true",
            testing=os.getenv("TESTING", "false").lower() == "true",
            database_url=PostgresDsn(os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@db:5432/app")),
            redis_url=os.getenv("REDIS_URL", "redis://redis:6379/0"),
        )
        
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


def test_invalid_environment(valid_env_vars: Dict[str, Any]):
    """Test invalid environment setting."""
    # Clean up environment variables
    for key in list(os.environ.keys()):
        if key.isupper():  # Only remove uppercase env vars (our settings)
            del os.environ[key]
    
    env_vars = {
        "ENVIRONMENT": "invalid",
        "APP_NAME": "TestApp",
        "PROJECT_NAME": "TestProject",
        "SECRET_KEY": "x" * 32,
        "DATABASE_URL": "postgresql+asyncpg://postgres:postgres@db:5432/test",
        "REDIS_URL": "redis://redis:6379/0",
    }
    
    try:
        for key, value in env_vars.items():
            os.environ[key] = value
        
        with pytest.raises(ValidationError) as exc_info:
            Settings(
                environment="invalid",
                app_name=env_vars["APP_NAME"],
                project_name=env_vars["PROJECT_NAME"],
                secret_key=SecretStr(env_vars["SECRET_KEY"]),
                database_url=PostgresDsn(env_vars["DATABASE_URL"]),
                redis_url=env_vars["REDIS_URL"],
            )
        
        # Find the environment error in the list of errors
        env_error = None
        for error in exc_info.value.errors():
            if error["loc"] == ("environment",):
                env_error = error
                break
        
        assert env_error is not None, "No validation error for environment found"
        assert "Environment must be one of" in env_error["msg"]
    finally:
        # Clean up environment variables after test
        for key in env_vars:
            if key in os.environ:
                del os.environ[key]


def test_invalid_secret_key(valid_env_vars: Dict[str, Any]):
    """Test invalid secret key."""
    # Clean up environment variables first
    for key in list(os.environ.keys()):
        if key.isupper():  # Only remove uppercase env vars (our settings)
            del os.environ[key]
    
    env_vars = {
        "APP_NAME": "TestApp",
        "PROJECT_NAME": "TestProject",
        "ENVIRONMENT": "development",
        "DATABASE_URL": "postgresql+asyncpg://postgres:postgres@db:5432/test",
        "REDIS_URL": "redis://redis:6379/0",
        "SECRET_KEY": "short",  # Invalid secret key
    }
    
    try:
        for key, value in env_vars.items():
            os.environ[key] = value
        
        with pytest.raises(ValidationError) as exc_info:
            # Create settings with invalid secret key
            Settings(
                app_name=env_vars["APP_NAME"],
                project_name=env_vars["PROJECT_NAME"],
                environment=env_vars["ENVIRONMENT"],
                database_url=PostgresDsn(env_vars["DATABASE_URL"]),
                redis_url=env_vars["REDIS_URL"],
                secret_key=SecretStr(env_vars["SECRET_KEY"]),
            )
        
        # Find the secret_key error in the list of errors
        secret_key_error = None
        for error in exc_info.value.errors():
            if error["loc"] == ("secret_key",):
                secret_key_error = error
                break
        
        assert secret_key_error is not None, "No validation error for secret_key found"
        assert "must be at least 32 characters long" in secret_key_error["msg"]
    finally:
        # Clean up environment variables after test
        for key in env_vars:
            if key in os.environ:
                del os.environ[key]


def test_empty_cors_origins(valid_env_vars: Dict[str, Any]):
    """Test empty CORS origins in non-testing environment."""
    env_vars = {
        **valid_env_vars,
        "CORS_ORIGINS": "[]",
        "TESTING": "false",
    }
    
    try:
        for key, value in env_vars.items():
            os.environ[key] = value
        
        with pytest.raises(ValidationError) as exc_info:
            Settings(
                app_name=env_vars["APP_NAME"],
                project_name=env_vars["PROJECT_NAME"],
                environment=env_vars["ENVIRONMENT"],
                secret_key=SecretStr(env_vars["SECRET_KEY"]),
                database_url=PostgresDsn(env_vars["DATABASE_URL"]),
                redis_url=env_vars["REDIS_URL"],
                cors_origins=[],  # Empty list
                testing=False,
            )
        
        # Find the cors_origins error in the list of errors
        cors_error = None
        for error in exc_info.value.errors():
            if error["loc"] == ("cors_origins",):
                cors_error = error
                break
        
        assert cors_error is not None, "No validation error for cors_origins found"
        assert "cannot be empty in non-testing environment" in cors_error["msg"]
    finally:
        # Clean up environment variables
        for key in env_vars:
            if key in os.environ:
                del os.environ[key]


def test_empty_cors_origins_in_testing(valid_env_vars: Dict[str, Any]):
    """Test empty CORS origins in testing environment."""
    env_vars = {
        **valid_env_vars,
        "CORS_ORIGINS": "[]",
        "TESTING": "true",
    }
    
    try:
        for key, value in env_vars.items():
            os.environ[key] = value
        
        settings = Settings(
            app_name=env_vars["APP_NAME"],
            project_name=env_vars["PROJECT_NAME"],
            environment=env_vars["ENVIRONMENT"],
            secret_key=SecretStr(env_vars["SECRET_KEY"]),
            database_url=PostgresDsn(env_vars["DATABASE_URL"]),
            redis_url=env_vars["REDIS_URL"],
            cors_origins=[],  # Empty list
            testing=True,
        )
        assert settings.cors_origins == []
    finally:
        # Clean up environment variables
        for key in env_vars:
            if key in os.environ:
                del os.environ[key]


def test_invalid_database_url(valid_env_vars: Dict[str, Any]):
    """Test invalid database URL."""
    env_vars = {
        **valid_env_vars,
        "DATABASE_URL": "invalid-url",
    }
    
    try:
        for key, value in env_vars.items():
            os.environ[key] = value
        
        with pytest.raises(ValidationError) as exc_info:
            Settings(
                app_name=env_vars["APP_NAME"],
                project_name=env_vars["PROJECT_NAME"],
                environment=env_vars["ENVIRONMENT"],
                secret_key=SecretStr(env_vars["SECRET_KEY"]),
                database_url=env_vars["DATABASE_URL"],
                redis_url=env_vars["REDIS_URL"],
            )
        
        error = exc_info.value.errors()[0]
        assert error["loc"] == ("database_url",)
        assert "Input should be a valid URL" in error["msg"]
    finally:
        # Clean up environment variables
        for key in env_vars:
            if key in os.environ:
                del os.environ[key]


def test_invalid_redis_url(valid_env_vars: Dict[str, Any]):
    """Test invalid Redis URL."""
    env_vars = {
        **valid_env_vars,
        "REDIS_URL": "invalid://redis:6379",
    }
    
    try:
        for key, value in env_vars.items():
            os.environ[key] = value
        
        with pytest.raises(ValidationError) as exc_info:
            Settings(
                app_name=env_vars["APP_NAME"],
                project_name=env_vars["PROJECT_NAME"],
                environment=env_vars["ENVIRONMENT"],
                secret_key=SecretStr(env_vars["SECRET_KEY"]),
                database_url=PostgresDsn(env_vars["DATABASE_URL"]),
                redis_url=env_vars["REDIS_URL"],
            )
        
        error = exc_info.value.errors()[0]
        assert error["loc"] == ("redis_url",)
        assert "Redis URL must start with redis:// or rediss://" in error["msg"]
    finally:
        # Clean up environment variables
        for key in env_vars:
            if key in os.environ:
                del os.environ[key]


def test_smtp_password_required_with_user(valid_env_vars: Dict[str, Any]):
    """Test SMTP password is required when user is set."""
    env_vars = {
        **valid_env_vars,
        "SMTP_USER": "test@example.com",
        "SMTP_PASSWORD": "",
    }
    
    try:
        for key, value in env_vars.items():
            os.environ[key] = value
        
        with pytest.raises(ValidationError) as exc_info:
            Settings(
                app_name=env_vars["APP_NAME"],
                project_name=env_vars["PROJECT_NAME"],
                environment=env_vars["ENVIRONMENT"],
                secret_key=SecretStr(env_vars["SECRET_KEY"]),
                database_url=PostgresDsn(env_vars["DATABASE_URL"]),
                redis_url=env_vars["REDIS_URL"],
                smtp_user=env_vars["SMTP_USER"],
                smtp_password=SecretStr(env_vars["SMTP_PASSWORD"]) if env_vars["SMTP_PASSWORD"] else None,
            )
        
        error = exc_info.value.errors()[0]
        assert error["loc"] == (), "Model-level validation error should have empty location tuple"
        assert "SMTP password is required when SMTP user is set" in error["msg"]
    finally:
        # Clean up environment variables
        for key in env_vars:
            if key in os.environ:
                del os.environ[key]


def test_database_url_for_env(valid_env_vars: Dict[str, Any]):
    """Test database URL modification for testing environment."""
    env_vars = {
        **valid_env_vars,
        "TESTING": "true",
    }
    
    try:
        for key, value in env_vars.items():
            os.environ[key] = value
        
        settings = Settings(
            app_name=env_vars["APP_NAME"],
            project_name=env_vars["PROJECT_NAME"],
            environment=env_vars["ENVIRONMENT"],
            secret_key=SecretStr(env_vars["SECRET_KEY"]),
            database_url=PostgresDsn(env_vars["DATABASE_URL"]),
            redis_url=env_vars["REDIS_URL"],
            testing=True,
        )
        assert "/test" in settings.database_url_for_env
        assert settings.database_url_for_env != str(settings.database_url)
    finally:
        # Clean up environment variables
        for key in env_vars:
            if key in os.environ:
                del os.environ[key] 