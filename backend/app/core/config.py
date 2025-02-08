"""Application configuration."""
import os
from typing import Any, Dict, List, Optional, Union
from pathlib import Path

from pydantic import AnyHttpUrl, EmailStr, HttpUrl, PostgresDsn, validator, field_validator, ConfigDict
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    app_name: str = "NeoForge"
    project_name: str = "NeoForge"  # Used in email templates
    version: str = "0.1.0"
    debug: bool = False
    environment: str = "development"
    testing: bool = False
    
    # API
    api_v1_str: str = "/api/v1"
    server_host: str = "http://localhost:8000"  # Frontend URL for email links
    
    # Security
    secret_key: str = "your-secret-key-for-jwt"  # Change in production
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
    database_url: str = "postgresql+asyncpg://postgres:postgres@db:5432/app"
    
    # Redis
    redis_url: str = "redis://redis:6379/0"
    
    # Email settings
    smtp_tls: bool = True
    smtp_port: Optional[int] = 587
    smtp_host: Optional[str] = "smtp.gmail.com"
    smtp_user: Optional[str] = ""
    smtp_password: Optional[str] = ""
    emails_from_email: Optional[EmailStr] = "info@neoforge.com"
    emails_from_name: Optional[str] = "NeoForge"
    email_reset_token_expire_hours: int = 48
    email_templates_dir: Path = Path(__file__).parent.parent / "templates" / "email"
    
    # List of email addresses to notify for admin alerts
    admin_notification_emails: List[EmailStr] = []

    @field_validator("admin_notification_emails", mode="before")
    def assemble_admin_emails(cls, v: str | List[str]) -> List[str]:
        """Convert comma-separated string to list."""
        if isinstance(v, str):
            return [email.strip() for email in v.split(",")]
        return v

    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )
    
    @property
    def database_url_for_env(self) -> str:
        """Get database URL for current environment."""
        if self.testing:
            # Use test database
            return self.database_url.replace("/app", "/test")
        return self.database_url


# Create settings instance
settings = Settings(
    testing="TESTING" in os.environ,
    environment=os.getenv("ENVIRONMENT", "development"),
) 