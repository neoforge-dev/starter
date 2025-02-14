from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    app_name: str = Field(
        default="NeoForge API",
        env="APP_NAME",
        description="Application name"
    )
    version: str = Field(
        default="0.1.0",
        env="APP_VERSION",
        description="Application version"
    )
    frontend_url: str = Field(
        default="http://localhost:3000",
        env="FRONTEND_URL",
        description="Frontend application URL"
    )
    secret_key: str = Field(
        default="development-secret",  # Default for development
        env="SECRET_KEY",
        description="Secret key for JWT token encoding/decoding"
    )
    algorithm: str = Field(
        default="HS256",
        env="JWT_ALGORITHM",
        description="Algorithm used for JWT tokens"
    )
    rate_limit_requests: int = Field(
        default=100,
        env="RATE_LIMIT_REQUESTS",
        description="Number of requests allowed per window"
    )
    rate_limit_window: int = Field(
        default=60,  # 1 minute
        env="RATE_LIMIT_WINDOW",
        description="Time window for rate limiting in seconds"
    )
    api_v1_str: str = Field(
        default="/api/v1",
        env="API_V1_STR",
        description="Base API v1 path"
    )
    database_url_for_env: str = Field(
        default="postgresql+asyncpg://postgres:password@localhost:5432/dbname",
        env="DATABASE_URL",
        description="Database connection URL for async operations"
    )
    debug: bool = Field(
        default=False,
        env="DEBUG",
        description="Enable debug mode"
    )
    testing: bool = Field(
        default=False,
        env="TESTING",
        description="Enable testing mode"
    )
    redis_url: str = Field(
        default="redis://localhost:6379",
        env="REDIS_URL",
        description="Redis connection URL"
    )
    environment: str = Field(
        default="development",
        env="ENVIRONMENT",
        description="Current environment (development/staging/production)"
    )
    cors_origins: list[str] = Field(
        default=["http://localhost:3000"],
        env="CORS_ORIGINS",
        description="List of allowed CORS origins"
    )
    # ... rest of settings ... 

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

settings = Settings() 