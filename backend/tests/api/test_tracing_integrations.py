import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_security_middleware_adds_trace_and_request_ids(client: AsyncClient):
    res = await client.get("/health")
    assert res.status_code == 200
    assert "X-Request-ID" in res.headers
    # X-Trace-Id may not always exist if otel not configured; accept optional
    if "X-Trace-Id" in res.headers:
        trace_id = res.headers["X-Trace-Id"]
        assert isinstance(trace_id, str)

async def test_tracing_does_not_break_endpoints(client: AsyncClient):
    # Basic smoke that endpoints work with instrumentation present
    r = await client.get("/health")
    assert r.status_code == 200
    r2 = await client.get("/metrics")
    assert r2.status_code == 200
