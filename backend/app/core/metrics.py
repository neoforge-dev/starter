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

        # Add DB metrics
        _metrics["db_pool_checkouts"] = Counter(
            "db_pool_checkouts_total",
            "Total number of connection checkouts from the pool",
            registry=REGISTRY,
        )

        _metrics["db_pool_checkins"] = Counter(
            "db_pool_checkins_total",
            "Total number of connection checkins to the pool",
            registry=REGISTRY,
        )

        _metrics["db_pool_overflow"] = Counter(
            "db_pool_overflow_total",
            "Total number of times the connection pool overflowed",
            registry=REGISTRY,
        )

        _metrics["db_query_duration"] = Histogram(
            "db_query_duration_seconds",
            "Duration of SQL queries",
            ["query_type", "table"],
            buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0),
            registry=REGISTRY,
        )

        # Add query monitoring metrics
        _metrics["db_query_count"] = Counter(
            "db_query_count_total",
            "Total number of SQL queries",
            ["query_type", "table"],
            registry=REGISTRY,
        )

        _metrics["db_query_errors"] = Counter(
            "db_query_errors_total",
            "Total number of SQL query errors",
            ["error_type", "query_type"],
            registry=REGISTRY,
        )

        _metrics["db_slow_queries"] = Counter(
            "db_slow_queries_total",
            "Total number of slow SQL queries (>100ms)",
            ["query_type", "table"],
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