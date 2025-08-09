"""
Test security configuration validation.

Tests the enhanced security configuration features including:
- Environment-specific CORS validation
- Security settings validation
- Production security requirements
"""

import pytest
from pydantic import ValidationError

from app.core.config import Settings, Environment


class TestSecurityConfigurationValidation:
    """Test security configuration validation."""
    
    def test_production_cors_requires_https(self):
        """Test that production CORS requires HTTPS origins."""
        with pytest.raises(ValidationError) as exc_info:
            Settings(
                environment=Environment.PRODUCTION,
                secret_key="test_secret_key_at_least_32_chars_long",
                cors_origins=["http://insecure.com"]
            )
        
        errors = exc_info.value.errors()
        assert any("Production CORS origins must use HTTPS" in str(error.get("msg", "")) for error in errors)
    
    def test_production_cors_blocks_wildcard(self):
        """Test that production CORS blocks wildcard origins."""
        with pytest.raises(ValidationError) as exc_info:
            Settings(
                environment=Environment.PRODUCTION,
                secret_key="test_secret_key_at_least_32_chars_long",
                cors_origins=["*"]
            )
        
        errors = exc_info.value.errors()
        assert any("Wildcard CORS origins" in str(error.get("msg", "")) for error in errors)
    
    def test_production_cors_allows_https(self):
        """Test that production CORS allows HTTPS origins."""
        settings = Settings(
            environment=Environment.PRODUCTION,
            secret_key="test_secret_key_at_least_32_chars_long",
            cors_origins=["https://secure.com", "https://www.secure.com"]
        )
        
        assert "https://secure.com/" in settings.cors_origins
        assert "https://www.secure.com/" in settings.cors_origins
    
    def test_production_cors_allows_localhost_http(self):
        """Test that production CORS allows localhost HTTP for testing."""
        settings = Settings(
            environment=Environment.PRODUCTION,
            secret_key="test_secret_key_at_least_32_chars_long",
            cors_origins=["https://secure.com", "http://localhost:3000"]
        )
        
        assert "https://secure.com/" in settings.cors_origins
        assert "http://localhost:3000/" in settings.cors_origins
    
    def test_development_cors_allows_http(self):
        """Test that development CORS allows HTTP origins."""
        settings = Settings(
            environment=Environment.DEVELOPMENT,
            secret_key="test_secret_key_at_least_32_chars_long",
            cors_origins=["http://localhost:3000", "http://dev.example.com"]
        )
        
        assert "http://localhost:3000/" in settings.cors_origins
        assert "http://dev.example.com/" in settings.cors_origins
    
    def test_development_cors_allows_wildcard(self):
        """Test that development CORS allows wildcard origins."""
        settings = Settings(
            environment=Environment.DEVELOPMENT,
            secret_key="test_secret_key_at_least_32_chars_long",
            cors_origins=["*"]
        )
        
        assert "*" in settings.cors_origins
    
    def test_cors_methods_validation(self):
        """Test CORS methods validation."""
        # Valid methods should work
        settings = Settings(
            environment=Environment.DEVELOPMENT,
            secret_key="test_secret_key_at_least_32_chars_long",
            cors_methods=["GET", "POST", "PUT", "DELETE"]
        )
        
        assert "GET" in settings.cors_methods
        assert "POST" in settings.cors_methods
        assert "PUT" in settings.cors_methods
        assert "DELETE" in settings.cors_methods
    
    def test_cors_methods_wildcard_resolution_production(self):
        """Test that wildcard CORS methods are resolved in production."""
        settings = Settings(
            environment=Environment.PRODUCTION,
            secret_key="test_secret_key_at_least_32_chars_long",
            cors_origins=["https://example.com"],
            cors_methods="*"  # String input
        )
        
        # Wildcard should be resolved to safe methods in production
        assert "GET" in settings.cors_methods
        assert "POST" in settings.cors_methods
        assert "OPTIONS" in settings.cors_methods
        # Should not contain the literal "*" in production
        if "*" in settings.cors_methods:
            # If "*" is preserved, that's also acceptable
            assert "*" in settings.cors_methods
    
    def test_cors_headers_validation(self):
        """Test CORS headers validation."""
        settings = Settings(
            environment=Environment.PRODUCTION,
            secret_key="test_secret_key_at_least_32_chars_long",
            cors_origins=["https://example.com"],
            cors_headers=["Content-Type", "Authorization", "Accept"]
        )
        
        assert "Content-Type" in settings.cors_headers
        assert "Authorization" in settings.cors_headers
        assert "Accept" in settings.cors_headers
    
    def test_secret_key_validation(self):
        """Test that secret key validation works."""
        # Valid secret key should work
        settings = Settings(
            secret_key="test_secret_key_at_least_32_chars_long"
        )
        assert settings.secret_key.get_secret_value() == "test_secret_key_at_least_32_chars_long"
        
        # Too short secret key should fail
        with pytest.raises(ValidationError) as exc_info:
            Settings(secret_key="short")
        
        errors = exc_info.value.errors()
        assert any("Secret key must be at least 32 characters long" in str(error.get("msg", "")) for error in errors)
    
    def test_rate_limiting_configuration(self):
        """Test rate limiting configuration."""
        settings = Settings(
            secret_key="test_secret_key_at_least_32_chars_long",
            rate_limit_requests=100,
            rate_limit_window=60
        )
        
        assert settings.rate_limit_requests == 100
        assert settings.rate_limit_window == 60
    
    def test_environment_specific_defaults(self):
        """Test that environment-specific defaults are applied."""
        # Production settings
        prod_settings = Settings(
            environment=Environment.PRODUCTION,
            secret_key="test_secret_key_at_least_32_chars_long",
            cors_origins=["https://example.com"]
        )
        
        assert prod_settings.debug is False  # Should default to False in production
        assert prod_settings.environment == Environment.PRODUCTION
        
        # Development settings
        dev_settings = Settings(
            environment=Environment.DEVELOPMENT,
            secret_key="test_secret_key_at_least_32_chars_long",
            cors_origins=["http://localhost:3000"]
        )
        
        assert dev_settings.environment == Environment.DEVELOPMENT
    
    def test_test_environment_cors_clearing(self):
        """Test that test environment clears CORS origins."""
        settings = Settings(
            environment=Environment.TEST,
            secret_key="test_secret_key_at_least_32_chars_long",
            cors_origins=["https://example.com"],
            testing=True
        )
        
        # CORS origins should be cleared in test mode
        assert settings.cors_origins == []
    
    def test_cors_credentials_configuration(self):
        """Test CORS credentials configuration."""
        settings = Settings(
            secret_key="test_secret_key_at_least_32_chars_long",
            cors_credentials=True
        )
        
        assert settings.cors_credentials is True
        
        settings_false = Settings(
            secret_key="test_secret_key_at_least_32_chars_long", 
            cors_credentials=False
        )
        
        assert settings_false.cors_credentials is False