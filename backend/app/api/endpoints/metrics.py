"""Metrics endpoints."""
from typing import Annotated, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.config import settings
from app.crud import email_tracking
from app.db.session import get_db
from app.core.redis import get_redis

router = APIRouter()

# Create a new registry
REGISTRY = CollectorRegistry()

# Define metrics
HTTP_REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
    registry=REGISTRY,
)

HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "endpoint", "status"],
    registry=REGISTRY,
)

DB_POOL_SIZE = Gauge(
    "db_pool_size",
    "Database connection pool size",
    registry=REGISTRY,
)

REDIS_CONNECTED = Gauge(
    "redis_connected",
    "Redis connection status (1 for connected, 0 for disconnected)",
    registry=REGISTRY,
)

EMAIL_METRICS = {
    "sent": Counter(
        "emails_sent_total",
        "Total number of emails sent",
        registry=REGISTRY,
    ),
    "delivered": Counter(
        "emails_delivered_total",
        "Total number of emails delivered",
        registry=REGISTRY,
    ),
    "failed": Counter(
        "emails_failed_total",
        "Total number of emails that failed to send",
        registry=REGISTRY,
    ),
}

@router.get(
    "/metrics",
    tags=["monitoring"],
    response_class=PlainTextResponse,
    responses={
        200: {
            "content": {"text/plain": {}},
            "description": "Prometheus metrics",
        }
    },
)
async def get_metrics(
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
) -> str:
    """
    Get application metrics in Prometheus format.
    
    This endpoint exposes various metrics about the application's performance
    and health, including:
    - HTTP request metrics
    - Database connection metrics
    - Redis connection status
    - Email delivery metrics
    """
    try:
        # Update database metrics
        DB_POOL_SIZE.set(db.bind.pool.size())

        # Update Redis metrics
        try:
            await redis.ping()
            REDIS_CONNECTED.set(1)
        except Exception:
            REDIS_CONNECTED.set(0)

        # Update email metrics from tracking data
        stats = await email_tracking.get_stats(db)
        EMAIL_METRICS["sent"].inc(stats.total_sent)
        EMAIL_METRICS["delivered"].inc(stats.total_delivered)
        EMAIL_METRICS["failed"].inc(stats.total_failed)

        # Generate and return metrics in Prometheus format
        return generate_latest(REGISTRY)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating metrics: {str(e)}",
        ) 