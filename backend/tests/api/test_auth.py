"""Test authentication endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from tests.factories import UserFactory

pytestmark = pytest.mark.asyncio


async def test_login_access_token(client: AsyncClient, db: AsyncSession) -> None:
    """Test login with valid credentials."""
    # Create a test user
    user = await UserFactory.create(
        session=db,
        email="test-auth@example.com",
        password="testpassword123",
        is_active=True
    )
    
    # Test login
    response = await client.post(
        f"{settings.api_v1_str}/auth/token",
        data={"username": "test-auth@example.com", "password": "testpassword123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


async def test_login_invalid_credentials(client: AsyncClient, db: AsyncSession) -> None:
    """Test login with invalid credentials."""
    # Create a test user
    user = await UserFactory.create(
        session=db,
        email="test-auth-invalid@example.com",
        password="testpassword123",
        is_active=True
    )
    
    # Test login with wrong password
    response = await client.post(
        f"{settings.api_v1_str}/auth/token",
        data={"username": "test-auth-invalid@example.com", "password": "wrongpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Incorrect email or password"
    
    # Test login with non-existent user
    response = await client.post(
        f"{settings.api_v1_str}/auth/token",
        data={"username": "nonexistent@example.com", "password": "testpassword123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Incorrect email or password"


async def test_login_inactive_user(client: AsyncClient, db: AsyncSession) -> None:
    """Test login with inactive user."""
    # Create an inactive test user
    user = await UserFactory.create(
        session=db,
        email="inactive@example.com",
        password="testpassword123",
        is_active=False
    )
    
    # Test login
    response = await client.post(
        f"{settings.api_v1_str}/auth/token",
        data={"username": "inactive@example.com", "password": "testpassword123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Incorrect email or password" 