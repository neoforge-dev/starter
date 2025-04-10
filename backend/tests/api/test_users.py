"""Test user CRUD operations."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from urllib.parse import urlencode

from app import crud
from app.schemas.user import UserCreate, UserUpdate
from app.core.auth import get_password_hash
from app.core.config import get_settings, Settings
from tests.factories import UserFactory
from app.models.user import User

pytestmark = pytest.mark.asyncio


async def test_create_user(client: AsyncClient, db: AsyncSession, superuser_headers: dict, test_settings: Settings) -> None:
    """Test creating a new user."""
    response = await client.post(
        f"{test_settings.api_v1_str}/users/",
        json={
            "email": "test@example.com",
            "password": "testpassword",
            "password_confirm": "testpassword",
            "full_name": "Test User",
        },
        headers={**superuser_headers, "Accept": "application/json"},
    )
    print(f"Response content: {response.content}")
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert "id" in data
    assert "password" not in data


async def test_read_users(client: AsyncClient, db: AsyncSession, superuser_headers: dict, test_settings: Settings) -> None:
    """Test reading multiple users."""
    # Clear existing users
    await db.execute(text("TRUNCATE TABLE users CASCADE"))
    await db.commit()
    
    # Create superuser first
    superuser_in = UserCreate(
        email="admin@example.com",
        password="admin123",
        password_confirm="admin123",
        full_name="Admin User",
        is_superuser=True
    )
    superuser = await crud.user.create(db, obj_in=superuser_in)
    await db.commit()
    await db.refresh(superuser)
    
    # Get authentication token for superuser
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/token",
        data={"username": superuser_in.email, "password": superuser_in.password},
        headers={"Accept": "application/json"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create test users
    test_users = []
    for i in range(3):
        user_in = UserCreate(
            email=f"test{i}@example.com",
            password="testpass123",
            password_confirm="testpass123",
            full_name=f"Test User {i}"
        )
        test_users.append(user_in)
        user = await crud.user.create(db, obj_in=user_in)
        await db.commit()
        await db.refresh(user)
        assert user.email == user_in.email
    
    response = await client.get(
        f"{test_settings.api_v1_str}/users/",
        headers={**headers, "Accept": "application/json"},
        params={"skip": 0, "limit": 10}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == len(test_users) + 1  # +1 for superuser


async def test_read_user(client: AsyncClient, db: AsyncSession, regular_user: User, superuser_headers: dict, test_settings: Settings) -> None:
    """Test reading a specific user."""
    response = await client.get(
        f"{test_settings.api_v1_str}/users/{regular_user.id}",
        headers={**superuser_headers, "Accept": "application/json"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == regular_user.email
    assert data["id"] == regular_user.id


async def test_update_user(client: AsyncClient, db: AsyncSession, regular_user: User, superuser_headers: dict, test_settings: Settings) -> None:
    """Test updating a user."""
    update_data = {"full_name": "Updated User Name"}
    response = await client.put(
        f"{test_settings.api_v1_str}/users/{regular_user.id}",
        json=update_data,
        headers={**superuser_headers, "Accept": "application/json", "Content-Type": "application/json"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated User Name"
    assert data["id"] == regular_user.id


async def test_delete_user(client: AsyncClient, db: AsyncSession, superuser_headers: dict, test_settings: Settings) -> None:
    """Test deleting a user."""
    user = await UserFactory.create(session=db)
    await db.commit()
    await db.refresh(user)
    
    response = await client.delete(
        f"{test_settings.api_v1_str}/users/{user.id}",
        headers={**superuser_headers, "Accept": "application/json"}
    )
    assert response.status_code == 204
    
    # Verify user is deleted
    response = await client.get(
        f"{test_settings.api_v1_str}/users/{user.id}",
        headers={**superuser_headers, "Accept": "application/json"}
    )
    assert response.status_code == 404


async def test_read_user_not_found(client: AsyncClient, db: AsyncSession, superuser_headers: dict, test_settings: Settings) -> None:
    """Test reading a non-existent user."""
    response = await client.get(
        f"{test_settings.api_v1_str}/users/99999",
        headers={**superuser_headers, "Accept": "application/json"}
    )
    assert response.status_code == 404


async def test_read_users_me(client: AsyncClient, db: AsyncSession, regular_user: User, regular_user_headers: dict, test_settings: Settings) -> None:
    """Test reading the current user's info."""
    response = await client.get(f"{test_settings.api_v1_str}/users/me", headers=regular_user_headers)
    assert response.status_code == 200


async def test_update_users_me(client: AsyncClient, db: AsyncSession, regular_user: User, regular_user_headers: dict, test_settings: Settings) -> None:
    """Test updating the current user's info."""
    update_data = {"full_name": "My Updated Name", "email": "my-updated-email@example.com"}
    response = await client.put(
        f"{test_settings.api_v1_str}/users/me",
        json=update_data,
        headers=regular_user_headers
    )
    assert response.status_code == 200


async def test_create_user_forbidden(client: AsyncClient, db: AsyncSession, regular_user_headers: dict, test_settings: Settings) -> None:
    """Test creating user forbidden for regular users."""
    user_data = {
        "email": "test@example.com",
        "password": "testpassword",
        "password_confirm": "testpassword",
        "full_name": "Test User",
    }
    response = await client.post(
        f"{test_settings.api_v1_str}/users/",
        json=user_data,
        headers=regular_user_headers
    )
    # Expect 400 Bad Request because the dependency get_current_active_superuser raises it
    assert response.status_code == 400 


async def test_read_user_forbidden(client: AsyncClient, db: AsyncSession, regular_user: User, regular_user_headers: dict, test_settings: Settings) -> None:
    """Test reading other users forbidden for regular users."""
    other_user = await UserFactory.create(session=db)
    response = await client.get(
        f"{test_settings.api_v1_str}/users/{other_user.id}",
        headers=regular_user_headers
    )
    assert response.status_code == 400


async def test_update_user_forbidden(client: AsyncClient, db: AsyncSession, regular_user: User, regular_user_headers: dict, test_settings: Settings) -> None:
    """Test updating other users forbidden for regular users."""
    other_user = await UserFactory.create(session=db)
    update_data = {"full_name": "Forbidden Update Name"}
    response = await client.put(
        f"{test_settings.api_v1_str}/users/{other_user.id}",
        json=update_data,
        headers=regular_user_headers
    )
    assert response.status_code == 400


async def test_delete_user_forbidden(client: AsyncClient, db: AsyncSession, regular_user: User, regular_user_headers: dict, test_settings: Settings) -> None:
    """Test deleting other users forbidden for regular users."""
    other_user = await UserFactory.create(session=db)
    response = await client.delete(
        f"{test_settings.api_v1_str}/users/{other_user.id}",
        headers=regular_user_headers
    )
    assert response.status_code == 400 