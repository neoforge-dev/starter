"""Test health check endpoints."""
import pytest
from httpx import AsyncClient
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

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