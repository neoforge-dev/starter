import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_community_create_list_idempotent(client: AsyncClient):
    headers = {"Idempotency-Key": "post-key-1"}
    r = await client.post(
        "/api/v1/community/posts",
        json={"title": "Hello", "content": "World", "author": "neo"},
        headers=headers,
    )
    assert r.status_code == 201

    r2 = await client.post(
        "/api/v1/community/posts",
        json={"title": "Hello", "content": "World", "author": "neo"},
        headers=headers,
    )
    assert r2.status_code in (200, 201)


@pytest.mark.asyncio
async def test_community_idempotency_replay_semantics(client: AsyncClient):
    headers = {"Idempotency-Key": "comm-dup-1"}
    r1 = await client.post(
        "/api/v1/community/posts",
        json={"title": "Same", "content": "Again", "author": "neo"},
        headers=headers,
    )
    assert r1.status_code == 201
    r2 = await client.post(
        "/api/v1/community/posts",
        json={"title": "Same", "content": "Again", "author": "neo"},
        headers=headers,
    )
    assert r2.status_code in (200, 201)

    rl = await client.get("/api/v1/community/posts", params={"page": 1, "page_size": 5})
    assert rl.status_code == 200
    data = rl.json()
    assert "items" in data and data["total"] >= 1
    assert "Cache-Control" in rl.headers

    # Boundary: high page request returns empty
    rb = await client.get(
        "/api/v1/community/posts", params={"page": 500, "page_size": 1}
    )
    assert rb.status_code == 200
    assert rb.json()["items"] == []
