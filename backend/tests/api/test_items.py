"""Test items API endpoints."""
import pytest
from typing import Dict
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

# Use get_settings for instantiation or Settings for type hints via fixtures
from app.core.config import get_settings, Settings
from app.models.item import Item
from app.models.user import User
from tests.factories import UserFactory, ItemFactory

pytestmark = pytest.mark.asyncio


@pytest.fixture
async def test_user(db: AsyncSession) -> User:
    """Create a test user, with cleanup."""
    user = None
    try:
        user = await UserFactory.create(session=db, email="test-item@example.com")
        await db.commit() # Ensure user is committed if factory doesn't
        await db.refresh(user)
        yield user
    finally:
        if user is not None:
            # Re-fetch the user in the current session context for deletion
            user_to_delete = await db.get(User, user.id)
            if user_to_delete:
                await db.delete(user_to_delete)
                await db.commit()


@pytest.fixture
async def test_user_headers(test_user: User, test_settings: Settings) -> Dict[str, str]:
    """Get headers for test user authentication."""
    from app.core.security import create_access_token
    from datetime import timedelta
    
    access_token_expires = timedelta(minutes=test_settings.access_token_expire_minutes)
    access_token = create_access_token(
        subject=str(test_user.id),
        settings=test_settings,
        expires_delta=access_token_expires
    )
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "TestClient",
    }


async def test_create_item(client: AsyncClient, db: AsyncSession, test_user_headers: Dict[str, str], test_settings: Settings) -> None:
    """Test creating an item."""
    item_data = {"title": "Test Item", "description": "This is a test item."}
    response = await client.post(
        f"{test_settings.api_v1_str}/items/",
        json=item_data,
        headers=test_user_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == item_data["title"]
    assert data["description"] == item_data["description"]
    assert "id" in data
    assert "owner_id" in data


async def test_read_item(client: AsyncClient, db: AsyncSession, test_user: UserFactory, test_user_headers: Dict[str, str], test_settings: Settings) -> None:
    """Test reading a specific item."""
    item = await ItemFactory.create(session=db, owner_id=test_user.id, title="Specific Item")
    await db.commit()
    response = await client.get(
        f"{test_settings.api_v1_str}/items/{item.id}",
        headers=test_user_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == item.id
    assert data["title"] == item.title
    assert data["owner_id"] == test_user.id


async def test_read_items(client: AsyncClient, db: AsyncSession, test_user: UserFactory, test_user_headers: Dict[str, str], test_settings: Settings) -> None:
    """Test reading multiple items."""
    # Create items for the test user
    ItemFactory.create_batch(session=db, size=3, owner_id=test_user.id)
    
    response = await client.get(
        f"{test_settings.api_v1_str}/items/",
        headers=test_user_headers,
        params={"skip": 0, "limit": 5}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3 # Ensure at least the created items are returned
    # Verify that all returned items belong to the test user
    for item in data:
        assert item["owner_id"] == test_user.id


async def test_update_item(client: AsyncClient, db: AsyncSession, test_user: UserFactory, test_user_headers: Dict[str, str], test_settings: Settings) -> None:
    """Test updating an item."""
    item = await ItemFactory.create(session=db, owner_id=test_user.id, title="Original Item Title")
    await db.commit()
    
    update_data = {"title": "Updated Item Title", "description": "Updated description."}
    response = await client.put(
        f"{test_settings.api_v1_str}/items/{item.id}",
        json=update_data,
        headers=test_user_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == item.id
    assert data["title"] == update_data["title"]
    assert data["description"] == update_data["description"]
    assert data["owner_id"] == test_user.id
    
    # Verify in DB
    await db.refresh(item)
    assert item.title == update_data["title"]


async def test_delete_item(client: AsyncClient, db: AsyncSession, test_user: UserFactory, test_user_headers: Dict[str, str], test_settings: Settings) -> None:
    """Test deleting an item."""
    item = await ItemFactory.create(session=db, owner_id=test_user.id)
    item_id = item.id
    await db.commit()
    
    response = await client.delete(
        f"{test_settings.api_v1_str}/items/{item_id}",
        headers=test_user_headers
    )
    assert response.status_code == 204
    
    # Verify deletion in DB
    result = await db.get(Item, item_id)
    assert result is None


async def test_read_item_not_found(client: AsyncClient, db: AsyncSession, test_user_headers: Dict[str, str], test_settings: Settings) -> None:
    """Test reading an item that does not exist."""
    response = await client.get(
        f"{test_settings.api_v1_str}/items/99999", # Non-existent ID
        headers=test_user_headers
    )
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "not found" in data["detail"].lower()


async def test_update_item_not_found(client: AsyncClient, db: AsyncSession, test_user_headers: Dict[str, str], test_settings: Settings) -> None:
    """Test updating an item that does not exist."""
    update_data = {"title": "Non-existent Item Update"}
    response = await client.put(
        f"{test_settings.api_v1_str}/items/99999", # Non-existent ID
        json=update_data,
        headers=test_user_headers
    )
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "not found" in data["detail"].lower()


async def test_delete_item_not_found(client: AsyncClient, db: AsyncSession, test_user_headers: Dict[str, str], test_settings: Settings) -> None:
    """Test deleting an item that does not exist."""
    response = await client.delete(
        f"{test_settings.api_v1_str}/items/99999", # Non-existent ID
        headers=test_user_headers
    )
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "not found" in data["detail"].lower()


async def test_item_access_forbidden(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test accessing/modifying an item belonging to another user."""
    # Create owner and item
    owner = await UserFactory.create(session=db, email="owner-item@example.com")
    item = await ItemFactory.create(session=db, owner_id=owner.id, title="Owned Item")
    await db.commit()
    
    # Create another user (requester)
    requester = await UserFactory.create(session=db, email="requester-item@example.com")
    await db.commit()
    
    # Generate requester headers
    from app.core.security import create_access_token
    from datetime import timedelta
    access_token_expires = timedelta(minutes=test_settings.access_token_expire_minutes)
    requester_token = create_access_token(
        subject=str(requester.id), settings=test_settings, expires_delta=access_token_expires
    )
    requester_headers = {"Authorization": f"Bearer {requester_token}", "Accept": "application/json", "Content-Type": "application/json"}
    
    # Test reading item (should fail)
    response = await client.get(f"{test_settings.api_v1_str}/items/{item.id}", headers=requester_headers)
    assert response.status_code == 403
    
    # Test updating item (should fail)
    update_data = {"title": "Forbidden Update"}
    response = await client.put(f"{test_settings.api_v1_str}/items/{item.id}", json=update_data, headers=requester_headers)
    assert response.status_code == 403
    
    # Test deleting item (should fail)
    response = await client.delete(f"{test_settings.api_v1_str}/items/{item.id}", headers=requester_headers)
    assert response.status_code == 403 