#!/usr/bin/env python
"""
Standalone Celery Worker Process

This script runs the Celery worker as a standalone process, separate from the main API.
It processes background tasks (primarily email sending) using the configured Celery app.

Usage:
    python -m app.worker.run_worker

    # Or with specific options:
    celery -A app.core.celery:celery_app worker --loglevel=info --queues=email,default
"""
import logging
import signal
import sys

import structlog

from app.core.celery import celery_app
from app.core.config import get_settings
from app.core.logging import setup_logging

# Get settings
settings = get_settings()

# Set up structured logging
setup_logging(settings.model_dump())
logger = structlog.get_logger()


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    logger.info(f"Received signal {signum}, shutting down worker...")
    # Celery will handle graceful shutdown
    sys.exit(0)


def main():
    """Main entry point for the Celery worker."""

    # Initialize OpenTelemetry tracing for worker using enhanced utilities
    from app.core.tracing import setup_instrumentation, setup_otlp_tracer_provider

    provider = setup_otlp_tracer_provider(settings, service_name_suffix="-worker")

    if provider:
        # Set up Celery-specific instrumentation
        setup_instrumentation()
        logger.info("celery_worker_tracing_enabled")

    logger.info(
        "celery_worker_starting",
        environment=settings.environment.value,
        redis_url=str(settings.redis_url),
        queues=["email", "default"],
    )

    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        # Start Celery worker
        # This is equivalent to running:
        # celery -A app.core.celery:celery_app worker --loglevel=info --queues=email,default
        celery_app.worker_main(
            [
                "worker",
                "--loglevel=info",
                "--queues=email,default",
                "--concurrency=2",  # Number of worker processes
                "--prefetch-multiplier=1",  # Tasks to prefetch per worker
                "--max-tasks-per-child=1000",  # Restart worker after N tasks
                "--without-gossip",  # Disable gossip for smaller deployments
                "--without-mingle",  # Disable mingle for faster startup
                "--without-heartbeat",  # Disable heartbeat for simpler monitoring
            ]
        )
    except KeyboardInterrupt:
        logger.info("Worker interrupted by user")
    except Exception as e:
        logger.error(f"Worker failed to start: {e}")
        sys.exit(1)
    finally:
        logger.info("celery_worker_shutdown")


if __name__ == "__main__":
    main()
