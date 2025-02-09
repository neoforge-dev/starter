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
        "http_requests": Counter(
            "http_requests",
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
    headers = {
        "Accept": "application/json",
        "User-Agent": "TestClient"
    }
    await client.get("/health", headers=headers)
    
    response = await client.get("/metrics", headers=headers)
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
    headers = {
        "Accept": "application/json",
        "User-Agent": "TestClient"
    }
    await client.get("/health", headers=headers)

    # Get metrics
    response = await client.get("/metrics", headers=headers)
    assert response.status_code == 200

    # Parse metrics
    metrics = {
        metric.name: metric
        for metric in text_string_to_metric_families(response.text)
    }

    # Print metrics for debugging
    print("Parsed metrics:", metrics)

    # Verify request was counted
    assert "http_requests" in metrics
    http_requests = metrics["http_requests"]
    
    # Check if there are any samples with method=GET and endpoint=/health
    health_requests = [
        sample for sample in http_requests.samples
        if sample.labels.get("method") == "GET" 
        and sample.labels.get("endpoint") == "/health"
        and sample.labels.get("status") == "200"
    ]
    assert len(health_requests) > 0
    assert health_requests[0].value >= 1

    # Verify request duration was recorded
    assert "http_request_duration_seconds" in metrics
    duration_metric = metrics["http_request_duration_seconds"]
    duration_samples = [
        sample for sample in duration_metric.samples
        if sample.labels.get("method") == "GET"
        and sample.labels.get("endpoint") == "/health"
    ]
    assert len(duration_samples) > 0

@pytest.mark.asyncio
async def test_metrics_error_handling(client):
    """Test metrics are updated for error responses."""
    headers = {
        "Accept": "application/json",
        "User-Agent": "TestClient"
    }
    # Make a request that will generate an error
    await client.get("/nonexistent", headers=headers)
    
    # Get metrics
    response = await client.get("/metrics", headers=headers)
    assert response.status_code == 200

    # Parse metrics
    metrics = {
        metric.name: metric
        for metric in text_string_to_metric_families(response.text)
    }

    # Print metrics for debugging
    print("Parsed metrics:", metrics)

    # Verify error metrics
    assert "http_requests" in metrics
    assert "http_request_duration_seconds" in metrics

    # Verify request was counted with error status
    http_requests = metrics["http_requests"]
    found_error = False
    for sample in http_requests.samples:
        if (
            sample.labels.get("method") == "GET"
            and sample.labels.get("endpoint") == "/nonexistent"
            and sample.labels.get("status") == "404"
            and sample.value >= 1
        ):
            found_error = True
            break
    assert found_error, "Error request was not counted in metrics" 