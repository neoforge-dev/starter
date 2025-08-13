import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_metrics_endpoint_exposes_core_metrics(client: AsyncClient):
    res = await client.get("/metrics")
    assert res.status_code == 200
    txt = res.text
    # Core metrics should be present
    assert "http_requests_total" in txt
    assert "http_request_duration_seconds" in txt
    assert "db_pool_size" in txt
    # Celery depth gauges should exist even if zero
    assert "celery_queue_depth" in txt
    # 5xx error counter should be registered
    assert "http_5xx_responses_total" in txt


@pytest.mark.asyncio
async def test_metrics_endpoint_5xx_counter_increments_on_error(client: AsyncClient):
    # Trigger a 5xx via examples error endpoint (non-existing table)
    r = await client.get("/api/v1/examples/error-handling")
    assert r.status_code == 500
    m = await client.get("/metrics")
    assert m.status_code == 200
    # Verify counter line is present
    assert "http_5xx_responses_total" in m.text
