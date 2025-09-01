"""
Comprehensive tests for Security Headers and CORS Management.
Tests API key management, security headers, CORS policies, and middleware functionality.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch
from fastapi import Request, Response
from fastapi.testclient import TestClient
from starlette.responses import JSONResponse

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.security_headers import (
    SecurityManager,
    SecurityConfig,
    CORSConfig,
    APIKeyConfig,
    SecurityHeadersMiddleware,
    APIKey,
    generate_api_key,
    validate_api_key,
    init_security_manager,
    get_security_manager
)


class TestCORSConfig:
    """Test CORS configuration functionality."""

    def test_cors_config_defaults(self):
        """Test CORS configuration with default values."""
        config = CORSConfig()
        assert config.allow_origins == ["*"]
        assert config.allow_credentials is False
        assert config.allow_methods == ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        assert config.allow_headers == ["*"]
        assert config.expose_headers == []
        assert config.max_age == 86400

    def test_cors_origin_validation(self):
        """Test CORS origin validation."""
        config = CORSConfig(allow_origins=["https://example.com", "https://api.example.com"])

        assert config.is_origin_allowed("https://example.com") is True
        assert config.is_origin_allowed("https://api.example.com") is True
        assert config.is_origin_allowed("https://other.com") is False

        # Test wildcard
        wildcard_config = CORSConfig(allow_origins=["*"])
        assert wildcard_config.is_origin_allowed("https://any.com") is True


class TestAPIKeyConfig:
    """Test API key configuration functionality."""

    def test_api_key_config_defaults(self):
        """Test API key configuration with default values."""
        config = APIKeyConfig()
        assert config.enabled is True
        assert config.header_name == "X-API-Key"
        assert config.query_param == "api_key"
        assert config.rate_limit_per_minute == 60
        assert config.rate_limit_per_hour == 1000
        assert config.expiration_days == 365
        assert config.key_length == 32


class TestSecurityConfig:
    """Test comprehensive security configuration."""

    def test_security_config_defaults(self):
        """Test security configuration with default values."""
        config = SecurityConfig()

        # Check CORS config
        assert isinstance(config.cors, CORSConfig)
        assert isinstance(config.api_keys, APIKeyConfig)

        # Check security headers are set
        assert "Content-Security-Policy" in config.security_headers
        assert "X-Frame-Options" in config.security_headers
        assert "X-Content-Type-Options" in config.security_headers
        assert "Strict-Transport-Security" in config.security_headers

    def test_security_config_customization(self):
        """Test security configuration customization."""
        custom_cors = CORSConfig(allow_origins=["https://example.com"])
        custom_api_keys = APIKeyConfig(enabled=False)
        custom_headers = {"Custom-Header": "value"}

        config = SecurityConfig(
            cors=custom_cors,
            api_keys=custom_api_keys,
            security_headers=custom_headers
        )

        assert config.cors.allow_origins == ["https://example.com"]
        assert config.api_keys.enabled is False
        assert config.security_headers == custom_headers


class TestAPIKey:
    """Test API key management functionality."""

    def test_api_key_generation(self):
        """Test API key generation."""
        config = APIKeyConfig()
        api_key_manager = APIKey(config)

        key = api_key_manager.generate_key("test-key", "test-owner", ["read", "write"])

        assert isinstance(key, str)
        assert len(key) == config.key_length * 4 // 3  # Base64 encoding

    def test_api_key_validation(self):
        """Test API key validation."""
        config = APIKeyConfig()
        api_key_manager = APIKey(config)

        # Generate a key
        key = api_key_manager.generate_key("test-key", "test-owner")

        # Validate the key
        is_valid, key_info = api_key_manager.validate_key(key)

        assert is_valid is True
        assert key_info is not None
        assert key_info["name"] == "test-key"
        assert key_info["owner"] == "test-owner"

    def test_api_key_validation_invalid(self):
        """Test validation of invalid API keys."""
        config = APIKeyConfig()
        api_key_manager = APIKey(config)

        # Test with invalid key
        is_valid, key_info = api_key_manager.validate_key("invalid-key")
        assert is_valid is False
        assert key_info is None

        # Test with empty key
        is_valid, key_info = api_key_manager.validate_key("")
        assert is_valid is False
        assert key_info is None

        # Test with None
        is_valid, key_info = api_key_manager.validate_key(None)
        assert is_valid is False
        assert key_info is None

    def test_api_key_revocation(self):
        """Test API key revocation."""
        config = APIKeyConfig()
        api_key_manager = APIKey(config)

        # Generate and validate a key
        key = api_key_manager.generate_key("test-key", "test-owner")
        is_valid, _ = api_key_manager.validate_key(key)
        assert is_valid is True

        # Revoke the key
        import hashlib
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        api_key_manager.revoke_key(key_hash)

        # Validate again - should be invalid
        is_valid, _ = api_key_manager.validate_key(key)
        assert is_valid is False

    def test_api_key_expiration(self):
        """Test API key expiration."""
        config = APIKeyConfig(expiration_days=0)  # Expire immediately
        api_key_manager = APIKey(config)

        # Generate a key
        key = api_key_manager.generate_key("test-key", "test-owner")

        # Validate - should be invalid due to expiration
        is_valid, key_info = api_key_manager.validate_key(key)
        assert is_valid is False
        assert key_info is None

    def test_api_key_scopes(self):
        """Test API key scopes."""
        config = APIKeyConfig()
        api_key_manager = APIKey(config)

        # Generate key with specific scopes
        key = api_key_manager.generate_key("test-key", "test-owner", ["read", "write"])

        # Validate and check scopes
        is_valid, key_info = api_key_manager.validate_key(key)
        assert is_valid is True
        assert key_info["scopes"] == ["read", "write"]

    def test_api_key_usage_tracking(self):
        """Test API key usage tracking."""
        config = APIKeyConfig()
        api_key_manager = APIKey(config)

        # Generate a key
        key = api_key_manager.generate_key("test-key", "test-owner")

        # Get initial usage count
        import hashlib
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        key_info = api_key_manager.get_key_info(key_hash)
        initial_usage = key_info["usage_count"]

        # Validate the key (this should increment usage)
        api_key_manager.validate_key(key)

        # Check usage count increased
        key_info = api_key_manager.get_key_info(key_hash)
        assert key_info["usage_count"] == initial_usage + 1
        assert key_info["last_used"] is not None


class TestSecurityHeadersMiddleware:
    """Test security headers middleware functionality."""

    @pytest.fixture
    def security_config(self):
        """Create a test security configuration."""
        return SecurityConfig(
            cors=CORSConfig(allow_origins=["https://example.com"]),
            api_keys=APIKeyConfig(enabled=True)
        )

    @pytest.fixture
    def middleware(self, security_config):
        """Create a test middleware instance."""
        return SecurityHeadersMiddleware(None, security_config)

    def test_middleware_creation(self, security_config):
        """Test middleware creation."""
        middleware = SecurityHeadersMiddleware(None, security_config)
        assert middleware.config == security_config
        assert isinstance(middleware.api_key_manager, APIKey)

    @pytest.mark.asyncio
    async def test_cors_preflight_handling(self, middleware):
        """Test CORS preflight request handling."""
        # Create mock request
        mock_request = Mock(spec=Request)
        mock_request.method = "OPTIONS"
        mock_request.headers = {"origin": "https://example.com"}

        response = await middleware._handle_cors_preflight(mock_request)

        assert response.status_code == 200
        assert "Access-Control-Allow-Origin" in response.headers
        assert response.headers["Access-Control-Allow-Origin"] == "https://example.com"

    @pytest.mark.asyncio
    async def test_cors_preflight_invalid_origin(self, middleware):
        """Test CORS preflight with invalid origin."""
        # Create mock request
        mock_request = Mock(spec=Request)
        mock_request.method = "OPTIONS"
        mock_request.headers = {"origin": "https://invalid.com"}

        response = await middleware._handle_cors_preflight(mock_request)

        assert response.status_code == 200
        # Should not include CORS headers for invalid origin
        assert "Access-Control-Allow-Origin" not in response.headers

    @pytest.mark.asyncio
    async def test_api_key_validation_success(self, middleware):
        """Test successful API key validation."""
        # Generate a valid API key
        key = middleware.api_key_manager.generate_key("test-key", "test-owner")

        # Create mock request with valid API key
        mock_request = Mock(spec=Request)
        mock_request.headers = {"x-api-key": key}
        mock_request.query_params = {}

        is_valid, key_info = await middleware._validate_api_key(mock_request)

        assert is_valid is True
        assert key_info is not None
        assert key_info["name"] == "test-key"

    @pytest.mark.asyncio
    async def test_api_key_validation_failure(self, middleware):
        """Test failed API key validation."""
        # Create mock request with invalid API key
        mock_request = Mock(spec=Request)
        mock_request.headers = {"x-api-key": "invalid-key"}
        mock_request.query_params = {}

        is_valid, key_info = await middleware._validate_api_key(mock_request)

        assert is_valid is False
        assert key_info is None

    @pytest.mark.asyncio
    async def test_api_key_from_query_param(self, middleware):
        """Test API key validation from query parameter."""
        # Generate a valid API key
        key = middleware.api_key_manager.generate_key("test-key", "test-owner")

        # Create mock request with API key in query params
        mock_request = Mock(spec=Request)
        mock_request.headers = {}
        mock_request.query_params = {"api_key": key}

        is_valid, key_info = await middleware._validate_api_key(mock_request)

        assert is_valid is True
        assert key_info is not None

    def test_security_headers_addition(self, middleware):
        """Test addition of security headers to response."""
        response = Response()

        middleware._add_security_headers(response)

        # Check that security headers are added
        assert "Content-Security-Policy" in response.headers
        assert "X-Frame-Options" in response.headers
        assert "X-Content-Type-Options" in response.headers
        assert "Strict-Transport-Security" in response.headers

    def test_cors_headers_addition(self, middleware):
        """Test addition of CORS headers to response."""
        mock_request = Mock(spec=Request)
        mock_request.headers = {"origin": "https://example.com"}
        response = Response()

        middleware._add_cors_headers(mock_request, response)

        assert "Access-Control-Allow-Origin" in response.headers
        assert response.headers["Access-Control-Allow-Origin"] == "https://example.com"


class TestSecurityManager:
    """Test security manager functionality."""

    @pytest.fixture
    def security_manager(self):
        """Create a test security manager."""
        config = SecurityConfig()
        return SecurityManager(config)

    def test_security_manager_creation(self, security_manager):
        """Test security manager creation."""
        assert isinstance(security_manager.config, SecurityConfig)
        assert isinstance(security_manager.api_key_manager, APIKey)

    def test_api_key_generation_through_manager(self, security_manager):
        """Test API key generation through security manager."""
        key = security_manager.generate_api_key("test-key", "test-owner", ["read"])

        assert isinstance(key, str)
        assert len(key) > 0

    def test_api_key_validation_through_manager(self, security_manager):
        """Test API key validation through security manager."""
        # Generate a key
        key = security_manager.generate_api_key("test-key", "test-owner")

        # Validate it
        is_valid, key_info = security_manager.validate_api_key(key)

        assert is_valid is True
        assert key_info is not None

    def test_security_config_getter(self, security_manager):
        """Test security configuration retrieval."""
        config = security_manager.get_security_config()

        assert "cors" in config
        assert "api_keys" in config
        assert "security_headers" in config

        assert isinstance(config["cors"], dict)
        assert isinstance(config["api_keys"], dict)
        assert isinstance(config["security_headers"], dict)

    def test_security_config_update(self, security_manager):
        """Test security configuration updates."""
        updates = {
            "cors": {
                "allow_origins": ["https://new.example.com"]
            },
            "api_keys": {
                "enabled": False
            },
            "security_headers": {
                "Custom-Security-Header": "value"
            }
        }

        security_manager.update_security_config(updates)

        # Check CORS config updated
        assert security_manager.config.cors.allow_origins == ["https://new.example.com"]

        # Check API keys config updated
        assert security_manager.config.api_keys.enabled is False

        # Check security headers updated
        assert "Custom-Security-Header" in security_manager.config.security_headers

    def test_security_statistics(self, security_manager):
        """Test security statistics retrieval."""
        # Generate some API keys
        security_manager.generate_api_key("key1", "owner1")
        security_manager.generate_api_key("key2", "owner2")

        stats = security_manager.get_security_statistics()

        assert "api_keys" in stats
        assert "cors" in stats
        assert "security_headers" in stats

        assert stats["api_keys"]["total_keys"] == 2
        assert stats["api_keys"]["active_keys"] == 2


class TestGlobalSecurityFunctions:
    """Test global security convenience functions."""

    def test_generate_api_key_global(self):
        """Test global API key generation function."""
        # Initialize security manager first
        init_security_manager()

        key = generate_api_key("test-key", "test-owner", ["read"])
        assert isinstance(key, str)
        assert len(key) > 0

    def test_validate_api_key_global(self):
        """Test global API key validation function."""
        # Initialize security manager first
        init_security_manager()
        manager = get_security_manager()

        # Generate a key using the manager directly
        key = manager.generate_api_key("test-key", "test-owner")

        # Validate using global function
        is_valid, key_info = validate_api_key(key)

        assert is_valid is True
        assert key_info is not None

    def test_get_security_manager_uninitialized(self):
        """Test getting security manager when not initialized."""
        # Reset global state
        import app.core.security_headers as security_module
        security_module.security_manager = None

        with pytest.raises(RuntimeError, match="Security Manager not initialized"):
            get_security_manager()


class TestSecurityIntegration:
    """Integration tests for security components."""

    @pytest.fixture
    def test_app(self):
        """Create a test FastAPI app with security middleware."""
        from fastapi import FastAPI

        app = FastAPI()

        # Add security middleware
        config = SecurityConfig(
            cors=CORSConfig(allow_origins=["https://example.com"]),
            api_keys=APIKeyConfig(enabled=True)
        )
        security_manager = SecurityManager(config)
        middleware = security_manager.create_middleware(app)
        app.add_middleware(middleware.__class__, config=config)

        @app.get("/test")
        async def test_endpoint():
            return {"message": "success"}

        return app

    def test_security_middleware_integration(self, test_app):
        """Test security middleware integration with FastAPI app."""
        client = TestClient(test_app)

        # Test without API key - should fail
        response = client.get("/test")
        assert response.status_code == 401
        assert "Invalid or missing API key" in response.json()["error"]

    def test_security_middleware_with_valid_key(self, test_app):
        """Test security middleware with valid API key."""
        client = TestClient(test_app)

        # Get the security manager from the app
        security_manager = None
        for middleware in test_app.user_middleware:
            if hasattr(middleware.cls, 'api_key_manager'):
                security_manager = middleware.cls
                break

        if security_manager:
            # Generate a valid API key
            api_key = security_manager.api_key_manager.generate_key("test-key", "test-owner")

            # Test with valid API key
            response = client.get("/test", headers={"X-API-Key": api_key})
            assert response.status_code == 200
            assert response.json() == {"message": "success"}

            # Check that security headers are present
            assert "Content-Security-Policy" in response.headers
            assert "X-Frame-Options" in response.headers

    def test_cors_integration(self, test_app):
        """Test CORS integration."""
        client = TestClient(test_app)

        # Test CORS preflight request
        response = client.options(
            "/test",
            headers={"Origin": "https://example.com"}
        )

        assert response.status_code == 200
        assert "Access-Control-Allow-Origin" in response.headers
        assert response.headers["Access-Control-Allow-Origin"] == "https://example.com"

    def test_cors_invalid_origin(self, test_app):
        """Test CORS with invalid origin."""
        client = TestClient(test_app)

        # Test CORS preflight request with invalid origin
        response = client.options(
            "/test",
            headers={"Origin": "https://invalid.com"}
        )

        assert response.status_code == 200
        # Should not include CORS headers for invalid origin
        assert "Access-Control-Allow-Origin" not in response.headers


if __name__ == "__main__":
    pytest.main([__file__])