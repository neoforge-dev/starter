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
