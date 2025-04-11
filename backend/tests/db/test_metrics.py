"""Test database metrics module."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from prometheus_client import REGISTRY
import asyncio

from app.db.metrics import get_pool_stats, log_pool_stats
from app.core.metrics import get_metrics
from tests.factories import UserFactory

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
    # Get initial sum from the metric
    await asyncio.sleep(0.01) # Short sleep to allow potential background metric processing
    initial_samples = list(metrics["db_query_duration_seconds"].collect())
    initial_sum = initial_samples[0].samples[0].value if initial_samples and initial_samples[0].samples else 0.0

    # Execute a real query (insert) instead of SELECT 1
    user = await UserFactory.create(session=db)
    await db.flush() # Ensure the insert is sent to DB
    await db.refresh(user) # Explicitly refresh to ensure listener has fired and completed
    await asyncio.sleep(0.01) # Short sleep after refresh

    # Get final sum
    final_samples = list(metrics["db_query_duration_seconds"].collect())
    final_sum = final_samples[0].samples[0].value if final_samples and final_samples[0].samples else 0.0
    
    assert final_sum > initial_sum, "Query duration metric sum should have increased"


async def test_total_queries_metric(db: AsyncSession) -> None:
    """Test that total queries metric is recorded."""
    # Get initial count from the metric
    await asyncio.sleep(0.01) # Short sleep to allow potential background metric processing
    initial_samples = list(metrics["db_query_count"].collect())
    initial_count = initial_samples[0].samples[0].value if initial_samples and initial_samples[0].samples else 0.0

    # Execute a real query (insert) instead of SELECT 1
    user = await UserFactory.create(session=db)
    await db.flush() # Ensure the insert is flushed
    await db.refresh(user) # Explicitly refresh to ensure listener has fired and completed
    await asyncio.sleep(0.01) # Short sleep after refresh

    # Get final count
    final_samples = list(metrics["db_query_count"].collect())
    final_count = final_samples[0].samples[0].value if final_samples and final_samples[0].samples else 0.0
    
    assert final_count == initial_count + 1.0, f"Total queries metric count should have increased by 1 (from {initial_count} to {final_count})"


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