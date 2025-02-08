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
from fastapi.openapi.utils import get_openapi
from fastapi.openapi.docs import get_swagger_ui_html
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.config import settings
from app.db.session import get_db, engine
from app.db.base import Base
from app.core.redis import get_redis, redis_client
from app.api.v1.api import api_router
from app.worker.email_worker import email_worker
from app.api.middleware import setup_middleware

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

async def init_db():
    """Initialize database."""
    try:
        # Create tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error("Failed to initialize database", error=str(e))
        raise

async def init_redis():
    """Initialize Redis connection."""
    try:
        await redis_client.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.error("Failed to connect to Redis", error=str(e))
        raise

async def close_redis():
    """Close Redis connection."""
    try:
        await redis_client.close()
        logger.info("Redis connection closed")
    except Exception as e:
        logger.error("Failed to close Redis connection", error=str(e))

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for FastAPI app."""
    # Startup
    await init_db()
    await init_redis()
    
    yield
    
    # Shutdown
    await close_redis()

def custom_openapi():
    """Generate custom OpenAPI schema."""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=settings.project_name,
        version=settings.version,
        description="""
        NeoForge Backend API Documentation.
        
        ## Authentication
        Most endpoints require authentication using JWT Bearer tokens.
        Get your token from the /api/auth/token endpoint.
        
        ## Rate Limiting
        Public endpoints are rate-limited to prevent abuse.
        Authenticated endpoints have higher limits.
        
        ## Error Handling
        The API uses standard HTTP status codes and returns detailed error messages.
        """,
        routes=app.routes,
        tags=[
            {"name": "auth", "description": "Authentication operations"},
            {"name": "users", "description": "User management operations"},
            {"name": "items", "description": "Item CRUD operations"},
            {"name": "admin", "description": "Admin-only operations"},
            {"name": "system", "description": "System health and monitoring"},
            {"name": "email", "description": "Email operations and tracking"},
        ]
    )
    
    # Add security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    openapi_url=f"{settings.api_v1_str}/openapi.json",
    docs_url=f"{settings.api_v1_str}/docs",
    redoc_url=f"{settings.api_v1_str}/redoc",
    lifespan=lifespan,
    description=__doc__,
)

# Override the default OpenAPI schema
app.openapi = custom_openapi

# Set up middleware
setup_middleware(app)

# Set up CORS
if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.cors_origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Add API router
app.include_router(api_router, prefix=settings.api_v1_str)

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