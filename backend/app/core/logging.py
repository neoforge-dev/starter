"""Logging configuration."""
import logging
import sys
import time
from typing import Any, Dict

import structlog
from structlog.types import EventDict, Processor
from structlog import contextvars as structlog_contextvars


def add_trace_id(_: Any, __: Any, event_dict: EventDict) -> EventDict:
    """Add OpenTelemetry trace_id to the event dict if available."""
    try:
        from opentelemetry import trace as _otel_trace  # type: ignore

        span = _otel_trace.get_current_span()
        ctx = span.get_span_context() if span else None
        if ctx and getattr(ctx, "trace_id", 0):
            event_dict["trace_id"] = f"{ctx.trace_id:032x}"
    except Exception:
        # Best-effort; do not block logging
        pass
    return event_dict

def add_timestamp(_, __, event_dict: EventDict) -> EventDict:
    """Add timestamp to the event dict."""
    event_dict["timestamp"] = time.time()
    return event_dict

def add_environment(config: Dict[str, Any]) -> Processor:
    """Add environment info to the event dict."""
    def processor(_, __, event_dict: EventDict) -> EventDict:
        event_dict["environment"] = config.get("environment", "development")
        event_dict["app_version"] = config.get("version", "unknown")
        return event_dict
    return processor

def setup_logging(config: Dict[str, Any]) -> None:
    """Configure structured logging."""
    processors = [
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        # Merge any bound contextvars (e.g., request_id) into the log event
        structlog_contextvars.merge_contextvars,
        add_timestamp,
        add_environment(config),
        add_trace_id,
        structlog.processors.JSONRenderer()
    ]

    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Set up stdlib logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )

    # Redirect uvicorn logs to structlog
    logging.getLogger("uvicorn").handlers = []
    logging.getLogger("uvicorn.access").handlers = []
    logging.getLogger("uvicorn.error").handlers = []

    # Set log level based on config
    log_level = logging.DEBUG if config.get("debug", False) else logging.INFO
    logging.getLogger().setLevel(log_level)

# Create a logger instance to be used throughout the application
logger = structlog.get_logger() 