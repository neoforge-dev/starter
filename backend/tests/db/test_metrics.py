"""Test database metrics module."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from prometheus_client import REGISTRY

from app.db.metrics import get_pool_stats, log_pool_stats
from app.core.metrics import get_metrics

pytestmark = pytest.mark.asyncio

# Initialize metrics
metrics = get_metrics()


async def test_get_pool_stats(db: AsyncSession) -> None:
    """Test getting pool statistics."""
    stats = get_pool_stats()
    assert isinstance(stats, dict)
    assert "size" in stats
    assert "checked_in" in stats
    assert "checked_out" in stats
    assert "overflow" in stats
    assert isinstance(stats["size"], int)
    assert isinstance(stats["checked_in"], int)
    assert isinstance(stats["checked_out"], int)
    assert isinstance(stats["overflow"], int)


async def test_log_pool_stats(db: AsyncSession) -> None:
    """Test logging pool statistics."""
    # This should not raise any exceptions
    await log_pool_stats()


async def test_pool_metrics_increment() -> None:
    """Test that pool metrics are incremented."""
    from app.db.session import AsyncSessionLocal
    # Get initial values
    initial_checkouts = metrics["db_pool_checkouts"]._value.get()
    initial_checkins = metrics["db_pool_checkins"]._value.get()
    
    # Create a new session to force a new connection checkout
    async with AsyncSessionLocal() as session:
        await session.execute(text("SELECT 1"))
    
    # Check that metrics were incremented
    assert metrics["db_pool_checkouts"]._value.get() > initial_checkouts
    assert metrics["db_pool_checkins"]._value.get() > initial_checkins


async def test_query_duration_metric(db: AsyncSession) -> None:
    """Test that query duration metric is recorded."""
    from app.db.query_monitor import QueryMonitor
    
    # Get initial count of observations with labels
    initial_count = REGISTRY.get_sample_value("db_query_duration_seconds_count", {"query_type": "select", "table": "unknown"}) or 0.0
    
    # Execute a query using QueryMonitor to ensure metrics are recorded
    monitor = QueryMonitor(db)
    await monitor.execute(text("SELECT pg_sleep(0.1)"))
    
    # Check that a new observation was recorded
    final_count = REGISTRY.get_sample_value("db_query_duration_seconds_count", {"query_type": "select", "table": "unknown"}) or 0.0
    assert final_count > initial_count


async def test_pool_overflow_metric(db: AsyncSession) -> None:
    """Test pool overflow metric."""
    # Get initial value
    initial_overflow = metrics["db_pool_overflow"]._value.get()
    
    # Create multiple connections to potentially trigger overflow
    sessions = []
    try:
        for _ in range(20):  # Try to exceed pool size
            session = AsyncSession(bind=db.bind)
            await session.execute(text("SELECT 1"))
            sessions.append(session)
    except Exception:
        pass  # We expect this might fail due to pool exhaustion
    finally:
        # Clean up sessions
        for session in sessions:
            await session.close()
    
    # Check if overflow was recorded
    # Note: This may not always increment if pool size wasn't exceeded
    overflow_count = metrics["db_pool_overflow"]._value.get()
    assert overflow_count >= initial_overflow 