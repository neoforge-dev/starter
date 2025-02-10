"""Health check endpoints."""
from typing import Annotated, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ValidationError
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.config import settings
from app.db.session import get_db
from app.core.redis import get_redis, check_redis_health
from app.db.metrics import get_pool_stats, log_pool_stats
from app.db.query_monitor import QueryMonitor
from app.core.metrics import get_metrics
from app.api.deps import MonitoredDB, get_monitored_db

router = APIRouter()

# Initialize metrics
metrics = get_metrics()

class HealthCheck(BaseModel):
    """Health check response model."""
    status: str
    version: str
    database_status: str
    redis_status: str

class DatabasePoolStats(BaseModel):
    """Database connection pool statistics."""
    size: int = 0
    checked_in: int = 0
    checked_out: int = 0
    overflow: int = 0

class QueryStats(BaseModel):
    """Query performance statistics."""
    total_queries: int = 0
    slow_queries: int = 0
    avg_duration_ms: float = 0.0
    p95_duration_ms: float = 0.0
    p99_duration_ms: float = 0.0

class RedisStats(BaseModel):
    """Redis statistics."""
    connected: bool = True
    latency_ms: float = 0.0
    error_message: str | None = None

class DetailedHealthCheck(HealthCheck):
    """Detailed health check response with component information."""
    database_latency_ms: float = 0.0
    redis_latency_ms: float = 0.0
    environment: str
    database_pool: DatabasePoolStats = DatabasePoolStats()
    redis_stats: RedisStats = RedisStats()
    query_stats: QueryStats = QueryStats()

@router.get(
    "/health",
    response_model=None,
    tags=["system"],
)
async def health_check(
    db: MonitoredDB,
    redis: Annotated[Redis, Depends(get_redis)],
) -> Dict:
    """
    Check API health status.
    
    Performs basic health check of the API and its dependencies.
    Returns 200 if healthy, 503 if unhealthy.
    """
    db_status = "healthy"
    redis_status = "healthy"
    is_healthy = True
    error_details = []

    # Check database connection
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        is_healthy = False
        error_details.append(f"Database unhealthy: {str(e)}")

    # Check Redis connection
    try:
        redis_healthy, error = await check_redis_health(redis)
        if not redis_healthy:
            redis_status = f"unhealthy: {error}"
            is_healthy = False
            error_details.append(f"Redis unhealthy: {error}")
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"
        is_healthy = False
        error_details.append(f"Redis unhealthy: {str(e)}")

    response_data = {
        "status": "healthy" if is_healthy else "unhealthy",
        "version": settings.version,
        "database_status": db_status,
        "redis_status": redis_status,
    }

    if not is_healthy:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"message": "Service unhealthy", "errors": error_details},
        )

    try:
        return HealthCheck(**response_data)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"message": "Health check validation failed", "errors": [str(e)]},
        )

@router.get(
    "/health/detailed",
    response_model=None,
    tags=["system"],
)
async def detailed_health_check(
    db: Annotated[MonitoredDB, Depends(get_monitored_db)],
    redis: Annotated[Redis, Depends(get_redis)],
) -> Dict:
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

    db_status = "healthy"
    redis_status = "healthy"
    db_latency = 0.0
    redis_latency = 0.0
    redis_error = None
    is_healthy = True
    errors = []

    # Check database latency
    try:
        start = time.time()
        await db.execute(text("SELECT 1"))
        db_latency = (time.time() - start) * 1000
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        errors.append(f"Database unhealthy: {str(e)}")
        is_healthy = False
        db_latency = 0.0

    # Check Redis health and latency
    try:
        start = time.time()
        redis_healthy, error = await check_redis_health(redis)
        redis_latency = (time.time() - start) * 1000
        
        if not redis_healthy:
            redis_status = f"unhealthy: {error}"
            redis_error = error
            errors.append(f"Redis unhealthy: {error}")
            is_healthy = False
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"
        redis_error = str(e)
        errors.append(f"Redis unhealthy: {str(e)}")
        is_healthy = False
        redis_latency = 0.0

    # Get database pool statistics
    try:
        pool_stats = get_pool_stats()
    except Exception as e:
        pool_stats = DatabasePoolStats().dict()
        errors.append(f"Pool stats error: {str(e)}")
        is_healthy = False

    # Get query performance metrics
    try:
        query_count = metrics["db_query_count"]
        query_duration = metrics["db_query_duration"]
        slow_queries = metrics["db_slow_queries"]
        
        total_queries = sum(query_count._value.values())
        total_slow = sum(slow_queries._value.values())
        total_duration_count = query_duration._count.sum()
        total_duration_sum = query_duration._sum.sum()
        
        query_stats = QueryStats(
            total_queries=total_queries or 0,
            slow_queries=total_slow or 0,
            avg_duration_ms=(total_duration_sum / max(total_duration_count, 1) * 1000) if total_duration_count else 0.0,
            p95_duration_ms=query_duration.quantile(0.95) * 1000 if total_duration_count else 0.0,
            p99_duration_ms=query_duration.quantile(0.99) * 1000 if total_duration_count else 0.0,
        )
    except (AttributeError, ZeroDivisionError, KeyError):
        # Handle case when metrics are not initialized
        query_stats = QueryStats()

    # Create response data
    response_data = {
        "status": "healthy" if is_healthy else "unhealthy",
        "version": settings.version,
        "database_status": db_status,
        "redis_status": redis_status,
        "database_latency_ms": db_latency,
        "redis_latency_ms": redis_latency,
        "environment": settings.environment,
        "database_pool": DatabasePoolStats(**pool_stats),
        "redis_stats": RedisStats(
            connected=is_healthy,
            latency_ms=redis_latency,
            error_message=redis_error,
        ),
        "query_stats": query_stats,
    }

    # If any service is unhealthy, raise 503 immediately
    if not is_healthy:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"message": "Service unhealthy", "errors": errors},
        )

    try:
        # Create and return response object
        return DetailedHealthCheck(**response_data)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"message": "Health check validation failed", "errors": [str(e)]},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"message": "Health check failed", "errors": [str(e)]},
        )