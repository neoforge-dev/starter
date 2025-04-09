import pytest
import jwt
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch
from redis.asyncio import Redis
from app.api.middleware.rate_limit import RateLimitMiddleware, setup_rate_limit_middleware
from app.core.config import settings
import asyncio

@pytest.fixture
def app():
    """Create test FastAPI application."""
    app = FastAPI()
    
    @app.get("/test")
    async def test_endpoint():
        return {"message": "success"}
    
    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}
    
    return app

@pytest.fixture
async def mock_redis():
    """Create a mock Redis client."""
    redis = AsyncMock(spec=Redis)
    redis.incr = AsyncMock()
    redis.expire = AsyncMock()
    redis.close = AsyncMock()
    return redis

@pytest.fixture
async def client(app, mock_redis):
    """Create test client with rate limit middleware."""
    await setup_rate_limit_middleware(app, mock_redis)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_rate_limit_ip_based(client, mock_redis):
    """Test IP-based rate limiting."""
    # Setup Redis mock for first request
    mock_redis.incr.return_value = 1
    
    response = await client.get("/test")
    assert response.status_code == 200
    assert response.json() == {"message": "success"}
    
    # Verify rate limit headers
    assert response.headers["X-RateLimit-Limit"] == str(settings.rate_limit_requests)
    assert response.headers["X-RateLimit-Remaining"] == str(settings.rate_limit_requests - 1)
    assert response.headers["X-RateLimit-Reset"] == str(settings.rate_limit_window)
    
    # Verify Redis calls
    mock_redis.incr.assert_called_once()
    mock_redis.expire.assert_called_once()

@pytest.mark.asyncio
async def test_rate_limit_token_based(client, mock_redis):
    """Test token-based rate limiting (should bypass)."""
    # Create a test token
    token = jwt.encode(
        {"sub": "test-user-id"},
        settings.secret_key.get_secret_value(),
        algorithm="HS256"
    )
    
    # Setup Redis mock (though it shouldn't be called)
    mock_redis.incr.return_value = 1
    
    response = await client.get(
        "/test",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    
    # Verify Redis incr was NOT called because authenticated users bypass the limit check
    mock_redis.incr.assert_not_called()

@pytest.mark.asyncio
async def test_rate_limit_exceeded(client, mock_redis):
    """Test behavior when rate limit is exceeded."""
    # Setup Redis mock to return value exceeding limit
    mock_redis.incr.return_value = settings.rate_limit_requests + 1
    
    response = await client.get("/test")
    assert response.status_code == 429
    assert response.json()["detail"] == "Too Many Requests"
    
    # Verify rate limit headers
    assert response.headers["X-RateLimit-Limit"] == str(settings.rate_limit_requests)
    assert response.headers["X-RateLimit-Remaining"] == "0"
    assert response.headers["X-RateLimit-Reset"] == str(settings.rate_limit_window)

@pytest.mark.asyncio
async def test_rate_limit_health_check(client, mock_redis):
    """Test that health check endpoints bypass rate limiting."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
    
    # Verify Redis was not called
    mock_redis.incr.assert_not_called()
    mock_redis.expire.assert_not_called()

@pytest.mark.asyncio
async def test_rate_limit_invalid_token(client, mock_redis):
    """Test behavior with invalid JWT token."""
    # Setup Redis mock
    mock_redis.incr.return_value = 1
    
    response = await client.get(
        "/test",
        headers={"Authorization": "Bearer invalid-token"}
    )
    assert response.status_code == 200
    
    # Verify rate limit key was IP-based
    mock_redis.incr.assert_called_once()
    call_args = mock_redis.incr.call_args[0][0]
    assert "rate_limit:ip:" in call_args

@pytest.mark.asyncio
async def test_rate_limit_redis_error(client, mock_redis):
    """Test behavior when Redis encounters an error."""
    # Setup Redis mock to raise an error
    mock_redis.incr.side_effect = Exception("Redis error")
    
    response = await client.get("/test")
    assert response.status_code == 200
    assert response.json() == {"message": "success"}

@pytest.mark.asyncio
async def test_rate_limit_no_redis(app):
    """Test behavior when Redis client is not available."""
    # Setup middleware without Redis
    await setup_rate_limit_middleware(app, None)
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/test")
        assert response.status_code == 200
        assert response.json() == {"message": "success"}

@pytest.mark.asyncio
async def test_rate_limit_concurrent_requests(client, mock_redis):
    """Test rate limiting with concurrent requests."""
    # Setup Redis mock with increasing counter
    counter = 1
    async def mock_incr(*args, **kwargs):
        nonlocal counter
        counter += 1
        return counter
    
    mock_redis.incr.side_effect = mock_incr
    
    # Make concurrent requests
    responses = await asyncio.gather(
        *[client.get("/test") for _ in range(5)],
        return_exceptions=True
    )
    
    # Verify responses
    success_count = sum(1 for r in responses if r.status_code == 200)
    rate_limited_count = sum(1 for r in responses if r.status_code == 429)
    
    assert success_count + rate_limited_count == 5
    assert rate_limited_count > 0  # Some requests should be rate limited 