"""Enhanced logging configuration with correlation IDs and security logging."""
import logging
import sys
import time
import uuid
from typing import Any, Dict, Optional
import contextvars
import json

import structlog
from structlog.types import EventDict, Processor
from structlog import contextvars as structlog_contextvars

# Context variables for correlation tracking
correlation_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar(
    'correlation_id', default=None
)
request_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar(
    'request_id', default=None
)
user_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar(
    'user_id', default=None
)
session_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar(
    'session_id', default=None
)


def get_correlation_id() -> str:
    """Get or create a correlation ID for request tracking."""
    correlation_id = correlation_id_ctx.get()
    if not correlation_id:
        correlation_id = str(uuid.uuid4())
        correlation_id_ctx.set(correlation_id)
    return correlation_id


def set_request_context(
    request_id: Optional[str] = None,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    correlation_id: Optional[str] = None
) -> None:
    """Set request context for logging."""
    if request_id:
        request_id_ctx.set(request_id)
    if user_id:
        user_id_ctx.set(user_id)
    if session_id:
        session_id_ctx.set(session_id)
    if correlation_id:
        correlation_id_ctx.set(correlation_id)
    else:
        # Always ensure we have a correlation ID
        get_correlation_id()


def add_correlation_id(_: Any, __: Any, event_dict: EventDict) -> EventDict:
    """Add correlation ID to the event dict."""
    correlation_id = correlation_id_ctx.get()
    if correlation_id:
        event_dict["correlation_id"] = correlation_id
    
    request_id = request_id_ctx.get()
    if request_id:
        event_dict["request_id"] = request_id
    
    user_id = user_id_ctx.get()
    if user_id:
        event_dict["user_id"] = user_id
    
    session_id = session_id_ctx.get()
    if session_id:
        event_dict["session_id"] = session_id
    
    return event_dict


def add_trace_id(_: Any, __: Any, event_dict: EventDict) -> EventDict:
    """Add OpenTelemetry trace_id to the event dict if available."""
    try:
        from opentelemetry import trace as _otel_trace  # type: ignore

        span = _otel_trace.get_current_span()
        ctx = span.get_span_context() if span else None
        if ctx and getattr(ctx, "trace_id", 0):
            event_dict["trace_id"] = f"{ctx.trace_id:032x}"
            event_dict["span_id"] = f"{ctx.span_id:016x}"
    except Exception:
        # Best-effort; do not block logging
        pass
    return event_dict


def add_security_context(_: Any, __: Any, event_dict: EventDict) -> EventDict:
    """Add security-related context to logs."""
    # Add log classification for security monitoring
    event_message = event_dict.get("event", "")
    event_level = event_dict.get("level", "").upper()
    
    # Security event classification
    security_keywords = [
        "login", "logout", "authentication", "authorization", "password",
        "token", "access", "permission", "security", "breach", "attack",
        "suspicious", "failed", "error", "unauthorized", "forbidden"
    ]
    
    if any(keyword in str(event_message).lower() for keyword in security_keywords):
        event_dict["log_category"] = "security"
        
        # Add security severity
        if event_level in ["ERROR", "CRITICAL"]:
            event_dict["security_severity"] = "high"
        elif event_level == "WARNING":
            event_dict["security_severity"] = "medium"
        else:
            event_dict["security_severity"] = "low"
    
    # Performance event classification
    performance_keywords = ["slow", "timeout", "performance", "latency", "response_time"]
    if any(keyword in str(event_message).lower() for keyword in performance_keywords):
        event_dict["log_category"] = "performance"
    
    # Business event classification
    business_keywords = ["user_action", "transaction", "payment", "order", "signup"]
    if any(keyword in str(event_message).lower() for keyword in business_keywords):
        event_dict["log_category"] = "business"
    
    return event_dict


def add_timestamp(_, __, event_dict: EventDict) -> EventDict:
    """Add timestamp to the event dict."""
    event_dict["timestamp"] = time.time()
    event_dict["@timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    return event_dict


def add_environment(config: Dict[str, Any]) -> Processor:
    """Add environment info to the event dict."""
    def processor(_, __, event_dict: EventDict) -> EventDict:
        event_dict["environment"] = config.get("environment", "development")
        event_dict["app_version"] = config.get("version", "unknown")
        event_dict["service_name"] = "neoforge-api"
        event_dict["log_source"] = "application"
        return event_dict
    return processor

def setup_logging(config: Dict[str, Any]) -> None:
    """Configure enhanced structured logging."""
    processors = [
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        # Merge any bound contextvars (e.g., request_id) into the log event
        structlog_contextvars.merge_contextvars,
        add_correlation_id,
        add_trace_id,
        add_security_context,
        add_timestamp,
        add_environment(config),
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