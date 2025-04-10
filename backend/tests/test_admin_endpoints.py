"""Test admin API endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, delete
import logging
from datetime import timedelta

from app.core.config import get_settings, Settings
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


@pytest.mark.parametrize(
    "role, expected_status",
    [
        (AdminRole.USER_ADMIN, 201),
        (AdminRole.CONTENT_ADMIN, 201),
        (AdminRole.SUPER_ADMIN, 201), # Super admin can create any role
        (AdminRole.READONLY_ADMIN, 403), # Readonly cannot create
    ]
)
async def test_create_admin_user_permissions(
    client: AsyncClient, db: AsyncSession, role: AdminRole, expected_status: int, test_settings: Settings
) -> None:
    """Test admin creation permissions based on creator's role."""
    creator_role = AdminRole.SUPER_ADMIN # Test as super admin for simplicity first
    # To test specific role permissions, adjust creator_role and expected_status
    
    # Create the admin who will perform the action
    creator = await AdminFactory.create(session=db, email=f"creator-{role.value}@example.com", role=creator_role)
    await db.commit()
    
    # Generate headers for the creator admin
    creator_headers = await get_admin_headers(creator, test_settings)
    
    # Data for the new admin to be created
    new_admin_data = {
        "email": f"new-admin-{role.value}@example.com",
        "password": "newpassword123",
        "password_confirm": "newpassword123",
        "full_name": f"New {role.value} Admin",
        "role": role.value
    }
    
    response = await client.post(
        f"{test_settings.api_v1_str}/admin/", # Use test_settings
        json=new_admin_data,
        headers=creator_headers
    )
    
    assert response.status_code == expected_status
    
    # Clean up created users
    await cleanup_test_users(db, [f"creator-{role.value}@example.com", f"new-admin-{role.value}@example.com"])

async def test_read_specific_admin_user(
    client: AsyncClient, db: AsyncSession, super_admin_headers: dict, test_settings: Settings
) -> None:
    """Test reading a specific admin user by ID."""
    # Create an admin user to read
    admin_to_read = await AdminFactory.create(session=db, email="read-me@example.com", role=AdminRole.USER_ADMIN)
    await db.commit()
    
    response = await client.get(
        f"{test_settings.api_v1_str}/admin/{admin_to_read.id}", # Use test_settings
        headers=super_admin_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == admin_to_read.id
    assert data["email"] == "read-me@example.com"
    
    await cleanup_test_users(db, ["read-me@example.com"])

async def test_update_admin_user_details(
    client: AsyncClient, db: AsyncSession, super_admin_headers: dict, test_settings: Settings
) -> None:
    """Test updating an admin user's details (e.g., full_name, role)."""
    admin_to_update = await AdminFactory.create(session=db, email="update-me@example.com", role=AdminRole.USER_ADMIN)
    await db.commit()
    
    update_data = {
        "full_name": "Updated Admin Name",
        "role": AdminRole.CONTENT_ADMIN.value
    }
    
    response = await client.put(
        f"{test_settings.api_v1_str}/admin/{admin_to_update.id}", # Use test_settings
        json=update_data,
        headers=super_admin_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == update_data["full_name"]
    assert data["role"] == update_data["role"]
    
    await cleanup_test_users(db, ["update-me@example.com"])

async def test_delete_admin_user(
    client: AsyncClient, db: AsyncSession, super_admin_headers: dict, test_settings: Settings
) -> None:
    """Test deleting an admin user."""
    admin_to_delete = await AdminFactory.create(session=db, email="delete-me@example.com", role=AdminRole.READONLY_ADMIN)
    admin_id_to_delete = admin_to_delete.id
    await db.commit()
    
    response = await client.delete(
        f"{test_settings.api_v1_str}/admin/{admin_id_to_delete}", # Use test_settings
        headers=super_admin_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Admin user deleted successfully"
    
    # Verify deletion
    response = await client.get(
        f"{test_settings.api_v1_str}/admin/{admin_id_to_delete}", # Use test_settings
        headers=super_admin_headers
    )
    assert response.status_code == 404
    
    await cleanup_test_users(db, ["delete-me@example.com"])


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