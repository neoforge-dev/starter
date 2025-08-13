import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_tracing_does_not_break_endpoints(client: AsyncClient):
    # Basic smoke that endpoints work with instrumentation present
    r = await client.get("/health")
    assert r.status_code == 200
    r2 = await client.get("/metrics")
    assert r2.status_code == 200
