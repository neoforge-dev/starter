import time
from typing import Annotated, Any, Dict

from app.api.deps import MonitoredDB, get_monitored_db
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from redis.asyncio import Redis
from redis.exceptions import ConnectionError as RedisConnectionError
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.redis import get_redis

router = APIRouter()


@router.get("", tags=["health"], summary="Health Check")
async def health_check():
    return {"status": "healthy"}


@router.get("/detailed", tags=["health"], summary="Detailed Health Check")
async def detailed_health_check(
    settings: Annotated[Settings, Depends(get_settings)],
    db: Annotated[MonitoredDB, Depends(get_monitored_db)],
    redis: Annotated[Redis | None, Depends(get_redis)],
) -> JSONResponse:
    start_time = time.time()
    db_status = "healthy"
    db_latency = None
    db_error = None
    redis_status = "healthy"
    redis_latency = None
    redis_error = None
    overall_status = "healthy"
    status_code = 200

    # Check DB health
    db_start = time.time()
    try:
        # Execute a simple query to check connection
        await db.execute(text("SELECT 1"))
        db_latency = (time.time() - db_start) * 1000  # Latency in ms
    except SQLAlchemyError as e:
        db_status = "unhealthy"
        db_error = str(e)
        overall_status = "unhealthy"
        status_code = 503
    except Exception as e:
        db_status = "unhealthy"
        db_error = f"Unexpected error: {str(e)}"
        overall_status = "unhealthy"
        status_code = 503

    # Check Redis health
    redis_start = time.time()
    if redis:
        try:
            await redis.ping()
            redis_latency = (time.time() - redis_start) * 1000
        except RedisConnectionError as e:
            redis_status = "unhealthy"
            redis_error = str(e)
            overall_status = "unhealthy"
            status_code = 503
        except Exception as e:
            redis_status = "unhealthy"
            redis_error = f"Unexpected Redis error: {str(e)}"
            overall_status = "unhealthy"
            status_code = 503
    else:
        redis_status = "unhealthy"
        redis_error = "Redis dependency failed to yield connection."
        overall_status = "unhealthy"
        status_code = 503

    # Determine final overall status based on components
    if db_status == "unhealthy" or redis_status == "unhealthy":
        overall_status = "unhealthy"
        status_code = 503
    else:
        overall_status = "healthy"
        status_code = 200

    response_data = {
        "status": overall_status,
        "version": settings.version,
        "database_status": db_status,
        "redis_status": redis_status,
        "database_latency_ms": round(db_latency, 2) if db_latency is not None else None,
        "redis_latency_ms": round(redis_latency, 2)
        if redis_latency is not None
        else None,
        "environment": settings.environment.value,
    }
    if db_error:
        response_data["database_error"] = db_error
    if redis_error:
        response_data["redis_error"] = redis_error

    # Return JSONResponse with the *final determined* status code
    return JSONResponse(content=response_data, status_code=status_code)


@router.get("/db", tags=["health"], summary="Database Health Check")
async def database_health_check(
    db: Annotated[MonitoredDB, Depends(get_monitored_db)]
) -> JSONResponse:
    """Check database connectivity specifically."""
    start_time = time.time()
    
    try:
        # Execute a simple query to check connection
        await db.execute(text("SELECT 1"))
        latency = (time.time() - start_time) * 1000  # Latency in ms
        
        return JSONResponse(
            content={
                "status": "healthy",
                "latency_ms": round(latency, 2),
                "timestamp": time.time()
            },
            status_code=200
        )
    except SQLAlchemyError as e:
        return JSONResponse(
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": time.time()
            },
            status_code=503
        )
    except Exception as e:
        return JSONResponse(
            content={
                "status": "unhealthy",
                "error": f"Unexpected error: {str(e)}",
                "timestamp": time.time()
            },
            status_code=503
        )


@router.get("/cache", tags=["health"], summary="Cache Health Check")
async def cache_health_check(
    redis: Annotated[Redis | None, Depends(get_redis)]
) -> JSONResponse:
    """Check Redis cache connectivity specifically."""
    start_time = time.time()
    
    if redis is None:
        return JSONResponse(
            content={
                "status": "unhealthy",
                "error": "Redis dependency failed to yield connection",
                "timestamp": time.time()
            },
            status_code=503
        )
    
    try:
        # Ping Redis to check connection
        await redis.ping()
        latency = (time.time() - start_time) * 1000  # Latency in ms
        
        return JSONResponse(
            content={
                "status": "healthy",
                "latency_ms": round(latency, 2),
                "timestamp": time.time()
            },
            status_code=200
        )
    except RedisConnectionError as e:
        return JSONResponse(
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": time.time()
            },
            status_code=503
        )
    except Exception as e:
        return JSONResponse(
            content={
                "status": "unhealthy",
                "error": f"Unexpected Redis error: {str(e)}",
                "timestamp": time.time()
            },
            status_code=503
        )
