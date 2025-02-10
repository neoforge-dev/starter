"""Database metrics module."""
from typing import Dict, Any

import structlog
from sqlalchemy import event
from sqlalchemy.pool import NullPool

from app.db.session import engine
from app.core.metrics import get_metrics

logger = structlog.get_logger()

# Initialize metrics
metrics = get_metrics()

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


def on_checkout(dbapi_con, con_record, con_proxy):
    """Handle connection checkout event."""
    try:
        metrics["db_pool_checkouts"].inc()
        # Check if we're at max capacity and need to overflow
        if not isinstance(engine.pool, NullPool):
            if engine.pool.checkedout() >= engine.pool.size():
                metrics["db_pool_overflow"].inc()
                logger.warning(
                    "db_pool_overflow",
                    current_size=engine.pool.size(),
                    overflow=engine.pool.overflow(),
                )
    except Exception as e:
        logger.error("db_pool_checkout_error", error=str(e))


def on_checkin(dbapi_con, con_record):
    """Handle connection checkin event."""
    try:
        metrics["db_pool_checkins"].inc()
    except Exception as e:
        logger.error("db_pool_checkin_error", error=str(e))


# Register event listeners for our specific engine instance
if not isinstance(engine.sync_engine.pool, NullPool):
    event.listen(engine.sync_engine.pool, "checkout", on_checkout)
    event.listen(engine.sync_engine.pool, "checkin", on_checkin) 