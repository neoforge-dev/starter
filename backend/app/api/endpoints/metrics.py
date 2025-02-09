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
from app.core.config import settings
from app.crud import email_tracking
from app.db.session import get_db
from app.core.redis import get_redis
from app.core.metrics import get_metrics

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