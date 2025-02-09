"""Test API middleware functionality."""
import asyncio
import jwt
import time
from typing import AsyncGenerator
from datetime import datetime, timedelta, UTC

import pytest
import pytest_asyncio
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from httpx import AsyncClient, ASGITransport
from redis.asyncio import Redis

from app.core.config import settings
from app.api.middleware.security import SecurityHeadersMiddleware
from app.api.middleware.validation import RequestValidationMiddleware
from app.api.middleware.rate_limit import RateLimitMiddleware
from tests.factories import UserFactory
from app.main import app

pytestmark = pytest.mark.asyncio


@pytest.fixture
async def redis() -> AsyncGenerator[Redis, None]:
    """Create Redis client for testing."""
    client = Redis.from_url(settings.redis_url)
    try:
        # Clear Redis before each test
        await client.flushdb()
        yield client
    finally:
        await client.aclose()


@pytest.fixture
def app_with_middleware() -> FastAPI:
    """Create test FastAPI application with middleware."""
    app = FastAPI()
    
    @app.get("/test")
    async def test_endpoint():
        return {"message": "success"}
    
    @app.get("/error")
    async def error_endpoint():
        raise ValueError("Test error")
        
    @app.get("/health")
    async def health_endpoint():
        return {"status": "ok"}
    
    return app


@pytest.fixture
def valid_jwt_token() -> str:
    """Generate a valid JWT token for testing."""
    payload = {
        "sub": "test-client",
        "exp": datetime.now(UTC) + timedelta(minutes=5)
    }
    return jwt.encode(
        payload, 
        settings.secret_key.get_secret_value(),
        algorithm=settings.algorithm
    )


async def test_error_handler_middleware(client: AsyncClient):
    """Test error handling middleware."""
    # Test successful request
    response = await client.get("/health")  # Use existing health endpoint
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert data["database_status"] == "healthy"
    assert data["redis_status"] == "healthy"

@pytest.mark.slow
async def test_rate_limit_middleware_unauthenticated(
    app_with_middleware: FastAPI,
    redis: Redis,
):
    """Test rate limiting for unauthenticated requests."""
    # Set lower rate limit for testing
    settings.rate_limit_requests = 5
    settings.rate_limit_window = 60

    # Clear Redis before test
    await redis.flushdb()

    # Add middleware with Redis client
    app_with_middleware.add_middleware(RateLimitMiddleware, redis_client=redis)

    # Create a new client using ASGITransport
    transport = ASGITransport(app=app_with_middleware)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Make requests up to the limit
        for i in range(settings.rate_limit_requests):
            response = await client.get("/test")
            assert response.status_code == 200, f"Request {i+1} failed unexpectedly"

            # Verify rate limit headers are present on each request
            assert "X-RateLimit-Limit" in response.headers
            assert "X-RateLimit-Remaining" in response.headers
            assert int(response.headers["X-RateLimit-Remaining"]) == settings.rate_limit_requests - (i + 1)

        # Wait a short time to ensure Redis has processed everything
        await asyncio.sleep(0.1)

        # Next request should be rate limited
        response = await client.get("/test")
        assert response.status_code == 429
        error_data = response.json()
        assert error_data["detail"] == "Too Many Requests"
        
        # Verify rate limit headers in error response
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert int(response.headers["X-RateLimit-Remaining"]) == 0
        assert "Retry-After" in response.headers
        assert int(response.headers["Retry-After"]) > 0


@pytest.mark.slow
async def test_rate_limit_middleware_authenticated(
    app_with_middleware: FastAPI,
    redis: Redis,
    valid_jwt_token: str  # Add fixture for valid token
):
    """Test authenticated requests bypass rate limits."""
    # Set up middleware with Redis
    app_with_middleware.add_middleware(RateLimitMiddleware, redis_client=redis)
    
    transport = ASGITransport(app=app_with_middleware)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Make 10 requests with valid token (well above unauthenticated limit)
        for i in range(10):
            response = await client.get(
                "/test",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            )
            assert response.status_code == 200, f"Request {i+1} failed"
            
            # Verify rate limit headers are NOT present
            assert "X-RateLimit-Limit" not in response.headers
            assert "X-RateLimit-Remaining" not in response.headers


async def test_rate_limit_middleware_ip_based(
    app_with_middleware: FastAPI,
    redis: Redis,
):
    """Test IP-based rate limiting."""
    # Set lower rate limit for testing
    settings.rate_limit_requests = 5
    settings.rate_limit_window = 60

    # Clear Redis before test
    await redis.flushdb()

    # Add middleware with Redis client
    app_with_middleware.add_middleware(RateLimitMiddleware, redis_client=redis)
    
    # Create a new AsyncClient after adding middleware and route
    transport = ASGITransport(app=app_with_middleware)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Make requests up to the limit
        for _ in range(settings.rate_limit_requests):
            response = await client.get("/test")
            assert response.status_code == 200

        # Next request should be rate limited
        response = await client.get("/test")
        assert response.status_code == 429
        await client.aclose()


@pytest.mark.slow
async def test_rate_limit_window_reset(app_with_middleware: FastAPI, redis: Redis):
    """Test rate limit window reset."""
    # Set lower rate limit for testing
    settings.rate_limit_requests = 5
    settings.rate_limit_window = 1  # 1 second window for faster test

    # Clear Redis before test
    await redis.flushdb()

    # Add middleware with Redis client
    app_with_middleware.add_middleware(RateLimitMiddleware, redis_client=redis)

    # Create a new AsyncClient after adding middleware and route
    transport = ASGITransport(app=app_with_middleware)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Make requests up to the rate limit
        for _ in range(settings.rate_limit_requests):
            response = await client.get("/test")
            assert response.status_code == 200

        # Next request should be rate limited
        response = await client.get("/test")
        assert response.status_code == 429

        # Wait for the rate limit window to reset
        await asyncio.sleep(settings.rate_limit_window)

        # After the window reset, request should be accepted
        response = await client.get("/test")
        assert response.status_code == 200

        await client.aclose()


@pytest.mark.slow
async def test_rate_limit_bypass_health_check(
    app_with_middleware: FastAPI,
    client: AsyncClient,
    redis: Redis,
):
    """Test that health check endpoints bypass rate limiting."""
    # Add middleware with Redis client
    app_with_middleware.add_middleware(RateLimitMiddleware, redis_client=redis)
    
    # Make many requests to health check
    for _ in range(settings.rate_limit_requests * 2):
        response = await client.get("/health")
        assert response.status_code == 200


async def test_rate_limit_middleware_invalid_token(app_with_middleware: FastAPI, redis: Redis):
    """Test rate limiting with invalid JWT token."""
    # Set lower rate limit for testing
    settings.rate_limit_requests = 5
    settings.rate_limit_window = 60

    # Clear Redis before test
    await redis.flushdb()

    # Add middleware with Redis client
    app_with_middleware.add_middleware(RateLimitMiddleware, redis_client=redis)

    # Create a new AsyncClient after adding middleware and route
    transport = ASGITransport(app=app_with_middleware)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer invalid.token.here"}
        # Should fall back to unauthenticated rate limit
        for _ in range(settings.rate_limit_requests):
            response = await client.get("/test", headers=headers)
            assert response.status_code == 200
        response = await client.get("/test", headers=headers)
        assert response.status_code == 429
        await client.aclose()


async def test_rate_limit_middleware_redis_error(
    app_with_middleware: FastAPI,
    client: AsyncClient,
    redis: Redis,
):
    """Test behavior when Redis is unavailable."""
    # Add middleware with invalid Redis client to simulate Redis being down
    app_with_middleware.add_middleware(RateLimitMiddleware, redis_client=None)
    
    # Make many requests - they should all succeed since Redis is down
    for _ in range(settings.rate_limit_requests * 2):
        response = await client.get("/test")
        assert response.status_code == 200


async def test_error_handler_middleware_validation_error(client: AsyncClient, superuser_headers: dict):
    """Test handling of validation errors."""
    # Send request to an endpoint that requires validation
    response = await client.post("/api/v1/users/", json={}, headers=superuser_headers)  # Missing required fields
    assert response.status_code == 422  # Validation error
    data = response.json()
    assert "detail" in data
    assert isinstance(data["detail"], list)  # Validation errors are returned as a list
    assert len(data["detail"]) > 0  # Should have at least one validation error


async def test_error_handler_middleware_database_error(client: AsyncClient, regular_user_headers: dict):
    """Test handling of database errors."""
    # Send request to an endpoint that requires database access with a non-existent ID
    response = await client.get("/api/v1/users/999999", headers=regular_user_headers)
    assert response.status_code == 404  # Not found error
    data = response.json()
    assert "detail" in data


async def test_rate_limit_middleware_no_redis_connection(
    app_with_middleware: FastAPI,
    client: AsyncClient,
):
    """Test behavior when Redis connection fails."""
    # Add test route to main app
    @app.get("/test_no_redis")
    async def test_route():
        return {"message": "success"}
    
    # Set invalid Redis URL
    settings.redis_url = "redis://invalid:6379/0"
    
    # Should still allow requests
    response = await client.get("/test_no_redis")
    assert response.status_code == 200
    assert response.json() == {"message": "success"} 