"""Application configuration."""
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    app_name: str = "NeoForge"
    version: str = "0.1.0"
    debug: bool = False
    environment: str = "development"
    
    # Security
    cors_origins: List[str] = ["http://localhost:3000"]
    
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@db:5432/app"
    
    # Redis
    redis_url: str = "redis://redis:6379/0"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )


settings = Settings() 