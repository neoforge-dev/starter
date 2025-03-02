"""
Tests for the factory classes used to generate test data.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.item import Item
from app.schemas.user import UserCreate
from tests.factories import UserFactory, ItemFactory, UserCreateFactory


@pytest.mark.asyncio
async def test_user_factory_create(db_session: AsyncSession):
    """Test that UserFactory.create creates a user with expected attributes."""
    # Create a user with default attributes
    user = await UserFactory.create(session=db_session)
    
    # Check that the user was created with expected attributes
    assert user.id is not None
    assert user.email is not None
    assert user.full_name is not None
    assert user.hashed_password is not None
    assert user.is_active is True
    assert user.is_superuser is False
    
    # Verify the user was added to the database
    db_user = await db_session.get(User, user.id)
    assert db_user is not None
    assert db_user.id == user.id
    assert db_user.email == user.email


@pytest.mark.asyncio
async def test_user_factory_create_with_custom_attributes(db_session: AsyncSession):
    """Test that UserFactory.create creates a user with custom attributes."""
    # Create a user with custom attributes
    custom_email = "custom@example.com"
    custom_name = "Custom User"
    custom_password = "custom_password"
    
    user = await UserFactory.create(
        session=db_session,
        email=custom_email,
        full_name=custom_name,
        password=custom_password,
        is_superuser=True
    )
    
    # Check that the user was created with custom attributes
    assert user.email == custom_email
    assert user.full_name == custom_name
    assert user.is_superuser is True
    
    # Verify the password was hashed
    assert user.hashed_password != custom_password
    
    # Verify the user was added to the database
    db_user = await db_session.get(User, user.id)
    assert db_user is not None
    assert db_user.email == custom_email
    assert db_user.is_superuser is True


@pytest.mark.asyncio
async def test_user_factory_create_batch(db_session: AsyncSession):
    """Test that UserFactory.create_batch creates multiple users."""
    # Create a batch of users
    batch_size = 3
    users = await UserFactory.create_batch(session=db_session, size=batch_size)
    
    # Check that the correct number of users was created
    assert len(users) == batch_size
    
    # Check that each user has expected attributes
    for user in users:
        assert user.id is not None
        assert user.email is not None
        assert user.full_name is not None
        assert user.is_active is True
    
    # Verify all users were added to the database
    for user in users:
        db_user = await db_session.get(User, user.id)
        assert db_user is not None
        assert db_user.id == user.id


def test_user_create_factory():
    """Test that UserCreateFactory creates a UserCreate schema with expected attributes."""
    # Create a UserCreate schema with default attributes
    user_create = UserCreateFactory()
    
    # Check that the schema was created with expected attributes
    assert isinstance(user_create, UserCreate)
    assert user_create.email is not None
    assert user_create.full_name is not None
    assert user_create.password is not None
    assert user_create.password_confirm is not None
    assert user_create.password == user_create.password_confirm


def test_user_create_factory_with_custom_attributes():
    """Test that UserCreateFactory creates a UserCreate schema with custom attributes."""
    # Create a UserCreate schema with custom attributes
    custom_email = "custom@example.com"
    custom_name = "Custom User"
    custom_password = "custom_password"
    
    user_create = UserCreateFactory(
        email=custom_email,
        full_name=custom_name,
        password=custom_password,
        password_confirm=custom_password
    )
    
    # Check that the schema was created with custom attributes
    assert user_create.email == custom_email
    assert user_create.full_name == custom_name
    assert user_create.password == custom_password
    assert user_create.password_confirm == custom_password


def test_user_create_factory_sequence():
    """Test that UserCreateFactory creates unique emails in sequence."""
    # Create multiple UserCreate schemas
    user_create1 = UserCreateFactory()
    user_create2 = UserCreateFactory()
    user_create3 = UserCreateFactory()
    
    # Check that each schema has a unique email
    assert user_create1.email != user_create2.email
    assert user_create2.email != user_create3.email
    assert user_create1.email != user_create3.email


@pytest.mark.asyncio
async def test_item_factory_create(db_session: AsyncSession):
    """Test that ItemFactory.create creates an item with expected attributes."""
    # Create an item with default attributes
    item = await ItemFactory.create(session=db_session)
    
    # Check that the item was created with expected attributes
    assert item.id is not None
    assert item.title is not None
    assert item.description is not None
    assert item.owner_id is None  # No owner specified
    
    # Verify the item was added to the database
    db_item = await db_session.get(Item, item.id)
    assert db_item is not None
    assert db_item.id == item.id
    assert db_item.title == item.title
    assert db_item.description == item.description


@pytest.mark.asyncio
async def test_item_factory_create_with_owner(db_session: AsyncSession):
    """Test that ItemFactory.create creates an item with an owner."""
    # Create a user first
    user = await UserFactory.create(session=db_session)
    
    # Create an item with the user as owner
    item = await ItemFactory.create(session=db_session, owner=user)
    
    # Check that the item was created with the correct owner
    assert item.owner_id == user.id
    
    # Verify the item was added to the database
    db_item = await db_session.get(Item, item.id)
    assert db_item is not None
    assert db_item.owner_id == user.id


@pytest.mark.asyncio
async def test_item_factory_create_with_custom_attributes(db_session: AsyncSession):
    """Test that ItemFactory.create creates an item with custom attributes."""
    # Create an item with custom attributes
    custom_title = "Custom Title"
    custom_description = "Custom Description"
    
    item = await ItemFactory.create(
        session=db_session,
        title=custom_title,
        description=custom_description
    )
    
    # Check that the item was created with custom attributes
    assert item.title == custom_title
    assert item.description == custom_description
    
    # Verify the item was added to the database
    db_item = await db_session.get(Item, item.id)
    assert db_item is not None
    assert db_item.title == custom_title
    assert db_item.description == custom_description 