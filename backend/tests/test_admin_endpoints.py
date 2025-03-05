"""Test admin API endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, delete
import logging
from datetime import timedelta

from app.core.config import settings
from app.models.admin import AdminRole, Admin
from app.models.user import User
from app.core.security import create_access_token
from app.schemas.admin import AdminCreate
from tests.factories import UserFactory, AdminFactory

pytestmark = pytest.mark.asyncio


@pytest.fixture(scope="function", autouse=True)
async def cleanup_admin_users(db: AsyncSession):
    """Clean up admin users before and after each test."""
    # Delete existing admin users with test emails
    test_emails = [
        "user-admin-test@example.com",
        "content-admin-test@example.com",
        "super-admin-test@example.com",
        "readonly-admin-test@example.com"
    ]
    
    # First find users with these emails
    for email in test_emails:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            # Delete associated admin record first
            await db.execute(delete(Admin).where(Admin.user_id == user.id))
            # Then delete the user
            await db.execute(delete(User).where(User.id == user.id))
    
    await db.commit()
    
    yield
    
    # Clean up after test
    for email in test_emails:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            # Delete associated admin record first
            await db.execute(delete(Admin).where(Admin.user_id == user.id))
            # Then delete the user
            await db.execute(delete(User).where(User.id == user.id))
    
    await db.commit()


@pytest.fixture
async def admin_user(db: AsyncSession):
    """Create an admin user with USER_ADMIN role."""
    return await AdminFactory.create(
        session=db,
        email="user-admin-test@example.com",
        password="admin123",
        role=AdminRole.USER_ADMIN,
        is_active=True
    )


@pytest.fixture
async def content_admin(db: AsyncSession):
    """Create an admin user with CONTENT_ADMIN role."""
    return await AdminFactory.create(
        session=db,
        email="content-admin-test@example.com",
        password="admin123",
        role=AdminRole.CONTENT_ADMIN,
        is_active=True
    )


@pytest.fixture
async def super_admin(db: AsyncSession):
    """Create an admin user with SUPER_ADMIN role."""
    return await AdminFactory.create(
        session=db,
        email="super-admin-test@example.com",
        password="admin123",
        role=AdminRole.SUPER_ADMIN,
        is_active=True
    )


@pytest.fixture
async def readonly_admin(db: AsyncSession):
    """Create an admin user with READONLY_ADMIN role."""
    return await AdminFactory.create(
        session=db,
        email="readonly-admin-test@example.com",
        password="admin123",
        role=AdminRole.READONLY_ADMIN,
        is_active=True
    )


@pytest.fixture
async def super_admin_headers(super_admin: Admin, test_settings) -> dict:
    """Get headers for super admin authentication."""
    access_token = create_access_token(
        subject=str(super_admin.user_id),
        expires_delta=timedelta(minutes=test_settings.access_token_expire_minutes)
    )
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }


async def test_admin_endpoints_registered(client: AsyncClient) -> None:
    """Test that admin endpoints are properly registered."""
    # Test the admin root endpoint
    response = await client.get(f"{settings.api_v1_str}/admin/")
    assert response.status_code != 404, "Admin endpoint not found (404)"
    
    # The actual status code might be 401 (Unauthorized) or 403 (Forbidden)
    # but it should not be 404 (Not Found)
    assert response.status_code in (401, 403, 200, 422), f"Unexpected status code: {response.status_code}"


async def test_create_admin(
    client: AsyncClient,
    super_admin_headers: dict,
    db: AsyncSession,
) -> None:
    """Test creating a new admin."""
    admin_data = {
        "email": "newadmin@example.com",
        "password": "strongpassword123",
        "full_name": "New Admin",
        "role": AdminRole.USER_ADMIN,
        "is_active": True
    }
    
    response = await client.post(
        f"{settings.api_v1_str}/admin/",
        headers=super_admin_headers,
        json=admin_data,
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["email"] == admin_data["email"]
    assert data["role"] == AdminRole.USER_ADMIN
    assert "id" in data


async def test_read_admin_me(
    client: AsyncClient,
    super_admin_headers: dict,
    db: AsyncSession,
) -> None:
    """Test getting current admin user."""
    response = await client.get(
        f"{settings.api_v1_str}/admin/me",
        headers=super_admin_headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["role"] == AdminRole.SUPER_ADMIN
    assert "id" in data


async def test_read_admin_by_id(
    client: AsyncClient,
    super_admin_headers: dict,
    db: AsyncSession,
) -> None:
    """Test getting an admin by ID."""
    # Create a test admin
    user = await UserFactory.create(session=db)
    admin = await AdminFactory.create(session=db, user_id=user.id)
    
    response = await client.get(
        f"{settings.api_v1_str}/admin/{admin.id}",
        headers=super_admin_headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["id"] == admin.id
    assert data["role"] == admin.role


async def test_read_admins(
    client: AsyncClient,
    super_admin_headers: dict,
    db: AsyncSession,
) -> None:
    """Test retrieving list of admins."""
    # Create some test admins
    for _ in range(3):
        user = await UserFactory.create(session=db)
        await AdminFactory.create(session=db, user_id=user.id)
    
    response = await client.get(
        f"{settings.api_v1_str}/admin/",
        headers=super_admin_headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert len(data) >= 3  # At least our created admins


async def test_update_admin(
    client: AsyncClient,
    super_admin_headers: dict,
    db: AsyncSession,
) -> None:
    """Test updating an admin."""
    # Create a test admin
    user = await UserFactory.create(session=db)
    admin = await AdminFactory.create(session=db, user_id=user.id)
    
    update_data = {
        "role": AdminRole.CONTENT_ADMIN,
        "is_active": True
    }
    
    response = await client.put(
        f"{settings.api_v1_str}/admin/{admin.id}",
        headers=super_admin_headers,
        json=update_data,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["role"] == AdminRole.CONTENT_ADMIN


async def test_delete_admin(
    client: AsyncClient,
    super_admin_headers: dict,
    db: AsyncSession,
) -> None:
    """Test deleting an admin."""
    # Create a test admin
    user = await UserFactory.create(session=db)
    admin = await AdminFactory.create(session=db, user_id=user.id)
    
    response = await client.delete(
        f"{settings.api_v1_str}/admin/{admin.id}",
        headers=super_admin_headers,
    )
    assert response.status_code == 200, response.text
    
    # Verify admin is deleted
    response = await client.get(
        f"{settings.api_v1_str}/admin/{admin.id}",
        headers=super_admin_headers,
    )
    assert response.status_code == 404


async def test_admin_permission_checks(
    client: AsyncClient,
    regular_user_headers: dict,
    db: AsyncSession,
) -> None:
    """Test that regular users cannot access admin endpoints."""
    # Try to access admin endpoints with regular user
    endpoints = [
        ("GET", "/"),
        ("POST", "/"),
        ("GET", "/me"),
        ("GET", "/1"),
        ("PUT", "/1"),
        ("DELETE", "/1"),
    ]
    
    for method, endpoint in endpoints:
        response = await client.request(
            method,
            f"{settings.api_v1_str}/admin{endpoint}",
            headers=regular_user_headers,
        )
        assert response.status_code in (401, 403), f"Endpoint {method} {endpoint} should be protected" 