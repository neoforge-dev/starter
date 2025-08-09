"""
Integration tests for security middleware stack.

Tests the complete security middleware chain including:
- CORS handling
- Security headers
- Request validation
- Rate limiting  
- Environment-specific behavior
"""

import pytest
import json
import time
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.core.config import Settings, Environment
from app.api.middleware.security import SecurityHeadersMiddleware, RateLimitingMiddleware
from app.api.middleware.validation import RequestValidationMiddleware


@pytest.fixture
def production_app():
    """Create FastAPI app with production security settings."""
    app = FastAPI()
    
    production_settings = Settings(
        environment=Environment.PRODUCTION,
        secret_key="test_production_secret_key_32_chars_long",
        cors_origins=["https://example.com"],
        cors_methods=["GET", "POST", "PUT", "DELETE"],
        cors_headers=["Content-Type", "Authorization"],
        rate_limit_requests=10,
        rate_limit_window=60,
        api_v1_str="/api/v1"
    )
    
    # Add security middleware stack in correct order
    with patch("app.api.middleware.validation.get_metrics") as mock_metrics:
        mock_metrics.return_value = {
            "http_request_duration_seconds": lambda **kwargs: lambda x: None,
            "http_requests": lambda **kwargs: lambda: None
        }
        app.add_middleware(RequestValidationMiddleware, settings=production_settings)
    
    app.add_middleware(RateLimitingMiddleware, settings=production_settings)  
    app.add_middleware(SecurityHeadersMiddleware, settings=production_settings)
    
    # Add test routes
    @app.get("/health")
    async def health():
        return {"status": "healthy"}
        
    @app.get("/api/v1/secure")
    async def secure_endpoint():
        return {"message": "secure data"}
        
    @app.post("/api/v1/data")
    async def post_data(data: dict):
        return {"received": data}
    
    return app


@pytest.fixture
def development_app():
    """Create FastAPI app with development security settings."""
    app = FastAPI()
    
    development_settings = Settings(
        environment=Environment.DEVELOPMENT,
        secret_key="test_development_secret_key_32_chars_long",
        cors_origins=["http://localhost:3000"],
        cors_methods=["*"],
        cors_headers=["*"],
        rate_limit_requests=1000,
        rate_limit_window=60,
        api_v1_str="/api/v1"
    )
    
    # Add security middleware stack
    with patch("app.api.middleware.validation.get_metrics") as mock_metrics:
        mock_metrics.return_value = {
            "http_request_duration_seconds": lambda **kwargs: lambda x: None,
            "http_requests": lambda **kwargs: lambda: None
        }
        app.add_middleware(RequestValidationMiddleware, settings=development_settings)
    
    app.add_middleware(RateLimitingMiddleware, settings=development_settings)
    app.add_middleware(SecurityHeadersMiddleware, settings=development_settings)
    
    # Add test routes
    @app.get("/health")
    async def health():
        return {"status": "healthy"}
        
    @app.get("/api/v1/secure")  
    async def secure_endpoint():
        return {"message": "secure data"}
        
    @app.post("/api/v1/data")
    async def post_data(data: dict):
        return {"received": data}
    
    return app


class TestProductionSecurityIntegration:
    """Test production security middleware integration."""
    
    def test_production_security_headers_applied(self, production_app):
        """Test that production security headers are applied."""
        client = TestClient(production_app)
        
        response = client.get("/health", headers={"User-Agent": "test-client"})
        
        assert response.status_code == 200
        # Production security headers should be present
        assert "Strict-Transport-Security" in response.headers
        assert response.headers["X-Frame-Options"] == "DENY"
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert "X-Request-ID" in response.headers
        assert "Content-Security-Policy" in response.headers
        
        # Check CSP doesn't allow unsafe-inline in production
        csp = response.headers["Content-Security-Policy"]
        assert "script-src 'self'" in csp
        assert "'unsafe-inline'" not in csp or "script-src" not in csp.split("'unsafe-inline'")[0]
    
    def test_suspicious_path_blocking_production(self, production_app):
        """Test that suspicious paths are blocked in production."""
        client = TestClient(production_app)
        
        # Test various suspicious paths
        suspicious_paths = ["/.env", "/wp-admin", "/backup", "/.git/config"]
        
        for path in suspicious_paths:
            response = client.get(path, headers={"User-Agent": "test-client"})
            assert response.status_code == 403
            assert response.json()["detail"] == "Access forbidden"
    
    def test_malicious_user_agent_blocking_production(self, production_app):
        """Test that malicious user agents are blocked in production."""
        client = TestClient(production_app)
        
        malicious_agents = ["sqlmap/1.0", "nikto", "nmap scanner", "dirb/2.0"]
        
        for agent in malicious_agents:
            response = client.get("/api/v1/secure", headers={"User-Agent": agent})
            assert response.status_code == 400
            assert response.json()["detail"] == "Invalid User-Agent"
    
    def test_security_threat_detection_production(self, production_app):
        """Test that security threats in request body are detected."""
        client = TestClient(production_app)
        
        malicious_payloads = [
            {"email": "test@test.com' OR 1=1--"},
            {"comment": "<script>alert('xss')</script>"},
            {"data": "'; DROP TABLE users;--"}
        ]
        
        headers = {
            "User-Agent": "test-client",
            "Content-Type": "application/json"
        }
        
        for payload in malicious_payloads:
            response = client.post("/api/v1/data", json=payload, headers=headers)
            assert response.status_code == 400
            assert response.json()["detail"] == "Invalid request data"
    
    def test_rate_limiting_production(self, production_app):
        """Test that rate limiting works in production."""
        client = TestClient(production_app)
        headers = {"User-Agent": "test-client"}
        
        # Make requests up to the limit (10)
        for i in range(10):
            response = client.get("/health", headers=headers)
            assert response.status_code == 200
        
        # Next request should be rate limited
        response = client.get("/health", headers=headers)
        assert response.status_code == 429
        assert "Retry-After" in response.headers
        assert response.json()["detail"] == "Rate limit exceeded"
    
    def test_request_validation_production(self, production_app):
        """Test comprehensive request validation in production."""
        client = TestClient(production_app)
        
        # Test missing required headers
        response = client.post("/api/v1/data", json={"test": "data"})
        assert response.status_code == 400
        assert "header is required" in response.json()["detail"]
        
        # Test wrong content type
        headers = {
            "User-Agent": "test-client",
            "Accept": "application/json",
            "Content-Type": "text/plain"
        }
        response = client.post("/api/v1/data", data="not json", headers=headers)
        assert response.status_code == 415
        assert response.json()["detail"] == "Content-Type must be application/json"


class TestDevelopmentSecurityIntegration:
    """Test development security middleware integration."""
    
    def test_development_security_headers_relaxed(self, development_app):
        """Test that development security headers are more relaxed."""
        client = TestClient(development_app)
        
        response = client.get("/health", headers={"User-Agent": "test-client"})
        
        assert response.status_code == 200
        # Production-only headers should not be present
        assert "Strict-Transport-Security" not in response.headers
        assert "Cross-Origin-Embedder-Policy" not in response.headers
        
        # Basic security headers should still be present
        assert response.headers["X-Frame-Options"] == "DENY"
        assert "X-Request-ID" in response.headers
        
        # CSP should allow unsafe-inline for development tools
        csp = response.headers.get("Content-Security-Policy", "")
        assert "'unsafe-inline'" in csp
        assert "'unsafe-eval'" in csp
    
    def test_security_threats_allowed_development(self, development_app):
        """Test that security threats are allowed in development for testing."""
        client = TestClient(development_app)
        
        # Malicious payload should be allowed in development
        malicious_payload = {
            "email": "test@test.com' OR 1=1--",
            "comment": "<script>alert('xss')</script>"
        }
        
        headers = {
            "User-Agent": "test-client",
            "Content-Type": "application/json"
        }
        
        response = client.post("/api/v1/data", json=malicious_payload, headers=headers)
        assert response.status_code == 200
        assert response.json()["received"] == malicious_payload
    
    def test_relaxed_rate_limiting_development(self, development_app):
        """Test that rate limiting is more relaxed in development."""
        client = TestClient(development_app)
        headers = {"User-Agent": "test-client"}
        
        # Should allow many more requests in development (1000 vs 10)
        for i in range(50):  # Test well under the 1000 limit
            response = client.get("/health", headers=headers)
            assert response.status_code == 200
    
    def test_minimal_validation_development(self, development_app):
        """Test that request validation is minimal in development."""
        client = TestClient(development_app)
        
        # Should be more lenient with headers in development
        # Only User-Agent is required, not Accept and others
        headers = {"User-Agent": "test-client"}
        response = client.get("/api/v1/secure", headers=headers)
        assert response.status_code == 200


class TestCORSSecurityIntegration:
    """Test CORS security integration."""
    
    def test_cors_origin_validation_production(self):
        """Test CORS origin validation in production."""
        # Should reject HTTP origins in production
        with pytest.raises(ValueError, match="Production CORS origins must use HTTPS"):
            Settings(
                environment=Environment.PRODUCTION,
                secret_key="test_secret_key_32_chars_long",
                cors_origins=["http://insecure.com"]
            )
        
        # Should reject wildcard origins in production  
        with pytest.raises(ValueError, match="Wildcard CORS origins .* are not allowed in production"):
            Settings(
                environment=Environment.PRODUCTION,
                secret_key="test_secret_key_32_chars_long", 
                cors_origins=["*"]
            )
    
    def test_cors_methods_validation_production(self):
        """Test CORS methods validation."""
        settings = Settings(
            environment=Environment.PRODUCTION,
            secret_key="test_secret_key_32_chars_long",
            cors_origins=["https://example.com"],
            cors_methods=["GET", "POST", "PUT", "DELETE"]
        )
        
        assert "GET" in settings.cors_methods
        assert "POST" in settings.cors_methods
        assert "*" not in settings.cors_methods  # Wildcard should be resolved


class TestErrorHandlingIntegration:
    """Test error handling across the security middleware stack."""
    
    def test_middleware_exception_handling(self, production_app):
        """Test that middleware exceptions are handled gracefully."""
        client = TestClient(production_app)
        
        # Test with oversized request
        large_payload = {"data": "x" * (11 * 1024 * 1024)}  # 11MB
        headers = {
            "User-Agent": "test-client",
            "Content-Type": "application/json"
        }
        
        response = client.post("/api/v1/data", json=large_payload, headers=headers)
        assert response.status_code == 413
        assert response.json()["detail"] == "Request entity too large"
    
    def test_invalid_json_handling(self, production_app):
        """Test handling of invalid JSON in requests."""
        client = TestClient(production_app)
        
        headers = {
            "User-Agent": "test-client", 
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        response = client.post("/api/v1/data", data="invalid json", headers=headers)
        assert response.status_code == 422
        assert response.json()["detail"] == "Invalid JSON in request body"


class TestSecurityLoggingIntegration:
    """Test that security events are properly logged."""
    
    def test_security_event_logging(self, production_app):
        """Test that security violations are logged."""
        client = TestClient(production_app)
        
        # This should trigger security logging (blocked malicious user-agent)
        with patch('app.api.middleware.validation.logger') as mock_logger:
            response = client.get("/api/v1/secure", headers={"User-Agent": "sqlmap/1.0"})
            
            assert response.status_code == 400
            mock_logger.warning.assert_called()
            
            # Check that the log call contains security information
            call_args = mock_logger.warning.call_args[1]
            assert "malicious_user_agent_blocked" in call_args
            assert call_args["user_agent"] == "sqlmap/1.0"
    
    def test_rate_limit_logging(self, production_app):
        """Test that rate limit violations are logged."""
        client = TestClient(production_app)
        headers = {"User-Agent": "test-client"}
        
        # Fill up rate limit
        for i in range(10):
            client.get("/health", headers=headers)
        
        # This should trigger rate limit logging
        with patch('app.api.middleware.security.logger') as mock_logger:
            response = client.get("/health", headers=headers)
            
            assert response.status_code == 429
            mock_logger.warning.assert_called()
            
            # Check that the log call contains rate limit information
            call_args = mock_logger.warning.call_args[1]
            assert "rate_limit_exceeded" in call_args