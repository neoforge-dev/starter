"""Test admin API endpoints."""
import logging
from datetime import timedelta

import pytest
from app.models.admin import Admin, AdminRole
from app.models.user import User
from app.schemas.admin import AdminCreate
from httpx import AsyncClient
from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.security import create_access_token
from tests.factories import AdminFactory, UserFactory

# Setup logger for this test module
logger = logging.getLogger(__name__)

pytestmark = pytest.mark.asyncio


@pytest.fixture(scope="function", autouse=True)
async def cleanup_admin_users(db: AsyncSession):
    """Clean up admin users before and after each test."""
    # Delete existing admin users with test emails
    test_emails = [
        "user-admin-test@example.com",
        "content-admin-test@example.com",
        "super-admin-test@example.com",
        "readonly-admin-test@example.com",
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
        is_active=True,
    )


@pytest.fixture
async def content_admin(db: AsyncSession):
    """Create an admin user with CONTENT_ADMIN role."""
    return await AdminFactory.create(
        session=db,
        email="content-admin-test@example.com",
        password="admin123",
        role=AdminRole.CONTENT_ADMIN,
        is_active=True,
    )


@pytest.fixture
async def super_admin(db: AsyncSession):
    """Create an admin user with SUPER_ADMIN role."""
    return await AdminFactory.create(
        session=db,
        email="super-admin-test@example.com",
        password="admin123",
        role=AdminRole.SUPER_ADMIN,
        is_active=True,
    )


@pytest.fixture
async def readonly_admin(db: AsyncSession):
    """Create an admin user with READONLY_ADMIN role."""
    return await AdminFactory.create(
        session=db,
        email="readonly-admin-test@example.com",
        password="admin123",
        role=AdminRole.READONLY_ADMIN,
        is_active=True,
    )


@pytest.fixture
async def super_admin_headers(super_admin: Admin, test_settings: Settings) -> dict:
    """Get headers for super admin authentication."""
    # Ensure the user relationship is loaded if needed for user_id
    # This might require a refresh/load if super_admin fixture doesn't eager load
    if not hasattr(super_admin, "user") or not super_admin.user:
        # Handle cases where user might not be loaded - ideally fixture handles this
        # For now, assume super_admin fixture provides user_id correctly
        pass

    access_token = create_access_token(
        subject=str(super_admin.user_id),
        settings=test_settings,  # Pass settings object
        expires_delta=timedelta(minutes=test_settings.access_token_expire_minutes),
    )
    return {"Authorization": f"Bearer {access_token}"}


async def test_admin_endpoints_registered(
    client: AsyncClient, test_settings: Settings
) -> None:
    """Test that admin endpoints are properly registered."""
    # Test the admin root endpoint
    response = await client.get(f"{test_settings.api_v1_str}/admin/")
    assert response.status_code != 404, "Admin root endpoint not found"

    # The actual status code might be 401 (Unauthorized) or 403 (Forbidden)
    # but it should not be 404 (Not Found)
    assert response.status_code in (
        401,
        403,
        200,
        422,
    ), f"Unexpected status code: {response.status_code}"


@pytest.mark.parametrize(
    "role, expected_status",
    [
        (AdminRole.USER_ADMIN, 201),
        (AdminRole.CONTENT_ADMIN, 201),
        (AdminRole.SUPER_ADMIN, 201),  # Super admin can create super admin
        (
            AdminRole.READONLY_ADMIN,
            201,
        ),  # Super admin can create readonly admin (Changed from 403)
    ],
)
async def test_create_admin_user_permissions(
    client: AsyncClient,
    db: AsyncSession,
    role: AdminRole,
    expected_status: int,
    test_settings: Settings,
) -> None:
    """Test admin creation permissions based on creator's role."""
    creator_role = AdminRole.SUPER_ADMIN  # Test as super admin for simplicity first
    # To test specific role permissions, adjust creator_role and expected_status

    # Create the admin who will perform the action
    creator = await AdminFactory.create(
        session=db, email=f"creator-{role.value}@example.com", role=creator_role
    )
    await db.commit()  # Commit to ensure user exists for token generation
    await db.refresh(
        creator, attribute_names=["user"]
    )  # Refresh to load user relationship

    # Generate headers for the creator admin (Replicated logic from fixture)
    # creator_headers = await get_admin_headers(creator, test_settings)
    user_id_for_token = str(creator.user.id)
    access_token_expires = timedelta(minutes=test_settings.access_token_expire_minutes)
    token = create_access_token(
        subject=user_id_for_token,
        settings=test_settings,
        expires_delta=access_token_expires,
    )
    creator_headers = {"Authorization": f"Bearer {token}"}

    # Data for the new admin to be created
    new_admin_email = f"new-admin-{role.value}@example.com"
    new_admin_data = {
        "email": new_admin_email,
        "password": "newpassword123",
        "password_confirm": "newpassword123",
        "full_name": f"New {role.value} Admin",
        "role": role.value,
    }

    response = await client.post(
        f"{test_settings.api_v1_str}/admin/",  # Use test_settings
        json=new_admin_data,
        headers=creator_headers,
    )

    assert response.status_code == expected_status

    # Clean up created users
    await cleanup_test_users(db, [f"creator-{role.value}@example.com", new_admin_email])


async def cleanup_test_users(db: AsyncSession, emails: list[str]):
    """Delete admin and user records with the specified emails."""
    if not emails:
        return
    try:
        # Find users first
        user_select_stmt = select(User).where(User.email.in_(emails))
        users_to_delete = (await db.execute(user_select_stmt)).scalars().all()
        user_ids = [u.id for u in users_to_delete]

        if user_ids:
            # Delete Admin records referencing these users first
            admin_delete_stmt = delete(Admin).where(Admin.user_id.in_(user_ids))
            await db.execute(admin_delete_stmt)

            # Then delete the User records
            user_delete_stmt = delete(User).where(User.id.in_(user_ids))
            await db.execute(user_delete_stmt)

            await db.commit()  # Commit deletions
            logger.info(f"Cleaned up admin/user records for emails: {emails}")
        else:
            logger.info(f"No users found for cleanup with emails: {emails}")
            # Ensure transaction state is clean if nothing was deleted but commit was expected
            # await db.commit() # Not strictly necessary if nothing was done, might cause issues if tx aborted
            pass  # Or potentially rollback if we know the tx might be bad
    except Exception as e:
        logger.error(f"Error during cleanup for emails {emails}: {e}", exc_info=True)
        await db.rollback()  # Rollback on error to prevent transaction issues
        # Re-raise or handle as appropriate for testing context
        raise


async def test_read_specific_admin_user(
    client: AsyncClient,
    db: AsyncSession,
    super_admin_headers: dict,
    test_settings: Settings,
) -> None:
    """Test reading a specific admin user by ID as super admin."""
    # Create an admin to read
    admin_to_read = await AdminFactory.create(session=db, email="read-me@example.com")
    await db.commit()
    await db.refresh(admin_to_read, attribute_names=["user"])

    response = await client.get(
        f"{test_settings.api_v1_str}/admin/{admin_to_read.id}",
        headers=super_admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == admin_to_read.id
    assert (
        data["email"] == "read-me@example.com"
    ), f"Expected email 'read-me@example.com', got {data.get('email')} in {data}"

    # Clean up
    await cleanup_test_users(db, ["read-me@example.com"])


async def test_update_specific_admin_user(
    client: AsyncClient,
    db: AsyncSession,
    super_admin_headers: dict,
    test_settings: Settings,
) -> None:
    """Test updating a specific admin user by ID as super admin."""
    # Create an admin to update
    admin_to_update = await AdminFactory.create(
        session=db, email="update-me@example.com", role=AdminRole.USER_ADMIN
    )
    await db.commit()
    await db.refresh(admin_to_update, attribute_names=["user"])

    update_data = {"role": AdminRole.CONTENT_ADMIN.value, "is_active": False}

    response = await client.put(
        f"{test_settings.api_v1_str}/admin/{admin_to_update.id}",
        json=update_data,
        headers=super_admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == admin_to_update.id
    assert data["role"] == AdminRole.CONTENT_ADMIN.value
    assert data["is_active"] is False

    # Clean up
    await cleanup_test_users(db, ["update-me@example.com"])


async def test_delete_specific_admin_user(
    client: AsyncClient,
    db: AsyncSession,
    super_admin_headers: dict,
    test_settings: Settings,
) -> None:
    """Test deleting a specific admin user by ID as super admin."""
    # Create an admin to delete
    admin_to_delete = await AdminFactory.create(
        session=db, email="delete-me@example.com"
    )
    admin_id_to_delete = admin_to_delete.id
    user_email_to_delete = (
        admin_to_delete.user.email
    )  # Get email before potential cascade delete
    await db.commit()

    response = await client.delete(
        f"{test_settings.api_v1_str}/admin/{admin_id_to_delete}",
        headers=super_admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == admin_id_to_delete

    # Verify deletion (optional, depending on endpoint response)
    # check_response = await client.get(f"{test_settings.api_v1_str}/admin/{admin_id_to_delete}", headers=super_admin_headers)
    # assert check_response.status_code == 404

    # Clean up (user might already be deleted by cascade, but attempt anyway)
    await cleanup_test_users(db, [user_email_to_delete])


async def test_admin_permission_checks(
    client: AsyncClient,
    normal_user_token_headers: tuple[dict, User],
    db: AsyncSession,
    test_settings: Settings,
) -> None:
    """Test that regular users cannot access admin endpoints."""
    headers, _ = normal_user_token_headers  # Unpack the tuple

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
            f"{test_settings.api_v1_str}/admin{endpoint}",
            headers=headers,
        )
        assert (
            response.status_code >= 400
        ), f"Endpoint {method} {endpoint} should be protected (>=400), got {response.status_code}"

    # Clean up
    await cleanup_test_users(db, ["read-me@example.com"])

    # Clean up
    await cleanup_test_users(db, ["update-me@example.com"])

    # Clean up
    await cleanup_test_users(db, ["delete-me@example.com"])

    # Clean up
    await cleanup_test_users(
        db, ["creator-USER_ADMIN@example.com", "new-admin-USER_ADMIN@example.com"]
    )
    await cleanup_test_users(
        db, ["creator-CONTENT_ADMIN@example.com", "new-admin-CONTENT_ADMIN@example.com"]
    )
    await cleanup_test_users(
        db, ["creator-SUPER_ADMIN@example.com", "new-admin-SUPER_ADMIN@example.com"]
    )
    await cleanup_test_users(
        db,
        ["creator-READONLY_ADMIN@example.com", "new-admin-READONLY_ADMIN@example.com"],
    )

    await db.commit()
