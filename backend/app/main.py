"""
NeoForge Backend API.

A modern, cost-efficient starter kit for bootstrapped founders.
"""
from contextlib import asynccontextmanager
from typing import Annotated, AsyncGenerator
import time

import structlog
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.config import settings
from app.db.session import get_db
from app.core.redis import get_redis
from app.api.v1.api import api_router

logger = structlog.get_logger()

class HealthCheck(BaseModel):
    """Health check response model."""
    
    status: str
    version: str
    database_status: str
    redis_status: str

class DetailedHealthCheck(HealthCheck):
    """Detailed health check response with component information."""
    
    database_latency_ms: float
    redis_latency_ms: float
    environment: str

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Handle application lifespan events.
    
    Args:
        app: FastAPI application instance
    """
    logger.info("Starting up application")
    yield
    logger.info("Shutting down application")

app = FastAPI(
    title="NeoForge API",
    description="Modern starter kit for bootstrapped founders",
    version=settings.version,
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")

@app.get(
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
            await db.execute(text("SELECT 1"))
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
        logger.exception("Health check failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )

@app.get(
    "/health/detailed",
    response_model=DetailedHealthCheck,
    tags=["system"],
)
async def detailed_health_check(
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
) -> DetailedHealthCheck:
    """
    Detailed health check with latency information.
    
    Performs comprehensive health check with latency measurements.
    Requires authentication in production.
    """
    # Check database latency
    db_status = "healthy"
    db_latency = 0.0
    try:
        start = time.time()
        await db.execute(text("SELECT 1"))
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

    return DetailedHealthCheck(
        status="healthy",
        version=settings.version,
        database_status=db_status,
        redis_status=redis_status,
        database_latency_ms=round(db_latency, 2),
        redis_latency_ms=round(redis_latency, 2),
        environment=settings.environment,
    ) 