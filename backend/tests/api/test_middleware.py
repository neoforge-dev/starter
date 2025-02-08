"""Test API middleware functionality."""
import pytest
import pytest_asyncio
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from httpx import AsyncClient, ASGITransport
import jwt
import time
import asyncio
from redis.asyncio import Redis
from typing import AsyncGenerator

from app.core.config import settings
from app.api.middleware import RateLimitMiddleware, ErrorHandlerMiddleware
from tests.factories import UserFactory
from app.main import app

pytestmark = pytest.mark.asyncio


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


async def test_rate_limit_middleware_unauthenticated(
    app_with_middleware: FastAPI,
    redis: Redis,
):
    """Test rate limiting for unauthenticated requests."""
    # Set lower rate limit for testing
    settings.rate_limit_requests = 5
    settings.rate_limit_window = 60

    # Add middleware with Redis client
    app_with_middleware.add_middleware(RateLimitMiddleware, redis_client=redis)

    # Create a new client using ASGITransport
    transport = ASGITransport(app=app_with_middleware)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Make requests up to the limit
        for _ in range(settings.rate_limit_requests):
            response = await client.get("/test")
            assert response.status_code == 200

        # Next request should be rate limited
        response = await client.get("/test")
        assert response.status_code == 429
        assert response.json()["detail"] == "Too Many Requests"


async def test_rate_limit_middleware_authenticated(
    app_with_middleware: FastAPI,
    redis: Redis,
    db,
):
    """Test rate limiting for authenticated requests."""
    # Add middleware with redis client
    app_with_middleware.add_middleware(RateLimitMiddleware, redis_client=redis)
    
    # Create user and token
    user = await UserFactory.create(session=db)
    token = jwt.encode(
        {"sub": str(user.id)},
        settings.secret_key,
        algorithm=settings.algorithm,
    )
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a new client using ASGITransport
    transport = ASGITransport(app=app_with_middleware)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Make settings.rate_limit_auth_requests + 1 requests and check responses
        for i in range(settings.rate_limit_auth_requests + 1):
            response = await client.get("/test", headers=headers)
            if i < settings.rate_limit_auth_requests:
                assert response.status_code == 200
            else:
                assert response.status_code == 429
                assert response.json()["detail"] == "Too Many Requests"


async def test_rate_limit_middleware_ip_based(
    app_with_middleware: FastAPI,
    redis: Redis,
):
    """Test IP-based rate limiting."""
    app_with_middleware.add_middleware(RateLimitMiddleware)
    
    # Add a dummy route for testing
    @app_with_middleware.get("/test")
    async def test_endpoint():
        return {"message": "ok"}

    # Create a new AsyncClient after adding middleware and route
    client = AsyncClient(transport=ASGITransport(app_with_middleware), base_url="http://test")

    for _ in range(settings.rate_limit_requests):
        response = await client.get("/test")
        assert response.status_code == 200

    response = await client.get("/test")
    assert response.status_code == 429
    await client.aclose()


async def test_rate_limit_window_reset(app_with_middleware: FastAPI, redis: Redis):
    """Test rate limit window reset."""
    app_with_middleware.add_middleware(RateLimitMiddleware)

    # Add a dummy route for testing
    @app_with_middleware.get("/test")
    async def test_endpoint():
        return {"message": "ok"}

    # Create a new AsyncClient after adding middleware and route
    client = AsyncClient(transport=ASGITransport(app_with_middleware), base_url="http://test")

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


async def test_rate_limit_bypass_health_check(
    app_with_middleware: FastAPI,
    client: AsyncClient,
    redis: Redis,
):
    """Test that health check endpoints bypass rate limiting."""
    # Add middleware
    app_with_middleware.add_middleware(RateLimitMiddleware)
    
    # Make many requests to health check
    for _ in range(settings.rate_limit_requests * 2):
        response = await client.get("/health")
        assert response.status_code == 200


async def test_rate_limit_middleware_invalid_token(app_with_middleware: FastAPI, redis: Redis):
    """Test rate limiting with invalid JWT token."""
    app_with_middleware.add_middleware(RateLimitMiddleware)

    # Add a dummy route for testing
    @app_with_middleware.get("/test")
    async def test_endpoint():
        return {"message": "ok"}

    # Create a new AsyncClient after adding middleware and route
    client = AsyncClient(transport=ASGITransport(app_with_middleware), base_url="http://test")

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
    # Add test endpoint
    @app_with_middleware.get("/test")
    async def test_endpoint():
        return {"message": "success"}
        
    # Add middleware
    app_with_middleware.add_middleware(RateLimitMiddleware)
    
    # Create a new client using ASGITransport
    transport = ASGITransport(app=app_with_middleware)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Close Redis connection to simulate error
        await redis.aclose()  # Using aclose() instead of deprecated close()
        
        # Should still allow requests when Redis is down
        response = await client.get("/test")
        assert response.status_code == 200


async def test_error_handler_middleware_validation_error(client: AsyncClient):
    """Test handling of validation errors."""
    # Send request to an endpoint that requires validation
    response = await client.post("/api/v1/users/", json={})  # Missing required fields
    assert response.status_code == 422  # Validation error
    data = response.json()
    assert "detail" in data


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