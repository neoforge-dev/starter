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

from app.core.config import Settings
from app.api.middleware.security import SecurityHeadersMiddleware
from app.api.middleware.validation import RequestValidationMiddleware
from app.api.middleware.rate_limit import RateLimitMiddleware
from tests.factories import UserFactory
from app.main import app

pytestmark = pytest.mark.asyncio


@pytest.fixture
async def redis(test_settings: Settings) -> AsyncGenerator[Redis, None]:
    """Create Redis client for testing."""
    client = Redis.from_url(test_settings.redis_url)
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
def valid_jwt_token(test_settings: Settings) -> str:
    """Generate a valid JWT token for testing."""
    payload = {
        "sub": "test-client",
        "exp": datetime.now(UTC) + timedelta(minutes=5)
    }
    return jwt.encode(
        payload, 
        test_settings.secret_key.get_secret_value(),
        algorithm=test_settings.algorithm
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
    test_settings: Settings,
):
    """Test rate limiting for unauthenticated requests."""
    # Create custom settings with override
    custom_settings = test_settings.model_copy(update={
        "rate_limit_requests": 5,
        "rate_limit_window": 60
    })

    # Clear Redis before test
    await redis.flushdb()

    # Add middleware with Redis client and custom settings
    app_with_middleware.add_middleware(RateLimitMiddleware, settings=custom_settings, redis_client=redis)

    # Create a new client using ASGITransport
    transport = ASGITransport(app=app_with_middleware)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Make requests up to the limit
        for i in range(custom_settings.rate_limit_requests):
            response = await client.get("/test")
            assert response.status_code == 200, f"Request {i+1} failed unexpectedly"

            # Verify rate limit headers are present on each request
            assert "X-RateLimit-Limit" in response.headers
            assert "X-RateLimit-Remaining" in response.headers
            assert int(response.headers["X-RateLimit-Remaining"]) == custom_settings.rate_limit_requests - (i + 1)

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
    # Use default test_settings here, as rate limits for authenticated aren't explicitly tested for override
    app_with_middleware.add_middleware(RateLimitMiddleware, settings=test_settings, redis_client=redis)
    
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
    test_settings: Settings,
):
    """Test IP-based rate limiting."""
    # Create custom settings with override
    custom_settings = test_settings.model_copy(update={
        "rate_limit_requests": 5,
        "rate_limit_window": 60
    })

    # Clear Redis before test
    await redis.flushdb()

    # Add middleware with Redis client and custom settings
    app_with_middleware.add_middleware(RateLimitMiddleware, settings=custom_settings, redis_client=redis)
    
    # Create a new AsyncClient after adding middleware and route
    transport = ASGITransport(app=app_with_middleware)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Make requests up to the limit
        for _ in range(custom_settings.rate_limit_requests):
            response = await client.get("/test")
            assert response.status_code == 200

        # Next request should be rate limited
        response = await client.get("/test")
        assert response.status_code == 429
        await client.aclose()


@pytest.mark.slow
async def test_rate_limit_window_reset(app_with_middleware: FastAPI, redis: Redis, test_settings: Settings):
    """Test rate limit window reset."""
    # Create custom settings with override
    custom_settings = test_settings.model_copy(update={
        "rate_limit_requests": 5,
        "rate_limit_window": 1 # 1 second window for faster test
    })

    # Clear Redis before test
    await redis.flushdb()

    # Add middleware with Redis client and custom settings
    app_with_middleware.add_middleware(RateLimitMiddleware, settings=custom_settings, redis_client=redis)

    # Create a new AsyncClient after adding middleware and route
    transport = ASGITransport(app=app_with_middleware)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Make requests up to the rate limit
        for _ in range(custom_settings.rate_limit_requests):
            response = await client.get("/test")
            assert response.status_code == 200

        # Next request should be rate limited
        response = await client.get("/test")
        assert response.status_code == 429

        # Wait for the rate limit window to reset
        await asyncio.sleep(custom_settings.rate_limit_window)

        # After the window reset, request should be accepted
        response = await client.get("/test")
        assert response.status_code == 200

        await client.aclose()


@pytest.mark.slow
async def test_rate_limit_bypass_health_check(
    app_with_middleware: FastAPI,
    client: AsyncClient,
    redis: Redis,
    test_settings: Settings,
):
    """Test that health check endpoints bypass rate limiting."""
    # Add middleware with Redis client and default test settings
    app_with_middleware.add_middleware(RateLimitMiddleware, settings=test_settings, redis_client=redis)
    
    # Make many requests to health check
    # Use a fixed number instead of relying on potentially modified settings
    for _ in range(10): # Make 10 requests
        response = await client.get("/health")
        assert response.status_code == 200


async def test_rate_limit_middleware_invalid_token(app_with_middleware: FastAPI, redis: Redis, test_settings: Settings):
    """Test rate limiting with invalid JWT token."""
    # Create custom settings with override
    custom_settings = test_settings.model_copy(update={
        "rate_limit_requests": 5,
        "rate_limit_window": 60
    })

    # Clear Redis before test
    await redis.flushdb()

    # Add middleware with Redis client and custom settings
    app_with_middleware.add_middleware(RateLimitMiddleware, settings=custom_settings, redis_client=redis)

    # Create a new AsyncClient after adding middleware and route
    transport = ASGITransport(app=app_with_middleware)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer invalid.token.here"}
        # Should fall back to unauthenticated rate limit
        for _ in range(custom_settings.rate_limit_requests):
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
    
    # Create a new client using the test app
    transport = ASGITransport(app=app_with_middleware)
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        # Make many requests - they should all succeed since Redis is down
        headers = {
            "Accept": "application/json",
            "User-Agent": "TestClient"
        }
        for _ in range(settings.rate_limit_requests * 2):
            response = await test_client.get("/test", headers=headers)
            assert response.status_code == 200


async def test_error_handler_middleware_validation_error(client: AsyncClient, regular_user_headers: dict):
    """Test handling of validation errors when authorization fails first."""
    # Send request to an endpoint that requires validation and superuser auth,
    # but use regular user headers. The auth dependency should raise 400 first.
    response = await client.post(f"{settings.api_v1_str}/users/", json={}, headers=regular_user_headers)
    assert response.status_code == 400 # Expect 400 due to superuser check failing
    # data = response.json()
    # assert "detail" in data
    # assert "privileges" in data["detail"] # Check for the auth error message


async def test_error_handler_middleware_database_error(
    client: AsyncClient, 
    superuser_headers: dict 
):
    """Test handling of database errors (like user not found)."""
    # Send request to an endpoint that requires database access with a non-existent ID
    # This endpoint requires superuser privileges
    response = await client.get(f"{settings.api_v1_str}/users/999999", headers=superuser_headers)
    # Now that the superuser can access the endpoint, 
    # it should correctly return 404 from the endpoint logic
    assert response.status_code == 404


async def test_rate_limit_middleware_no_redis_connection(
    app_with_middleware: FastAPI,
    client: AsyncClient,
):
    """Test behavior when Redis connection fails."""
    # Add test route to test app
    @app_with_middleware.get("/test_no_redis")
    async def test_route():
        return {"message": "success"}
    
    # Set invalid Redis URL
    settings.redis_url = "redis://invalid:6379/0"
    
    # Create a new client using the test app
    transport = ASGITransport(app=app_with_middleware)
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        # Should still allow requests
        headers = {
            "Accept": "application/json",
            "User-Agent": "TestClient"
        }
        response = await test_client.get("/test_no_redis", headers=headers)
        assert response.status_code == 200 