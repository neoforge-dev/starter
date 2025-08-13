import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_auth_sessions_list_and_revoke(client: AsyncClient):
    # Register a user
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "sess@example.com",
            "full_name": "Sess User",
            "password": "testpass123",
            "password_confirm": "testpass123",
        },
    )
    assert reg.status_code == 200
    access_token = reg.json()["access_token"]

    # Login to ensure a refresh session exists
    form = {"username": "sess@example.com", "password": "testpass123"}
    login = await client.post("/api/v1/auth/token", data=form)
    assert login.status_code == 200
    data = login.json()
    assert "refresh_token" in data

    # List sessions
    headers = {"Authorization": f"Bearer {access_token}"}
    ls = await client.get("/api/v1/auth/sessions", headers=headers)
    assert ls.status_code == 200
    payload = ls.json()
    assert payload["total"] >= 1
    sess_id = payload["items"][0]["id"]

    # Revoke the session
    rv = await client.post(f"/api/v1/auth/sessions/{sess_id}/revoke", headers=headers)
    assert rv.status_code == 200

    # Verify revoked
    ls2 = await client.get("/api/v1/auth/sessions", headers=headers)
    assert ls2.status_code == 200
    items2 = ls2.json()["items"]
    found = next((it for it in items2 if it["id"] == sess_id), None)
    assert found is not None
    assert found["revoked_at"] is not None

@pytest.mark.asyncio
async def test_auth_sessions_revoke_others_keeps_selected(client: AsyncClient):
    # Register and login twice to create two sessions
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "sess2@example.com",
            "full_name": "Sess2 User",
            "password": "testpass123",
            "password_confirm": "testpass123",
        },
    )
    assert reg.status_code == 200
    access_token = reg.json()["access_token"]

    form = {"username": "sess2@example.com", "password": "testpass123"}
    login1 = await client.post("/api/v1/auth/token", data=form)
    assert login1.status_code == 200
    login2 = await client.post("/api/v1/auth/token", data=form)
    assert login2.status_code == 200

    # List sessions to get their IDs
    headers = {"Authorization": f"Bearer {access_token}"}
    ls = await client.get("/api/v1/auth/sessions", headers=headers)
    assert ls.status_code == 200
    items = ls.json()["items"]
    assert len(items) >= 2
    keep_session_id = items[0]["id"]

    # Revoke all others
    rv_all = await client.post(
        "/api/v1/auth/sessions/revoke-others",
        headers=headers,
        json={"keep_session_id": keep_session_id},
    )
    assert rv_all.status_code == 200
    payload = rv_all.json()
    assert "revoked_count" in payload and payload["revoked_count"] >= 1

    # Verify only kept session is not revoked
    ls2 = await client.get("/api/v1/auth/sessions", headers=headers)
    assert ls2.status_code == 200
    items2 = ls2.json()["items"]
    for it in items2:
        if it["id"] == keep_session_id:
            assert it["revoked_at"] is None
        else:
            assert it["revoked_at"] is not None
