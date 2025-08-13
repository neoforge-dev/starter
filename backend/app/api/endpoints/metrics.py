"""Metrics endpoints."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    REGISTRY,
    generate_latest,
)
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud import email_tracking
from app.db.session import get_db
from app.core.redis import get_redis
from app.core.metrics import get_metrics
from app.core.celery import celery_app

router = APIRouter()

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
async def get_metrics_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
) -> PlainTextResponse:
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
        metrics = get_metrics()

        # Update database metrics
        pool = db.bind.pool
        if hasattr(pool, 'size'):
            metrics["db_pool_size"].set(pool.size())
        else:
            metrics["db_pool_size"].set(0)  # NullPool case

        # Redis metrics are handled by the Redis module

        # Celery queue depth (if broker is Redis and inspect available)
        try:
            inspect = celery_app.control.inspect()
            # Approximate queue depth via active/reserved/scheduled tasks
            active = inspect.active() or {}
            reserved = inspect.reserved() or {}
            scheduled = inspect.scheduled() or {}
            total_active = sum(len(v) for v in active.values()) if active else 0
            total_reserved = sum(len(v) for v in reserved.values()) if reserved else 0
            total_scheduled = sum(len(v) for v in scheduled.values()) if scheduled else 0
            # Report per logical queue names where available; fallback to aggregates
            metrics["celery_queue_depth"].labels(queue="active").set(total_active)
            metrics["celery_queue_depth"].labels(queue="reserved").set(total_reserved)
            metrics["celery_queue_depth"].labels(queue="scheduled").set(total_scheduled)
        except Exception:
            # Best-effort; do not fail metrics endpoint
            pass

        # Update email metrics from tracking data
        stats = await email_tracking.get_stats(db)
        metrics["email_metrics"]["sent"].set(stats.total_sent)
        metrics["email_metrics"]["delivered"].set(stats.total_delivered)
        metrics["email_metrics"]["failed"].set(stats.total_failed)

        # Generate metrics and return with correct content type
        return PlainTextResponse(
            content=generate_latest(REGISTRY),
            media_type=CONTENT_TYPE_LATEST,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating metrics: {str(e)}",
        ) 