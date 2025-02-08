"""Test API dependencies."""
import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt

from app.api import deps
from app.core.config import settings
from app.models.user import User
from app.models.admin import Admin, AdminRole
from tests.factories import UserFactory

pytestmark = pytest.mark.asyncio


async def test_get_db():
    """Test database session dependency."""
    async for session in deps.get_db():
        assert isinstance(session, AsyncSession)
        break


async def test_get_current_user_valid_token(db: AsyncSession):
    """Test getting current user with valid token."""
    user = await UserFactory.create(session=db)
    token = jwt.encode(
        {"sub": str(user.id)},
        settings.secret_key,
        algorithm=settings.algorithm
    )
    
    current_user = await deps.get_current_user(db=db, token=token)
    assert isinstance(current_user, User)
    assert current_user.id == user.id


async def test_get_current_user_invalid_token(db: AsyncSession):
    """Test getting current user with invalid token."""
    with pytest.raises(HTTPException) as exc_info:
        await deps.get_current_user(db=db, token="invalid-token")
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Could not validate credentials"


async def test_get_current_user_nonexistent_user(db: AsyncSession):
    """Test getting current user with token for nonexistent user."""
    token = jwt.encode(
        {"sub": "999999"},  # Non-existent user ID
        settings.secret_key,
        algorithm=settings.algorithm
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await deps.get_current_user(db=db, token=token)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "User not found"


async def test_get_current_user_inactive_user(db: AsyncSession):
    """Test getting current user with inactive user."""
    user = await UserFactory.create(session=db, is_active=False)
    token = jwt.encode(
        {"sub": str(user.id)},
        settings.secret_key,
        algorithm=settings.algorithm
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await deps.get_current_user(db=db, token=token)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Inactive user"


async def test_get_current_active_user(db: AsyncSession):
    """Test getting current active user."""
    user = await UserFactory.create(session=db, is_active=True)
    current_user = await deps.get_current_active_user(current_user=user)
    assert current_user == user


async def test_get_current_active_user_inactive(db: AsyncSession):
    """Test getting current active user with inactive user."""
    user = await UserFactory.create(session=db, is_active=False)
    with pytest.raises(HTTPException) as exc_info:
        await deps.get_current_active_user(current_user=user)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Inactive user"


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
    await db.commit()
    await db.refresh(admin)
    
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
    await db.commit()
    
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
    await db.commit()
    await db.refresh(admin)
    
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
    await db.commit()
    await db.refresh(admin)
    
    with pytest.raises(HTTPException) as exc_info:
        await deps.get_current_active_admin(current_admin=admin)
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Inactive admin user" 