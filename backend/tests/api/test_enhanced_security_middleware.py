"""
Test enhanced security middleware functionality.

This module tests the comprehensive security features including:
- Environment-specific security headers
- Request validation with threat detection
- Rate limiting
- CORS validation
- Malicious user-agent blocking
"""

import pytest
import json
import time
from unittest.mock import MagicMock, patch, AsyncMock
from starlette.datastructures import URL, Headers
from starlette.responses import JSONResponse
from fastapi import FastAPI

from app.api.middleware.security import SecurityHeadersMiddleware, RateLimitingMiddleware
from app.api.middleware.validation import RequestValidationMiddleware, SecurityValidator
from app.core.config import Settings, Environment


def create_mock_request(method: str, path: str, headers: dict, body: bytes = b'', client_ip: str = "127.0.0.1"):
    """Create a mock request for testing."""
    url = URL(f"http://test{path}")
    scope_headers = [(k.lower().encode('latin-1'), v.encode('latin-1')) for k, v in headers.items()]
    scope = {
        "type": "http",
        "method": method,
        "path": path,
        "headers": scope_headers,
        "url": url,
        "query_string": b"",
        "root_path": "",
        "client": (client_ip, 8080),
        "server": ("testserver", 80),
    }
    
    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}
        
    mock_req = MagicMock()
    mock_req.method = method
    mock_req.url = url
    mock_req.headers = Headers(scope=scope)
    mock_req.scope = scope
    mock_req.receive = receive
    mock_req.client = MagicMock()
    mock_req.client.host = client_ip
    
    # Mock json() method for POST/PUT/PATCH
    if method in ["POST", "PUT", "PATCH"] and body:
        async def mock_json():
            try:
                return json.loads(body.decode('utf-8'))
            except json.JSONDecodeError as e:
                raise json.JSONDecodeError(e.msg, e.doc, e.pos)
        mock_req.json = mock_json
    else:
        async def mock_json_empty():
            raise json.JSONDecodeError("Expecting value", "", 0)
        mock_req.json = mock_json_empty
        
    return mock_req


async def dummy_call_next(request):
    """Dummy call_next function for middleware testing."""
    return JSONResponse({"message": "success"}, status_code=200)


class TestSecurityValidator:
    """Test the SecurityValidator utility class."""
    
    def test_sql_injection_detection(self):
        """Test SQL injection pattern detection."""
        threats = SecurityValidator.validate_input_security("SELECT * FROM users WHERE id = 1 OR 1=1--")
        assert "Potential SQL injection detected" in threats
        
        threats = SecurityValidator.validate_input_security("'; DROP TABLE users;--")
        assert "Potential SQL injection detected" in threats
        
        threats = SecurityValidator.validate_input_security("normal text")
        assert len(threats) == 0
    
    def test_xss_detection(self):
        """Test XSS attack pattern detection."""
        threats = SecurityValidator.validate_input_security("<script>alert('xss')</script>")
        assert "Potential XSS attack detected" in threats
        
        threats = SecurityValidator.validate_input_security("javascript:alert('xss')")
        assert "Potential XSS attack detected" in threats
        
        threats = SecurityValidator.validate_input_security("<iframe src='evil.com'></iframe>")
        assert "Potential XSS attack detected" in threats
        
        threats = SecurityValidator.validate_input_security("normal text")
        assert len(threats) == 0
    
    def test_nested_data_validation(self):
        """Test validation of nested data structures."""
        malicious_data = {
            "user": {
                "name": "test",
                "email": "test@test.com' OR 1=1--"
            },
            "items": ["normal", "<script>alert('xss')</script>"]
        }
        threats = SecurityValidator.validate_input_security(malicious_data)
        assert len(threats) >= 2  # Should detect both SQL injection and XSS
    
    def test_suspicious_path_detection(self):
        """Test suspicious path detection."""
        assert SecurityValidator.is_suspicious_path("/.env")
        assert SecurityValidator.is_suspicious_path("/wp-admin/config.php")
        assert SecurityValidator.is_suspicious_path("/backup/database")
        assert not SecurityValidator.is_suspicious_path("/api/v1/users")
        assert not SecurityValidator.is_suspicious_path("/health")
    
    def test_user_agent_validation(self):
        """Test user agent validation."""
        assert not SecurityValidator.validate_user_agent("sqlmap/1.0")
        assert not SecurityValidator.validate_user_agent("nikto scanner")
        assert not SecurityValidator.validate_user_agent("nmap")
        assert not SecurityValidator.validate_user_agent("")
        assert not SecurityValidator.validate_user_agent("short")
        assert SecurityValidator.validate_user_agent("Mozilla/5.0 (compatible browser)")


class TestSecurityHeadersMiddleware:
    """Test security headers middleware."""
    
    @pytest.fixture
    def production_settings(self):
        return Settings(
            environment=Environment.PRODUCTION,
            secret_key="test_secret_key_at_least_32_chars_long",
            cors_origins=["https://example.com"]
        )
    
    @pytest.fixture
    def development_settings(self):
        return Settings(
            environment=Environment.DEVELOPMENT,
            secret_key="test_secret_key_at_least_32_chars_long",
            cors_origins=["http://localhost:3000"]
        )
    
    @pytest.mark.asyncio
    async def test_production_security_headers(self, production_settings):
        """Test that production security headers are applied correctly."""
        middleware = SecurityHeadersMiddleware(app=None, settings=production_settings)
        
        request = create_mock_request("GET", "/api/v1/test", {"User-Agent": "test-client"})
        response = await middleware.dispatch(request, dummy_call_next)
        
        # Check production-specific headers
        assert "Strict-Transport-Security" in response.headers
        assert response.headers["Strict-Transport-Security"] == "max-age=31536000; includeSubDomains; preload"
        assert response.headers["X-Frame-Options"] == "DENY"
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["Cross-Origin-Embedder-Policy"] == "require-corp"
        assert "X-Request-ID" in response.headers
    
    @pytest.mark.asyncio
    async def test_development_security_headers(self, development_settings):
        """Test that development headers are more relaxed."""
        middleware = SecurityHeadersMiddleware(app=None, settings=development_settings)
        
        request = create_mock_request("GET", "/api/v1/test", {"User-Agent": "test-client"})
        response = await middleware.dispatch(request, dummy_call_next)
        
        # Production-only headers should not be present
        assert "Strict-Transport-Security" not in response.headers
        assert "Cross-Origin-Embedder-Policy" not in response.headers
        
        # Common security headers should still be present
        assert response.headers["X-Frame-Options"] == "DENY"
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert "X-Request-ID" in response.headers
    
    @pytest.mark.asyncio
    async def test_csp_headers(self, production_settings):
        """Test Content Security Policy headers."""
        middleware = SecurityHeadersMiddleware(app=None, settings=production_settings)
        
        request = create_mock_request("GET", "/api/v1/test", {"User-Agent": "test-client"})
        response = await middleware.dispatch(request, dummy_call_next)
        
        csp_header = response.headers.get("Content-Security-Policy")
        assert csp_header is not None
        assert "default-src 'self'" in csp_header
        assert "script-src 'self'" in csp_header  # No unsafe-inline in production
        assert "upgrade-insecure-requests" in csp_header


class TestRateLimitingMiddleware:
    """Test rate limiting middleware."""
    
    @pytest.fixture
    def rate_limit_settings(self):
        return Settings(
            secret_key="test_secret_key_at_least_32_chars_long",
            rate_limit_requests=5,
            rate_limit_window=60
        )
    
    @pytest.mark.asyncio
    async def test_rate_limiting_allows_under_limit(self, rate_limit_settings):
        """Test that requests under the rate limit are allowed."""
        middleware = RateLimitingMiddleware(app=None, settings=rate_limit_settings)
        
        # Make requests under the limit
        for i in range(4):
            request = create_mock_request("GET", "/api/v1/test", {"User-Agent": "test-client"})
            response = await middleware.dispatch(request, dummy_call_next)
            assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_rate_limiting_blocks_over_limit(self, rate_limit_settings):
        """Test that requests over the rate limit are blocked."""
        middleware = RateLimitingMiddleware(app=None, settings=rate_limit_settings)
        
        # Fill up the rate limit
        for i in range(5):
            request = create_mock_request("GET", "/api/v1/test", {"User-Agent": "test-client"})
            response = await middleware.dispatch(request, dummy_call_next)
            assert response.status_code == 200
        
        # Next request should be blocked
        request = create_mock_request("GET", "/api/v1/test", {"User-Agent": "test-client"})
        response = await middleware.dispatch(request, dummy_call_next)
        assert response.status_code == 429
        assert "Retry-After" in response.headers
    
    @pytest.mark.asyncio
    async def test_rate_limiting_per_ip(self, rate_limit_settings):
        """Test that rate limiting is applied per client IP."""
        middleware = RateLimitingMiddleware(app=None, settings=rate_limit_settings)
        
        # Fill rate limit for first IP
        for i in range(5):
            request = create_mock_request("GET", "/api/v1/test", 
                                        {"User-Agent": "test-client"}, 
                                        client_ip="192.168.1.1")
            response = await middleware.dispatch(request, dummy_call_next)
            assert response.status_code == 200
        
        # First IP should be blocked
        request = create_mock_request("GET", "/api/v1/test", 
                                    {"User-Agent": "test-client"}, 
                                    client_ip="192.168.1.1")
        response = await middleware.dispatch(request, dummy_call_next)
        assert response.status_code == 429
        
        # Second IP should still be allowed
        request = create_mock_request("GET", "/api/v1/test", 
                                    {"User-Agent": "test-client"}, 
                                    client_ip="192.168.1.2")
        response = await middleware.dispatch(request, dummy_call_next)
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_rate_limiting_cleanup(self, rate_limit_settings):
        """Test that old rate limiting entries are cleaned up."""
        middleware = RateLimitingMiddleware(app=None, settings=rate_limit_settings)
        
        # Add some requests
        request = create_mock_request("GET", "/api/v1/test", {"User-Agent": "test-client"})
        await middleware.dispatch(request, dummy_call_next)
        
        # Mock time to simulate passage of time
        with patch('time.time') as mock_time:
            mock_time.return_value = time.time() + 120  # 2 minutes later
            
            # This should trigger cleanup and allow the request
            response = await middleware.dispatch(request, dummy_call_next)
            assert response.status_code == 200


class TestEnhancedRequestValidation:
    """Test enhanced request validation middleware."""
    
    @pytest.fixture
    def production_validation_settings(self):
        return Settings(
            environment=Environment.PRODUCTION,
            secret_key="test_secret_key_at_least_32_chars_long",
            api_v1_str="/api/v1"
        )
    
    @pytest.fixture
    def development_validation_settings(self):
        return Settings(
            environment=Environment.DEVELOPMENT,
            secret_key="test_secret_key_at_least_32_chars_long",
            api_v1_str="/api/v1"
        )
    
    @pytest.mark.asyncio
    async def test_suspicious_path_blocking(self, production_validation_settings):
        """Test that suspicious paths are blocked."""
        with patch("app.api.middleware.validation.get_metrics") as mock_get_metrics:
            mock_get_metrics.return_value = {
                "http_request_duration_seconds": MagicMock(),
                "http_requests": MagicMock()
            }
            
            middleware = RequestValidationMiddleware(app=None, settings=production_validation_settings)
            
            request = create_mock_request("GET", "/.env", {"User-Agent": "test-client"})
            response = await middleware.dispatch(request, dummy_call_next)
            
            assert response.status_code == 403
            response_data = json.loads(response.body)
            assert response_data["detail"] == "Access forbidden"
    
    @pytest.mark.asyncio
    async def test_malicious_user_agent_blocking(self, production_validation_settings):
        """Test that malicious user agents are blocked."""
        with patch("app.api.middleware.validation.get_metrics") as mock_get_metrics:
            mock_get_metrics.return_value = {
                "http_request_duration_seconds": MagicMock(),
                "http_requests": MagicMock()
            }
            
            middleware = RequestValidationMiddleware(app=None, settings=production_validation_settings)
            
            request = create_mock_request("GET", "/api/v1/test", {"User-Agent": "sqlmap/1.0"})
            response = await middleware.dispatch(request, dummy_call_next)
            
            assert response.status_code == 400
            response_data = json.loads(response.body)
            assert response_data["detail"] == "Invalid User-Agent"
    
    @pytest.mark.asyncio
    async def test_security_threat_detection_in_production(self, production_validation_settings):
        """Test that security threats in request body are detected in production."""
        with patch("app.api.middleware.validation.get_metrics") as mock_get_metrics:
            mock_get_metrics.return_value = {
                "http_request_duration_seconds": MagicMock(),
                "http_requests": MagicMock()
            }
            
            middleware = RequestValidationMiddleware(app=None, settings=production_validation_settings)
            
            malicious_body = json.dumps({
                "email": "test@test.com' OR 1=1--",
                "comment": "<script>alert('xss')</script>"
            }).encode('utf-8')
            
            headers = {
                "User-Agent": "test-client",
                "Content-Type": "application/json",
                "Content-Length": str(len(malicious_body))
            }
            
            request = create_mock_request("POST", "/api/v1/test", headers, malicious_body)
            response = await middleware.dispatch(request, dummy_call_next)
            
            assert response.status_code == 400
            response_data = json.loads(response.body)
            assert response_data["detail"] == "Invalid request data"
    
    @pytest.mark.asyncio
    async def test_security_threats_allowed_in_development(self, development_validation_settings):
        """Test that security threats are not blocked in development."""
        with patch("app.api.middleware.validation.get_metrics") as mock_get_metrics:
            mock_get_metrics.return_value = {
                "http_request_duration_seconds": MagicMock(),
                "http_requests": MagicMock()
            }
            
            middleware = RequestValidationMiddleware(app=None, settings=development_validation_settings)
            
            malicious_body = json.dumps({
                "email": "test@test.com' OR 1=1--",
                "comment": "<script>alert('xss')</script>"
            }).encode('utf-8')
            
            headers = {
                "User-Agent": "test-client",
                "Content-Type": "application/json",
                "Content-Length": str(len(malicious_body))
            }
            
            request = create_mock_request("POST", "/api/v1/test", headers, malicious_body)
            response = await middleware.dispatch(request, dummy_call_next)
            
            # Should be allowed in development
            assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_request_size_limits(self, production_validation_settings):
        """Test that oversized requests are rejected."""
        with patch("app.api.middleware.validation.get_metrics") as mock_get_metrics:
            mock_get_metrics.return_value = {
                "http_request_duration_seconds": MagicMock(),
                "http_requests": MagicMock()
            }
            
            middleware = RequestValidationMiddleware(app=None, settings=production_validation_settings)
            
            # Create a large payload
            large_payload = "x" * (11 * 1024 * 1024)  # 11MB, over the 10MB limit
            
            headers = {
                "User-Agent": "test-client",
                "Content-Type": "application/json",
                "Content-Length": str(len(large_payload))
            }
            
            request = create_mock_request("POST", "/api/v1/test", headers, large_payload.encode())
            response = await middleware.dispatch(request, dummy_call_next)
            
            assert response.status_code == 413
            response_data = json.loads(response.body)
            assert response_data["detail"] == "Request entity too large"


class TestEnvironmentSpecificCORSValidation:
    """Test CORS validation in different environments."""
    
    def test_production_cors_https_requirement(self):
        """Test that production CORS requires HTTPS origins."""
        with pytest.raises(ValueError, match="Production CORS origins must use HTTPS"):
            Settings(
                environment=Environment.PRODUCTION,
                secret_key="test_secret_key_at_least_32_chars_long",
                cors_origins=["http://insecure.com"]
            )
    
    def test_production_cors_wildcard_blocked(self):
        """Test that production CORS blocks wildcard origins."""
        with pytest.raises(ValueError, match="Wildcard CORS origins .* are not allowed in production"):
            Settings(
                environment=Environment.PRODUCTION,
                secret_key="test_secret_key_at_least_32_chars_long",
                cors_origins=["*"]
            )
    
    def test_development_cors_allows_http(self):
        """Test that development CORS allows HTTP origins."""
        settings = Settings(
            environment=Environment.DEVELOPMENT,
            secret_key="test_secret_key_at_least_32_chars_long",
            cors_origins=["http://localhost:3000"]
        )
        assert "http://localhost:3000/" in settings.cors_origins
    
    def test_production_cors_allows_https(self):
        """Test that production CORS allows HTTPS origins."""
        settings = Settings(
            environment=Environment.PRODUCTION,
            secret_key="test_secret_key_at_least_32_chars_long",
            cors_origins=["https://secure.com"]
        )
        assert "https://secure.com/" in settings.cors_origins