"""
Security test suite covering authentication, authorization, and protections.
"""

import pytest
from fastapi import status
from httpx import AsyncClient
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from tests.factories import UserFactory

pytestmark = pytest.mark.asyncio


async def test_unauthenticated_access(client: AsyncClient):
    """Test protected routes without authentication."""
    endpoints = [
        ("GET", "/api/users/me"),
        ("PATCH", "/api/users/me"),
    ]
    
    for method, path in endpoints:
        response = await client.request(method, path)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()["detail"] == "Not authenticated"


async def test_invalid_token(client: AsyncClient):
    """Test authentication with invalid JWT tokens."""
    headers = {"Authorization": "Bearer invalid_token"}
    response = await client.get("/api/users/me", headers=headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Could not validate credentials"


async def test_expired_token(client: AsyncClient):
    """Test authentication with expired JWT token."""
    expired_token = jwt.encode(
        {"sub": "user1", "exp": 1},  # Expired in 1970
        settings.secret_key,
        algorithm=settings.algorithm,
    )
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = await client.get("/api/users/me", headers=headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Could not validate credentials"


async def test_regular_user_access(client: AsyncClient, regular_user_headers: dict):
    """Test regular user access to protected endpoints."""
    response = await client.get("/api/users/me", headers=regular_user_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "id" in data
    assert "email" in data
    assert "full_name" in data


async def test_superuser_access(client: AsyncClient, superuser_headers: dict):
    """Test superuser access to protected endpoints."""
    # Test access to user list (protected endpoint)
    response = await client.get("/api/users/", headers=superuser_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)


async def test_login_access_token(client: AsyncClient, db: AsyncSession):
    """Test login endpoint."""
    # Create test user
    user = await UserFactory.create(
        session=db,
        email="test@example.com",
        password="testpassword",
    )
    
    # Test login
    response = await client.post(
        "/api/auth/token",
        data={
            "username": "test@example.com",
            "password": "testpassword",
        },
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer" 