"""Test core metrics functionality."""
import pytest
from prometheus_client import REGISTRY, CollectorRegistry
from app.core.metrics import get_metrics

@pytest.fixture(autouse=True)
def clear_registry():
    """Clear Prometheus registry before each test."""
    collectors = list(REGISTRY._collector_to_names.keys())
    for collector in collectors:
        REGISTRY.unregister(collector)
    yield
    # Clean up after test
    collectors = list(REGISTRY._collector_to_names.keys())
    for collector in collectors:
        REGISTRY.unregister(collector)

def test_initial_metrics_creation():
    """Test initial creation of metrics."""
    metrics = get_metrics()
    
    # Verify core metrics exist
    assert "http_requests" in metrics
    assert "http_request_duration_seconds" in metrics
    assert "db_pool_size" in metrics
    assert "redis_connected" in metrics
    
    # Verify email metrics exist
    assert "email_metrics" in metrics
    assert "sent" in metrics["email_metrics"]
    assert "delivered" in metrics["email_metrics"]
    assert "failed" in metrics["email_metrics"]

def test_metrics_reuse():
    """Test that getting metrics multiple times returns the same objects."""
    metrics1 = get_metrics()
    metrics2 = get_metrics()
    
    assert metrics1 is metrics2
    assert metrics1["http_requests"] is metrics2["http_requests"]
    assert metrics1["email_metrics"]["sent"] is metrics2["email_metrics"]["sent"]

def test_email_metrics_functionality():
    """Test email metrics can be incremented and decremented."""
    metrics = get_metrics()
    
    # Test sent emails
    metrics["email_metrics"]["sent"].inc()
    assert REGISTRY.get_sample_value("emails_sent_total") == 1.0
    
    # Test delivered emails
    metrics["email_metrics"]["delivered"].inc()
    assert REGISTRY.get_sample_value("emails_delivered_total") == 1.0
    
    # Test failed emails
    metrics["email_metrics"]["failed"].inc()
    assert REGISTRY.get_sample_value("emails_failed_total") == 1.0

def test_http_metrics_functionality():
    """Test HTTP metrics can record requests and durations."""
    # Clear registry and get fresh metrics
    collectors = list(REGISTRY._collector_to_names.keys())
    for collector in collectors:
        REGISTRY.unregister(collector)
    
    metrics = get_metrics()

    # Test request counter
    metrics["http_requests"].labels(
        method="GET",
        endpoint="/test_metrics",
        status="200"
    ).inc()

    # Test duration histogram
    metrics["http_request_duration_seconds"].labels(
        method="GET",
        endpoint="/test_metrics"
    ).observe(0.1)

    # Verify metrics were recorded
    assert REGISTRY.get_sample_value(
        "http_requests_total",
        {"method": "GET", "endpoint": "/test_metrics", "status": "200"}
    ) == 1.0

    # Verify duration was recorded
    assert REGISTRY.get_sample_value(
        "http_request_duration_seconds_sum",
        {"method": "GET", "endpoint": "/test_metrics"}
    ) == 0.1 