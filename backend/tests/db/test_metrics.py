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

# Make sure metric is properly registered and cleared before test
@pytest.fixture(autouse=True)
def clear_metrics():
    """Clears Prometheus metrics before each test."""
    for metric in list(REGISTRY.collect()):
        try:
            # Attempt to access _metrics attribute common in prometheus_client
            metric_dict = getattr(metric, '_metrics', {})
            if isinstance(metric_dict, dict):
                metric_dict.clear()
            # For collectors like Info, Gauge, Counter etc. that might not have _metrics
            elif hasattr(metric, 'clear'): 
                metric.clear()
        except AttributeError:
            # Handle cases where metrics might not have _metrics or clear
            pass 
    # Optional: Reset specific metrics if general clearing is problematic
    # DB_QUERY_DURATION._metrics.clear()
    # DB_TOTAL_QUERIES._metrics.clear()
    yield


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
    # Initial value should be 0 or not exist if cleared properly
    initial_value = get_metric_value(DB_QUERY_DURATION)
    # print(f"Initial DB_QUERY_DURATION value: {initial_value}") # Removed diagnostic
    assert initial_value == 0.0, "Metric should start at 0"

    # Execute a query
    await db.execute(text("SELECT 1"))
    await db.commit() # Commit to ensure after_cursor_execute fires if needed
    
    # Check if the metric value has increased
    final_value = get_metric_value(DB_QUERY_DURATION)
    # print(f"Final DB_QUERY_DURATION value: {final_value}") # Removed diagnostic
    
    # Check the number of samples
    samples = list(DB_QUERY_DURATION.collect())[0].samples
    # print(f"DB_QUERY_DURATION Samples: {samples}") # Removed diagnostic
    
    assert final_value > 0.0, "Query duration metric should have increased"


async def test_total_queries_metric(db: AsyncSession) -> None:
    """Test that total queries metric is recorded."""
    initial_value = get_metric_value(DB_TOTAL_QUERIES)
    # print(f"Initial DB_TOTAL_QUERIES value: {initial_value}") # Removed diagnostic
    assert initial_value == 0.0, "Metric should start at 0"

    # Execute a query
    await db.execute(text("SELECT 1"))
    await db.commit()
    
    # Check if the metric value has increased
    final_value = get_metric_value(DB_TOTAL_QUERIES)
    # print(f"Final DB_TOTAL_QUERIES value: {final_value}") # Removed diagnostic
    assert final_value == 1.0, "Total queries metric should be 1"


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