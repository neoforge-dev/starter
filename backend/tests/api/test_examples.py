"""Tests for example endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import clear_cache
from app.core.config import settings
from tests.factories import UserFactory

pytestmark = pytest.mark.asyncio

async def test_cached_users(client: AsyncClient, db: AsyncSession):
    """Test cached users endpoint."""
    # Create test users
    users = [await UserFactory.create(session=db) for _ in range(3)]
    await db.commit()
    
    # First request should hit database
    response = await client.get(f"{settings.api_v1_str}/examples/cached-users", headers={
        "Accept": "application/json",
        "User-Agent": "TestClient"
    })
    assert response.status_code == 200
    assert len(response.json()) == 3
    
    # Second request should use cache
    response = await client.get(f"{settings.api_v1_str}/examples/cached-users", headers={
        "Accept": "application/json",
        "User-Agent": "TestClient"
    })
    assert response.status_code == 200
    assert len(response.json()) == 3
    
    # Clear cache and verify it hits database again
    await clear_cache()
    response = await client.get(f"{settings.api_v1_str}/examples/cached-users", headers={
        "Accept": "application/json",
        "User-Agent": "TestClient"
    })
    assert response.status_code == 200
    assert len(response.json()) == 3

async def test_query_types(client: AsyncClient):
    """Test query types endpoint."""
    response = await client.get(f"{settings.api_v1_str}/examples/query-types", headers={
        "Accept": "application/json",
        "User-Agent": "TestClient"
    })
    assert response.status_code == 200
    data = response.json()
    
    # Verify response structure
    assert "query_timings" in data
    assert "monitoring_active" in data
    assert data["monitoring_active"] is True
    
    # Verify query timings
    timings = data["query_timings"]
    assert "select" in timings
    assert "join" in timings
    assert "transaction" in timings
    
    # Verify slow query detection
    assert float(timings["select"]["duration"]) >= 0.05  # Due to pg_sleep(0.05)

async def test_connection_pool(client: AsyncClient):
    """Test connection pool endpoint."""
    response = await client.get("/examples/connection-pool", headers={
        "Accept": "application/json",
        "User-Agent": "TestClient"
    })
    assert response.status_code == 200
    data = response.json()
    
    # Verify response structure
    assert "query_timings" in data
    assert "pool_stats" in data
    
    # Verify pool stats
    assert len(data["query_timings"]) == 5
    assert isinstance(data["pool_stats"], dict)

async def test_error_handling(client: AsyncClient):
    """Test error handling endpoint."""
    response = await client.get("/examples/error-handling", headers={
        "Accept": "application/json",
        "User-Agent": "TestClient"
    })
    assert response.status_code == 500
    data = response.json()
    
    assert data["detail"] == "Query error demonstration" 