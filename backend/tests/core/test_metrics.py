"""Test core metrics functionality."""
import pytest
from prometheus_client import Counter, Histogram, Gauge, REGISTRY
from unittest.mock import patch, MagicMock
import time
import asyncio
import random
import threading

from app.core.metrics import (
    get_metrics,
    initialize_metrics,
    reset_metrics,
    MetricsManager,
)

@pytest.fixture(autouse=True)
def clear_registry():
    """Clear Prometheus registry before each test."""
    collectors = list(REGISTRY._collector_to_names.keys())
    for collector in collectors:
        REGISTRY.unregister(collector)

@pytest.fixture
def metrics_manager():
    """Create metrics manager instance."""
    return MetricsManager()

def test_metrics_initialization():
    """Test metrics initialization."""
    metrics = initialize_metrics()
    
    # Check HTTP metrics
    assert "http_requests" in metrics
    assert isinstance(metrics["http_requests"], Counter)
    assert "method" in metrics["http_requests"]._labelnames
    assert "endpoint" in metrics["http_requests"]._labelnames
    assert "status" in metrics["http_requests"]._labelnames
    
    assert "http_request_duration_seconds" in metrics
    assert isinstance(metrics["http_request_duration_seconds"], Histogram)
    assert "method" in metrics["http_request_duration_seconds"]._labelnames
    assert "endpoint" in metrics["http_request_duration_seconds"]._labelnames
    
    # Check database metrics
    assert "db_connections_active" in metrics
    assert isinstance(metrics["db_connections_active"], Gauge)
    
    assert "db_query_duration_seconds" in metrics
    assert isinstance(metrics["db_query_duration_seconds"], Histogram)
    assert "query_type" in metrics["db_query_duration_seconds"]._labelnames
    
    # Check Redis metrics
    assert "redis_operations_total" in metrics
    assert isinstance(metrics["redis_operations_total"], Counter)
    assert "operation" in metrics["redis_operations_total"]._labelnames
    
    assert "redis_errors_total" in metrics
    assert isinstance(metrics["redis_errors_total"], Counter)
    assert "error_type" in metrics["redis_errors_total"]._labelnames

def test_get_metrics_singleton():
    """Test that get_metrics returns the same instance."""
    metrics1 = get_metrics()
    metrics2 = get_metrics()
    
    assert metrics1 is metrics2
    assert id(metrics1) == id(metrics2)

def test_metrics_recording():
    """Test recording metrics."""
    metrics = get_metrics()
    
    # Record HTTP request
    metrics["http_requests"].labels(
        method="GET",
        endpoint="/test",
        status="200"
    ).inc()
    
    # Record query duration
    metrics["db_query_duration_seconds"].labels(
        query_type="select"
    ).observe(0.1)
    
    # Record Redis operation
    metrics["redis_operations_total"].labels(
        operation="get"
    ).inc()
    
    # Verify metrics
    assert REGISTRY.get_sample_value(
        "http_requests_total",
        {"method": "GET", "endpoint": "/test", "status": "200"}
    ) == 1.0
    
    assert REGISTRY.get_sample_value(
        "redis_operations_total",
        {"operation": "get"}
    ) == 1.0

def test_metrics_labels():
    """Test metric label validation."""
    metrics = get_metrics()
    
    # Valid labels
    metrics["http_requests"].labels(
        method="GET",
        endpoint="/test",
        status="200"
    ).inc()
    
    # Invalid labels should raise ValueError
    with pytest.raises(ValueError):
        metrics["http_requests"].labels(
            invalid_label="value"
        ).inc()

def test_histogram_buckets():
    """Test histogram bucket configuration."""
    metrics = get_metrics()
    
    # Test request duration buckets
    duration_metric = metrics["http_request_duration_seconds"]
    assert len(duration_metric._buckets) > 0
    assert min(duration_metric._buckets) == 0.005  # 5ms
    assert max(duration_metric._buckets) == 10.0   # 10s
    
    # Test query duration buckets
    query_metric = metrics["db_query_duration_seconds"]
    assert len(query_metric._buckets) > 0
    assert min(query_metric._buckets) == 0.001  # 1ms
    assert max(query_metric._buckets) == 5.0    # 5s

def test_metrics_reset():
    """Test metrics reset functionality."""
    metrics = get_metrics()
    
    # Record some metrics
    metrics["http_requests"].labels(
        method="GET",
        endpoint="/test",
        status="200"
    ).inc()
    
    metrics["db_connections_active"].set(5)
    
    # Reset metrics
    reset_metrics()
    
    # Verify metrics are reset
    assert REGISTRY.get_sample_value(
        "http_requests_total",
        {"method": "GET", "endpoint": "/test", "status": "200"}
    ) == None  # After reset, the metric should be None, not 0
    
    assert REGISTRY.get_sample_value(
        "db_connections_active"
    ) == 0.0

def test_metrics_manager_context():
    """Test MetricsManager context manager."""
    manager = MetricsManager()
    metrics = get_metrics()
    
    with manager.timer("test_operation", {"type": "test"}):
        time.sleep(0.1)  # Simulate work
    
    # Verify timer recorded duration
    samples = REGISTRY.get_sample_value(
        "operation_duration_seconds_count",
        {"type": "test"}
    )
    assert samples is not None
    assert samples > 0

def test_metrics_manager_error_tracking():
    """Test error tracking in MetricsManager."""
    manager = MetricsManager()
    metrics = get_metrics()
    
    # Test error counting
    try:
        with manager.error_tracker("test_operation"):
            raise ValueError("Test error")
    except ValueError:
        pass
    
    # Verify error was counted
    assert REGISTRY.get_sample_value(
        "operation_errors_total",
        {"operation": "test_operation", "error_type": "ValueError"}
    ) == 1.0

def test_concurrent_metrics_recording():
    """Test concurrent metrics recording using threads instead of asyncio."""
    metrics = get_metrics()
    
    def record_metrics():
        # Simulate concurrent requests
        for _ in range(5):
            metrics["http_requests"].labels(
                method="GET",
                endpoint="/test",
                status="200"
            ).inc()
            time.sleep(0.01)  # Small delay
    
    # Create and start threads
    threads = []
    for _ in range(3):
        thread = threading.Thread(target=record_metrics)
        thread.start()
        threads.append(thread)
    
    # Wait for all threads to complete
    for thread in threads:
        thread.join()
    
    # Verify total count (5 requests * 3 threads)
    value = REGISTRY.get_sample_value(
        "http_requests_total",
        {"method": "GET", "endpoint": "/test", "status": "200"}
    )
    assert value == 15.0

def test_custom_metrics():
    """Test adding custom metrics."""
    metrics = get_metrics()
    
    # Add custom counter
    custom_counter = Counter(
        "custom_events_total",
        "Total number of custom events",
        labelnames=["event_type"]
    )
    metrics["custom_events"] = custom_counter
    
    # Record custom metric
    metrics["custom_events"].labels(event_type="test").inc()
    
    # Verify custom metric
    assert REGISTRY.get_sample_value(
        "custom_events_total",
        {"event_type": "test"}
    ) == 1.0 