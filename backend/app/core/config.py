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
    rate_limit_auth_requests: int = Field(default=200, env="RATE_LIMIT_AUTH_REQUESTS")
    rate_limit_login_requests: int = Field(default=10, env="RATE_LIMIT_LOGIN_REQUESTS")
    rate_limit_by_ip: bool = Field(default=True, env="RATE_LIMIT_BY_IP")
    rate_limit_by_key: bool = Field(default=False, env="RATE_LIMIT_BY_KEY")
    enable_rate_limiting: bool = Field(default=False, env="ENABLE_RATE_LIMITING")
    api_v1_str: str = Field(default="/api/v1", env="API_V1_STR")
    database_url_for_env: str = Field(default="", env="DATABASE_URL")
    debug: bool = Field(default=False, env="DEBUG")
    testing: bool = Field(default=False, env="TESTING")
    redis_url: RedisDsn = Field(default="redis://redis:6379/0", env="REDIS_URL")
    refresh_token_expire_days: int = Field(default=7, env="REFRESH_TOKEN_EXPIRE_DAYS")
    environment: Environment = Field(default=Environment.DEVELOPMENT, env="ENVIRONMENT")
    cors_origins: List[str] = Field(default=["http://localhost:3000"], env="CORS_ORIGINS")
    cors_methods: List[str] = Field(default=["GET", "POST", "PUT", "DELETE"], env="CORS_METHODS")
    cors_headers: List[str] = Field(default=["*"], env="CORS_HEADERS")
    cors_credentials: bool = Field(default=True, env="CORS_CREDENTIALS")
    access_token_expire_minutes: int = Field(default=10080, env="ACCESS_TOKEN_EXPIRE_MINUTES")  # 7 days
    
    # Enhanced security settings
    enable_threat_detection: bool = Field(default=True, env="ENABLE_THREAT_DETECTION")
    ip_block_duration: int = Field(default=3600, env="IP_BLOCK_DURATION")  # 1 hour in seconds
    threat_threshold: int = Field(default=3, env="THREAT_THRESHOLD")  # Block IP after N threats
    threat_window: int = Field(default=3600, env="THREAT_WINDOW")  # Time window in seconds for threat counting
    enable_request_fingerprinting: bool = Field(default=True, env="ENABLE_REQUEST_FINGERPRINTING")
    max_request_size: int = Field(default=10485760, env="MAX_REQUEST_SIZE")  # 10MB default
    password_min_length: int = Field(default=8, env="PASSWORD_MIN_LENGTH")
    password_require_uppercase: bool = Field(default=True, env="PASSWORD_REQUIRE_UPPERCASE")
    password_require_lowercase: bool = Field(default=True, env="PASSWORD_REQUIRE_LOWERCASE")
    password_require_numbers: bool = Field(default=True, env="PASSWORD_REQUIRE_NUMBERS")
    password_require_special: bool = Field(default=True, env="PASSWORD_REQUIRE_SPECIAL")
    account_lockout_threshold: int = Field(default=5, env="ACCOUNT_LOCKOUT_THRESHOLD")
    account_lockout_duration: int = Field(default=1800, env="ACCOUNT_LOCKOUT_DURATION")  # 30 minutes
    smtp_user: Optional[str] = Field(default=None, env="SMTP_USER")
    smtp_password: Optional[str] = Field(default=None, env="SMTP_PASSWORD")
    # Webhook settings
    SENDGRID_WEBHOOK_PUBLIC_KEY: Optional[str] = Field(default=None, env="SENDGRID_WEBHOOK_PUBLIC_KEY")
    WEBHOOK_SECRET_KEY: Optional[str] = Field(default=None, env="WEBHOOK_SECRET_KEY")
    
    # OpenTelemetry OTLP Configuration
    # Core OTLP settings
    otel_exporter_otlp_endpoint: Optional[str] = Field(default=None, env="OTEL_EXPORTER_OTLP_ENDPOINT")
    otel_exporter_otlp_traces_endpoint: Optional[str] = Field(default=None, env="OTEL_EXPORTER_OTLP_TRACES_ENDPOINT")
    otel_exporter_otlp_headers: Optional[str] = Field(default=None, env="OTEL_EXPORTER_OTLP_HEADERS")
    otel_exporter_otlp_traces_headers: Optional[str] = Field(default=None, env="OTEL_EXPORTER_OTLP_TRACES_HEADERS")
    otel_exporter_otlp_protocol: str = Field(default="http/protobuf", env="OTEL_EXPORTER_OTLP_PROTOCOL")
    otel_exporter_otlp_traces_protocol: Optional[str] = Field(default=None, env="OTEL_EXPORTER_OTLP_TRACES_PROTOCOL")
    otel_exporter_otlp_timeout: int = Field(default=10, env="OTEL_EXPORTER_OTLP_TIMEOUT")
    otel_exporter_otlp_traces_timeout: Optional[int] = Field(default=None, env="OTEL_EXPORTER_OTLP_TRACES_TIMEOUT")
    otel_exporter_otlp_compression: Optional[str] = Field(default=None, env="OTEL_EXPORTER_OTLP_COMPRESSION")
    otel_exporter_otlp_traces_compression: Optional[str] = Field(default=None, env="OTEL_EXPORTER_OTLP_TRACES_COMPRESSION")
    
    # Service configuration
    otel_service_name: str = Field(default="neoforge-api", env="OTEL_SERVICE_NAME")
    otel_service_version: Optional[str] = Field(default=None, env="OTEL_SERVICE_VERSION")
    otel_resource_attributes: Optional[str] = Field(default=None, env="OTEL_RESOURCE_ATTRIBUTES")
    
    # Trace configuration
    otel_traces_exporter: str = Field(default="console", env="OTEL_TRACES_EXPORTER")  # console, otlp, none
    otel_traces_sampler: str = Field(default="always_on", env="OTEL_TRACES_SAMPLER")  # always_on, always_off, ratio
    otel_traces_sampler_arg: Optional[str] = Field(default=None, env="OTEL_TRACES_SAMPLER_ARG")
    
    # SDK configuration
    otel_sdk_disabled: bool = Field(default=False, env="OTEL_SDK_DISABLED")
    otel_log_level: str = Field(default="info", env="OTEL_LOG_LEVEL")

    model_config = SettingsConfigDict(
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
        """Validate CORS origins with environment-specific security."""
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

        # Production security: prohibit wildcard origins
        if environment == "production":
            if "*" in v:
                raise ValueError("Wildcard CORS origins (*) are not allowed in production")
            # Only allow HTTPS origins in production (except localhost for development testing)
            for origin in v:
                if not origin.startswith("https://") and not origin.startswith("http://localhost"):
                    raise ValueError(f"Production CORS origins must use HTTPS: {origin}")

        # Validate each URL (optional but recommended)
        validated_origins = []
        for origin in v:
            try:
                validated_url = str(AnyHttpUrl(origin)) # Keep as string
                validated_origins.append(validated_url)
            except Exception as e: # Catch Pydantic validation error more specifically if possible
                raise ValueError(f"Invalid URL in CORS_ORIGINS: {origin} ({e})")
        
        return validated_origins
    
    @field_validator("cors_methods", mode="before")
    def validate_cors_methods(cls, v: Union[str, List[str]], info: ValidationInfo) -> List[str]:
        """Validate CORS methods with security constraints."""
        environment = str(info.data.get("environment", "")).lower()
        
        # Handle string input (from env var)
        if isinstance(v, str):
            if v == "*":
                # Default safe methods for production
                if environment == "production":
                    return ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
                else:
                    return ["*"]
            try:
                v = json.loads(v)
            except json.JSONDecodeError:
                # Try comma-separated
                v = [method.strip() for method in v.split(",")]

        if not isinstance(v, list):
            raise ValueError("CORS_METHODS must be a list of strings")
        
        # Validate HTTP methods
        valid_methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "*"]
        for method in v:
            if method not in valid_methods:
                raise ValueError(f"Invalid HTTP method: {method}")
        
        return v
    
    @field_validator("cors_headers", mode="before")
    def validate_cors_headers(cls, v: Union[str, List[str]], info: ValidationInfo) -> List[str]:
        """Validate CORS headers."""
        # Handle string input (from env var)
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            try:
                v = json.loads(v)
            except json.JSONDecodeError:
                # Try comma-separated
                v = [header.strip() for header in v.split(",")]

        if not isinstance(v, list):
            raise ValueError("CORS_HEADERS must be a list of strings")
        
        return v

    @field_validator("debug", mode="before")
    def validate_debug(cls, v: Union[str, bool], info: ValidationInfo) -> bool:
        """Validate debug flag."""
        # Parse boolean value
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return str(v).lower() in ("true", "1", "t", "yes", "y")
        return False

    @field_validator("database_url_for_env", mode="before")
    def adjust_database_url_for_environment(cls, v: Optional[str], info: ValidationInfo) -> str:
        """Ensure sensible DB defaults per environment if not explicitly set.

        - Prefer provided env var value
        - For test env, default to db_test + neoforge_test
        - For development, default to db + neoforge
        """
        try:
            env = info.data.get("environment")
        except Exception:
            env = None
        if v and isinstance(v, str) and v.strip():
            # If driver is missing for async, upgrade to asyncpg
            if v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
            return v
        # No value provided; choose sensible default by environment
        env_val = env.value if isinstance(env, Environment) else str(env).lower() if env else None
        if env_val == Environment.TEST.value or env_val == "test":
            # CI and local compose map test DB to non-standard 55433 (compose) or 55432 (CI),
            # but inside containers use service host/port. Prefer env DATABASE_URL if provided.
            return "postgresql+asyncpg://postgres:postgres@db_test:5432/neoforge_test"
        # Development default
        return "postgresql+asyncpg://postgres:postgres@db:5432/neoforge"

    @field_validator("testing", mode="before")
    def validate_testing(cls, v: Union[str, bool]) -> bool:
        """Validate testing flag."""
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("true", "1", "t", "yes", "y")
        return False

    @field_validator("otel_traces_exporter", mode="before")
    def validate_otel_traces_exporter(cls, v: str) -> str:
        """Validate OTEL traces exporter."""
        valid_exporters = ["console", "otlp", "none"]
        if v not in valid_exporters:
            raise ValueError(f"OTEL_TRACES_EXPORTER must be one of: {', '.join(valid_exporters)}")
        return v

    @field_validator("otel_traces_sampler", mode="before")
    def validate_otel_traces_sampler(cls, v: str) -> str:
        """Validate OTEL traces sampler."""
        valid_samplers = ["always_on", "always_off", "ratio", "traceidratio"]
        if v not in valid_samplers:
            raise ValueError(f"OTEL_TRACES_SAMPLER must be one of: {', '.join(valid_samplers)}")
        return v

    @field_validator("otel_exporter_otlp_protocol", mode="before")
    def validate_otel_protocol(cls, v: str) -> str:
        """Validate OTLP protocol."""
        valid_protocols = ["grpc", "http/protobuf", "http/json"]
        if v not in valid_protocols:
            raise ValueError(f"OTEL_EXPORTER_OTLP_PROTOCOL must be one of: {', '.join(valid_protocols)}")
        return v

    @field_validator("otel_sdk_disabled", mode="before")
    def validate_otel_sdk_disabled(cls, v: Union[str, bool]) -> bool:
        """Validate OTEL SDK disabled flag."""
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("true", "1", "t", "yes", "y")
        return False

    @model_validator(mode="after")
    def validate_all(self) -> "Settings":
        """Validate settings after initial loading. Primarily handles SMTP check."""
        # Test overrides (debug, cors, testing, environment) are now handled 
        # primarily by environment variables set in the test environment (docker-compose.dev.yml)
        # and potentially explicit instantiation in tests (e.g., Settings(testing=True))
        # We no longer force overrides here based on self.environment.

        # Validate SMTP settings (only relevant if not in a test context typically)
        # We can keep this check, assuming test env won't set SMTP_USER without password.
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
    # For test environment, force environment variable loading
    import os
    if os.environ.get("ENVIRONMENT") == "test":
        try:
            return Settings(
                environment="test",
                database_url_for_env=os.environ.get("DATABASE_URL", ""),
                redis_url=os.environ.get("REDIS_URL", "redis://cache:6379/1"),
                debug=False,
                testing=True
            )
        except ValidationError as e:
            print(f"ERROR: Test settings validation failed: {e}")
            raise
    
    # Normal environment loading
    try:
        return Settings()
    except ValidationError as e:
        # Log error details during startup if validation fails
        print(f"ERROR: Settings validation failed: {e}")
        raise

# Export settings instance for direct import
settings = get_settings() 