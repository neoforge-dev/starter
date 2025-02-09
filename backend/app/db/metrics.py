"""Database metrics module."""
from typing import Dict, Any

from prometheus_client import Counter, Gauge, Histogram
import structlog
from sqlalchemy.pool import NullPool

from app.db.session import engine
from app.core.config import settings
from app.core.metrics import get_metrics

logger = structlog.get_logger()

# Initialize metrics
metrics = get_metrics()

# Metrics
DB_POOL_CHECKOUTS = Counter(
    "db_pool_checkouts_total",
    "Total number of connection checkouts from the pool",
)

DB_POOL_CHECKINS = Counter(
    "db_pool_checkins_total",
    "Total number of connection checkins to the pool",
)

DB_POOL_OVERFLOW = Counter(
    "db_pool_overflow_total",
    "Total number of times the connection pool overflowed",
)

DB_QUERY_DURATION = Histogram(
    "db_query_duration_seconds",
    "Database query duration in seconds",
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0),
)


def get_pool_stats() -> Dict[str, Any]:
    """Get current database pool statistics."""
    if isinstance(engine.pool, NullPool):
        # Return dummy stats for NullPool
        stats = {
            "size": 0,
            "checked_in": 0,
            "checked_out": 0,
            "overflow": 0,
        }
    else:
        pool = engine.pool
        stats = {
            "size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
        }

    # Update Prometheus metrics
    try:
        metrics["db_pool_size"].set(stats["size"])
    except (KeyError, AttributeError):
        logger.debug("db_pool_size metric not initialized")

    return stats


async def log_pool_stats() -> None:
    """Log current database pool statistics."""
    try:
        stats = get_pool_stats()
        logger.info(
            "db_pool_stats",
            size=stats["size"],
            checked_in=stats["checked_in"],
            checked_out=stats["checked_out"],
            overflow=stats["overflow"],
        )
    except Exception as e:
        logger.error("db_pool_stats_error", error=str(e))


# Add event listeners for connection pool events only in non-test environment
if not isinstance(engine.pool, NullPool):
    @engine.pool.add_listener("checkout")
    def on_checkout(dbapi_con, con_record, con_proxy):
        """Handle connection checkout event."""
        DB_POOL_CHECKOUTS.inc()

    @engine.pool.add_listener("checkin")
    def on_checkin(dbapi_con, con_record):
        """Handle connection checkin event."""
        DB_POOL_CHECKINS.inc()

    @engine.pool.add_listener("overflow")
    def on_overflow(dbapi_con, con_record):
        """Handle connection pool overflow event."""
        DB_POOL_OVERFLOW.inc()
        logger.warning(
            "db_pool_overflow",
            current_size=engine.pool.size(),
            overflow=engine.pool.overflow(),
        ) 