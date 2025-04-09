"""Test API dependencies."""
import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt
from httpx import AsyncClient

from app.api import deps
from app.core.config import settings, Settings
from app.models.user import User
from app.models.admin import Admin, AdminRole
from tests.factories import UserFactory

pytestmark = pytest.mark.asyncio


async def test_get_db(db: AsyncSession):
    """Test database session dependency."""
    assert isinstance(db, AsyncSession)


async def test_get_current_user_valid_token(client: AsyncClient, db: AsyncSession, test_settings: Settings):
    """Test getting current user with valid token via endpoint."""
    user = await UserFactory.create(session=db)
    await db.commit()
    await db.refresh(user) # Ensure ID is loaded
    
    token = jwt.encode(
        {"sub": str(user.id)}, # Use the actual ID from the created user
        test_settings.secret_key.get_secret_value(),
        algorithm=test_settings.algorithm
    )
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "pytest-test-client",
        "Accept": "application/json"
    }
    
    response = await client.get("/test-deps/current-user", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user.id
    assert data["email"] == user.email


async def test_get_current_user_invalid_token(client: AsyncClient):
    """Test getting current user with invalid token via endpoint."""
    headers = {
        "Authorization": "Bearer invalid-token",
        "User-Agent": "pytest-test-client",
        "Accept": "application/json"
    }
    response = await client.get("/test-deps/current-user", headers=headers)
    assert response.status_code == 401
    assert "Could not validate credentials" in response.json()["detail"]


async def test_get_current_user_nonexistent_user(client: AsyncClient, db: AsyncSession, test_settings: Settings):
    """Test getting current user with token for nonexistent user via endpoint."""
    token = jwt.encode(
        {"sub": "999999"},  # Non-existent user ID
        test_settings.secret_key.get_secret_value(),
        algorithm=test_settings.algorithm
    )
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "pytest-test-client",
        "Accept": "application/json"
    }
    
    response = await client.get("/test-deps/current-user", headers=headers)
    assert response.status_code == 404


async def test_get_current_user_inactive_user(client: AsyncClient, db: AsyncSession, test_settings: Settings):
    """Test getting current user with inactive user via endpoint."""
    user = await UserFactory.create(session=db, is_active=False)
    await db.commit()
    await db.refresh(user)

    token = jwt.encode(
        {"sub": str(user.id)},
        test_settings.secret_key.get_secret_value(),
        algorithm=test_settings.algorithm
    )
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "pytest-test-client",
        "Accept": "application/json"
    }
    
    response = await client.get("/test-deps/current-user", headers=headers)
    assert response.status_code == 200


async def test_get_current_active_user(client: AsyncClient, regular_user_headers: dict, regular_user: User):
    """Test getting current active user."""
    # This dependency relies on get_current_user, so we test via an endpoint
    # We'll use the existing /users/me endpoint which uses get_current_active_user implicitly
    response = await client.get(f"{settings.api_v1_str}/users/me", headers=regular_user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == regular_user.id


async def test_get_current_active_user_inactive(client: AsyncClient, db: AsyncSession, test_settings: Settings):
    """Test getting current active user when user is inactive."""
    user = await UserFactory.create(session=db, is_active=False)
    await db.commit()
    await db.refresh(user)
    
    token = jwt.encode(
        {"sub": str(user.id)}, 
        test_settings.secret_key.get_secret_value(), 
        algorithm=test_settings.algorithm
    )
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "pytest-test-client",
        "Accept": "application/json"
    }
    
    # Use the /users/me endpoint which depends on get_current_active_user
    response = await client.get(f"{settings.api_v1_str}/users/me", headers=headers)
    assert response.status_code == 400
    assert "Inactive user" in response.json()["detail"]


async def test_get_current_active_superuser(db: AsyncSession):
    """Test getting current active superuser."""
    user = await UserFactory.create(session=db, is_superuser=True)
    superuser = await deps.get_current_active_superuser(current_user=user)
    assert superuser == user


async def test_get_current_active_superuser_not_superuser(db: AsyncSession):
    """Test getting current active superuser with non-superuser."""
    user = await UserFactory.create(session=db, is_superuser=False)
    with pytest.raises(HTTPException) as exc_info:
        await deps.get_current_active_superuser(current_user=user)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "The user doesn't have enough privileges"


async def test_get_current_admin(db: AsyncSession):
    """Test getting current admin user."""
    # Create user and admin
    user = await UserFactory.create(session=db)
    admin = Admin(
        user_id=user.id,
        role=AdminRole.SUPER_ADMIN,
        is_active=True
    )
    db.add(admin)
    await db.flush()
    
    current_admin = await deps.get_current_admin(db=db, current_user=user)
    assert isinstance(current_admin, Admin)
    assert current_admin.user_id == user.id


async def test_get_current_admin_not_admin(db: AsyncSession):
    """Test getting current admin with non-admin user."""
    user = await UserFactory.create(session=db)
    with pytest.raises(HTTPException) as exc_info:
        await deps.get_current_admin(db=db, current_user=user)
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "The user is not an admin"


async def test_get_current_admin_inactive(db: AsyncSession):
    """Test getting current admin with inactive admin."""
    # Create user and inactive admin
    user = await UserFactory.create(session=db)
    admin = Admin(
        user_id=user.id,
        role=AdminRole.SUPER_ADMIN,
        is_active=False
    )
    db.add(admin)
    await db.flush()
    
    with pytest.raises(HTTPException) as exc_info:
        await deps.get_current_admin(db=db, current_user=user)
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Inactive admin user"


async def test_get_current_active_admin(db: AsyncSession):
    """Test getting current active admin."""
    # Create user and active admin
    user = await UserFactory.create(session=db)
    admin = Admin(
        user_id=user.id,
        role=AdminRole.SUPER_ADMIN,
        is_active=True
    )
    db.add(admin)
    await db.flush()
    
    current_admin = await deps.get_current_active_admin(current_admin=admin)
    assert current_admin == admin


async def test_get_current_active_admin_inactive(db: AsyncSession):
    """Test getting current active admin with inactive admin."""
    # Create user and inactive admin
    user = await UserFactory.create(session=db)
    admin = Admin(
        user_id=user.id,
        role=AdminRole.SUPER_ADMIN,
        is_active=False
    )
    db.add(admin)
    await db.flush()
    
    with pytest.raises(HTTPException) as exc_info:
        await deps.get_current_active_admin(current_admin=admin)
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Inactive admin user" 