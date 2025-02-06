"""Test item CRUD operations."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import UserFactory, ItemFactory

pytestmark = pytest.mark.asyncio


async def test_create_item(client: AsyncClient, db: AsyncSession) -> None:
    """Test item creation."""
    # Create a user first
    user = await UserFactory(session=db)
    
    response = await client.post(
        "/api/items/",
        json={
            "title": "Test Item",
            "description": "Test Description",
            "owner_id": user.id,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Item"
    assert data["description"] == "Test Description"
    assert data["owner_id"] == user.id
    assert "id" in data


async def test_read_items(client: AsyncClient, db: AsyncSession) -> None:
    """Test reading item list."""
    # Create a user and items
    user = await UserFactory(session=db)
    items = [
        await ItemFactory(session=db, owner_id=user.id),
        await ItemFactory(session=db, owner_id=user.id),
        await ItemFactory(session=db, owner_id=user.id),
    ]
    
    response = await client.get("/api/items/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == len(items)


async def test_read_item(client: AsyncClient, db: AsyncSession) -> None:
    """Test reading single item."""
    user = await UserFactory(session=db)
    item = await ItemFactory(session=db, owner_id=user.id)
    
    response = await client.get(f"/api/items/{item.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == item.id
    assert data["title"] == item.title
    assert data["description"] == item.description
    assert data["owner_id"] == user.id


async def test_update_item(client: AsyncClient, db: AsyncSession) -> None:
    """Test updating item."""
    user = await UserFactory(session=db)
    item = await ItemFactory(session=db, owner_id=user.id)
    
    response = await client.put(
        f"/api/items/{item.id}",
        json={
            "title": "Updated Item",
            "description": "Updated Description",
            "owner_id": user.id,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Item"
    assert data["description"] == "Updated Description"


async def test_delete_item(client: AsyncClient, db: AsyncSession) -> None:
    """Test deleting item."""
    user = await UserFactory(session=db)
    item = await ItemFactory(session=db, owner_id=user.id)
    
    response = await client.delete(f"/api/items/{item.id}")
    assert response.status_code == 204
    
    # Verify item is deleted
    response = await client.get(f"/api/items/{item.id}")
    assert response.status_code == 404


async def test_read_user_items(client: AsyncClient, db: AsyncSession) -> None:
    """Test reading items for a specific user."""
    user = await UserFactory(session=db)
    other_user = await UserFactory(session=db)
    
    # Create items for both users
    user_items = [
        await ItemFactory(session=db, owner_id=user.id),
        await ItemFactory(session=db, owner_id=user.id),
    ]
    await ItemFactory(session=db, owner_id=other_user.id)  # Other user's item
    
    response = await client.get(f"/api/users/{user.id}/items")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == len(user_items)
    for item in data:
        assert item["owner_id"] == user.id 