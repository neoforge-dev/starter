"""
Tests for the factory classes used to generate test data.
"""

import pytest
from app.models.admin import Admin, AdminRole
from app.models.item import Item
from app.models.user import User
from app.schemas.user import UserCreate
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import AdminFactory, ItemFactory, UserCreateFactory, UserFactory

pytestmark = pytest.mark.asyncio


async def test_user_factory_create(db: AsyncSession):
    """Test creating a user with UserFactory."""
    # Create a user with default values
    user = await UserFactory.create(session=db)

    # Verify the user was created
    assert user.id is not None
    assert "@" in user.email  # Email should be valid
    assert user.full_name is not None
    assert user.hashed_password is not None
    assert user.is_active is True
    assert user.is_superuser is False

    # Verify we can retrieve it from the database
    result = await db.execute(select(User).where(User.id == user.id))
    db_user = result.scalar_one()
    assert db_user.email == user.email


async def test_user_factory_with_custom_values(db: AsyncSession):
    """Test creating a user with custom values."""
    custom_data = {
        "email": "custom@example.com",
        "full_name": "Custom User",
        "password": "custom_password",  # Should be hashed
        "is_active": False,
        "is_superuser": True,
    }

    user = await UserFactory.create(session=db, **custom_data)

    assert user.email == custom_data["email"]
    assert user.full_name == custom_data["full_name"]
    assert user.hashed_password != custom_data["password"]  # Password should be hashed
    assert user.is_active == custom_data["is_active"]
    assert user.is_superuser == custom_data["is_superuser"]


async def test_user_factory_create_batch(db: AsyncSession):
    """Test creating multiple users with UserFactory."""
    users = await UserFactory.create_batch(db, size=3)

    assert len(users) == 3
    # Verify all users have unique emails
    emails = [user.email for user in users]
    assert len(set(emails)) == 3


async def test_admin_factory_create(db: AsyncSession):
    """Test creating an admin with AdminFactory."""
    admin = await AdminFactory.create(session=db)

    # Verify admin properties
    assert admin.id is not None
    assert admin.user_id is not None
    assert admin.role == AdminRole.USER_ADMIN
    assert admin.is_active is True

    # Verify associated user was created
    assert admin.user is not None
    assert admin.user.is_superuser is True
    assert admin.user.is_active is True


async def test_admin_factory_with_custom_values(db: AsyncSession):
    """Test creating an admin with custom values."""
    custom_data = {
        "email": "custom.admin@example.com",
        "full_name": "Custom Admin",
        "password": "admin_password",
        "role": AdminRole.SUPER_ADMIN,
        "is_active": False,
    }

    admin = await AdminFactory.create(session=db, **custom_data)

    assert admin.role == custom_data["role"]
    assert admin.is_active == custom_data["is_active"]
    assert admin.user.email == custom_data["email"]
    assert admin.user.full_name == custom_data["full_name"]


async def test_item_factory_create(db: AsyncSession):
    """Test creating an item with ItemFactory."""
    # First create a user as owner
    user = await UserFactory.create(session=db)

    # Create an item with the user as owner
    item = await ItemFactory.create(session=db, owner=user)

    assert item.id is not None
    assert item.owner_id == user.id
    assert item.title is not None
    assert item.description is not None

    # Verify we can retrieve it from the database
    result = await db.execute(select(Item).where(Item.id == item.id))
    db_item = result.scalar_one()
    assert db_item.owner_id == user.id


async def test_item_factory_with_custom_values(db: AsyncSession):
    """Test creating an item with custom values."""
    user = await UserFactory.create(session=db)

    custom_data = {
        "title": "Custom Item",
        "description": "Custom Description",
        "owner": user,
    }

    item = await ItemFactory.create(session=db, **custom_data)

    assert item.title == custom_data["title"]
    assert item.description == custom_data["description"]
    assert item.owner_id == user.id


async def test_user_create_factory(db: AsyncSession):
    """Test UserCreateFactory for schema validation."""
    user_create = UserCreateFactory()

    assert user_create.email is not None
    assert "@" in user_create.email
    assert user_create.full_name is not None
    assert user_create.password is not None
    assert user_create.password == user_create.password_confirm
    assert len(user_create.password) >= 12  # Password should be at least 12 chars
