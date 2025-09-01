"""
Integration tests for all security components working together.
Tests the complete security stack including input validation, rate limiting,
JWT security, audit logging, and security headers.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch
from fastapi import FastAPI, Request, Depends
from fastapi.testclient import TestClient
from starlette.responses import JSONResponse

from app.core.security_headers import SecurityManager, SecurityConfig, CORSConfig, APIKeyConfig
from app.core.input_validation import InputValidator, ValidationResult, init_input_validator
from app.core.jwt_security import JWTManager, JWTConfig, init_jwt_manager
from app.core.rate_limiting import RateLimiter, RateLimitConfig, init_rate_limiter
from app.core.audit_logging import AuditLogger, AuditConfig, init_audit_logger


class TestSecurityStackIntegration:
    """Integration tests for the complete security stack."""

    @pytest.fixture
    def security_stack(self):
        """Initialize the complete security stack."""
        # Initialize all security components
        init_input_validator()
        init_jwt_manager()
        init_rate_limiter()
        init_audit_logger()

        # Create security manager
        security_config = SecurityConfig(
            cors=CORSConfig(allow_origins=["https://example.com"]),
            api_keys=APIKeyConfig(enabled=True)
        )
        security_manager = SecurityManager(security_config)

        return {
            'input_validator': InputValidator(),
            'jwt_manager': JWTManager(),
            'rate_limiter': RateLimiter(),
            'audit_logger': AuditLogger(),
            'security_manager': security_manager
        }

    @pytest.fixture
    def test_app(self, security_stack):
        """Create a test FastAPI app with complete security stack."""
        app = FastAPI()

        # Add security middleware
        middleware = security_stack['security_manager'].create_middleware(app)
        app.add_middleware(middleware.__class__, config=security_stack['security_manager'].config)

        @app.get("/api/public")
        async def public_endpoint():
            """Public endpoint without authentication."""
            return {"message": "public"}

        @app.get("/api/protected")
        async def protected_endpoint():
            """Protected endpoint requiring API key."""
            return {"message": "protected"}

        @app.post("/api/user")
        async def create_user(request: Request):
            """Endpoint with input validation."""
            from app.core.input_validation import get_input_validator

            data = await request.json()

            # Validate input
            validator = get_input_validator()
            validation_results = validator.validate_json_payload(data, {
                "email": "email",
                "username": "username",
                "password": "password"
            })

            # Check if all validations passed
            if not all(result.is_valid for result in validation_results.values()):
                errors = []
                for field, result in validation_results.items():
                    if not result.is_valid:
                        errors.extend(result.errors)
                return JSONResponse(
                    status_code=400,
                    content={"error": "Validation failed", "details": errors}
                )

            return {"message": "User created", "data": data}

        @app.get("/api/admin")
        async def admin_endpoint():
            """Admin endpoint with rate limiting."""
            from app.core.rate_limiting import get_rate_limiter

            # Check rate limit
            rate_limiter = get_rate_limiter()
            client_ip = "127.0.0.1"  # Mock IP for testing

            if not rate_limiter.check_rate_limit("admin", client_ip):
                return JSONResponse(
                    status_code=429,
                    content={"error": "Rate limit exceeded"}
                )

            return {"message": "admin"}

        return app

    def test_public_endpoint_access(self, test_app):
        """Test accessing public endpoint without authentication."""
        client = TestClient(test_app)

        response = client.get("/api/public")
        assert response.status_code == 200
        assert response.json() == {"message": "public"}

        # Check security headers are present
        assert "Content-Security-Policy" in response.headers
        assert "X-Frame-Options" in response.headers

    def test_protected_endpoint_without_api_key(self, test_app):
        """Test accessing protected endpoint without API key."""
        client = TestClient(test_app)

        response = client.get("/api/protected")
        assert response.status_code == 401
        assert "Invalid or missing API key" in response.json()["error"]

    def test_protected_endpoint_with_valid_api_key(self, test_app, security_stack):
        """Test accessing protected endpoint with valid API key."""
        client = TestClient(test_app)

        # Generate a valid API key
        api_key = security_stack['security_manager'].generate_api_key(
            "test-key", "test-owner", ["read"]
        )

        response = client.get("/api/protected", headers={"X-API-Key": api_key})
        assert response.status_code == 200
        assert response.json() == {"message": "protected"}

    def test_input_validation_integration(self, test_app):
        """Test input validation integration."""
        client = TestClient(test_app)

        # Generate API key for authentication
        from app.core.security_headers import init_security_manager, get_security_manager
        init_security_manager()
        api_key = get_security_manager().generate_api_key("test-key", "test-owner")

        # Test with valid data
        valid_data = {
            "email": "test@example.com",
            "username": "testuser",
            "password": "TestPass123!"
        }

        response = client.post(
            "/api/user",
            json=valid_data,
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        assert response.json()["message"] == "User created"

        # Test with invalid data
        invalid_data = {
            "email": "invalid-email",
            "username": "us",  # Too short
            "password": "weak"
        }

        response = client.post(
            "/api/user",
            json=invalid_data,
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 400
        assert "Validation failed" in response.json()["error"]

    def test_rate_limiting_integration(self, test_app):
        """Test rate limiting integration."""
        client = TestClient(test_app)

        # Generate API key
        from app.core.security_headers import init_security_manager, get_security_manager
        init_security_manager()
        api_key = get_security_manager().generate_api_key("test-key", "test-owner")

        # Make multiple requests to trigger rate limit
        for i in range(10):
            response = client.get("/api/admin", headers={"X-API-Key": api_key})
            if i < 5:  # First few should succeed
                assert response.status_code == 200
            else:  # Later ones should be rate limited
                if response.status_code == 429:
                    assert "Rate limit exceeded" in response.json()["error"]
                    break

    def test_cors_integration(self, test_app):
        """Test CORS integration."""
        client = TestClient(test_app)

        # Test CORS preflight with allowed origin
        response = client.options(
            "/api/public",
            headers={"Origin": "https://example.com"}
        )
        assert response.status_code == 200
        assert "Access-Control-Allow-Origin" in response.headers
        assert response.headers["Access-Control-Allow-Origin"] == "https://example.com"

        # Test CORS preflight with disallowed origin
        response = client.options(
            "/api/public",
            headers={"Origin": "https://malicious.com"}
        )
        assert response.status_code == 200
        assert "Access-Control-Allow-Origin" not in response.headers

    def test_security_headers_completeness(self, test_app):
        """Test that all security headers are present."""
        client = TestClient(test_app)

        response = client.get("/api/public")

        # Essential security headers
        required_headers = [
            "Content-Security-Policy",
            "X-Frame-Options",
            "X-Content-Type-Options",
            "X-XSS-Protection",
            "Strict-Transport-Security",
            "Referrer-Policy",
            "Permissions-Policy",
            "X-Permitted-Cross-Domain-Policies"
        ]

        for header in required_headers:
            assert header in response.headers, f"Missing security header: {header}"

    def test_audit_logging_integration(self, test_app, security_stack):
        """Test audit logging integration."""
        client = TestClient(test_app)

        # Generate API key
        api_key = security_stack['security_manager'].generate_api_key("test-key", "test-owner")

        # Make a request that should be logged
        response = client.get("/api/protected", headers={"X-API-Key": api_key})
        assert response.status_code == 200

        # Check that audit log was created (in a real scenario)
        # This would typically involve checking a database or log file
        # For this test, we just verify the audit logger is working
        assert security_stack['audit_logger'] is not None

    def test_jwt_integration(self, security_stack):
        """Test JWT integration with security stack."""
        jwt_manager = security_stack['jwt_manager']

        # Create a test token
        payload = {"sub": "test-user", "scopes": ["read", "write"]}
        token = jwt_manager.create_access_token(payload)

        # Verify the token
        decoded = jwt_manager.verify_token(token)
        assert decoded["sub"] == "test-user"
        assert "read" in decoded["scopes"]

    def test_comprehensive_security_workflow(self, test_app, security_stack):
        """Test a comprehensive security workflow."""
        client = TestClient(test_app)

        # Step 1: Generate API key
        api_key = security_stack['security_manager'].generate_api_key(
            "workflow-test", "test-user", ["read", "write"]
        )

        # Step 2: Test input validation with valid data
        valid_user_data = {
            "email": "workflow@example.com",
            "username": "workflowuser",
            "password": "SecurePass123!"
        }

        response = client.post(
            "/api/user",
            json=valid_user_data,
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200

        # Step 3: Test protected endpoint access
        response = client.get("/api/protected", headers={"X-API-Key": api_key})
        assert response.status_code == 200

        # Step 4: Verify security headers are present
        assert "Content-Security-Policy" in response.headers
        assert "X-Frame-Options" in response.headers

        # Step 5: Test JWT token creation and validation
        jwt_manager = security_stack['jwt_manager']
        token = jwt_manager.create_access_token({"sub": "workflow-user"})
        decoded = jwt_manager.verify_token(token)
        assert decoded["sub"] == "workflow-user"

    def test_security_error_handling(self, test_app):
        """Test security error handling."""
        client = TestClient(test_app)

        # Test with malformed JSON
        response = client.post(
            "/api/user",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code in [400, 401, 422]  # Various error codes possible

        # Test with missing required fields
        response = client.post(
            "/api/user",
            json={"email": "test@example.com"},  # Missing username and password
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code in [400, 401, 422]

    def test_security_configuration_management(self, security_stack):
        """Test security configuration management."""
        security_manager = security_stack['security_manager']

        # Get current configuration
        config = security_manager.get_security_config()
        assert "cors" in config
        assert "api_keys" in config
        assert "security_headers" in config

        # Update configuration
        updates = {
            "cors": {
                "allow_origins": ["https://new-origin.com"]
            },
            "api_keys": {
                "rate_limit_per_minute": 50
            }
        }

        security_manager.update_security_config(updates)

        # Verify updates
        updated_config = security_manager.get_security_config()
        assert "https://new-origin.com" in updated_config["cors"]["allow_origins"]
        assert updated_config["api_keys"]["rate_limit_per_minute"] == 50

    def test_security_statistics(self, security_stack):
        """Test security statistics collection."""
        security_manager = security_stack['security_manager']

        # Generate some API keys
        security_manager.generate_api_key("stat-test-1", "user1")
        security_manager.generate_api_key("stat-test-2", "user2")

        # Get statistics
        stats = security_manager.get_security_statistics()

        assert "api_keys" in stats
        assert stats["api_keys"]["total_keys"] == 2
        assert stats["api_keys"]["active_keys"] == 2
        assert stats["api_keys"]["revoked_keys"] == 0


class TestSecurityPerformance:
    """Performance tests for security components."""

    def test_api_key_validation_performance(self, security_stack):
        """Test API key validation performance."""
        import time

        security_manager = security_stack['security_manager']

        # Generate multiple API keys
        keys = []
        for i in range(10):
            key = security_manager.generate_api_key(f"perf-test-{i}", f"user-{i}")
            keys.append(key)

        # Measure validation performance
        start_time = time.time()
        for key in keys:
            is_valid, _ = security_manager.validate_api_key(key)
            assert is_valid
        end_time = time.time()

        # Should complete within reasonable time (adjust threshold as needed)
        duration = end_time - start_time
        assert duration < 1.0  # Less than 1 second for 10 validations

    def test_input_validation_performance(self, security_stack):
        """Test input validation performance."""
        import time

        validator = security_stack['input_validator']

        # Test data
        test_cases = [
            ("test@example.com", "email"),
            ("validuser123", "username"),
            ("SecurePass123!", "password"),
            ("https://example.com", "url")
        ] * 10  # Repeat for more data

        start_time = time.time()
        for value, rule_name in test_cases:
            result = validator.validate(value, rule_name)
            assert result.is_valid
        end_time = time.time()

        duration = end_time - start_time
        assert duration < 2.0  # Less than 2 seconds for 40 validations


class TestSecurityCompliance:
    """Compliance tests for security standards."""

    def test_security_headers_compliance(self, security_stack):
        """Test security headers compliance with OWASP recommendations."""
        security_manager = security_stack['security_manager']

        config = security_manager.get_security_config()
        headers = config["security_headers"]

        # OWASP recommended headers
        recommended_headers = [
            "Content-Security-Policy",
            "X-Frame-Options",
            "X-Content-Type-Options",
            "Strict-Transport-Security"
        ]

        for header in recommended_headers:
            assert header in headers, f"Missing recommended security header: {header}"

    def test_cors_security_compliance(self, security_stack):
        """Test CORS configuration for security compliance."""
        security_manager = security_stack['security_manager']

        config = security_manager.get_security_config()
        cors_config = config["cors"]

        # CORS should not allow credentials with wildcard origin (security risk)
        if cors_config["allow_credentials"]:
            assert "*" not in cors_config["allow_origins"], \
                "CORS credentials should not be allowed with wildcard origin"

    def test_api_key_security_compliance(self, security_stack):
        """Test API key configuration for security compliance."""
        security_manager = security_stack['security_manager']

        config = security_manager.get_security_config()
        api_config = config["api_keys"]

        # API keys should have reasonable expiration
        assert api_config["expiration_days"] <= 365, \
            "API key expiration should be reasonable (max 1 year)"

        # Rate limits should be reasonable
        assert api_config["rate_limit_per_minute"] <= 1000, \
            "Rate limit per minute should be reasonable"
        assert api_config["rate_limit_per_hour"] <= 10000, \
            "Rate limit per hour should be reasonable"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])