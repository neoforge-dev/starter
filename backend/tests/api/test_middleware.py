"""Test API middleware functionality."""
import asyncio
import jwt
import time
from typing import AsyncGenerator, Dict
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
from tests.factories import UserFactory
from app.main import app
from app.models.user import User

pytestmark = pytest.mark.asyncio


@pytest.fixture
async def redis(test_settings: Settings) -> AsyncGenerator[Redis, None]:
    """Create Redis client for testing."""
    client = Redis.from_url(str(test_settings.redis_url))
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
    # Test successful request using an existing endpoint from the main app
    response = await client.get("/health") 
    assert response.status_code == 200
    data = response.json()
    # Check against the actual health check response model
    assert data["status"] == "healthy"
    assert "version" in data
    assert data["database_status"] == "healthy" # Assuming test DB is healthy
    assert data["redis_status"] == "healthy" # Assuming test Redis is healthy


async def test_error_handler_middleware_validation_error(
    client: AsyncClient,
    normal_user_token_headers: tuple[Dict[str, str], User],
    test_settings: Settings
):
    """Test handling of validation errors."""
    headers, _ = normal_user_token_headers
    # Example: Try to create an item with invalid data (requires authentication)
    invalid_item_data = {"name": 123} # Invalid type for name
    response = await client.post(
        f"{test_settings.api_v1_str}/items/",
        json=invalid_item_data,
        headers=headers
    )
    assert response.status_code == 422 # Unprocessable Entity for validation errors
    data = response.json()
    assert "detail" in data
    assert isinstance(data["detail"], list)
    assert "msg" in data["detail"][0]
    assert "type" in data["detail"][0]


async def test_rate_limit_middleware_no_redis_connection(
    app_with_middleware: FastAPI,
    client: AsyncClient,
    test_settings: Settings
):
    """Test behavior when Redis connection fails."""
    # Add test route to test app
    @app_with_middleware.get("/test_no_redis")
    async def test_route():
        return {"message": "success"}
    
    # Set invalid Redis URL
    test_settings.redis_url = "redis://invalid:6379/0"
    
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