"""Application configuration."""
import os
from typing import List

from pydantic import PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    app_name: str = "NeoForge"
    version: str = "0.1.0"
    debug: bool = False
    environment: str = "development"
    testing: bool = False
    
    # Security
    secret_key: str = "your-secret-key-for-jwt"  # Change in production
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    cors_origins: List[str] = ["http://localhost:3000"]
    
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@db:5432/app"
    
    # Redis
    redis_url: str = "redis://redis:6379/0"
    
    model_config = SettingsConfigDict(
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