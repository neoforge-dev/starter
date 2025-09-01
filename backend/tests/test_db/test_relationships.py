"""
Test model relationships.

This test verifies that relationships between models work correctly,
including foreign keys, cascading deletes, and relationship loading.
"""

import pytest
from app.models import Item, User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import ItemFactory, UserFactory

pytestmark = pytest.mark.asyncio


@pytest.mark.asyncio
async def test_user_items_relationship(db: AsyncSession):
    """Test the relationship between users and items."""
    # Create a user
    user = await UserFactory.create(session=db)

    # Create multiple items for the user
    items = []
    for i in range(3):
        item = await ItemFactory.create(session=db, owner=user, title=f"Test Item {i}")
        items.append(item)

    # Commit changes if factories don't auto-commit within the session
    await db.commit()

    # Refresh user to potentially load items relationship (if needed)
    await db.refresh(user, attribute_names=["items"])
    assert len(user.items) == 3

    # Query the items for the user directly
    result = await db.execute(select(Item).where(Item.owner_id == user.id))
    user_items = result.scalars().all()

    # Verify the user has the correct number of items
    assert len(user_items) == 3

    # Verify the items belong to the user
    for item in user_items:
        assert item.owner_id == user.id


@pytest.mark.asyncio
async def test_cascade_delete(db: AsyncSession):
    """Test that deleting a user cascades to delete their items."""
    # Create a user
    user = await UserFactory.create(session=db)
    user_id = user.id

    # Create multiple items for the user
    for i in range(3):
        await ItemFactory.create(session=db, owner=user, title=f"Test Item {i}")
    await db.commit()

    # Verify the user has items
    result = await db.execute(select(Item).where(Item.owner_id == user.id))
    user_items = result.scalars().all()
    assert len(user_items) == 3

    # Delete the user
    await db.delete(user)
    await db.commit()

    # Verify the user is deleted
    db_user = await db.get(User, user_id)
    assert db_user is None

    # Verify the items are also deleted (if cascade delete is configured)
    # Note: This test may fail if cascade delete is not configured on the relationship
    result = await db.execute(select(Item).where(Item.owner_id == user_id))
    remaining_items = result.scalars().all()
    assert len(remaining_items) == 0, "Items should be cascade deleted"


@pytest.mark.asyncio
async def test_multiple_users_with_items(db: AsyncSession):
    """Test that multiple users can have items without interference."""
    # Create multiple users
    user1 = await UserFactory.create(session=db)
    user2 = await UserFactory.create(session=db)
    await db.commit()

    # Create items for user1
    for i in range(2):
        await ItemFactory.create(session=db, owner=user1, title=f"User1 Item {i}")

    # Create items for user2
    for i in range(3):
        await ItemFactory.create(session=db, owner=user2, title=f"User2 Item {i}")
    await db.commit()

    # Verify user1 has the correct number of items
    result = await db.execute(select(Item).where(Item.owner_id == user1.id))
    user1_items = result.scalars().all()
    assert len(user1_items) == 2

    # Verify user2 has the correct number of items
    result = await db.execute(select(Item).where(Item.owner_id == user2.id))
    user2_items = result.scalars().all()
    assert len(user2_items) == 3

    # Verify the items belong to the correct users
    for item in user1_items:
        assert item.owner_id == user1.id
        assert "User1" in item.title

    for item in user2_items:
        assert item.owner_id == user2.id
        assert "User2" in item.title
