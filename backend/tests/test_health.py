"""Test health check endpoints."""
import pytest
from httpx import AsyncClient
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from unittest.mock import patch

pytestmark = pytest.mark.asyncio


async def test_health_check(
    client: AsyncClient,
    db: AsyncSession,
    redis: Redis,
) -> None:
    """Test basic health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database_status"] == "healthy"
    assert data["redis_status"] == "healthy"
    assert "version" in data


async def test_detailed_health_check(
    client: AsyncClient,
    db: AsyncSession,
    redis: Redis,
) -> None:
    """Test detailed health check endpoint."""
    response = await client.get(
        "/health/detailed",
        headers={"Accept": "application/json"},
    )
    if response.status_code != 200:
        print(f"Response body: {response.text}")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database_status"] == "healthy"
    assert data["redis_status"] == "healthy"
    assert isinstance(data["database_latency_ms"], float)
    assert isinstance(data["redis_latency_ms"], float)
    assert data["environment"] == "test"
    assert "version" in data


async def test_health_check_db_failure(
    client: AsyncClient,
    db: AsyncSession,
    redis: Redis,
) -> None:
    """Test health check when database is down."""
    # Mock database execute to raise an exception
    with patch('sqlalchemy.ext.asyncio.AsyncSession.execute') as mock_execute:
        mock_execute.side_effect = Exception("Database connection error")
        
        response = await client.get("/health")
        assert response.status_code == 503
        data = response.json()
        assert "Database unhealthy" in data["detail"]


async def test_health_check_redis_failure(
    client: AsyncClient,
    db: AsyncSession,
    redis: Redis,
) -> None:
    """Test health check when Redis is down."""
    # Mock Redis health check to return unhealthy
    with patch('app.api.endpoints.health.check_redis_health') as mock_check:
        mock_check.return_value = (False, "Redis connection error")
        
        response = await client.get("/health")
        assert response.status_code == 503
        data = response.json()
        assert "Redis unhealthy" in data["detail"]["errors"][0]


async def test_detailed_health_check_db_failure(
    client: AsyncClient,
    db: AsyncSession,
    redis: Redis,
) -> None:
    """Test detailed health check when database is down."""
    # Mock database execute to raise an exception
    with patch('sqlalchemy.ext.asyncio.AsyncSession.execute') as mock_execute:
        mock_execute.side_effect = Exception("Database connection error")
        
        response = await client.get("/health/detailed")
        assert response.status_code == 503
        data = response.json()
        assert "Database unhealthy" in data["detail"]


async def test_detailed_health_check_redis_failure(
    client: AsyncClient,
    db: AsyncSession,
    redis: Redis,
) -> None:
    """Test detailed health check when Redis is down."""
    # Mock Redis health check to return unhealthy
    with patch('app.core.redis.check_redis_health') as mock_check:
        mock_check.return_value = (False, "Redis connection error")
        
        response = await client.get("/health/detailed")
        assert response.status_code == 503
        data = response.json()
        assert "Redis unhealthy" in data["detail"]


async def test_detailed_health_check_pool_stats(
    client: AsyncClient,
    db: AsyncSession,
    redis: Redis,
) -> None:
    """Test detailed health check includes pool stats."""
    # Execute a query to ensure pool is used
    await db.execute(text("SELECT 1"))
    
    response = await client.get("/health/detailed")
    assert response.status_code == 200
    data = response.json()
    
    # Check database pool stats
    assert "database_pool" in data
    pool_stats = data["database_pool"]
    assert isinstance(pool_stats["size"], int)
    assert isinstance(pool_stats["checked_in"], int)
    assert isinstance(pool_stats["checked_out"], int)
    assert isinstance(pool_stats["overflow"], int)
    
    # Check query stats
    assert "query_stats" in data
    query_stats = data["query_stats"]
    assert isinstance(query_stats["total_queries"], int)
    assert isinstance(query_stats["slow_queries"], int)
    assert isinstance(query_stats["avg_duration_ms"], float)
    assert isinstance(query_stats["p95_duration_ms"], float)
    assert isinstance(query_stats["p99_duration_ms"], float)
    
    # Check Redis stats
    assert "redis_stats" in data
    redis_stats = data["redis_stats"]
    assert isinstance(redis_stats["connected"], bool)
    assert isinstance(redis_stats["latency_ms"], float)
    assert redis_stats["error_message"] is None 