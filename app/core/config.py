from typing import Any, Dict, List, Optional, Union
from pydantic import AnyHttpUrl, EmailStr, Field, SecretStr, field_validator, model_validator, ValidationInfo
from pydantic_settings import BaseSettings, SettingsConfigDict
import logging
import json
import os

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    app_name: str = Field(default="NeoForge", env="APP_NAME")
    version: str = Field(default="0.1.0", env="APP_VERSION")
    frontend_url: str = Field(default="http://localhost:3000", env="FRONTEND_URL")
    secret_key: SecretStr = Field(..., env="SECRET_KEY")
    algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=60, env="RATE_LIMIT_WINDOW")
    api_v1_str: str = Field(default="/api/v1", env="API_V1_STR")
    database_url_for_env: str = Field(alias="database_url", env="DATABASE_URL")
    debug: bool = Field(
        default=False,
        env="DEBUG",
        json_schema_extra={"coerce_boolean": True}
    )
    testing: bool = Field(default=False, env="TESTING")
    redis_url: str = Field(default="redis://redis:6379/0", env="REDIS_URL")
    environment: str = Field(
        default="development",
        env="ENVIRONMENT",
        validation_alias="environment"
    )
    cors_origins: List[str] = Field(default=["http://localhost:3000"], env="CORS_ORIGINS")
    access_token_expire_minutes: int = Field(default=10080, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    smtp_user: Optional[str] = Field(default=None, env="SMTP_USER")
    smtp_password: Optional[str] = Field(default=None, env="SMTP_PASSWORD")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        env_prefix="",
        extra="ignore",
        validate_default=True,
        validate_assignment=True,
        env_nested_delimiter="__",
        secrets_dir="/run/secrets"
    )

    @field_validator("environment", mode="before")
    def validate_environment(cls, v: str) -> str:
        allowed_environments = {"development", "staging", "production", "test"}
        v = str(v).lower()
        if v not in allowed_environments:
            raise ValueError(f"Environment must be one of {allowed_environments}")
        return v

    @field_validator("secret_key", mode="before")
    def validate_secret_key(cls, v: Union[str, SecretStr]) -> SecretStr:
        if isinstance(v, SecretStr):
            secret_value = v.get_secret_value()
        else:
            secret_value = str(v)
        
        if len(secret_value) < 32:
            raise ValueError("Secret key must be at least 32 characters long")
        return SecretStr(secret_value)

    @field_validator("cors_origins", mode="before")
    def validate_cors_origins(cls, v: Union[str, List[str]], info: ValidationInfo) -> List[str]:
        # Get current testing status from validation context
        testing = info.data.get("testing", False)
        
        if isinstance(v, str):
            try:
                v = json.loads(v)
            except json.JSONDecodeError:
                raise ValueError("CORS_ORIGINS must be a valid JSON string")

        if not isinstance(v, list):
            raise ValueError("CORS_ORIGINS must be a list")

        # Clear CORS origins in test mode
        if testing:
            return []

        # Validate each origin
        return [str(origin) for origin in v] if v else ["http://localhost:3000"]

    @field_validator("debug", mode="before")
    def validate_debug(cls, v: Union[str, bool]) -> bool:
        if isinstance(v, str):
            return v.lower() == "true"
        return bool(v)

    @field_validator("testing", mode="before")
    def validate_testing(cls, v: Union[str, bool]) -> bool:
        if isinstance(v, str):
            return v.lower() == "true"
        return bool(v)

    @model_validator(mode='after')
    def validate_smtp(self):
        if (self.smtp_user or self.smtp_password) and not (
            self.smtp_user and self.smtp_password
        ):
            raise ValueError("SMTP requires both user and password")

    @model_validator(mode="after")
    def validate_all(self) -> "Settings":
        # Force test settings when environment is test
        if self.environment == "test":
            self.testing = True
            self.debug = False
            self.cors_origins = []
        
        # Add back SMTP validation
        if bool(self.smtp_user) != bool(self.smtp_password):
            logger.error("SMTP settings mismatch")
            raise ValueError("SMTP user and password must both be set or both be None")
        
        return self

def verify_settings():
    """Runtime validation for critical production settings"""
    if settings.environment == "production":
        assert len(settings.secret_key.get_secret_value()) >= 32
        assert settings.debug is False