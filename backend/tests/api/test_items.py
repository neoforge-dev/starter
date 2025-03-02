"""Test item CRUD operations."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from tests.factories import UserFactory, ItemFactory
from app.core.config import settings

pytestmark = pytest.mark.asyncio


async def test_read_items(client: AsyncClient, db: AsyncSession, regular_user_headers: dict, regular_user) -> None:
    """Test reading item list."""
    # Clean up existing items
    await db.execute(text("TRUNCATE TABLE items CASCADE"))
    await db.commit()

    # Create test items
    items = [
        await ItemFactory.create(session=db, owner=regular_user),
        await ItemFactory.create(session=db, owner=regular_user),
        await ItemFactory.create(session=db, owner=regular_user),
    ]

    response = await client.get(f"{settings.api_v1_str}/items/", headers=regular_user_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == len(items)


async def test_create_item(client: AsyncClient, db: AsyncSession, regular_user_headers: dict) -> None:
    """Test creating an item."""
    item_data = {
        "title": "Test Item",
        "description": "This is a test item",
    }
    
    response = await client.post(
        f"{settings.api_v1_str}/items/",
        json=item_data,
        headers=regular_user_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == item_data["title"]
    assert data["description"] == item_data["description"]
    assert "id" in data
    assert "owner_id" in data


async def test_read_item(client: AsyncClient, db: AsyncSession, regular_user_headers: dict, regular_user) -> None:
    """Test reading a single item."""
    # Create a test item
    item = await ItemFactory.create(session=db, owner=regular_user)
    
    response = await client.get(
        f"{settings.api_v1_str}/items/{item.id}",
        headers=regular_user_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == item.id
    assert data["title"] == item.title
    assert data["description"] == item.description
    assert data["owner_id"] == regular_user.id


async def test_update_item(client: AsyncClient, db: AsyncSession, regular_user_headers: dict, regular_user) -> None:
    """Test updating an item."""
    # Create a test item
    item = await ItemFactory.create(session=db, owner=regular_user)
    
    update_data = {
        "title": "Updated Item",
        "description": "This item has been updated",
    }
    
    response = await client.put(
        f"{settings.api_v1_str}/items/{item.id}",
        json=update_data,
        headers=regular_user_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == item.id
    assert data["title"] == update_data["title"]
    assert data["description"] == update_data["description"]
    assert data["owner_id"] == regular_user.id


async def test_delete_item(client: AsyncClient, db: AsyncSession, regular_user_headers: dict, regular_user) -> None:
    """Test deleting an item."""
    # Create a test item
    item = await ItemFactory.create(session=db, owner=regular_user)
    
    # Delete the item
    response = await client.delete(
        f"{settings.api_v1_str}/items/{item.id}",
        headers=regular_user_headers
    )
    
    assert response.status_code == 204
    
    # Verify item is deleted
    response = await client.get(
        f"{settings.api_v1_str}/items/{item.id}",
        headers=regular_user_headers
    )
    
    assert response.status_code == 404


async def test_read_item_not_found(client: AsyncClient, db: AsyncSession, regular_user_headers: dict) -> None:
    """Test reading a non-existent item."""
    response = await client.get(
        f"{settings.api_v1_str}/items/999999",
        headers=regular_user_headers
    )
    
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data


async def test_update_item_not_found(client: AsyncClient, db: AsyncSession, regular_user_headers: dict) -> None:
    """Test updating a non-existent item."""
    update_data = {
        "title": "Updated Item",
        "description": "This item has been updated",
    }
    
    response = await client.put(
        f"{settings.api_v1_str}/items/999999",
        json=update_data,
        headers=regular_user_headers
    )
    
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data


async def test_delete_item_not_found(client: AsyncClient, db: AsyncSession, regular_user_headers: dict) -> None:
    """Test deleting a non-existent item."""
    response = await client.delete(
        f"{settings.api_v1_str}/items/999999",
        headers=regular_user_headers
    )
    
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data


async def test_read_other_user_item(client: AsyncClient, db: AsyncSession, regular_user_headers: dict) -> None:
    """Test reading an item owned by another user."""
    # Create another user
    other_user = await UserFactory.create(session=db)
    
    # Create an item owned by the other user
    item = await ItemFactory.create(session=db, owner=other_user)
    
    # Try to read the item as the regular user
    response = await client.get(
        f"{settings.api_v1_str}/items/{item.id}",
        headers=regular_user_headers
    )
    
    # Should return 403 Forbidden or 404 Not Found depending on the API implementation
    assert response.status_code in [403, 404] 