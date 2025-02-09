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
        # Define metrics
        _metrics["http_request_duration_seconds"] = Histogram(
            "http_request_duration_seconds",
            "HTTP request duration in seconds",
            ["method", "endpoint"],
            registry=REGISTRY,
        )

        _metrics["http_requests"] = Counter(
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

        # Initialize email metrics
        email_metrics = {}
        email_metrics["sent"] = Counter(
            "emails_sent_total",
            "Total number of emails sent",
            registry=REGISTRY,
        )
        email_metrics["delivered"] = Counter(
            "emails_delivered_total",
            "Total number of emails delivered",
            registry=REGISTRY,
        )
        email_metrics["failed"] = Counter(
            "emails_failed_total",
            "Total number of emails that failed to send",
            registry=REGISTRY,
        )
        _metrics["email_metrics"] = email_metrics

    # Ensure all metrics are registered
    for name, metric in _metrics.items():
        if name == "email_metrics":
            for email_metric_name, email_metric in metric.items():
                if email_metric not in REGISTRY._collector_to_names:
                    REGISTRY.register(email_metric)
        elif metric not in REGISTRY._collector_to_names:
            REGISTRY.register(metric)

    return _metrics 