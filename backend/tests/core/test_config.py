"""
Test configuration module functionality, focusing on unit validation.
"""

import pytest
from unittest.mock import patch
from pydantic import SecretStr, ValidationError

from app.core.config import (
    Settings,
    Environment,
    parse_bool_str,
    parse_environment,
    get_settings, # Keep import for cache test
)

VALID_SECRET_KEY = "a_valid_secret_key_that_is_at_least_32_characters_long"


def test_parse_bool_str():
    """Test that parse_bool_str correctly parses boolean values from strings."""
    assert parse_bool_str("true") is True
    assert parse_bool_str("false") is False
    assert parse_bool_str(True) is True
    assert parse_bool_str(False) is False
    with pytest.raises(ValueError):
        parse_bool_str("invalid")

def test_parse_environment():
    """Test that parse_environment correctly validates environment values."""
    assert parse_environment("development") == "development"
    assert parse_environment("production") == "production"
    assert parse_environment("test") == "test"
    with pytest.raises(ValueError):
        parse_environment("invalid")

def test_environment_enum():
    """Test that Environment enum has the correct values."""
    assert Environment.DEVELOPMENT == "development"
    assert Environment.TEST == "test"

def test_settings_direct_instantiation():
    """Test direct instantiation with specific values (minimal validation focus)."""
    settings = Settings(
        app_name="DirectApp",
        secret_key=VALID_SECRET_KEY,
        environment=Environment.PRODUCTION,
        debug=True,
        testing=False, # Explicitly False
        cors_origins=["http://direct.com"], # Passed directly
        database_url_for_env="direct_db_url",
        redis_url="redis://direct-redis:6379/2"
    )
    assert settings.app_name == "DirectApp"
    assert settings.secret_key.get_secret_value() == VALID_SECRET_KEY
    assert settings.environment == Environment.PRODUCTION
    assert settings.debug is True
    assert settings.testing is False
    # CORS validator runs, but testing=False and environment=PRODUCTION means it shouldn't clear the list
    # It does add a trailing slash
    assert settings.cors_origins == ["http://direct.com/"] 
    assert settings.database_url_for_env == "direct_db_url"
    assert str(settings.redis_url) == "redis://direct-redis:6379/2"

def test_settings_secret_key_validation():
    """Test secret key validation during instantiation."""
    # Valid key
    Settings(secret_key=VALID_SECRET_KEY)
    # Invalid key (too short)
    with pytest.raises(ValidationError, match="Secret key must be at least 32 characters long"):
        Settings(secret_key="short")

def test_settings_cors_validator_in_test_mode():
    """Test the CORS validator specifically empties list in test mode."""
    # Instantiate with testing=True
    settings_testing = Settings(
        secret_key=VALID_SECRET_KEY, 
        testing=True, 
        cors_origins=["http://should_be_removed.com"]
    )
    assert settings_testing.cors_origins == [], "When testing=True, cors_origins should be empty"

def test_get_settings_caching():
    """Test that get_settings caches the settings (relies on test env)."""
    # Clear cache first via fixture (implicitly applied)
    settings1 = get_settings()
    settings2 = get_settings()
    assert settings1 is settings2


class TestOTLPConfiguration:
    """Test OpenTelemetry OTLP configuration validation."""

    def test_otel_traces_exporter_validation(self):
        """Test OTEL_TRACES_EXPORTER validation."""
        # Valid values
        for exporter in ["console", "otlp", "none"]:
            settings = Settings(
                secret_key=VALID_SECRET_KEY,
                otel_traces_exporter=exporter
            )
            assert settings.otel_traces_exporter == exporter

        # Invalid value
        with pytest.raises(ValidationError, match="OTEL_TRACES_EXPORTER must be one of"):
            Settings(
                secret_key=VALID_SECRET_KEY,
                otel_traces_exporter="invalid"
            )

    def test_otel_traces_sampler_validation(self):
        """Test OTEL_TRACES_SAMPLER validation."""
        # Valid values
        for sampler in ["always_on", "always_off", "ratio", "traceidratio"]:
            settings = Settings(
                secret_key=VALID_SECRET_KEY,
                otel_traces_sampler=sampler
            )
            assert settings.otel_traces_sampler == sampler

        # Invalid value
        with pytest.raises(ValidationError, match="OTEL_TRACES_SAMPLER must be one of"):
            Settings(
                secret_key=VALID_SECRET_KEY,
                otel_traces_sampler="invalid"
            )

    def test_otel_exporter_otlp_protocol_validation(self):
        """Test OTEL_EXPORTER_OTLP_PROTOCOL validation."""
        # Valid values
        for protocol in ["grpc", "http/protobuf", "http/json"]:
            settings = Settings(
                secret_key=VALID_SECRET_KEY,
                otel_exporter_otlp_protocol=protocol
            )
            assert settings.otel_exporter_otlp_protocol == protocol

        # Invalid value
        with pytest.raises(ValidationError, match="OTEL_EXPORTER_OTLP_PROTOCOL must be one of"):
            Settings(
                secret_key=VALID_SECRET_KEY,
                otel_exporter_otlp_protocol="invalid"
            )

    def test_otel_sdk_disabled_validation(self):
        """Test OTEL_SDK_DISABLED boolean validation."""
        # String boolean values
        for value, expected in [("true", True), ("false", False), ("1", True), ("0", False)]:
            settings = Settings(
                secret_key=VALID_SECRET_KEY,
                otel_sdk_disabled=value
            )
            assert settings.otel_sdk_disabled == expected

        # Boolean values
        for value in [True, False]:
            settings = Settings(
                secret_key=VALID_SECRET_KEY,
                otel_sdk_disabled=value
            )
            assert settings.otel_sdk_disabled == value

    def test_otel_default_values(self):
        """Test OTLP configuration default values."""
        settings = Settings(secret_key=VALID_SECRET_KEY)
        
        assert settings.otel_service_name == "neoforge-api"
        assert settings.otel_traces_exporter == "console"
        assert settings.otel_traces_sampler == "always_on"
        assert settings.otel_exporter_otlp_protocol == "http/protobuf"
        assert settings.otel_exporter_otlp_timeout == 10
        assert settings.otel_sdk_disabled is False
        assert settings.otel_log_level == "info"
        
        # Optional fields should be None
        assert settings.otel_exporter_otlp_endpoint is None
        assert settings.otel_exporter_otlp_headers is None
        assert settings.otel_service_version is None
        assert settings.otel_resource_attributes is None

    def test_otel_endpoint_configuration(self):
        """Test OTLP endpoint configuration."""
        settings = Settings(
            secret_key=VALID_SECRET_KEY,
            otel_exporter_otlp_endpoint="http://jaeger:4318/v1/traces",
            otel_exporter_otlp_traces_endpoint="http://jaeger:4318/v1/traces/custom",
            otel_traces_exporter="otlp"
        )
        
        assert settings.otel_exporter_otlp_endpoint == "http://jaeger:4318/v1/traces"
        assert settings.otel_exporter_otlp_traces_endpoint == "http://jaeger:4318/v1/traces/custom"
        assert settings.otel_traces_exporter == "otlp"

    def test_otel_headers_configuration(self):
        """Test OTLP headers configuration."""
        settings = Settings(
            secret_key=VALID_SECRET_KEY,
            otel_exporter_otlp_headers="api-key=secret123,x-tenant=test",
            otel_exporter_otlp_traces_headers="x-trace-source=backend"
        )
        
        assert settings.otel_exporter_otlp_headers == "api-key=secret123,x-tenant=test"
        assert settings.otel_exporter_otlp_traces_headers == "x-trace-source=backend"

    def test_otel_timeout_configuration(self):
        """Test OTLP timeout configuration."""
        settings = Settings(
            secret_key=VALID_SECRET_KEY,
            otel_exporter_otlp_timeout=30,
            otel_exporter_otlp_traces_timeout=45
        )
        
        assert settings.otel_exporter_otlp_timeout == 30
        assert settings.otel_exporter_otlp_traces_timeout == 45

    def test_otel_compression_configuration(self):
        """Test OTLP compression configuration."""
        settings = Settings(
            secret_key=VALID_SECRET_KEY,
            otel_exporter_otlp_compression="gzip",
            otel_exporter_otlp_traces_compression="snappy"
        )
        
        assert settings.otel_exporter_otlp_compression == "gzip"
        assert settings.otel_exporter_otlp_traces_compression == "snappy"

    def test_otel_resource_configuration(self):
        """Test OTLP resource configuration."""
        settings = Settings(
            secret_key=VALID_SECRET_KEY,
            otel_service_name="custom-service",
            otel_service_version="1.2.3",
            otel_resource_attributes="environment=prod,team=backend"
        )
        
        assert settings.otel_service_name == "custom-service"
        assert settings.otel_service_version == "1.2.3"
        assert settings.otel_resource_attributes == "environment=prod,team=backend" 