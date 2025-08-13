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
import sys
import signal
import logging
import structlog
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.core.celery import celery_app

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
    
    # Initialize OpenTelemetry tracing for worker (if configured)
    try:
        if settings.otel_traces_exporter != "none":
            from opentelemetry import trace
            from opentelemetry.sdk.resources import SERVICE_NAME, Resource
            from opentelemetry.sdk.trace import TracerProvider
            from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
            from opentelemetry.instrumentation.celery import CeleryInstrumentor
            
            # Create resource for worker
            res = Resource(attributes={SERVICE_NAME: f"{settings.otel_service_name}-worker"})
            provider = TracerProvider(resource=res)
            
            # Configure exporter (same logic as main app)
            if settings.otel_traces_exporter == "otlp" and settings.otel_exporter_otlp_endpoint:
                try:
                    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
                    
                    headers = {}
                    if settings.otel_exporter_otlp_headers:
                        for header_pair in settings.otel_exporter_otlp_headers.split(","):
                            if "=" in header_pair:
                                key, value = header_pair.strip().split("=", 1)
                                headers[key.strip()] = value.strip()
                    
                    otlp_exporter = OTLPSpanExporter(
                        endpoint=settings.otel_exporter_otlp_endpoint,
                        headers=headers if headers else None,
                    )
                    processor = BatchSpanProcessor(otlp_exporter)
                    logger.info("celery_worker_otlp_exporter_configured")
                except ImportError:
                    processor = BatchSpanProcessor(ConsoleSpanExporter())
                    logger.warning("celery_worker_otlp_unavailable", fallback="console")
            else:
                processor = BatchSpanProcessor(ConsoleSpanExporter())
                logger.info("celery_worker_console_exporter_configured")
            
            provider.add_span_processor(processor)
            trace.set_tracer_provider(provider)
            
            # Instrument Celery for automatic trace propagation
            CeleryInstrumentor().instrument()
            logger.info("celery_worker_tracing_enabled")
    except Exception as e:
        logger.warning("celery_worker_tracing_setup_failed", error=str(e))
    
    logger.info(
        "celery_worker_starting",
        environment=settings.environment.value,
        redis_url=str(settings.redis_url),
        queues=["email", "default"]
    )
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Start Celery worker
        # This is equivalent to running: 
        # celery -A app.core.celery:celery_app worker --loglevel=info --queues=email,default
        celery_app.worker_main([
            'worker',
            '--loglevel=info',
            '--queues=email,default',
            '--concurrency=2',  # Number of worker processes
            '--prefetch-multiplier=1',  # Tasks to prefetch per worker
            '--max-tasks-per-child=1000',  # Restart worker after N tasks
            '--without-gossip',  # Disable gossip for smaller deployments
            '--without-mingle',  # Disable mingle for faster startup
            '--without-heartbeat',  # Disable heartbeat for simpler monitoring
        ])
    except KeyboardInterrupt:
        logger.info("Worker interrupted by user")
    except Exception as e:
        logger.error(f"Worker failed to start: {e}")
        sys.exit(1)
    finally:
        logger.info("celery_worker_shutdown")

if __name__ == "__main__":
    main()