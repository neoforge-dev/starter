"""Health check endpoints."""
from typing import Annotated, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.core.redis import get_redis
from app.db.metrics import get_pool_stats, log_pool_stats

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

class DetailedHealthCheck(HealthCheck):
    """Detailed health check response with component information."""
    database_latency_ms: float
    redis_latency_ms: float
    environment: str
    database_pool: DatabasePoolStats

@router.get(
    "/health",
    response_model=HealthCheck,
    tags=["system"],
)
async def health_check(
    db: Annotated[AsyncSession, Depends(get_db)],
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
        try:
            await redis.ping()
        except Exception as e:
            redis_status = f"unhealthy: {str(e)}"
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Redis unhealthy: {str(e)}",
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
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
) -> DetailedHealthCheck:
    """
    Detailed health check with latency and pool information.
    
    Performs comprehensive health check with:
    - Latency measurements for database and Redis
    - Database connection pool statistics
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

    # Check Redis latency
    redis_status = "healthy"
    redis_latency = 0.0
    try:
        start = time.time()
        await redis.ping()
        redis_latency = (time.time() - start) * 1000
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Redis unhealthy: {str(e)}",
        )

    # Get database pool statistics
    pool_stats = get_pool_stats()
    
    # Log pool statistics for monitoring
    await log_pool_stats()

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
    ) 