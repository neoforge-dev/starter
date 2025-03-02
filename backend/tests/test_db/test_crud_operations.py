"""
Test CRUD operations with SQLModel models.

This test verifies that Create, Read, Update, and Delete operations
work correctly with SQLModel models and the database.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.item import Item
from tests.factories import UserFactory, ItemFactory


@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession):
    """Test creating a user and retrieving it from the database."""
    # Create a user using the factory
    user = await UserFactory.create(session=db_session)
    
    # Verify the user was created with an ID
    assert user.id is not None
    
    # Retrieve the user from the database
    db_user = await db_session.get(User, user.id)
    
    # Verify the retrieved user matches the created user
    assert db_user is not None
    assert db_user.id == user.id
    assert db_user.email == user.email
    assert db_user.full_name == user.full_name
    assert db_user.is_active is True


@pytest.mark.asyncio
async def test_update_user(db_session: AsyncSession):
    """Test updating a user in the database."""
    # Create a user using the factory
    user = await UserFactory.create(session=db_session)
    
    # Update the user
    new_name = "Updated Name"
    user.full_name = new_name
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    
    # Verify the user was updated
    assert user.full_name == new_name
    
    # Retrieve the user from the database
    db_user = await db_session.get(User, user.id)
    
    # Verify the retrieved user has the updated name
    assert db_user is not None
    assert db_user.full_name == new_name


@pytest.mark.asyncio
async def test_delete_user(db_session: AsyncSession):
    """Test deleting a user from the database."""
    # Create a user using the factory
    user = await UserFactory.create(session=db_session)
    
    # Delete the user
    await db_session.delete(user)
    await db_session.commit()
    
    # Verify the user was deleted
    db_user = await db_session.get(User, user.id)
    assert db_user is None


@pytest.mark.asyncio
async def test_create_item_with_owner(db_session: AsyncSession):
    """Test creating an item with an owner and retrieving it from the database."""
    # Create a user using the factory
    user = await UserFactory.create(session=db_session)
    
    # Create an item with the user as owner
    item = await ItemFactory.create(session=db_session, owner=user)
    
    # Verify the item was created with an ID and owner
    assert item.id is not None
    assert item.owner_id == user.id
    
    # Retrieve the item from the database
    db_item = await db_session.get(Item, item.id)
    
    # Verify the retrieved item matches the created item
    assert db_item is not None
    assert db_item.id == item.id
    assert db_item.title == item.title
    assert db_item.description == item.description
    assert db_item.owner_id == user.id


@pytest.mark.asyncio
async def test_update_item(db_session: AsyncSession):
    """Test updating an item in the database."""
    # Create an item using the factory
    item = await ItemFactory.create(session=db_session)
    
    # Update the item
    new_title = "Updated Title"
    new_description = "Updated Description"
    item.title = new_title
    item.description = new_description
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)
    
    # Verify the item was updated
    assert item.title == new_title
    assert item.description == new_description
    
    # Retrieve the item from the database
    db_item = await db_session.get(Item, item.id)
    
    # Verify the retrieved item has the updated values
    assert db_item is not None
    assert db_item.title == new_title
    assert db_item.description == new_description


@pytest.mark.asyncio
async def test_delete_item(db_session: AsyncSession):
    """Test deleting an item from the database."""
    # Create an item using the factory
    item = await ItemFactory.create(session=db_session)
    
    # Delete the item
    await db_session.delete(item)
    await db_session.commit()
    
    # Verify the item was deleted
    db_item = await db_session.get(Item, item.id)
    assert db_item is None 