import time
from typing import Any, Dict, Tuple

import psutil
from prometheus_client import REGISTRY, Counter, Gauge, Histogram

_metrics: Dict[str, Any] = {}


def initialize_metrics() -> Dict[str, Any]:
    """Initialize and register application metrics."""
    global _metrics
    if _metrics:
        return _metrics

    _metrics = {}

    _metrics["http_requests"] = Counter(
        "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"]
    )

    # Per-route 5xx error counter for fast error-rate computations
    _metrics["http_5xx_responses"] = Counter(
        "http_5xx_responses_total",
        "Total number of 5xx HTTP responses per route",
        ["method", "endpoint"],
    )

    hist_http = Histogram(
        "http_request_duration_seconds",
        "HTTP request duration in seconds",
        ["method", "endpoint"],
        buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
    )
    _metrics["http_request_duration_seconds"] = hist_http

    _metrics["db_connections_active"] = Gauge(
        "db_connections_active", "Active database connections"
    )

    # Add db_query_count metric
    _metrics["db_query_count"] = Counter(
        "db_query_count_total",
        "Total number of database queries",
        ["query_type", "table"],
    )

    # Add db_slow_queries metric
    _metrics["db_slow_queries"] = Counter(
        "db_slow_queries_total",
        "Total number of slow database queries (>100ms)",
        ["query_type", "table"],
    )

    # Add database pool metrics
    _metrics["db_pool_size"] = Gauge(
        "db_pool_size", "Current database connection pool size"
    )

    _metrics["db_pool_checkouts"] = Counter(
        "db_pool_checkouts_total", "Total number of database connection checkouts"
    )

    _metrics["db_pool_checkins"] = Counter(
        "db_pool_checkins_total", "Total number of database connection checkins"
    )

    _metrics["db_pool_overflow"] = Counter(
        "db_pool_overflow_total", "Total number of database connection pool overflows"
    )

    hist_db = Histogram(
        "db_query_duration_seconds",
        "Database query duration in seconds",
        ["query_type", "table"],
        buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 5.0],
    )
    _metrics["db_query_duration_seconds"] = hist_db

    _metrics["redis_operations_total"] = Counter(
        "redis_operations_total", "Total number of Redis operations", ["operation"]
    )

    _metrics["redis_errors_total"] = Counter(
        "redis_errors_total", "Total number of Redis errors", ["error_type"]
    )

    # Celery queue depth gauges (Redis broker)
    _metrics["celery_queue_depth"] = Gauge(
        "celery_queue_depth", "Current depth of Celery queues", ["queue"]
    )

    # Email metrics (totals reported from tracking table)
    _metrics["email_metrics"] = {
        "sent": Gauge("email_sent_total", "Total emails sent"),
        "delivered": Gauge("email_delivered_total", "Total emails delivered"),
        "failed": Gauge("email_failed_total", "Total emails failed"),
    }

    return _metrics


def get_metrics() -> Dict[str, Any]:
    """Return the singleton metrics instance."""
    global _metrics
    if not _metrics:
        initialize_metrics()
    return _metrics


def reset_metrics() -> None:
    """Reset metrics by unregistering them and clearing the singleton."""
    global _metrics
    for metric in list(_metrics.values()):
        try:
            REGISTRY.unregister(metric)
        except KeyError:
            pass
    _metrics = {}


class MetricsManager:
    """A context manager for metrics handling."""

    def __init__(self) -> None:
        self.metrics = get_metrics()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        reset_metrics()


# System and process metrics functions
def get_process_time() -> float:
    """Get the current process CPU time in seconds."""
    return time.process_time()


def get_process_memory() -> int:
    """Get the current process memory usage in bytes."""
    process = psutil.Process()
    return process.memory_info().rss


def get_system_cpu() -> float:
    """Get the current system CPU usage as a percentage."""
    return psutil.cpu_percent(interval=None)


def get_system_memory() -> Tuple[int, int, float]:
    """Get the system memory usage.

    Returns:
        Tuple containing:
        - total memory in bytes
        - available memory in bytes
        - percentage of memory used
    """
    memory = psutil.virtual_memory()
    return memory.total, memory.available, 100 - (memory.available / memory.total * 100)


def format_bytes(size: int) -> str:
    """Format bytes to human-readable string.

    Args:
        size: Size in bytes

    Returns:
        Human-readable string representation
    """
    if size < 1024:
        return f"{size} B"
    elif size < 1024 * 1024:
        return f"{size / 1024:.1f} KB"
    elif size < 1024 * 1024 * 1024:
        return f"{size / (1024 * 1024):.1f} MB"
    elif size < 1024 * 1024 * 1024 * 1024:
        return f"{size / (1024 * 1024 * 1024):.1f} GB"
    else:
        return f"{size / (1024 * 1024 * 1024 * 1024):.1f} TB"


__all__ = [
    "initialize_metrics",
    "get_metrics",
    "reset_metrics",
    "MetricsManager",
    "get_process_time",
    "get_process_memory",
    "get_system_cpu",
    "get_system_memory",
    "format_bytes",
]
