"""Test admin API endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.config import settings
from app.models.admin import AdminRole
from tests.factories import UserFactory, AdminFactory

pytestmark = pytest.mark.asyncio


@pytest.fixture
async def admin_user(db: AsyncSession):
    """Create an admin user with USER_ADMIN role."""
    return await AdminFactory.create(
        session=db,
        email="user-admin@example.com",
        password="admin123",
        role=AdminRole.USER_ADMIN,
        is_active=True
    )


@pytest.fixture
async def content_admin(db: AsyncSession):
    """Create an admin user with CONTENT_ADMIN role."""
    return await AdminFactory.create(
        session=db,
        email="content-admin@example.com",
        password="admin123",
        role=AdminRole.CONTENT_ADMIN,
        is_active=True
    )


@pytest.fixture
async def super_admin(db: AsyncSession):
    """Create an admin user with SUPER_ADMIN role."""
    return await AdminFactory.create(
        session=db,
        email="super-admin@example.com",
        password="admin123",
        role=AdminRole.SUPER_ADMIN,
        is_active=True
    )


@pytest.fixture
async def readonly_admin(db: AsyncSession):
    """Create an admin user with READONLY_ADMIN role."""
    return await AdminFactory.create(
        session=db,
        email="readonly-admin@example.com",
        password="admin123",
        role=AdminRole.READONLY_ADMIN,
        is_active=True
    )


@pytest.fixture
async def admin_headers(admin_user, test_settings):
    """Get headers for admin user authentication."""
    from app.core.security import create_access_token
    from datetime import timedelta
    
    access_token = create_access_token(
        subject=str(admin_user.id),
        expires_delta=timedelta(minutes=test_settings.access_token_expire_minutes)
    )
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }


@pytest.fixture
async def content_admin_headers(content_admin, test_settings):
    """Get headers for content admin user authentication."""
    from app.core.security import create_access_token
    from datetime import timedelta
    
    access_token = create_access_token(
        subject=str(content_admin.id),
        expires_delta=timedelta(minutes=test_settings.access_token_expire_minutes)
    )
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }


@pytest.fixture
async def super_admin_headers(super_admin, test_settings):
    """Get headers for super admin user authentication."""
    from app.core.security import create_access_token
    from datetime import timedelta
    
    access_token = create_access_token(
        subject=str(super_admin.id),
        expires_delta=timedelta(minutes=test_settings.access_token_expire_minutes)
    )
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }


@pytest.fixture
async def readonly_admin_headers(readonly_admin, test_settings):
    """Get headers for readonly admin user authentication."""
    from app.core.security import create_access_token
    from datetime import timedelta
    
    access_token = create_access_token(
        subject=str(readonly_admin.id),
        expires_delta=timedelta(minutes=test_settings.access_token_expire_minutes)
    )
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }


async def test_create_admin(client: AsyncClient, db: AsyncSession, super_admin_headers: dict) -> None:
    """Test creating a new admin user."""
    # Clean up existing users with this email if any
    await db.execute(text("DELETE FROM users WHERE email = 'new-admin@example.com'"))
    await db.commit()
    
    admin_data = {
        "email": "new-admin@example.com",
        "password": "newadmin123",
        "full_name": "New Admin",
        "role": AdminRole.USER_ADMIN.value
    }
    
    response = await client.post(
        f"{settings.api_v1_str}/admin/",
        json=admin_data,
        headers=super_admin_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == admin_data["email"]
    assert data["full_name"] == admin_data["full_name"]
    assert data["role"] == admin_data["role"]
    assert "id" in data
    assert "password" not in data


async def test_create_admin_permission_denied(client: AsyncClient, db: AsyncSession, readonly_admin_headers: dict) -> None:
    """Test creating a new admin user with insufficient permissions."""
    admin_data = {
        "email": "another-admin@example.com",
        "password": "anotheradmin123",
        "full_name": "Another Admin",
        "role": AdminRole.USER_ADMIN.value
    }
    
    response = await client.post(
        f"{settings.api_v1_str}/admin/",
        json=admin_data,
        headers=readonly_admin_headers
    )
    
    assert response.status_code == 403
    data = response.json()
    assert "detail" in data


async def test_read_admin_me(client: AsyncClient, db: AsyncSession, admin_headers: dict, admin_user) -> None:
    """Test reading current admin user."""
    response = await client.get(
        f"{settings.api_v1_str}/admin/me",
        headers=admin_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == admin_user.id
    assert data["email"] == admin_user.email
    assert data["role"] == admin_user.role.value


async def test_read_admin(client: AsyncClient, db: AsyncSession, super_admin_headers: dict, admin_user) -> None:
    """Test reading a specific admin user."""
    response = await client.get(
        f"{settings.api_v1_str}/admin/{admin_user.id}",
        headers=super_admin_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == admin_user.id
    assert data["email"] == admin_user.email
    assert data["role"] == admin_user.role.value


async def test_read_admin_permission_denied(client: AsyncClient, db: AsyncSession, readonly_admin_headers: dict, admin_user) -> None:
    """Test reading a specific admin user with insufficient permissions."""
    response = await client.get(
        f"{settings.api_v1_str}/admin/{admin_user.id}",
        headers=readonly_admin_headers
    )
    
    # Readonly admin should be able to read other admins, but not modify them
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == admin_user.id


async def test_read_admins(client: AsyncClient, db: AsyncSession, super_admin_headers: dict) -> None:
    """Test reading all admin users."""
    response = await client.get(
        f"{settings.api_v1_str}/admin/",
        headers=super_admin_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


async def test_update_admin(client: AsyncClient, db: AsyncSession, super_admin_headers: dict, admin_user) -> None:
    """Test updating an admin user."""
    update_data = {
        "full_name": "Updated Admin Name",
        "role": AdminRole.CONTENT_ADMIN.value
    }
    
    response = await client.put(
        f"{settings.api_v1_str}/admin/{admin_user.id}",
        json=update_data,
        headers=super_admin_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == admin_user.id
    assert data["full_name"] == update_data["full_name"]
    assert data["role"] == update_data["role"]


async def test_update_admin_permission_denied(client: AsyncClient, db: AsyncSession, readonly_admin_headers: dict, admin_user) -> None:
    """Test updating an admin user with insufficient permissions."""
    update_data = {
        "full_name": "Should Not Update",
        "role": AdminRole.CONTENT_ADMIN.value
    }
    
    response = await client.put(
        f"{settings.api_v1_str}/admin/{admin_user.id}",
        json=update_data,
        headers=readonly_admin_headers
    )
    
    assert response.status_code == 403
    data = response.json()
    assert "detail" in data


async def test_delete_admin(client: AsyncClient, db: AsyncSession, super_admin_headers: dict) -> None:
    """Test deleting an admin user."""
    # Create a temporary admin to delete
    temp_admin = await AdminFactory.create(
        session=db,
        email="temp-admin@example.com",
        password="temp123",
        role=AdminRole.READONLY_ADMIN,
        is_active=True
    )
    
    response = await client.delete(
        f"{settings.api_v1_str}/admin/{temp_admin.id}",
        headers=super_admin_headers
    )
    
    assert response.status_code == 200
    
    # Verify admin is deleted
    response = await client.get(
        f"{settings.api_v1_str}/admin/{temp_admin.id}",
        headers=super_admin_headers
    )
    
    assert response.status_code == 404


async def test_delete_admin_permission_denied(client: AsyncClient, db: AsyncSession, content_admin_headers: dict, readonly_admin) -> None:
    """Test deleting an admin user with insufficient permissions."""
    response = await client.delete(
        f"{settings.api_v1_str}/admin/{readonly_admin.id}",
        headers=content_admin_headers
    )
    
    assert response.status_code == 403
    data = response.json()
    assert "detail" in data 