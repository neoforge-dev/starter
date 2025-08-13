import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_ready_endpoint_reports_dependencies(client: AsyncClient):
    r = await client.get("/ready")
    assert r.status_code in (200, 503)
    data = r.json()
    assert "status" in data
    assert "database" in data
    assert "redis" in data
