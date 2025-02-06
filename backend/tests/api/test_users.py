"""Test user CRUD operations."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from tests.factories import UserFactory

pytestmark = pytest.mark.asyncio


async def test_create_user(client: AsyncClient, db: AsyncSession) -> None:
    """Test user creation."""
    response = await client.post(
        "/api/users/",
        json={
            "email": "test@example.com",
            "password": "testpassword",
            "full_name": "Test User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert "id" in data
    assert "password" not in data


async def test_read_users(client: AsyncClient, db: AsyncSession) -> None:
    """Test reading user list."""
    # Create test users
    users = [
        await UserFactory(session=db),
        await UserFactory(session=db),
        await UserFactory(session=db),
    ]
    
    response = await client.get("/api/users/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == len(users)


async def test_read_user(client: AsyncClient, db: AsyncSession) -> None:
    """Test reading single user."""
    user = await UserFactory(session=db)
    
    response = await client.get(f"/api/users/{user.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user.id
    assert data["email"] == user.email
    assert data["full_name"] == user.full_name


async def test_update_user(client: AsyncClient, db: AsyncSession) -> None:
    """Test updating user."""
    user = await UserFactory(session=db)
    
    response = await client.put(
        f"/api/users/{user.id}",
        json={
            "email": "updated@example.com",
            "full_name": "Updated User",
            "password": "newpassword",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "updated@example.com"
    assert data["full_name"] == "Updated User"


async def test_delete_user(client: AsyncClient, db: AsyncSession) -> None:
    """Test deleting user."""
    user = await UserFactory(session=db)
    
    response = await client.delete(f"/api/users/{user.id}")
    assert response.status_code == 204
    
    # Verify user is deleted
    response = await client.get(f"/api/users/{user.id}")
    assert response.status_code == 404 