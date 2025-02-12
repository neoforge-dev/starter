"""Health check endpoints."""
from typing import Annotated, Dict, Optional, Any
import time
import os

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ValidationError, Field
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

START_TIME = time.time()

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

class DetailedHealthResponse(BaseModel):
    """Detailed health check response."""
    status: str = Field(..., description="Overall health status")
    version: str = Field(..., description="Application version")
    database_status: str = Field(..., alias="databaseStatus", description="Database health status")
    redis_status: str = Field(..., alias="redisStatus", description="Redis health status")
    database_latency_ms: float = Field(..., description="Database latency in milliseconds")
    redis_latency_ms: float = Field(..., description="Redis latency in milliseconds")
    environment: str = Field(..., description="Application environment")
    pool_stats: Optional[dict] = Field(None, alias="poolStats", description="Database pool statistics")
    uptime: float = Field(..., description="Application uptime in seconds")
    load_avg: list[float] = Field(..., alias="loadAvg", description="System load averages")
    errors: Optional[list[str]] = Field(None, description="List of errors if any")

@router.get(
    "/health",
    response_model=None,
    tags=["system"],
)
async def health_check(
    db: Annotated[Any, Depends(get_monitored_db)],
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
    response_model=DetailedHealthResponse,
    responses={503: {"description": "Service Unavailable"}},
)
async def detailed_health_check(
    db: AsyncSession = Depends(get_monitored_db),
    redis: Redis = Depends(get_redis),
) -> DetailedHealthResponse:
    """
    Get detailed health status of the application.
    """
    db_start = time.time()
    db_healthy, db_status = await check_db_health(db)
    db_latency = (time.time() - db_start) * 1000

    redis_start = time.time()
    redis_healthy, redis_status = await check_redis_health(redis)
    redis_latency = (time.time() - redis_start) * 1000

    errors = []
    if not db_healthy:
        errors.append(db_status)
    if not redis_healthy:
        errors.append(redis_status)

    response = DetailedHealthResponse(
        status="healthy" if (db_healthy and redis_healthy) else "unhealthy",
        version=settings.version,
        database_status=db_status,
        redis_status=redis_status,
        database_latency_ms=db_latency,
        redis_latency_ms=redis_latency,
        environment=settings.environment,
        pool_stats=getattr(db, 'pool_stats', None),
        uptime=time.time() - START_TIME,
        load_avg=list(os.getloadavg()),
        errors=errors if errors else None
    )

    if not db_healthy or not redis_healthy:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"message": "Service unhealthy", "errors": errors},
        )

    return response

async def check_db_health(db: Any) -> tuple[bool, str]:
    """Check database health by executing a simple query."""
    try:
        if not hasattr(db, 'execute'):
            return False, "Database connection not available"
        try:
            await db.execute(text("SELECT 1"))
            return True, "healthy"
        except Exception as e:
            return False, f"Database error: {str(e)}"
    except Exception as e:
        return False, f"Database error: {str(e)}"