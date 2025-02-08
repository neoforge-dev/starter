"""Test API middleware functionality."""
import pytest
import pytest_asyncio
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from httpx import AsyncClient
import jwt
import time
import asyncio
from redis.asyncio import Redis
from typing import AsyncGenerator

from app.core.config import settings
from app.api.middleware import RateLimitMiddleware, ErrorHandlerMiddleware
from tests.factories import UserFactory

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


async def test_error_handler_middleware(app_with_middleware: FastAPI, client: AsyncClient):
    """Test error handling middleware."""
    # Add middleware
    app_with_middleware.add_middleware(ErrorHandlerMiddleware)
    
    # Test successful request
    response = await client.get("/test")
    assert response.status_code == 200
    
    # Test error handling
    response = await client.get("/error")
    assert response.status_code == 500
    assert response.json()["detail"] == "Internal Server Error"


async def test_rate_limit_middleware_unauthenticated(
    app_with_middleware: FastAPI,
    client: AsyncClient,
    redis: Redis,
):
    """Test rate limiting for unauthenticated requests."""
    # Set lower rate limit for testing
    settings.rate_limit_requests = 5
    settings.rate_limit_window = 60
    
    # Add middleware with Redis client
    app_with_middleware.add_middleware(RateLimitMiddleware, redis_client=redis)
    
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
    client: AsyncClient,
    redis: Redis,
    db,
):
    """Test rate limiting for authenticated requests."""
    # Add middleware
    app_with_middleware.add_middleware(RateLimitMiddleware)
    
    # Create user and token
    user = await UserFactory.create(session=db)
    token = jwt.encode(
        {"sub": str(user.id)},
        settings.secret_key,
        algorithm=settings.algorithm,
    )
    headers = {"Authorization": f"Bearer {token}"}
    
    # Make requests up to the authenticated limit
    for _ in range(settings.rate_limit_auth_requests):
        response = await client.get("/test", headers=headers)
        assert response.status_code == 200
    
    # Next request should be rate limited
    response = await client.get("/test", headers=headers)
    assert response.status_code == 429


async def test_rate_limit_middleware_ip_based(
    app_with_middleware: FastAPI,
    client: AsyncClient,
    redis: Redis,
):
    """Test IP-based rate limiting."""
    # Add middleware
    app_with_middleware.add_middleware(RateLimitMiddleware)
    
    # Make requests from same IP
    for _ in range(settings.rate_limit_requests):
        response = await client.get("/test")
        assert response.status_code == 200
    
    # Next request should be rate limited
    response = await client.get("/test")
    assert response.status_code == 429


async def test_rate_limit_window_reset(
    app_with_middleware: FastAPI,
    client: AsyncClient,
    redis: Redis,
):
    """Test rate limit window reset."""
    # Add middleware
    app_with_middleware.add_middleware(RateLimitMiddleware)
    
    # Make requests up to the limit
    for _ in range(settings.rate_limit_requests):
        response = await client.get("/test")
        assert response.status_code == 200
    
    # Wait for window to reset
    await asyncio.sleep(settings.rate_limit_window)
    
    # Should be able to make requests again
    response = await client.get("/test")
    assert response.status_code == 200


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


async def test_rate_limit_middleware_invalid_token(
    app_with_middleware: FastAPI,
    client: AsyncClient,
    redis: Redis,
):
    """Test rate limiting with invalid JWT token."""
    # Add middleware
    app_with_middleware.add_middleware(RateLimitMiddleware)
    
    # Use invalid token
    headers = {"Authorization": "Bearer invalid.token.here"}
    
    # Should fall back to unauthenticated rate limit
    for _ in range(settings.rate_limit_requests):
        response = await client.get("/test", headers=headers)
        assert response.status_code == 200
    
    # Next request should be rate limited
    response = await client.get("/test", headers=headers)
    assert response.status_code == 429


async def test_rate_limit_middleware_redis_error(
    app_with_middleware: FastAPI,
    client: AsyncClient,
    redis: Redis,
):
    """Test behavior when Redis is unavailable."""
    # Add middleware
    app_with_middleware.add_middleware(RateLimitMiddleware)
    
    # Close Redis connection to simulate error
    await redis.close()
    
    # Should still allow requests when Redis is down
    response = await client.get("/test")
    assert response.status_code == 200


async def test_error_handler_middleware_validation_error(
    app_with_middleware: FastAPI,
    client: AsyncClient,
):
    """Test handling of validation errors."""
    app = app_with_middleware
    app.add_middleware(ErrorHandlerMiddleware)
    
    @app.post("/validate")
    async def validation_endpoint(request: Request):
        data = await request.json()
        if "required_field" not in data:
            raise ValueError("Validation error")
        return {"message": "success"}
    
    # Send invalid JSON
    response = await client.post("/validate", json={})
    assert response.status_code == 500
    assert "Internal Server Error" in response.json()["detail"]


async def test_error_handler_middleware_database_error(
    app_with_middleware: FastAPI,
    client: AsyncClient,
):
    """Test handling of database errors."""
    app = app_with_middleware
    app.add_middleware(ErrorHandlerMiddleware)
    
    @app.get("/db-error")
    async def db_error_endpoint():
        from sqlalchemy.exc import SQLAlchemyError
        raise SQLAlchemyError("Database connection failed")
    
    response = await client.get("/db-error")
    assert response.status_code == 500
    assert response.json()["detail"] == "Database Error"


async def test_rate_limit_middleware_no_redis_connection(
    app_with_middleware: FastAPI,
    client: AsyncClient,
):
    """Test behavior when Redis connection fails."""
    # Add middleware with invalid Redis URL
    settings.redis_url = "redis://invalid:6379/0"
    app_with_middleware.add_middleware(RateLimitMiddleware)
    
    # Should still allow requests
    response = await client.get("/test")
    assert response.status_code == 200 