import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_rate_limit_headers_and_429(client: AsyncClient):
    # Register a user
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "rl@example.com",
            "full_name": "RL User",
            "password": "testpass123",
            "password_confirm": "testpass123",
        },
    )
    assert reg.status_code == 200

    # Perform repeated login attempts to trigger middleware
    data = {"username": "rl@example.com", "password": "testpass123"}

    saw_headers = False
    got_429 = False

    # Default login limit is 10; go beyond to assert 429 appears
    for i in range(15):
        res = await client.post("/api/v1/auth/token", data=data)
        # All responses should include standard rate limit headers
        assert "X-RateLimit-Limit" in res.headers
        assert "X-RateLimit-Remaining" in res.headers
        assert "X-RateLimit-Reset" in res.headers
        saw_headers = True
        if res.status_code == 429:
            # 429 should include Retry-After and rate-limit headers
            assert "Retry-After" in res.headers
            got_429 = True
            break

    assert saw_headers
    assert got_429
