"""Test item CRUD operations."""
from app.models.item import Item
from app.core.config import settings
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from tests.factories import UserFactory, ItemFactory

pytestmark = pytest.mark.asyncio


async def test_create_item(client: AsyncClient, db: AsyncSession, regular_user_headers: dict) -> None:
    """Test item creation."""
    # Create a user first
    user = await UserFactory.create(session=db)
    
    response = await client.post(
        f"{settings.api_v1_str}/items/",
        json={
            "title": "Test Item",
            "description": "Test Description",
            "owner_id": user.id,
        },
        headers=regular_user_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Item"
    assert data["description"] == "Test Description"
    assert data["owner_id"] == user.id
    assert "id" in data


async def test_read_items(client: AsyncClient, db: AsyncSession, regular_user_headers: dict) -> None:
    """Test reading item list."""
    user = await UserFactory.create(session=db)
    items = [
        await ItemFactory.create(session=db, user=user),
        await ItemFactory.create(session=db, user=user),
        await ItemFactory.create(session=db, user=user),
    ]
    
    response = await client.get(f"{settings.api_v1_str}/items/", headers=regular_user_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == len(items)


async def test_read_item(client: AsyncClient, db: AsyncSession, regular_user_headers: dict) -> None:
    """Test reading single item."""
    user = await UserFactory.create(session=db)
    item = await ItemFactory.create(session=db, user=user)
    
    response = await client.get(f"{settings.api_v1_str}/items/{item.id}", headers=regular_user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == item.id
    assert data["title"] == item.title
    assert data["description"] == item.description
    assert data["owner_id"] == user.id


async def test_update_item(client: AsyncClient, db: AsyncSession, regular_user_headers: dict) -> None:
    """Test updating item."""
    user = await UserFactory.create(session=db)
    item = await ItemFactory.create(session=db, user=user)
    
    response = await client.put(
        f"{settings.api_v1_str}/items/{item.id}",
        json={
            "title": "Updated Item",
            "description": "Updated Description",
            "owner_id": user.id,
        },
        headers=regular_user_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Item"
    assert data["description"] == "Updated Description"


async def test_delete_item(client: AsyncClient, db: AsyncSession, regular_user_headers: dict) -> None:
    """Test deleting item."""
    user = await UserFactory.create(session=db)
    item = await ItemFactory.create(session=db, user=user)
    
    response = await client.delete(f"{settings.api_v1_str}/items/{item.id}", headers=regular_user_headers)
    assert response.status_code == 204
    
    # Verify item is deleted
    response = await client.get(f"{settings.api_v1_str}/items/{item.id}", headers=regular_user_headers)
    assert response.status_code == 404


async def test_read_user_items(client: AsyncClient, db: AsyncSession, regular_user_headers: dict) -> None:
    """Test reading items for a specific user."""
    user = await UserFactory.create(session=db)
    other_user = await UserFactory.create(session=db)
    
    # Create items for both users
    user_items = [
        await ItemFactory.create(session=db, user=user),
        await ItemFactory.create(session=db, user=user),
    ]
    await ItemFactory.create(session=db, user=other_user)  # Other user's item
    
    response = await client.get(f"{settings.api_v1_str}/users/{user.id}/items", headers=regular_user_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == len(user_items)
    for item in data:
        assert item["owner_id"] == user.id


@pytest.mark.asyncio
async def test_create_item_with_owner(db: AsyncSession):
    """Test creating an item with an owner."""
    user = await UserFactory.create(session=db)
    item = await ItemFactory.create(session=db, user=user)
    
    # Verify relationships
    assert item.owner_id == user.id
    
    # Query to verify the relationship in the database
    result = await db.execute(
        select(Item).where(Item.owner_id == user.id)
    )
    items = list(result.scalars().all())
    assert len(items) == 1
    assert items[0].id == item.id


@pytest.mark.asyncio
async def test_batch_create_with_relationships(db: AsyncSession):
    """Test batch creating items with relationships."""
    # Create user with items directly
    user = await UserFactory.create(session=db)
    item1 = await ItemFactory.create(session=db, user=user, title="First Item")
    item2 = await ItemFactory.create(session=db, user=user, title="Second Item")
    
    # Query to verify the relationships in the database
    result = await db.execute(
        select(Item).where(Item.owner_id == user.id)
    )
    items = list(result.scalars().all())
    assert len(items) == 2
    assert {item.title for item in items} == {"First Item", "Second Item"} 