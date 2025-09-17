"""Application configuration module for FastAPI setup."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import TYPE_CHECKING

import structlog
from fastapi import FastAPI

from app.core.logging import setup_logging
from app.core.metrics import get_metrics

if TYPE_CHECKING:
    from app.config.settings import Settings


logger = structlog.get_logger()


class ApplicationConfig:
    """Handles FastAPI application configuration and basic setup."""

    def __init__(self, settings: Settings):
        """Initialize application configuration."""
        self.settings = settings

    def create_app(self) -> FastAPI:
        """Create and configure the base FastAPI application."""
        # Set up structured logging
        setup_logging(self.settings.model_dump())

        app = FastAPI(
            title=self.settings.app_name,
            version=self.settings.version,
            description="NeoForge Backend API. A modern, cost-efficient starter kit for bootstrapped founders.",
            lifespan=self._create_lifespan(),
            docs_url=None,
            redoc_url=None,
            openapi_url="/api/openapi.json"
            if self.settings.environment != "production"
            else None,
        )

        return app

    def _create_lifespan(self):
        """Create the application lifespan context manager."""
        @asynccontextmanager
        async def lifespan(app: FastAPI):
            """Application lifespan context manager."""
            # Initialize services
            await self._init_services()

            # Initialize metrics
            get_metrics()

            # Initialize memory monitoring
            from app.utils.memory_optimization import initialize_memory_monitoring
            await initialize_memory_monitoring()

            # Initialize OpenTelemetry tracing
            self._setup_tracing(app)

            # Start background tasks
            await self._start_background_tasks(app)

            logger.info(
                "application_startup",
                environment=self.settings.environment,
                debug=self.settings.debug,
            )

            yield

            # Cleanup
            await self._cleanup_services(app)

            logger.info("application_shutdown")

        return lifespan

    async def _init_services(self):
        """Initialize core services."""
        # Database initialization
        await self._init_database()

        # Redis initialization
        await self._init_redis()

    async def _init_database(self):
        """Initialize database with performance optimizations."""
        try:
            from app.db.base import Base
            from app.db.session import engine
            from sqlalchemy import text

            # Install required PostgreSQL extensions
            async with engine.begin() as conn:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS btree_gin"))
                logger.info("PostgreSQL extensions installed")

                # Create tables
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database initialized successfully")

            # Skip database optimizations for now (as per main.py)
            logger.info("Database optimization skipped - will be re-enabled after JSON column fixes")

        except Exception as e:
            logger.error("Failed to initialize database", error=str(e))
            raise

    async def _init_redis(self):
        """Initialize Redis connection."""
        try:
            from app.core.redis import redis_client
            await redis_client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.error("Failed to connect to Redis", error=str(e))
            raise

    def _setup_tracing(self, app: FastAPI):
        """Set up OpenTelemetry tracing."""
        try:
            from app.core.tracing import setup_instrumentation, setup_otlp_tracer_provider
            from app.db.session import engine

            settings = self.settings
            provider = setup_otlp_tracer_provider(settings)

            if provider:
                setup_instrumentation(app=app, engine=engine)
        except Exception as e:
            logger.warning("otel_instrumentation_partial_failure", error=str(e))

    async def _start_background_tasks(self, app: FastAPI):
        """Start background maintenance tasks."""
        import asyncio

        async def _cleanup_loop():
            """Periodic cleanup of idempotency keys and sessions."""
            from app.crud.user_session import user_session as user_session_crud
            from app.db.session import AsyncSessionLocal
            from app.utils.idempotency import cleanup_idempotency_keys

            while True:
                try:
                    async with AsyncSessionLocal() as session:
                        await cleanup_idempotency_keys(session, max_age_seconds=86400)
                        await user_session_crud.prune_expired_and_revoked(
                            session, older_than_days=30
                        )
                    await asyncio.sleep(3600)
                except Exception as e:
                    logger.warning("idempotency_cleanup_error", error=str(e))
                    await asyncio.sleep(3600)

        app.state._idem_cleanup_task = asyncio.create_task(_cleanup_loop())

        # Celery integration note
        logger.info(
            "celery_integration_ready",
            note="Celery workers should be started separately using: python -m app.worker.run_worker",
        )

    async def _cleanup_services(self, app: FastAPI):
        """Clean up services on shutdown."""
        # Cancel cleanup task
        try:
            task = getattr(app.state, "_idem_cleanup_task", None)
            if task:
                task.cancel()
        except Exception:
            pass

        # Close Redis connection
        try:
            from app.core.redis import redis_client
            await redis_client.close()
            logger.info("Redis connection closed")
        except Exception as e:
            logger.error("Failed to close Redis connection", error=str(e))

        # Cleanup memory monitoring
        try:
            from app.utils.memory_optimization import cleanup_memory_monitoring
            cleanup_memory_monitoring()
        except Exception:
            pass

        logger.info("celery_integration_shutdown_complete")