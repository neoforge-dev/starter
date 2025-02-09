"""Test core metrics module."""
import pytest
from prometheus_client import REGISTRY, Counter, Gauge, Histogram

from app.core.metrics import get_metrics


@pytest.fixture(autouse=True)
def clear_metrics():
    """Clear metrics before each test."""
    # Clear existing metrics
    collectors = list(REGISTRY._collector_to_names.keys())
    for collector in collectors:
        REGISTRY.unregister(collector)
    
    # Clear the metrics cache
    from app.core.metrics import _metrics
    _metrics.clear()
    
    yield


def test_get_metrics_initial():
    """Test getting metrics for the first time."""
    metrics = get_metrics()
    
    # Check that all expected metrics are created
    assert "http_request_duration_seconds" in metrics
    assert isinstance(metrics["http_request_duration_seconds"], Histogram)
    
    assert "http_requests_total" in metrics
    assert isinstance(metrics["http_requests_total"], Counter)
    
    assert "db_pool_size" in metrics
    assert isinstance(metrics["db_pool_size"], Gauge)
    
    assert "redis_connected" in metrics
    assert isinstance(metrics["redis_connected"], Gauge)
    
    assert "email_metrics" in metrics
    assert "sent" in metrics["email_metrics"]
    assert isinstance(metrics["email_metrics"]["sent"], Gauge)
    assert "delivered" in metrics["email_metrics"]
    assert isinstance(metrics["email_metrics"]["delivered"], Gauge)
    assert "failed" in metrics["email_metrics"]
    assert isinstance(metrics["email_metrics"]["failed"], Gauge)


def test_get_metrics_reuse():
    """Test getting metrics when they already exist."""
    # Get metrics first time
    metrics1 = get_metrics()
    
    # Get metrics second time
    metrics2 = get_metrics()
    
    # Check that we got the same objects
    assert metrics1 is metrics2
    assert metrics1["http_request_duration_seconds"] is metrics2["http_request_duration_seconds"]
    assert metrics1["http_requests_total"] is metrics2["http_requests_total"]
    assert metrics1["db_pool_size"] is metrics2["db_pool_size"]
    assert metrics1["redis_connected"] is metrics2["redis_connected"]
    assert metrics1["email_metrics"]["sent"] is metrics2["email_metrics"]["sent"]
    assert metrics1["email_metrics"]["delivered"] is metrics2["email_metrics"]["delivered"]
    assert metrics1["email_metrics"]["failed"] is metrics2["email_metrics"]["failed"]


def test_get_metrics_already_registered():
    """Test getting metrics when they are already registered in the REGISTRY."""
    # Create some metrics directly in the registry
    Histogram(
        "http_request_duration_seconds",
        "HTTP request duration in seconds",
        ["method", "endpoint"],
        registry=REGISTRY,
    )
    Counter(
        "http_requests_total",
        "Total number of HTTP requests",
        ["method", "endpoint", "status"],
        registry=REGISTRY,
    )
    
    # Get metrics through the module
    metrics = get_metrics()
    
    # Check that we got the existing metrics
    assert "http_request_duration_seconds" in metrics
    assert isinstance(metrics["http_request_duration_seconds"], Histogram)
    assert "http_requests_total" in metrics
    assert isinstance(metrics["http_requests_total"], Counter) 