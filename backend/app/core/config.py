from functools import lru_cache
from typing import Literal, List, Annotated, Optional, Any, Dict, Union
import json
from pydantic import Field, SecretStr, field_validator, model_validator, ValidationInfo, BeforeValidator, AnyHttpUrl, EmailStr, ValidationError, PostgresDsn, RedisDsn
from pydantic_settings import BaseSettings, SettingsConfigDict
import logging
from enum import Enum
import os

logger = logging.getLogger(__name__)

def parse_bool_str(v: str | bool) -> bool:
    """Parse boolean values from string."""
    if isinstance(v, str):
        if v.lower() == "true" or v == "1":
            return True
        if v.lower() == "false" or v == "0":
            return False
        raise ValueError("Boolean value must be 'true', 'false', '1', or '0'")
    return bool(v)

def parse_environment(v: str) -> Literal["development", "staging", "production", "test"]:
    """Parse environment value."""
    valid_environments = ["development", "staging", "production", "test"]
    if v not in valid_environments:
        raise ValueError(f"Environment must be one of: {', '.join(valid_environments)}")
    return v  # type: ignore

BoolStr = Annotated[bool, BeforeValidator(parse_bool_str)]

class Environment(str, Enum):
    """Application environment."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TEST = "test"

class Settings(BaseSettings):
    """Application settings."""
    app_name: str = Field(default="TestApp", env="APP_NAME")
    version: str = Field(default="0.1.0", env="APP_VERSION")
    frontend_url: str = Field(default="http://localhost:3000", env="FRONTEND_URL")
    secret_key: SecretStr = Field(default="test_secret_key_replace_in_production_7e1a34bd93b148f0", env="SECRET_KEY")
    algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=60, env="RATE_LIMIT_WINDOW")
    api_v1_str: str = Field(default="/api/v1", env="API_V1_STR")
    database_url_for_env: str = Field(default="postgresql+asyncpg://postgres:postgres@db:5432/app", env="DATABASE_URL")
    debug: bool = Field(default=False, env="DEBUG")
    testing: bool = Field(default=False, env="TESTING")
    redis_url: str = Field(default="redis://redis:6379/0", env="REDIS_URL")
    environment: Environment = Field(default=Environment.DEVELOPMENT, env="ENVIRONMENT")
    cors_origins: List[str] = Field(default=["http://localhost:3000"], env="CORS_ORIGINS")
    access_token_expire_minutes: int = Field(default=10080, env="ACCESS_TOKEN_EXPIRE_MINUTES")  # 7 days
    smtp_user: Optional[str] = Field(default=None, env="SMTP_USER")
    smtp_password: Optional[str] = Field(default=None, env="SMTP_PASSWORD")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        validate_default=True,
        case_sensitive=True,
        env_prefix="",
        extra="ignore",
        validate_assignment=True,
    )

    @field_validator("environment", mode="before")
    def validate_environment(cls, v: str) -> Environment:
        """Validate environment."""
        if isinstance(v, Environment):
            return v
        try:
            v_lower = str(v).lower()
            if v_lower not in [e.value for e in Environment]:
                raise ValueError(f"Invalid environment: {v}. Must be one of {[e.value for e in Environment]}")
            return Environment(v_lower)
        except (ValueError, TypeError) as e:
            # Re-raise as ValueError for Pydantic to handle
            raise ValueError(str(e))

    @field_validator("secret_key", mode="before")
    def validate_secret_key(cls, v: Union[str, SecretStr]) -> SecretStr:
        """Validate secret key."""
        if isinstance(v, SecretStr):
            secret_str = v.get_secret_value()
        else:
            secret_str = str(v)

        if len(secret_str) < 32:
            # Raise ValueError directly; Pydantic V2 will handle it.
            raise ValueError("Secret key must be at least 32 characters long")

        return SecretStr(secret_str)

    @field_validator("cors_origins", mode="before")
    def validate_cors_origins(cls, v: Union[str, List[str]], info: ValidationInfo) -> List[str]:
        """Validate CORS origins."""
        # If in test mode, return empty list
        testing = str(info.data.get("testing", "false")).lower() in ("true", "1", "t", "yes", "y")
        environment = str(info.data.get("environment", "")).lower()
        if testing or environment == "test":
            return []

        # Handle string input (from env var)
        if isinstance(v, str):
            try:
                v = json.loads(v)
            except json.JSONDecodeError:
                raise ValueError("CORS_ORIGINS must be a valid JSON string if provided as a string")

        # Ensure it's a list of strings now
        if not isinstance(v, list) or not all(isinstance(i, str) for i in v):
             raise ValueError("CORS_ORIGINS must be a list of strings")

        # Validate each URL (optional but recommended)
        validated_origins = []
        for origin in v:
            try:
                validated_url = str(AnyHttpUrl(origin)) # Keep as string
                validated_origins.append(validated_url)
            except Exception as e: # Catch Pydantic validation error more specifically if possible
                raise ValueError(f"Invalid URL in CORS_ORIGINS: {origin} ({e})")
        
        return validated_origins

    @field_validator("debug", mode="before")
    def validate_debug(cls, v: Union[str, bool], info: ValidationInfo) -> bool:
        """Validate debug flag."""
        # Parse boolean value
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return str(v).lower() in ("true", "1", "t", "yes", "y")
        return False

    @field_validator("testing", mode="before")
    def validate_testing(cls, v: Union[str, bool]) -> bool:
        """Validate testing flag."""
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("true", "1", "t", "yes", "y")
        return False

    @model_validator(mode="after")
    def validate_all(self) -> "Settings":
        """Validate all settings."""
        # Handle test mode settings first
        if self.testing or self.environment == Environment.TEST:
            # Use object.__setattr__ to bypass validation and prevent recursion
            object.__setattr__(self, "debug", False)
            object.__setattr__(self, "cors_origins", [])
            object.__setattr__(self, "environment", Environment.TEST)
            object.__setattr__(self, "testing", True)
            
            # Set a default secret_key for test mode if not provided
            if not hasattr(self, "secret_key") or not self.secret_key:
                test_secret = "test_secret_key_replace_in_production_7e1a34bd93b148f0"
                object.__setattr__(self, "secret_key", SecretStr(test_secret))
            
            return self

        # Validate SMTP settings
        if self.smtp_user and not self.smtp_password:
            raise ValidationError(
                [
                    {
                        "type": "value_error",
                        "loc": ("smtp_password",),
                        "msg": "SMTP password is required when SMTP user is set",
                        "input": None,
                    }
                ]
            )

        return self

# Cached function to get settings
@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    # Automatically loads from .env file, environment variables, etc.
    try:
        return Settings()
    except ValidationError as e:
        # Log error details during startup if validation fails
        print(f"ERROR: Settings validation failed: {e}")
        raise

settings = Settings() 