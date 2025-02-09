"""Test metrics endpoints."""
import pytest
from prometheus_client import REGISTRY, Counter, Gauge, Histogram
from prometheus_client.parser import text_string_to_metric_families

from app.main import app
from app.core.metrics import get_metrics

@pytest.fixture(autouse=True)
def init_metrics():
    """Initialize metrics before each test."""
    # Clear existing metrics
    collectors = list(REGISTRY._collector_to_names.keys())
    for collector in collectors:
        REGISTRY.unregister(collector)
    
    # Initialize core metrics
    metrics = {
        "http_request_duration_seconds": Histogram(
            "http_request_duration_seconds",
            "HTTP request duration in seconds",
            ["method", "endpoint"],
            registry=REGISTRY,
        ),
        "http_requests_total": Counter(
            "http_requests_total",
            "Total number of HTTP requests",
            ["method", "endpoint", "status"],
            registry=REGISTRY,
        ),
        "db_pool_size": Gauge(
            "db_pool_size",
            "Database connection pool size",
            registry=REGISTRY,
        ),
        "redis_connected": Gauge(
            "redis_connected",
            "Redis connection status (1 for connected, 0 for disconnected)",
            registry=REGISTRY,
        ),
        "email_metrics": {
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
    }
    
    # Register metrics in the global metrics dictionary
    from app.core.metrics import _metrics
    _metrics.update(metrics)
    
    yield metrics

@pytest.mark.asyncio
async def test_metrics_endpoint(client):
    """Test metrics endpoint returns Prometheus metrics."""
    # Make a request to ensure metrics are generated
    await client.get("/health")
    
    response = await client.get("/metrics")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain; version=0.0.4")

    # Print response text for debugging
    print("Response text:", response.text)

    # Parse metrics and verify expected metrics exist
    metrics = {
        metric.name: metric
        for metric in text_string_to_metric_families(response.text)
    }

    # Print parsed metrics for debugging
    print("Parsed metrics:", metrics)

    # Verify HTTP metrics
    assert "http_request_duration_seconds" in metrics
    assert "http_requests" in metrics

    # Verify database metrics
    assert "db_pool_size" in metrics

    # Verify Redis metrics
    assert "redis_connected" in metrics

    # Verify email metrics
    assert "emails_sent_total" in metrics
    assert "emails_delivered_total" in metrics
    assert "emails_failed_total" in metrics

@pytest.mark.asyncio
async def test_metrics_after_request(client):
    """Test metrics are updated after making requests."""
    # Make a test request
    await client.get("/health")

    # Get metrics
    response = await client.get("/metrics")
    assert response.status_code == 200

    # Parse metrics
    metrics = {
        metric.name: metric
        for metric in text_string_to_metric_families(response.text)
    }

    # Print metrics for debugging
    print("Parsed metrics:", metrics)

    # Verify request was counted
    http_requests = metrics["http_requests"]
    found_request = False
    for sample in http_requests.samples:
        if (
            sample.labels.get("method") == "GET"
            and sample.labels.get("endpoint") == "/health"
            and sample.labels.get("status") == "200"
            and sample.value >= 1
        ):
            found_request = True
            break
    assert found_request, "Health check request was not counted in metrics"

    # Verify request duration was recorded
    http_duration = metrics["http_request_duration_seconds"]
    found_duration = False
    for sample in http_duration.samples:
        if (
            sample.labels.get("method") == "GET"
            and sample.labels.get("endpoint") == "/health"
            and sample.value > 0
        ):
            found_duration = True
            break
    assert found_duration, "Request duration was not recorded in metrics"

@pytest.mark.asyncio
async def test_metrics_error_handling(client):
    """Test metrics endpoint error handling."""
    # Simulate database error by closing pool and raising an error
    from app.db.session import engine
    await engine.dispose()
    
    # Mock the get_stats method to raise an error
    from unittest.mock import patch
    from sqlalchemy.exc import SQLAlchemyError
    
    with patch('app.crud.email_tracking.email_tracking.get_stats', side_effect=SQLAlchemyError("Database error")):
        response = await client.get("/metrics")
        assert response.status_code == 500
        assert "Error generating metrics" in response.json()["detail"] 