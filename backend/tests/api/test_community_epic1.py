import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_community_create_list_idempotent(client: AsyncClient):
    headers = {"Idempotency-Key": "post-key-1"}
    r = await client.post("/api/v1/community/posts", json={
        "title": "Hello",
        "content": "World",
        "author": "neo"
    }, headers=headers)
    assert r.status_code == 201

    r2 = await client.post("/api/v1/community/posts", json={
        "title": "Hello",
        "content": "World",
        "author": "neo"
    }, headers=headers)
    assert r2.status_code in (200, 201)

    rl = await client.get("/api/v1/community/posts", params={"page": 1, "page_size": 5})
    assert rl.status_code == 200
    data = rl.json()
    assert "items" in data and data["total"] >= 1
