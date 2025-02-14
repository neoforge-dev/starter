from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # ... existing settings ...
    jwt_secret: str = Field(
        default="development-secret",  # Default for development
        env="JWT_SECRET",
        description="Secret key for JWT token encoding/decoding"
    )
    jwt_algorithm: str = Field(
        default="HS256",
        env="JWT_ALGORITHM",
        description="Algorithm used for JWT tokens"
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
    # ... rest of settings ... 

settings = Settings() 