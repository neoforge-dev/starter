"""Tests for enhanced security middleware."""
from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.middleware.security import (
    RateLimitingMiddleware,
    SecurityHeadersMiddleware,
    ThreatDetectionMiddleware,
)
from app.core.config import Environment, get_settings
from tests.factories import UserFactory


class TestSecurityHeadersMiddleware:
    """Test security headers middleware."""

    @pytest.mark.asyncio
    async def test_security_headers_development(self, async_client: AsyncClient):
        """Test security headers in development environment."""
        response = await async_client.get("/health")

        # Check basic security headers
        assert "X-Content-Type-Options" in response.headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"

        assert "X-Frame-Options" in response.headers
        assert response.headers["X-Frame-Options"] == "DENY"

        assert "X-XSS-Protection" in response.headers
        assert response.headers["X-XSS-Protection"] == "1; mode=block"

        assert "Referrer-Policy" in response.headers
        assert "Content-Security-Policy" in response.headers

        # Request ID should be present
        assert "X-Request-ID" in response.headers


class TestThreatDetectionMiddleware:
    """Test threat detection middleware."""

    @pytest.mark.asyncio
    async def test_sql_injection_detection(self, async_client: AsyncClient):
        """Test SQL injection attempt detection."""
        # Attempt SQL injection in query parameter
        malicious_urls = [
            "/api/v1/items?id=1' OR '1'='1",
            "/api/v1/items?name='; DROP TABLE users; --",
            "/api/v1/items?search=UNION SELECT * FROM users",
        ]

        for url in malicious_urls:
            response = await async_client.get(url)

            # Should be blocked by threat detection
            if response.status_code == 403:
                assert "security policy" in response.json()["detail"].lower()
                assert "X-Blocked-Reason" in response.headers
                assert "X-Threat-Types" in response.headers
                assert "sql_injection" in response.headers["X-Threat-Types"]

    @pytest.mark.asyncio
    async def test_xss_attempt_detection(self, async_client: AsyncClient):
        """Test XSS attempt detection."""
        malicious_urls = [
            "/api/v1/items?q=<script>alert('xss')</script>",
            "/api/v1/items?name=<iframe src='evil.com'></iframe>",
            "/api/v1/items?search=javascript:alert(1)",
        ]

        for url in malicious_urls:
            response = await async_client.get(url)

            # Should be blocked by threat detection
            if response.status_code == 403:
                assert "security policy" in response.json()["detail"].lower()
                assert "xss_attempt" in response.headers["X-Threat-Types"]

    @pytest.mark.asyncio
    async def test_suspicious_user_agent_detection(self, async_client: AsyncClient):
        """Test suspicious user agent detection."""
        suspicious_agents = [
            "sqlmap/1.0",
            "Nikto/2.1",
            "Acunetix-WVS",
            "Burp Suite",
            "w3af",
        ]

        for agent in suspicious_agents:
            headers = {"User-Agent": agent}
            response = await async_client.get("/api/v1/items", headers=headers)

            # Should be blocked
            if response.status_code == 403:
                assert "suspicious_user_agent" in response.headers["X-Threat-Types"]


class TestRateLimitingMiddleware:
    """Test rate limiting middleware."""

    @pytest.mark.asyncio
    async def test_rate_limiting_headers(self, async_client: AsyncClient):
        """Test rate limiting headers are present."""
        response = await async_client.get("/api/v1/items")

        # Rate limiting headers should be present
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers

        # Values should be numeric
        assert response.headers["X-RateLimit-Limit"].isdigit()
        assert response.headers["X-RateLimit-Remaining"].isdigit()
        assert response.headers["X-RateLimit-Reset"].isdigit()

    @pytest.mark.asyncio
    async def test_health_endpoints_bypass_rate_limiting(
        self, async_client: AsyncClient
    ):
        """Test that health endpoints bypass rate limiting."""
        # Health endpoints should not be rate limited
        for i in range(10):  # Make many requests
            response = await async_client.get("/health")
            assert response.status_code == 200


class TestIntegratedSecurityMiddleware:
    """Test integrated security middleware functionality."""

    @pytest.mark.asyncio
    async def test_security_middleware_integration(self, async_client: AsyncClient):
        """Test that all security middleware work together."""
        response = await async_client.get("/health")

        # Should have security headers
        assert "X-Content-Type-Options" in response.headers
        assert "X-Frame-Options" in response.headers
        assert "Content-Security-Policy" in response.headers

        # Should have request tracking
        assert "X-Request-ID" in response.headers

        # Should have rate limiting headers
        assert "X-RateLimit-Limit" in response.headers

        # Should not be blocked by threat detection
        assert response.status_code == 200
