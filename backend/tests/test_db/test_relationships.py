"""
Test model relationships.

This test verifies that relationships between models work correctly,
including foreign keys, cascading deletes, and relationship loading.
"""

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.item import Item
from tests.factories import UserFactory, ItemFactory


@pytest.mark.asyncio
async def test_user_items_relationship(db_session: AsyncSession):
    """Test the relationship between users and items."""
    # Create a user
    user = await UserFactory.create(session=db_session)
    
    # Create multiple items for the user
    items = []
    for i in range(3):
        item = await ItemFactory.create(
            session=db_session,
            owner=user,
            title=f"Test Item {i}"
        )
        items.append(item)
    
    # Query the items for the user
    result = await db_session.execute(
        select(Item).where(Item.owner_id == user.id)
    )
    user_items = result.scalars().all()
    
    # Verify the user has the correct number of items
    assert len(user_items) == 3
    
    # Verify the items belong to the user
    for item in user_items:
        assert item.owner_id == user.id


@pytest.mark.asyncio
async def test_cascade_delete(db_session: AsyncSession):
    """Test that deleting a user cascades to delete their items."""
    # Create a user
    user = await UserFactory.create(session=db_session)
    user_id = user.id
    
    # Create multiple items for the user
    for i in range(3):
        await ItemFactory.create(
            session=db_session,
            owner=user,
            title=f"Test Item {i}"
        )
    
    # Verify the user has items
    result = await db_session.execute(
        select(Item).where(Item.owner_id == user.id)
    )
    user_items = result.scalars().all()
    assert len(user_items) == 3
    
    # Delete the user
    await db_session.delete(user)
    await db_session.commit()
    
    # Verify the user is deleted
    db_user = await db_session.get(User, user_id)
    assert db_user is None
    
    # Verify the items are also deleted (if cascade delete is configured)
    # Note: This test may fail if cascade delete is not configured
    result = await db_session.execute(
        select(Item).where(Item.owner_id == user_id)
    )
    remaining_items = result.scalars().all()
    assert len(remaining_items) == 0


@pytest.mark.asyncio
async def test_multiple_users_with_items(db_session: AsyncSession):
    """Test that multiple users can have items without interference."""
    # Create multiple users
    user1 = await UserFactory.create(session=db_session)
    user2 = await UserFactory.create(session=db_session)
    
    # Create items for user1
    for i in range(2):
        await ItemFactory.create(
            session=db_session,
            owner=user1,
            title=f"User1 Item {i}"
        )
    
    # Create items for user2
    for i in range(3):
        await ItemFactory.create(
            session=db_session,
            owner=user2,
            title=f"User2 Item {i}"
        )
    
    # Verify user1 has the correct number of items
    result = await db_session.execute(
        select(Item).where(Item.owner_id == user1.id)
    )
    user1_items = result.scalars().all()
    assert len(user1_items) == 2
    
    # Verify user2 has the correct number of items
    result = await db_session.execute(
        select(Item).where(Item.owner_id == user2.id)
    )
    user2_items = result.scalars().all()
    assert len(user2_items) == 3
    
    # Verify the items belong to the correct users
    for item in user1_items:
        assert item.owner_id == user1.id
        assert "User1" in item.title
    
    for item in user2_items:
        assert item.owner_id == user2.id
        assert "User2" in item.title 