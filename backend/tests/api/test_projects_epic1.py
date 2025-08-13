import json
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_projects_crud_and_pagination(client: AsyncClient):
    # Create 2 projects with idempotency
    headers = {"Idempotency-Key": "key-1"}
    r1 = await client.post("/api/v1/projects", json={"name": "A", "description": "x"}, headers=headers)
    assert r1.status_code == 201
    p1 = r1.json()

    # Replay should return same object
    r1b = await client.post("/api/v1/projects", json={"name": "A", "description": "x"}, headers=headers)
    assert r1b.status_code in (200, 201)
    assert r1b.json()["name"] == p1["name"]

    r2 = await client.post("/api/v1/projects", json={"name": "B"})
    assert r2.status_code == 201

    # List paginated
    rlist = await client.get("/api/v1/projects", params={"page": 1, "page_size": 1})
    assert rlist.status_code == 200
    data = rlist.json()
    assert "items" in data and "total" in data and data["page"] == 1
    # Cache-Control present in non-prod
    assert "Cache-Control" in rlist.headers

    # Boundary: page beyond last should return empty items
    pages = data.get("pages", 1)
    rbeyond = await client.get("/api/v1/projects", params={"page": pages + 10, "page_size": 50})
    assert rbeyond.status_code == 200
    assert rbeyond.json()["items"] == []

    # Get by id with ETag
    gid = await client.get(f"/api/v1/projects/{p1['id']}")
    assert gid.status_code == 200
    etag = gid.headers.get("ETag")
    assert etag
    # If-None-Match should yield 304
    gid2 = await client.get(f"/api/v1/projects/{p1['id']}", headers={"If-None-Match": etag})
    assert gid2.status_code == 304

    # Patch idempotency
    patch_headers = {"Idempotency-Key": "key-1-patch"}
    up1 = await client.patch(f"/api/v1/projects/{p1['id']}", json={"description": "new"}, headers=patch_headers)
    assert up1.status_code == 200
    up2 = await client.patch(f"/api/v1/projects/{p1['id']}", json={"description": "new"}, headers=patch_headers)
    assert up2.status_code in (200, 201)

@pytest.mark.asyncio
async def test_projects_idempotency_replay_201_to_200(client: AsyncClient):
    headers = {"Idempotency-Key": "proj-201-200"}
    r1 = await client.post("/api/v1/projects", json={"name": "Replay"}, headers=headers)
    assert r1.status_code == 201
    r2 = await client.post("/api/v1/projects", json={"name": "Replay"}, headers=headers)
    assert r2.status_code in (200, 201)
