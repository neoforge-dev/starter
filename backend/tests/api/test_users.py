"""Test user CRUD operations."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from tests.factories import UserFactory

pytestmark = pytest.mark.asyncio


async def test_create_user(client: AsyncClient, db: AsyncSession, superuser_headers: dict) -> None:
    """Test user creation."""
    response = await client.post(
        "/api/users/",
        json={
            "email": "test@example.com",
            "password": "testpassword",
            "full_name": "Test User",
        },
        headers=superuser_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert "id" in data
    assert "password" not in data


async def test_read_users(client: AsyncClient, db: AsyncSession, superuser_headers: dict) -> None:
    """Test reading user list."""
    # Create test users
    users = [
        await UserFactory.create(session=db),
        await UserFactory.create(session=db),
        await UserFactory.create(session=db),
    ]
    
    response = await client.get("/api/users/", headers=superuser_headers)
    assert response.status_code == 200
    data = response.json()
    # Account for the superuser created by the fixture
    assert len(data) == len(users) + 1


async def test_read_user(client: AsyncClient, db: AsyncSession, superuser_headers: dict) -> None:
    """Test reading single user."""
    user = await UserFactory.create(session=db)
    
    response = await client.get(f"/api/users/{user.id}", headers=superuser_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user.id
    assert data["email"] == user.email
    assert data["full_name"] == user.full_name


async def test_update_user(client: AsyncClient, db: AsyncSession, superuser_headers: dict) -> None:
    """Test updating user."""
    user = await UserFactory.create(session=db)
    
    response = await client.put(
        f"/api/users/{user.id}",
        json={
            "full_name": "Updated User",
        },
        headers=superuser_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user.id
    assert data["full_name"] == "Updated User"


async def test_delete_user(client: AsyncClient, db: AsyncSession, superuser_headers: dict) -> None:
    """Test deleting user."""
    user = await UserFactory.create(session=db)
    
    response = await client.delete(f"/api/users/{user.id}", headers=superuser_headers)
    assert response.status_code == 204
    
    # Verify user is deleted
    response = await client.get(f"/api/users/{user.id}", headers=superuser_headers)
    assert response.status_code == 404 