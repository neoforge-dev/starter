import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_support_create_list_update(client: AsyncClient):
    # Create ticket with idempotency
    headers = {"Idempotency-Key": "tick-key-1"}
    r = await client.post(
        "/api/v1/support/tickets",
        json={
            "email": "u@example.com",
            "subject": "Help",
            "message": "Something broke",
        },
        headers=headers,
    )
    assert r.status_code == 201
    t = r.json()

    # Replay duplicate
    r2 = await client.post(
        "/api/v1/support/tickets",
        json={
            "email": "u@example.com",
            "subject": "Help",
            "message": "Something broke",
        },
        headers=headers,
    )
    assert r2.status_code in (200, 201)


@pytest.mark.asyncio
async def test_support_idempotency_replay_semantics(client: AsyncClient):
    headers = {"Idempotency-Key": "support-dup-1"}
    r1 = await client.post(
        "/api/v1/support/tickets",
        json={"email": "dup@example.com", "subject": "Same", "message": "Again"},
        headers=headers,
    )
    assert r1.status_code == 201
    r2 = await client.post(
        "/api/v1/support/tickets",
        json={"email": "dup@example.com", "subject": "Same", "message": "Again"},
        headers=headers,
    )
    assert r2.status_code in (200, 201)

    # List paginated
    rl = await client.get(
        "/api/v1/support/tickets", params={"page": 1, "page_size": 10}
    )
    assert rl.status_code == 200
    data = rl.json()
    assert data["total"] >= 1
    assert "Cache-Control" in rl.headers

    # Boundary: page_size 1 and page 999 returns empty items
    rb = await client.get(
        "/api/v1/support/tickets", params={"page": 999, "page_size": 1}
    )
    assert rb.status_code == 200
    assert rb.json()["items"] == []

    # Update ticket
    up = await client.patch(
        f"/api/v1/support/tickets/{t['id']}", json={"status": "closed"}
    )
    assert up.status_code == 200
    assert up.json()["status"] == "closed"
