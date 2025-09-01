"""
NeoForge Backend API.

A modern, cost-efficient starter kit for bootstrapped founders.
"""
import time
from contextlib import asynccontextmanager
from typing import Annotated, AsyncGenerator

import structlog
from app.api.endpoints import metrics
from app.api.v1.api import api_router
from app.db.base import Base
from app.db.session import engine, get_db
from app.schemas.user import UserResponse
from app.utils.idempotency import cleanup_idempotency_keys
from fastapi import APIRouter, Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps

# Import specific middleware setup functions
from app.api.middleware import (
    setup_http_metrics_middleware,
    setup_security_middleware,
    setup_validation_middleware,
)
from app.core.caching import CacheMiddleware, cache_middleware
from app.core.celery import celery_app
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.core.metrics import get_metrics
from app.core.redis import get_redis, redis_client

# Set up structured logging
setup_logging(get_settings().model_dump())
logger = structlog.get_logger()


class HealthCheck(BaseModel):
    """Health check response model."""

    status: str = "healthy"
    version: str
    database_status: str
    redis_status: str
    celery_status: str


class DetailedHealthCheck(HealthCheck):
    """Detailed health check response with component information."""

    database_latency_ms: float
    redis_latency_ms: float
    environment: str
    celery_details: dict


async def init_db():
    """Initialize database with performance optimizations."""
    try:
        # Install required PostgreSQL extensions
        async with engine.begin() as conn:
            # Install pg_trgm extension for GIN indexes on text columns
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
            # Install btree_gin extension for GIN indexes on various data types including JSON
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS btree_gin"))
            logger.info("PostgreSQL extensions installed")

            # Create tables
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database initialized successfully")

        # Temporarily skip database performance optimizations due to GIN index issues
        # TODO: Fix JSON column types and re-enable optimizations
        logger.info("Database optimization skipped - will be re-enabled after JSON column fixes")
        optimization_results = {"status": "skipped", "reason": "GIN index issues with JSON columns"}

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

    # Initialize memory monitoring
    from app.utils.memory_optimization import initialize_memory_monitoring

    await initialize_memory_monitoring()

    # Initialize OpenTelemetry tracing using enhanced utilities
    from app.core.tracing import setup_instrumentation, setup_otlp_tracer_provider

    settings = get_settings()
    provider = setup_otlp_tracer_provider(settings)

    if provider:
        # Set up automatic instrumentation
        try:
            from app.db.session import engine

            setup_instrumentation(app=app, engine=engine)
        except Exception as e:
            logger.warning("otel_instrumentation_partial_failure", error=str(e))

    # Celery is managed separately - just log that it should be running
    logger.info(
        "celery_integration_ready",
        note="Celery workers should be started separately using: python -m app.worker.run_worker",
    )

    logger.info(
        "application_startup",
        environment=get_settings().environment,
        debug=get_settings().debug,
    )

    # Start background task for periodic idempotency key cleanup (simple loop)
    async def _cleanup_loop():
        from app.crud.user_session import user_session as user_session_crud
        from app.db.session import AsyncSessionLocal

        while True:
            try:
                async with AsyncSessionLocal() as session:
                    await cleanup_idempotency_keys(session, max_age_seconds=86400)
                    # Prune sessions (revoked and old expired)
                    await user_session_crud.prune_expired_and_revoked(
                        session, older_than_days=30
                    )
                await asyncio.sleep(3600)
            except Exception as e:
                logger.warning("idempotency_cleanup_error", error=str(e))
                await asyncio.sleep(3600)

    import asyncio

    app.state._idem_cleanup_task = asyncio.create_task(_cleanup_loop())

    yield

    # Celery workers are managed separately - no cleanup needed in FastAPI app
    logger.info("celery_integration_shutdown_complete")

    # Cancel cleanup task on shutdown
    try:
        task = getattr(app.state, "_idem_cleanup_task", None)
        if task:
            task.cancel()
    except Exception:
        pass

    await close_redis()

    # Cleanup memory monitoring
    from app.utils.memory_optimization import cleanup_memory_monitoring

    cleanup_memory_monitoring()

    logger.info("application_shutdown")


def custom_openapi():
    """Generate custom OpenAPI schema."""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=get_settings().app_name,
        version=get_settings().version,
        description=__doc__,
        routes=app.routes,
    )

    # Custom OpenAPI modifications
    openapi_schema["info"]["x-logo"] = {"url": "https://neoforge.dev/logo.png"}

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app = FastAPI(
    title=get_settings().app_name,
    version=get_settings().version,
    description=__doc__,
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url="/api/openapi.json"
    if get_settings().environment != "production"
    else None,
)

# Override the default OpenAPI schema
app.openapi = custom_openapi

# Set up CORS first with environment-specific configuration
if get_settings().cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in get_settings().cors_origins],
        allow_credentials=get_settings().cors_credentials,
        allow_methods=get_settings().cors_methods,
        allow_headers=get_settings().cors_headers,
    )
    logger.info(
        "cors_configured",
        origins=get_settings().cors_origins,
        methods=get_settings().cors_methods,
        credentials=get_settings().cors_credentials,
        environment=get_settings().environment,
    )

# Set up HTTP metrics middleware (should be early to capture all requests)
setup_http_metrics_middleware(app)

# Set up security and validation middleware
setup_security_middleware(app)
setup_validation_middleware(app)

# Set up tenant middleware for multi-tenant architecture
from app.api.middleware.tenant import TenantMiddleware

app.add_middleware(
    TenantMiddleware,
    default_tenant_slug="default",
    cache_ttl=300,  # 5 minutes
    enable_domain_resolution=True,
    enable_header_resolution=True,
)

# Set up HTTP caching middleware for performance optimization
from app.api.middleware.caching import setup_caching_middleware

setup_caching_middleware(
    app,
    cache_ttl=600,  # 10 minutes for production efficiency
    max_cache_size=2000,  # Increased cache size for better hit rates
    enable_middleware=True,
)

# Set up memory optimization middleware
from app.utils.memory_optimization import setup_memory_optimization

setup_memory_optimization(app)

# Add API router
app.include_router(api_router, prefix=get_settings().api_v1_str)

# Add metrics endpoint
app.include_router(metrics.router, tags=["monitoring"])

# Add a router specifically for testing dependencies
# This should ideally only be active in test environments
if get_settings().environment == "test":
    test_deps_router = APIRouter()

    @test_deps_router.get(
        "/test-deps/current-user",
        response_model=UserResponse,
        tags=["test_dependencies"],
    )
    async def test_get_current_user_dependency(
        current_user: Annotated[UserResponse, Depends(deps.get_current_user)]
    ) -> UserResponse:
        """Test endpoint specifically for testing get_current_user dependency."""
        return current_user

    app.include_router(test_deps_router)


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Custom Swagger UI."""
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{get_settings().app_name} - API Documentation",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="/static/swagger-ui-bundle.js",
        swagger_css_url="/static/swagger-ui.css",
    )


@app.get("/health", response_model=HealthCheck, tags=["system"])
async def health_check(
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
) -> HealthCheck:
    """Check API health status with dependency statuses."""
    db_status = "healthy"
    redis_status = "healthy"
    celery_status = "healthy"

    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    try:
        await redis.ping()
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"

    # Check Celery status by inspecting active workers
    try:
        # Check if Celery can connect to broker (Redis)
        inspect = celery_app.control.inspect()
        active_workers = inspect.active()
        if active_workers is None or len(active_workers) == 0:
            celery_status = "no_workers"
        else:
            # Check if any workers are available
            total_workers = sum(len(tasks) for tasks in active_workers.values())
            celery_status = (
                f"healthy ({len(active_workers)} workers, {total_workers} active tasks)"
            )
    except Exception as e:
        celery_status = f"error: {str(e)}"

    # Overall status is healthy only if all components are healthy
    all_healthy = all(
        "healthy" in str(status) for status in [db_status, redis_status, celery_status]
    )
    overall_status = "healthy" if all_healthy else "unhealthy"

    return HealthCheck(
        status=overall_status,
        version=get_settings().version,
        database_status=db_status,
        redis_status=redis_status,
        celery_status=celery_status,
    )


@app.get("/ready", tags=["system"])
async def readiness_probe(
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
) -> dict:
    """K8s-friendly readiness check: 200 only when DB and Redis are reachable."""
    db_ok = True
    redis_ok = True
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False
    try:
        await redis.ping()
    except Exception:
        redis_ok = False
    overall_ok = db_ok and redis_ok
    status_code = 200 if overall_ok else 503
    from fastapi.responses import JSONResponse

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ready" if overall_ok else "not_ready",
            "database": "ok" if db_ok else "error",
            "redis": "ok" if redis_ok else "error",
        },
    )


@app.get("/health/detailed", response_model=DetailedHealthCheck, tags=["system"])
async def detailed_health_check(
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
) -> DetailedHealthCheck:
    """Detailed health check with latency information."""
    import time

    db_status = "healthy"
    redis_status = "healthy"
    celery_status = "healthy"

    t_db = time.perf_counter()
    try:
        await db.execute(text("SELECT 1"))
        db_latency = (time.perf_counter() - t_db) * 1000
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        db_latency = 0.0

    t_redis = time.perf_counter()
    try:
        await redis.ping()
        redis_latency = (time.perf_counter() - t_redis) * 1000
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"
        redis_latency = 0.0

    # Get detailed Celery status
    celery_details = {}
    try:
        inspect = celery_app.control.inspect()
        active_workers = inspect.active() or {}
        registered_tasks = inspect.registered() or {}
        stats = inspect.stats() or {}

        celery_details = {
            "active_workers": list(active_workers.keys()),
            "worker_count": len(active_workers),
            "active_tasks_total": sum(len(tasks) for tasks in active_workers.values()),
            "registered_tasks": list(set().union(*registered_tasks.values()))
            if registered_tasks
            else [],
            "worker_stats": stats,
        }

        if len(active_workers) == 0:
            celery_status = "no_workers"
        else:
            celery_status = "healthy"

    except Exception as e:
        celery_status = f"error: {str(e)}"
        celery_details = {"error": str(e)}

    all_healthy = all(
        "healthy" in str(status) for status in [db_status, redis_status, celery_status]
    )
    overall_status = "healthy" if all_healthy else "unhealthy"

    return DetailedHealthCheck(
        status=overall_status,
        version=get_settings().version,
        database_status=db_status,
        redis_status=redis_status,
        celery_status=celery_status,
        database_latency_ms=round(db_latency, 2),
        redis_latency_ms=round(redis_latency, 2),
        environment=get_settings().environment,
        celery_details=celery_details,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
