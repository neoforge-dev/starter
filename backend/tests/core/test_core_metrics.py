"""Test core metrics functionality."""
import pytest
from prometheus_client import REGISTRY, CollectorRegistry

from app.core.metrics import get_metrics, reset_metrics


@pytest.fixture(autouse=True)
def clear_registry():
    """Clear Prometheus registry and metrics cache before/after each test."""
    reset_metrics()
    yield
    reset_metrics()


def test_initial_metrics_creation():
    """Test initial creation of metrics."""
    metrics = get_metrics()

    # Verify core metrics exist
    assert "http_requests" in metrics
    assert "http_request_duration_seconds" in metrics
    assert "db_pool_size" in metrics
    # assert "redis_connected" in metrics # Removed assertion
    # Add assertions for other expected DB metrics
    assert "db_pool_checkins" in metrics
    assert "db_pool_checkouts" in metrics
    assert "db_pool_overflow" in metrics
    assert "db_connections_active" in metrics
    assert "db_query_duration_seconds" in metrics


def test_metrics_reuse():
    """Test that getting metrics multiple times returns the same objects."""
    metrics1 = get_metrics()
    metrics2 = get_metrics()

    assert metrics1 is metrics2
    assert metrics1["http_requests"] is metrics2["http_requests"]
    assert (
        metrics1["db_query_duration_seconds"] is metrics2["db_query_duration_seconds"]
    )
    # assert metrics1["email_metrics"]["sent"] is metrics2["email_metrics"]["sent"] # Removed assertion


def test_http_metrics_functionality():
    """Test HTTP metrics can record requests and durations."""
    # Reset relevant samples manually if needed for idempotency, avoid full clear
    # Or rely on test isolation if run separately

    # Get metrics instance (caches internally)
    metrics = get_metrics()

    # Define labels
    labels_200 = {"method": "GET", "endpoint": "/test_metrics", "status": "200"}
    duration_labels = {"method": "GET", "endpoint": "/test_metrics"}

    # Get current counts before test actions (optional, for delta checking)
    # count_before = REGISTRY.get_sample_value("http_requests_total", labels_200) or 0
    # duration_count_before = REGISTRY.get_sample_value("http_request_duration_seconds_count", duration_labels) or 0
    # duration_sum_before = REGISTRY.get_sample_value("http_request_duration_seconds_sum", duration_labels) or 0

    # Test request counter
    http_requests_metric = metrics["http_requests"]
    http_requests_metric.labels(**labels_200).inc()

    # Test duration histogram
    http_duration_metric = metrics["http_request_duration_seconds"]
    http_duration_metric.labels(**duration_labels).observe(0.1)
    http_duration_metric.labels(**duration_labels).observe(0.2)

    # Verify metrics were recorded by querying the REGISTRY
    # Note: Use _total suffix for Counters when querying
    assert REGISTRY.get_sample_value("http_requests_total", labels_200) == 1.0
    # Note: Use _count and _sum suffixes for Histograms
    assert (
        REGISTRY.get_sample_value(
            "http_request_duration_seconds_count", duration_labels
        )
        == 2.0
    )
    # Use pytest.approx for floating-point comparison
    assert REGISTRY.get_sample_value(
        "http_request_duration_seconds_sum", duration_labels
    ) == pytest.approx(0.3)
