import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_status_overall_and_service(client: AsyncClient):
    # Initially unknown
    r0 = await client.get("/api/v1/status")
    assert r0.status_code == 200
    assert r0.json()["status"] in ("operational", "degraded", "unknown")

    # Create events
    e1 = await client.post(
        "/api/v1/status/events",
        json={"service_id": "api", "status": "operational", "description": "boot"},
    )
    assert e1.status_code == 201

    e2 = await client.post(
        "/api/v1/status/events",
        json={"service_id": "db", "status": "degraded", "description": "slow"},
    )
    assert e2.status_code == 201

    # Overall should be degraded due to db
    ro = await client.get("/api/v1/status")
    assert ro.status_code == 200
    assert ro.json()["status"] == "degraded"

    # Service-specific
    rs_api = await client.get("/api/v1/status/services/api")
    assert rs_api.status_code == 200
    assert rs_api.json()["status"] == "operational"

    rs_db = await client.get("/api/v1/status/services/db")
    assert rs_db.status_code == 200
    assert rs_db.json()["status"] == "degraded"


@pytest.mark.asyncio
async def test_status_pagination_boundaries(client: AsyncClient):
    # Create several events for a single service
    for i in range(3):
        r = await client.post(
            "/api/v1/status/events",
            json={
                "service_id": "api",
                "status": "operational",
                "description": f"ok-{i}",
            },
        )
        assert r.status_code == 201

    # List events with small page size
    r1 = await client.get("/api/v1/status/events", params={"page": 1, "page_size": 1})
    assert r1.status_code == 200
    data1 = r1.json()
    assert data1["page"] == 1
    # Overflow page yields empty items
    r_over = await client.get(
        "/api/v1/status/events", params={"page": 999, "page_size": 2}
    )
    assert r_over.status_code == 200
    assert r_over.json()["items"] == []
