"""Test example endpoints."""
import logging
from typing import Dict

import pytest
import pytest_asyncio
from app.models.user import User
from httpx import AsyncClient
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import clear_cache
from app.core.config import Settings, get_settings
from tests.factories import UserFactory

pytestmark = pytest.mark.asyncio

logger = logging.getLogger(__name__)


@pytest.fixture
async def test_user(db: AsyncSession) -> User:
    """Create a test user for authentication."""
    user = await UserFactory.create(session=db, email="test-example@example.com")
    await db.commit()
    return user


@pytest.fixture
async def test_user_headers(test_user: User, test_settings: Settings) -> Dict[str, str]:
    """Get headers for test user authentication."""
    from datetime import timedelta

    from app.core.security import create_access_token

    access_token_expires = timedelta(minutes=test_settings.access_token_expire_minutes)
    access_token = create_access_token(
        subject=str(test_user.id),
        settings=test_settings,
        expires_delta=access_token_expires,
    )
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "TestClient",
    }


async def test_cached_users(
    client: AsyncClient, db: AsyncSession, test_settings: Settings
):
    """Test cached users endpoint (using standard pattern)."""
    # Clear existing data and cache
    await db.execute(text("DELETE FROM users WHERE email LIKE '%cachedtest%'"))
    await clear_cache()

    # Create test users
    test_users = []
    test_user_emails = set()
    for i in range(3):
        email = f"cachedtest{i}@example.com"
        user = await UserFactory.create(session=db, email=email, is_active=True)
        test_users.append(user)
        test_user_emails.add(email)

    # Use a nested transaction for data setup
    async with db.begin_nested():
        await db.flush()  # Flush users within the nested transaction
    # Nested transaction commits here

    # Headers for non-authenticated endpoint
    headers = {"Accept": "application/json", "User-Agent": "TestClient"}

    # First request should hit database
    response = await client.get(
        f"{test_settings.api_v1_str}/examples/cached-users", headers=headers
    )
    assert response.status_code == 200
    users_from_api = response.json()
    api_user_emails = {user["email"] for user in users_from_api}
    assert test_user_emails.issubset(
        api_user_emails
    ), f"Expected {test_user_emails} to be subset of {api_user_emails}"  # Verify our users are present

    # Second request should hit cache (if caching were enabled)
    response2 = await client.get(
        f"{test_settings.api_v1_str}/examples/cached-users", headers=headers
    )
    assert response2.status_code == 200
    users_from_api2 = response2.json()
    assert len(users_from_api2) == len(
        users_from_api
    )  # Check if same number of users returned

    # Verify cache hit (requires instrumentation or specific cache headers)
    # E.g., check for a hypothetical 'X-Cache-Hit' header
    # assert response2.headers.get('X-Cache-Hit') == 'true'


async def test_query_types(client: AsyncClient, test_settings: Settings):
    """Test query types endpoint."""
    headers = {"Accept": "application/json", "User-Agent": "TestClient"}
    response = await client.get(
        f"{test_settings.api_v1_str}/examples/query-types", headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "query_timings" in data
    timings = data["query_timings"]
    assert "select" in timings
    assert "join" in timings
    assert "transaction" in timings
    # Example assertion: check if select took at least 50ms due to pg_sleep
    assert float(timings["select"]["duration"]) >= 0.05


async def test_connection_pool(client: AsyncClient, test_settings: Settings):
    """Test connection pool endpoint."""
    headers = {"Accept": "application/json", "User-Agent": "TestClient"}
    response = await client.get(
        f"{test_settings.api_v1_str}/examples/connection-pool", headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "pool_stats" in data
    assert isinstance(data["pool_stats"], dict)


async def test_error_handling(client: AsyncClient, test_settings: Settings):
    """Test error handling endpoint."""
    headers = {"Accept": "application/json", "User-Agent": "TestClient"}
    response = await client.get(
        f"{test_settings.api_v1_str}/examples/error-handling", headers=headers
    )
    assert response.status_code == 500  # Expecting Internal Server Error
    data = response.json()
    assert "detail" in data
    # Check for a specific error message if applicable, otherwise just the presence of detail
    assert data["detail"] == "Query error demonstration"
