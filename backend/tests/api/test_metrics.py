"""Test metrics endpoints."""
import pytest
from fastapi.testclient import TestClient
from prometheus_client.parser import text_string_to_metric_families

from app.main import app

@pytest.fixture
def client():
    """Test client fixture."""
    return TestClient(app)

def test_metrics_endpoint(client):
    """Test metrics endpoint returns Prometheus metrics."""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/plain; version=0.0.4"

    # Parse metrics and verify expected metrics exist
    metrics = {
        metric.name: metric
        for metric in text_string_to_metric_families(response.text)
    }

    # Verify HTTP metrics
    assert "http_request_duration_seconds" in metrics
    assert "http_requests_total" in metrics

    # Verify database metrics
    assert "db_pool_size" in metrics

    # Verify Redis metrics
    assert "redis_connected" in metrics

    # Verify email metrics
    assert "emails_sent_total" in metrics
    assert "emails_delivered_total" in metrics
    assert "emails_failed_total" in metrics

def test_metrics_after_request(client):
    """Test metrics are updated after making requests."""
    # Make a test request
    client.get("/health")

    # Get metrics
    response = client.get("/metrics")
    assert response.status_code == 200

    # Parse metrics
    metrics = {
        metric.name: metric
        for metric in text_string_to_metric_families(response.text)
    }

    # Verify request was counted
    http_requests = metrics["http_requests_total"]
    found_request = False
    for sample in http_requests.samples:
        if (
            sample.labels["method"] == "GET"
            and sample.labels["endpoint"] == "/health"
            and sample.labels["status"] == "200"
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
            sample.labels["method"] == "GET"
            and sample.labels["endpoint"] == "/health"
            and sample.value > 0
        ):
            found_duration = True
            break
    assert found_duration, "Request duration was not recorded in metrics"

def test_metrics_error_handling(client):
    """Test metrics endpoint error handling."""
    # Simulate database error by closing pool
    from app.db.session import engine
    engine.dispose()

    response = client.get("/metrics")
    assert response.status_code == 500
    assert "Error generating metrics" in response.json()["detail"] 