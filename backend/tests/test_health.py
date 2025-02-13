from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from unittest.mock import MagicMock, AsyncMock
from typing import Any, AsyncGenerator

from app.api.deps import get_monitored_db, MonitoredDB
from app.db.session import get_db
from app.main import app
from app.db.query_monitor import QueryMonitor

async def test_detailed_health_check_db_failure(
    client: AsyncClient,
    db: AsyncSession,
    redis: Redis,
) -> None:
    """Test detailed health check when database is down."""
    class FailingDB:
        async def execute(self, query, *args, **kwargs):
            raise Exception("Database connection error")

        @property
        def pool_stats(self):
            return None

    async def failing_get_monitored_db_override() -> AsyncGenerator[Any, None]:
        yield FailingDB()
    app.dependency_overrides[get_monitored_db] = failing_get_monitored_db_override

    try:
        response = await client.get("/health/detailed")
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        assert response.status_code == 503
        assert "Database error: Database connection error" in response.text
    finally:
        app.dependency_overrides.clear()

    async def failing_db_generator():
        instance = MagicMock(spec=MonitoredDB)
        async def failing_execute(*args, **kwargs):
            raise Exception("Database connection error")
        instance.execute = failing_execute
        instance.close = AsyncMock()
        instance.begin = AsyncMock()
        instance.commit = AsyncMock()
        instance.rollback = AsyncMock()
        instance.scalar = AsyncMock()
        instance.scalars = AsyncMock()
        instance.refresh = AsyncMock()
        instance.add = AsyncMock()
        instance.add_all = AsyncMock()
        instance.delete = AsyncMock()
        instance.flush = AsyncMock()
        instance.merge = AsyncMock()
        instance.expunge = AsyncMock()
        instance.expunge_all = AsyncMock()
        instance.get_bind = AsyncMock()
        instance.connection = AsyncMock()
        instance.in_transaction = AsyncMock(return_value=False)
        instance.is_active = True
        instance.info = {}
        instance.current_query = None
        instance._query_stats = {
            "total_queries": 0,
            "slow_queries": 0,
            "errors": 0,
            "total_duration": 0.0,
        }
        
        # Create a property for stats
        class QueryStats:
            def __init__(self, stats):
                self._stats = stats
            
            @property
            def total_queries(self):
                return self._stats["total_queries"]
            
            @property
            def slow_queries(self):
                return self._stats["slow_queries"]
            
            @property
            def total_duration(self):
                return self._stats["total_duration"]
            
            @property
            def errors(self):
                return self._stats["errors"]
            
            @property
            def avg_duration_ms(self):
                return 0.0
            
            @property
            def p95_duration_ms(self):
                return 0.0
            
            @property
            def p99_duration_ms(self):
                return 0.0
        
        instance.stats = QueryStats(instance._query_stats)
        yield instance

    async def failing_get_monitored_db():
        class FailingDB:
            async def execute(self, query, *args, **kwargs):
                raise Exception("Database connection error")

            @property
            def pool_stats(self):
                return None
        yield FailingDB()

    class FailingQueryMonitor(QueryMonitor):
        async def execute(self, query, *args, **kwargs):
            raise Exception("Database connection error")

        @property
        def pool_stats(self):
            return None

        async def close(self) -> None:
            pass

    async def failing_get_monitored_db_override() -> AsyncGenerator[QueryMonitor, None]:
        from app.db.query_monitor import QueryMonitor
        monitor = QueryMonitor(db)

        async def failing_execute(query, *args, **kwargs):
            raise Exception("Database connection error")

        monitor.execute = failing_execute
        yield monitor

    app.dependency_overrides[get_monitored_db] = failing_get_monitored_db_override

    try:
        response = await client.get("/health/detailed")
        print("Response body:", response.json())
        assert response.status_code == 503
        assert "Database connection error" in response.json()["detail"]["errors"][0]
    finally:
        pass 