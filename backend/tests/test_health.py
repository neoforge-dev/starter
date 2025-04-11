from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from redis.exceptions import ConnectionError
import redis.exceptions
from unittest.mock import MagicMock, AsyncMock, patch
from typing import Any, AsyncGenerator
from sqlalchemy.exc import SQLAlchemyError

from app.api.deps import get_db
from app.api.deps import get_monitored_db
from app.db.session import get_db as session_get_db
from app.main import app
from app.db.query_monitor import QueryMonitor
from app.core.config import Settings
from app.core.redis import get_redis

async def test_detailed_health_check_db_failure(
    client: AsyncClient,
    db: AsyncSession,
) -> None:
    """Test detailed health check when database interaction fails."""
    mock_session = AsyncMock(spec=AsyncSession)
    mock_session.execute = AsyncMock(side_effect=SQLAlchemyError("Simulated DB execute error via override"))

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield mock_session

    # Apply the override to the globally imported app object
    app.dependency_overrides[get_db] = override_get_db

    try:
        # Remove setting override on client.app
        # client.app.dependency_overrides[get_db] = override_get_db
        response = await client.get("/health/detailed")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["database_status"] == "unhealthy"
        assert "Simulated DB execute error via override" in data.get("database_error", "")
    finally:
        # Clear the override from the globally imported app object
        app.dependency_overrides.pop(get_db, None)
        # client.app.dependency_overrides.pop(get_db, None)

async def test_detailed_health_check_redis_failure(
    client: AsyncClient,
) -> None:
    """Test detailed health check when Redis interaction fails."""
    mock_redis_client = AsyncMock(spec=Redis)
    mock_redis_client.ping = AsyncMock(side_effect=redis.exceptions.ConnectionError("Simulated Redis ping error via override"))

    async def override_get_redis() -> AsyncGenerator[Redis, None]:
        yield mock_redis_client

    # Apply the override to the globally imported app object
    app.dependency_overrides[get_redis] = override_get_redis

    try:
        # Remove setting override on client.app
        # client.app.dependency_overrides[get_redis] = override_get_redis
        response = await client.get("/health/detailed")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["redis_status"] == "unhealthy"
        assert "Simulated Redis ping error via override" in data.get("redis_error", "")
    finally:
        # Clear the override from the globally imported app object
        app.dependency_overrides.pop(get_redis, None)
        # client.app.dependency_overrides.pop(get_redis, None)

    # Remove old commented out/unused code at the end 