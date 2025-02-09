"""Core metrics module."""
from typing import Dict, Any
from prometheus_client import (
    REGISTRY,
    Counter,
    Gauge,
    Histogram,
)

_metrics = {}

def get_metrics() -> Dict[str, Any]:
    """Get or create metrics."""
    global _metrics
    if not _metrics:
        try:
            # Define metrics
            _metrics["http_request_duration_seconds"] = Histogram(
                "http_request_duration_seconds",
                "HTTP request duration in seconds",
                ["method", "endpoint"],
                registry=REGISTRY,
            )

            _metrics["http_requests_total"] = Counter(
                "http_requests_total",
                "Total number of HTTP requests",
                ["method", "endpoint", "status"],
                registry=REGISTRY,
            )

            _metrics["db_pool_size"] = Gauge(
                "db_pool_size",
                "Database connection pool size",
                registry=REGISTRY,
            )

            _metrics["redis_connected"] = Gauge(
                "redis_connected",
                "Redis connection status (1 for connected, 0 for disconnected)",
                registry=REGISTRY,
            )

            _metrics["email_metrics"] = {
                "sent": Gauge(
                    "emails_sent_total",
                    "Total number of emails sent",
                    registry=REGISTRY,
                ),
                "delivered": Gauge(
                    "emails_delivered_total",
                    "Total number of emails delivered",
                    registry=REGISTRY,
                ),
                "failed": Gauge(
                    "emails_failed_total",
                    "Total number of emails that failed to send",
                    registry=REGISTRY,
                ),
            }
        except ValueError:
            # If metrics are already registered, get them from the registry
            _metrics = {}
            
            # Get core metrics
            if "http_request_duration_seconds" in REGISTRY._names_to_collectors:
                _metrics["http_request_duration_seconds"] = REGISTRY._names_to_collectors["http_request_duration_seconds"]
            if "http_requests_total" in REGISTRY._names_to_collectors:
                _metrics["http_requests_total"] = REGISTRY._names_to_collectors["http_requests_total"]
            if "db_pool_size" in REGISTRY._names_to_collectors:
                _metrics["db_pool_size"] = REGISTRY._names_to_collectors["db_pool_size"]
            if "redis_connected" in REGISTRY._names_to_collectors:
                _metrics["redis_connected"] = REGISTRY._names_to_collectors["redis_connected"]
            
            # Get email metrics
            email_metrics = {}
            if "emails_sent_total" in REGISTRY._names_to_collectors:
                email_metrics["sent"] = REGISTRY._names_to_collectors["emails_sent_total"]
            if "emails_delivered_total" in REGISTRY._names_to_collectors:
                email_metrics["delivered"] = REGISTRY._names_to_collectors["emails_delivered_total"]
            if "emails_failed_total" in REGISTRY._names_to_collectors:
                email_metrics["failed"] = REGISTRY._names_to_collectors["emails_failed_total"]
            if email_metrics:
                _metrics["email_metrics"] = email_metrics

    return _metrics 