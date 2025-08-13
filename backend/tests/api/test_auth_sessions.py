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
