from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from redis.exceptions import ConnectionError
from unittest.mock import MagicMock, AsyncMock, patch
from typing import Any, AsyncGenerator

from app.api.deps import get_monitored_db, MonitoredDB
from app.db.session import get_db
from app.main import app
from app.db.query_monitor import QueryMonitor
from app.core.config import Settings
from app.core.redis import get_redis

async def test_detailed_health_check_db_failure(
    client: AsyncClient,
    db: AsyncSession,
) -> None:
    """Test detailed health check when database is down."""
    # Simplified FailingDB mock
    class FailingDB:
        async def execute(self, query, *args, **kwargs):
            # Simulate a database error during query execution
            raise Exception("Simulated database connection error")

    # Simplified override function
    async def failing_get_monitored_db_override() -> AsyncGenerator[Any, None]:
        yield FailingDB()

    # Apply the override
    app.dependency_overrides[get_monitored_db] = failing_get_monitored_db_override

    try:
        response = await client.get("/health/detailed")
        # Debug output:
        # print(f"DB Failure Test - Status: {response.status_code}")
        # print(f"DB Failure Test - Body: {response.text}")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["database_status"] == "unhealthy"
        # Check for the specific error message raised by the mock
        assert "Simulated database connection error" in data.get("database_error", "")
    finally:
        # Ensure overrides are cleared after the test
        app.dependency_overrides.clear()

async def test_detailed_health_check_redis_failure(
    client: AsyncClient,
) -> None:
    """Test detailed health check when Redis is down."""

    # Mock the ping method to raise an exception
    mock_redis_ping = AsyncMock(side_effect=Exception("Simulated Redis connection error"))

    # Patch the 'ping' method of the Redis instance obtained via get_redis
    # The target string points to where 'ping' is called within the health endpoint logic
    # Assuming get_redis returns an object with a 'ping' method
    # A more robust patch target might be needed depending on Redis client setup
    with patch("app.api.endpoints.health.get_redis", new_callable=AsyncMock) as mock_get_redis:
        # Configure the mock Redis instance returned by the mocked get_redis
        mock_redis_instance = AsyncMock()
        mock_redis_instance.ping = mock_redis_ping
        mock_get_redis.return_value = mock_redis_instance

        response = await client.get("/health/detailed")

        # Debug output:
        # print(f"Redis Failure Test - Status: {response.status_code}")
        # print(f"Redis Failure Test - Body: {response.text}")

        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["redis_status"] == "unhealthy"
        # Check for the specific error message raised by the mock
        assert "Simulated Redis connection error" in data.get("redis_error", "")

    # Ensure patch is automatically cleaned up by exiting the 'with' block

    # Remove the previous complex/unused override code
    # ... (Removed FailingRedis, failing_get_redis, etc.) ...

    # Remove the previous complex/unused override code
    # ... (Removed FailingRedis, failing_get_redis, etc.) ... 