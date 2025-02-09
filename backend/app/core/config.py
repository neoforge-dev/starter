"""Application configuration."""
import os
from typing import Any, Dict, List, Optional, Union
from pathlib import Path

from pydantic import (
    AnyHttpUrl,
    EmailStr,
    HttpUrl,
    PostgresDsn,
    SecretStr,
    validator,
    field_validator,
    ConfigDict,
    ValidationError,
    model_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict
import structlog

logger = structlog.get_logger()

class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    app_name: str
    project_name: str
    version: str = "0.1.0"
    debug: bool = False
    environment: str = "development"
    testing: bool = False
    
    # API
    api_v1_str: str = "/api/v1"
    server_host: AnyHttpUrl = "http://localhost:8000"  # Frontend URL for email links
    
    # Security
    secret_key: SecretStr
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 8  # 8 days
    cors_origins: List[str] = ["http://localhost:3000"]
    
    # Rate Limiting
    enable_rate_limiting: bool = True
    rate_limit_requests: int = 100  # requests per window
    rate_limit_window: int = 60  # window in seconds
    rate_limit_auth_requests: int = 500  # authenticated requests per window
    rate_limit_by_ip: bool = True  # limit by IP address
    rate_limit_by_key: bool = True  # limit by API key
    
    # Database
    database_url: PostgresDsn
    
    # Redis
    redis_url: str
    
    # Email settings
    smtp_tls: bool = True
    smtp_port: Optional[int] = 587
    smtp_host: Optional[str] = "smtp.gmail.com"
    smtp_user: Optional[str] = ""
    smtp_password: Optional[SecretStr] = None
    emails_from_email: Optional[EmailStr] = "info@neoforge.com"
    emails_from_name: Optional[str] = "NeoForge"
    email_reset_token_expire_hours: int = 48
    email_templates_dir: Path = Path(__file__).parent.parent / "templates" / "email"
    
    # List of email addresses to notify for admin alerts
    admin_notification_emails: List[EmailStr] = []

    @field_validator("environment")
    def validate_environment(cls, v: str) -> str:
        """Validate environment setting."""
        allowed = {"development", "staging", "production", "test"}
        if v not in allowed:
            raise ValueError(f"Environment must be one of {allowed}")
        return v

    @field_validator("secret_key")
    def validate_secret_key(cls, v: SecretStr) -> SecretStr:
        """Validate secret key."""
        if len(v.get_secret_value()) < 32:
            raise ValueError("Secret key must be at least 32 characters long")
        return v

    @field_validator("cors_origins")
    def validate_cors_origins(cls, v: List[str]) -> List[str]:
        """Validate CORS origins."""
        if not v and not os.getenv("TESTING"):
            raise ValueError("CORS origins cannot be empty in non-testing environment")
        return v

    @field_validator("database_url")
    def validate_database_url(cls, v: PostgresDsn) -> PostgresDsn:
        """Validate database URL."""
        return v

    @field_validator("redis_url")
    def validate_redis_url(cls, v: str) -> str:
        """Validate Redis URL."""
        if not v.startswith(("redis://", "rediss://")):
            raise ValueError("Redis URL must start with redis:// or rediss://")
        return v

    @model_validator(mode='after')
    def validate_smtp_settings(self) -> 'Settings':
        """Validate SMTP settings."""
        if self.smtp_user and not self.smtp_password:
            raise ValueError("SMTP password is required when SMTP user is set")
        return self

    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
        validate_default=True,
    )
    
    @property
    def database_url_for_env(self) -> str:
        """Get database URL for current environment."""
        if self.testing:
            # Use test database
            return str(self.database_url).replace("/app", "/test")
        return str(self.database_url)


def get_settings() -> Settings:
    """Get settings instance based on environment."""
    try:
        return Settings(
            testing="TESTING" in os.environ,
            environment=os.getenv("ENVIRONMENT", "development"),
            app_name=os.getenv("APP_NAME", "NeoForge"),
            project_name=os.getenv("PROJECT_NAME", "NeoForge"),
        )
    except ValidationError as e:
        # If we're in test mode, use test defaults
        if "TESTING" in os.environ:
            return Settings(
                testing=True,
                environment="test",
                secret_key=SecretStr("x" * 32),
                database_url=PostgresDsn("postgresql+asyncpg://postgres:postgres@db:5432/test"),
                redis_url="redis://redis:6379/0",
                app_name="NeoForge",
                project_name="NeoForge",
            )
        logger.error(
            "configuration_error",
            errors=e.errors(),
        )
        raise

# Create settings instance
settings = get_settings() 