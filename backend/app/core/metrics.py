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
        except ValueError as e:
            # If metrics are already registered, try to get them from the registry
            collectors = list(REGISTRY.collect())
            for collector in collectors:
                name = collector.name
                if name == "http_request_duration_seconds":
                    _metrics["http_request_duration_seconds"] = REGISTRY._names_to_collectors[name]
                elif name == "http_requests_total":
                    _metrics["http_requests_total"] = REGISTRY._names_to_collectors[name]
                elif name == "db_pool_size":
                    _metrics["db_pool_size"] = REGISTRY._names_to_collectors[name]
                elif name == "redis_connected":
                    _metrics["redis_connected"] = REGISTRY._names_to_collectors[name]
                elif name == "emails_sent_total":
                    if "email_metrics" not in _metrics:
                        _metrics["email_metrics"] = {}
                    _metrics["email_metrics"]["sent"] = REGISTRY._names_to_collectors[name]
                elif name == "emails_delivered_total":
                    if "email_metrics" not in _metrics:
                        _metrics["email_metrics"] = {}
                    _metrics["email_metrics"]["delivered"] = REGISTRY._names_to_collectors[name]
                elif name == "emails_failed_total":
                    if "email_metrics" not in _metrics:
                        _metrics["email_metrics"] = {}
                    _metrics["email_metrics"]["failed"] = REGISTRY._names_to_collectors[name]

    return _metrics 