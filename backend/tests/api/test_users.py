"""Test user CRUD operations."""
import logging
from typing import Dict
from urllib.parse import urlencode

import pytest
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from httpx import AsyncClient
from sqlalchemy import delete, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.core.auth import get_password_hash
from app.core.config import Settings, get_settings
from tests.factories import UserFactory

pytestmark = pytest.mark.asyncio

logger = logging.getLogger(__name__)


async def test_create_user(
    client: AsyncClient,
    db: AsyncSession,
    superuser_token_headers: dict,
    test_settings: Settings,
) -> None:
    """Test creating a new user."""
    response = await client.post(
        f"{test_settings.api_v1_str}/users/",
        json={
            "email": "test@example.com",
            "password": "testpassword",
            "password_confirm": "testpassword",
            "full_name": "Test User",
        },
        headers={**superuser_token_headers, "Accept": "application/json"},
    )
    print(f"Response content: {response.content}")
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert "id" in data
    assert "password" not in data


async def test_read_users(
    client: AsyncClient,
    db: AsyncSession,
    superuser_token_headers: dict,
    test_settings: Settings,
) -> None:
    """Test reading multiple users."""
    # Clear existing users first (use DELETE for simplicity, TRUNCATE might require specific permissions)
    # await db.execute(delete(User))
    # await db.commit() # Commit deletion - Let the transaction handle it

    # Create superuser first (rely on fixture flush)
    # Superuser creation is handled by the superuser_token_headers fixture, including commit/flush
    # No need to create manually here unless specifically testing that creation.
    # superuser_email = "admin@example.com"
    # superuser_password = "admin123"
    # superuser_in = UserCreate(
    #     email=superuser_email,
    #     password=superuser_password,
    #     password_confirm=superuser_password,
    #     full_name="Admin User",
    #     is_superuser=True
    # )
    # superuser = await crud.user.create(db, obj_in=superuser_in) # Factory flushes
    # await db.commit() # Don't commit superuser creation yet

    # Get authentication token for superuser - Use the fixture directly
    # The superuser_token_headers fixture already creates and commits a superuser
    headers = superuser_token_headers

    # Create test users (rely on factory flush)
    test_users_created = []
    for i in range(3):
        user_in = UserCreate(
            email=f"test{i}@example.com",
            password="testpass123",
            password_confirm="testpass123",
            full_name=f"Test User {i}",
        )
        user = await crud.user.create(db, obj_in=user_in)  # Factory flushes
        test_users_created.append(user)

        await db.flush()  # Flush newly created users before the API call
        # await db.commit() # REMOVED: Commit all newly created users before the API call - Rely on fixture rollback

    # Now, read the users using the superuser token
    logger.info(f"Reading users with superuser token: {headers}")
    response = await client.get(
        f"{test_settings.api_v1_str}/users/",
        headers={**headers, "Accept": "application/json"},
        params={"skip": 0, "limit": 10},
    )
    logger.info(f"Read users response status: {response.status_code}")
    logger.info(f"Read users response body: {response.text}")
    assert response.status_code == 200, f"Read users failed: {response.text}"

    data = response.json()
    assert (
        len(data) >= 3
    )  # Check if at least the 3 created users are returned (might include superuser)
    created_emails = {u.email for u in test_users_created}
    returned_emails = {u["email"] for u in data}
    assert created_emails.issubset(returned_emails)


async def test_read_user(
    client: AsyncClient,
    db: AsyncSession,
    normal_user_token_headers: tuple[Dict[str, str], User],
    superuser_token_headers: dict,
    test_settings: Settings,
) -> None:
    """Test reading a specific user."""
    _, regular_user = normal_user_token_headers
    response = await client.get(
        f"{test_settings.api_v1_str}/users/{regular_user.id}",
        headers={**superuser_token_headers, "Accept": "application/json"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == regular_user.email
    assert data["id"] == regular_user.id


async def test_update_user(
    client: AsyncClient,
    db: AsyncSession,
    superuser_token_headers: dict,
    test_settings: Settings,
):
    """Test updating a user."""
    # Create a user to update first using the factory
    user_to_update = await UserFactory.create(session=db)
    await db.flush()  # Ensure the user is flushed

    update_data = {"full_name": "Updated User Name"}
    response = await client.put(
        f"{test_settings.api_v1_str}/users/{user_to_update.id}",  # Use the created user's ID
        json=update_data,
        headers={
            **superuser_token_headers,
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated User Name"
    assert data["id"] == user_to_update.id  # Check against the correct user ID


async def test_delete_user(
    client: AsyncClient,
    db: AsyncSession,
    superuser_token_headers: dict,
    test_settings: Settings,
):
    """Test deleting a user."""
    user = await UserFactory.create(session=db)
    await db.commit()
    await db.refresh(user)

    response = await client.delete(
        f"{test_settings.api_v1_str}/users/{user.id}",
        headers={**superuser_token_headers, "Accept": "application/json"},
    )
    assert response.status_code == 204

    # Verify user is deleted
    response = await client.get(
        f"{test_settings.api_v1_str}/users/{user.id}",
        headers={**superuser_token_headers, "Accept": "application/json"},
    )
    assert response.status_code == 404


async def test_read_user_not_found(
    client: AsyncClient,
    db: AsyncSession,
    superuser_token_headers: dict,
    test_settings: Settings,
) -> None:
    """Test reading a non-existent user."""
    response = await client.get(
        f"{test_settings.api_v1_str}/users/99999",
        headers={**superuser_token_headers, "Accept": "application/json"},
    )
    assert response.status_code == 404


async def test_read_users_me(
    client: AsyncClient,
    db: AsyncSession,
    normal_user_token_headers: tuple[Dict[str, str], User],
    test_settings: Settings,
) -> None:
    """Test reading the current user's info."""
    headers, regular_user = normal_user_token_headers
    response = await client.get(f"{test_settings.api_v1_str}/users/me", headers=headers)
    assert response.status_code == 200


async def test_update_users_me(
    client: AsyncClient,
    db: AsyncSession,
    normal_user_token_headers: tuple[Dict[str, str], User],
    test_settings: Settings,
) -> None:
    """Test updating the current user's info."""
    headers, regular_user = normal_user_token_headers
    update_data = {
        "full_name": "My Updated Name",
        "email": "my-updated-email@example.com",
    }
    response = await client.put(
        f"{test_settings.api_v1_str}/users/me", json=update_data, headers=headers
    )
    assert response.status_code == 200


async def test_create_user_forbidden(
    client: AsyncClient,
    db: AsyncSession,
    normal_user_token_headers: tuple[Dict[str, str], User],
    test_settings: Settings,
) -> None:
    """Test creating user forbidden for regular users."""
    headers, _ = normal_user_token_headers
    user_data = {
        "email": "test@example.com",
        "password": "testpassword",
        "password_confirm": "testpassword",
        "full_name": "Test User",
    }
    response = await client.post(
        f"{test_settings.api_v1_str}/users/", json=user_data, headers=headers
    )
    # Expect 400 Bad Request because the dependency get_current_active_superuser raises it
    assert response.status_code == 400


async def test_read_user_forbidden(
    client: AsyncClient,
    db: AsyncSession,
    normal_user_token_headers: tuple[Dict[str, str], User],
    test_settings: Settings,
) -> None:
    """Test reading other users forbidden for regular users."""
    headers, _ = normal_user_token_headers
    other_user = await UserFactory.create(session=db)
    response = await client.get(
        f"{test_settings.api_v1_str}/users/{other_user.id}", headers=headers
    )
    assert response.status_code == 400


async def test_update_user_forbidden(
    client: AsyncClient,
    db: AsyncSession,
    normal_user_token_headers: tuple[Dict[str, str], User],
    test_settings: Settings,
) -> None:
    """Test updating other users forbidden for regular users."""
    headers, _ = normal_user_token_headers
    other_user = await UserFactory.create(session=db)
    update_data = {"full_name": "Forbidden Update Name"}
    response = await client.put(
        f"{test_settings.api_v1_str}/users/{other_user.id}",
        json=update_data,
        headers=headers,
    )
    assert response.status_code == 400


async def test_delete_user_forbidden(
    client: AsyncClient,
    db: AsyncSession,
    normal_user_token_headers: tuple[Dict[str, str], User],
    test_settings: Settings,
) -> None:
    """Test deleting other users forbidden for regular users."""
    headers, _ = normal_user_token_headers
    other_user = await UserFactory.create(session=db)
    response = await client.delete(
        f"{test_settings.api_v1_str}/users/{other_user.id}", headers=headers
    )
    assert response.status_code == 400
