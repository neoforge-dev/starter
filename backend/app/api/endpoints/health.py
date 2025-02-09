"""Health check endpoints."""
from typing import Annotated, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.core.redis import get_redis, check_redis_health
from app.db.metrics import get_pool_stats, log_pool_stats
from app.db.query_monitor import QueryMonitor, QUERY_COUNT, QUERY_DURATION, SLOW_QUERIES
from app.api.deps import MonitoredDB

router = APIRouter()

class HealthCheck(BaseModel):
    """Health check response model."""
    status: str
    version: str
    database_status: str
    redis_status: str

class DatabasePoolStats(BaseModel):
    """Database connection pool statistics."""
    size: int
    checked_in: int
    checked_out: int
    overflow: int

class QueryStats(BaseModel):
    """Query performance statistics."""
    total_queries: int
    slow_queries: int
    avg_duration_ms: float
    p95_duration_ms: float
    p99_duration_ms: float

class RedisStats(BaseModel):
    """Redis statistics."""
    connected: bool
    latency_ms: float
    error_message: str | None = None

class DetailedHealthCheck(HealthCheck):
    """Detailed health check response with component information."""
    database_latency_ms: float
    redis_latency_ms: float
    environment: str
    database_pool: DatabasePoolStats
    redis_stats: RedisStats
    query_stats: QueryStats

@router.get(
    "/health",
    response_model=HealthCheck,
    tags=["system"],
)
async def health_check(
    db: MonitoredDB,
    redis: Annotated[Redis, Depends(get_redis)],
) -> HealthCheck:
    """
    Check API health status.
    
    Performs basic health check of the API and its dependencies.
    Returns 200 if healthy, 503 if unhealthy.
    """
    try:
        # Check database connection
        db_status = "healthy"
        try:
            await db.execute("SELECT 1")
        except Exception as e:
            db_status = f"unhealthy: {str(e)}"
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Database unhealthy: {str(e)}",
            )

        # Check Redis connection
        redis_status = "healthy"
        is_healthy, error = await check_redis_health()
        if not is_healthy:
            redis_status = f"unhealthy: {error}"
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Redis unhealthy: {error}",
            )

        return HealthCheck(
            status="healthy",
            version=settings.version,
            database_status=db_status,
            redis_status=redis_status,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )

@router.get(
    "/health/detailed",
    response_model=DetailedHealthCheck,
    tags=["system"],
)
async def detailed_health_check(
    db: MonitoredDB,
    redis: Annotated[Redis, Depends(get_redis)],
) -> DetailedHealthCheck:
    """
    Detailed health check with latency and pool information.
    
    Performs comprehensive health check with:
    - Latency measurements for database and Redis
    - Database connection pool statistics
    - Redis connection status and metrics
    - Query performance metrics
    - Environment information
    
    Requires authentication in production.
    """
    import time

    # Check database latency
    db_status = "healthy"
    db_latency = 0.0
    try:
        start = time.time()
        await db.execute("SELECT 1")
        db_latency = (time.time() - start) * 1000
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unhealthy: {str(e)}",
        )

    # Check Redis health and latency
    redis_status = "healthy"
    redis_latency = 0.0
    redis_error = None
    try:
        start = time.time()
        is_healthy, error = await check_redis_health()
        redis_latency = (time.time() - start) * 1000
        
        if not is_healthy:
            redis_status = f"unhealthy: {error}"
            redis_error = error
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Redis unhealthy: {error}",
            )
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"
        redis_error = str(e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Redis unhealthy: {str(e)}",
        )

    # Get database pool statistics
    pool_stats = get_pool_stats()
    
    # Log pool statistics for monitoring
    await log_pool_stats()

    # Get query performance metrics
    query_stats = QueryStats(
        total_queries=QUERY_COUNT._value.sum(),
        slow_queries=SLOW_QUERIES._value.sum(),
        avg_duration_ms=QUERY_DURATION._sum.sum() / max(QUERY_DURATION._count.sum(), 1) * 1000,
        p95_duration_ms=QUERY_DURATION.quantile(0.95) * 1000,
        p99_duration_ms=QUERY_DURATION.quantile(0.99) * 1000,
    )

    return DetailedHealthCheck(
        status="healthy",
        version=settings.version,
        database_status=db_status,
        redis_status=redis_status,
        database_latency_ms=round(db_latency, 2),
        redis_latency_ms=round(redis_latency, 2),
        environment=settings.environment,
        database_pool=DatabasePoolStats(
            size=pool_stats["size"],
            checked_in=pool_stats["checked_in"],
            checked_out=pool_stats["checked_out"],
            overflow=pool_stats["overflow"],
        ),
        redis_stats=RedisStats(
            connected=redis_error is None,
            latency_ms=round(redis_latency, 2),
            error_message=redis_error,
        ),
        query_stats=query_stats,
    ) 