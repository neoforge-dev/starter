"""Test user CRUD operations."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app import crud
from app.schemas.user import UserCreate
from app.core.security import get_password_hash
from app.core.config import settings
from tests.factories import UserFactory

pytestmark = pytest.mark.asyncio


async def test_create_user(client: AsyncClient, db: AsyncSession, superuser_headers: dict) -> None:
    """Test user creation."""
    response = await client.post(
        f"{settings.api_v1_str}/users/",
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


async def test_read_users(client: AsyncClient, db: AsyncSession) -> None:
    """Test reading user list."""
    # Clear existing users
    await db.execute(text("TRUNCATE TABLE users CASCADE"))
    await db.commit()
    
    # Create superuser first
    superuser_in = UserCreate(
        email="admin@example.com",
        password="admin123",
        full_name="Admin User",
        is_superuser=True
    )
    superuser = await crud.user.create(db, obj_in=superuser_in)
    
    # Get authentication token for superuser
    response = await client.post(
        f"{settings.api_v1_str}/auth/token",
        data={"username": superuser_in.email, "password": superuser_in.password},
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
            full_name=f"Test User {i}"
        )
        test_users.append(user_in)
        user = await crud.user.create(db, obj_in=user_in)
        assert user.email == user_in.email
    
    response = await client.get(f"{settings.api_v1_str}/users/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == len(test_users) + 1  # +1 for superuser


async def test_read_user(client: AsyncClient, db: AsyncSession, superuser_headers: dict) -> None:
    """Test reading single user."""
    user = await UserFactory.create(session=db)
    
    response = await client.get(f"{settings.api_v1_str}/users/{user.id}", headers=superuser_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user.id
    assert data["email"] == user.email
    assert data["full_name"] == user.full_name


async def test_update_user(client: AsyncClient, db: AsyncSession, superuser_headers: dict) -> None:
    """Test updating user."""
    user = await UserFactory.create(session=db)
    
    response = await client.put(
        f"{settings.api_v1_str}/users/{user.id}",
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
    
    response = await client.delete(f"{settings.api_v1_str}/users/{user.id}", headers=superuser_headers)
    assert response.status_code == 204
    
    # Verify user is deleted
    response = await client.get(f"{settings.api_v1_str}/users/{user.id}", headers=superuser_headers)
    assert response.status_code == 404 