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
from app.core.logging import setup_logging
from app.db.session import get_db, engine
from app.db.base import Base
from app.core.redis import get_redis, redis_client
from app.api.v1.api import api_router
from app.api.endpoints import metrics
from app.worker.email_worker import email_worker
from app.api.middleware import setup_security_middleware, setup_validation_middleware
from app.core.metrics import get_metrics

# Set up structured logging
setup_logging(settings.model_dump())
logger = structlog.get_logger()

class HealthCheck(BaseModel):
    """Health check response model."""
    
    status: str = "healthy"
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
    """Application lifespan context manager."""
    # Initialize services
    await init_db()
    await init_redis()
    
    # Initialize metrics
    get_metrics()
    
    # Start background workers
    email_worker.start()
    
    logger.info(
        "application_startup",
        environment=settings.environment,
        debug=settings.debug,
    )
    
    yield
    
    # Cleanup
    await close_redis()
    email_worker.stop()
    
    logger.info("application_shutdown")

def custom_openapi():
    """Generate custom OpenAPI schema."""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=settings.app_name,
        version=settings.version,
        description=__doc__,
        routes=app.routes,
    )
    
    # Custom OpenAPI modifications
    openapi_schema["info"]["x-logo"] = {
        "url": "https://neoforge.dev/logo.png"
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description=__doc__,
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url="/api/openapi.json" if settings.environment != "production" else None,
)

# Override the default OpenAPI schema
app.openapi = custom_openapi

# Set up middleware
setup_security_middleware(app)
setup_validation_middleware(app)

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

# Add metrics endpoint
app.include_router(metrics.router, tags=["monitoring"])

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Custom Swagger UI."""
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{settings.app_name} - API Documentation",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="/static/swagger-ui-bundle.js",
        swagger_css_url="/static/swagger-ui.css",
    )

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

        response = HealthCheck(
            status="healthy",
            version=settings.version,
            database_status=db_status,
            redis_status=redis_status,
        )
        logger.info("Health check response", response=response.model_dump())
        return response

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