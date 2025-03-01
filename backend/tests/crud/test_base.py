"""Test CRUD base functionality."""
import pytest
from typing import Optional
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.expression import func

from app.db.base_class import Base
from app.crud.base import CRUDBase
from app.schemas.common import PaginationParams

pytestmark = pytest.mark.asyncio

# Test models
class TestItem(Base):
    """Test item model."""
    __tablename__ = "test_items"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    owner_id = Column(Integer, index=True)

class TestItemCreate(BaseModel):
    """Test item create schema."""
    title: str
    description: Optional[str] = None
    owner_id: int

class TestItemUpdate(BaseModel):
    """Test item update schema."""
    title: Optional[str] = None
    description: Optional[str] = None

class TestCRUD(CRUDBase[TestItem, TestItemCreate, TestItemUpdate]):
    """Test CRUD operations."""
    pass

@pytest.fixture
def crud() -> TestCRUD:
    """Create CRUD instance."""
    return TestCRUD(TestItem)

async def test_create(test_session: AsyncSession, crud: TestCRUD):
    """Test item creation."""
    item_in = TestItemCreate(
        title="Test Item",
        description="Test Description",
        owner_id=1
    )
    item = await crud.create(test_session, obj_in=item_in)
    
    assert item.id is not None
    assert item.title == "Test Item"
    assert item.description == "Test Description"
    assert item.owner_id == 1

async def test_get(test_session: AsyncSession, crud: TestCRUD):
    """Test getting a single item."""
    # Create test item
    item_in = TestItemCreate(title="Test Item", owner_id=1)
    item = await crud.create(test_session, obj_in=item_in)
    
    # Get item
    retrieved = await crud.get(test_session, id=item.id)
    assert retrieved is not None
    assert retrieved.id == item.id
    assert retrieved.title == item.title
    
    # Test non-existent item
    non_existent = await crud.get(test_session, id=999999)
    assert non_existent is None

async def test_get_multi(test_session: AsyncSession, crud: TestCRUD):
    """Test getting multiple items with pagination."""
    # Create test items
    items = []
    for i in range(15):  # Create 15 items
        item_in = TestItemCreate(
            title=f"Test Item {i}",
            owner_id=1
        )
        item = await crud.create(test_session, obj_in=item_in)
        items.append(item)
    
    # Test default pagination
    pagination = PaginationParams()
    result = await crud.get_multi(test_session, pagination=pagination)
    assert len(result.items) == 10  # Default page size
    assert result.total == 15
    assert result.page == 1
    
    # Test custom pagination
    pagination = PaginationParams(page=2, page_size=5)
    result = await crud.get_multi(test_session, pagination=pagination)
    assert len(result.items) == 5
    assert result.total == 15
    assert result.page == 2

async def test_get_multi_by_owner(test_session: AsyncSession, crud: TestCRUD):
    """Test getting items by owner."""
    # Create items for different owners
    owner_ids = [1, 1, 2, 2, 2]
    for owner_id in owner_ids:
        item_in = TestItemCreate(
            title=f"Test Item for owner {owner_id}",
            owner_id=owner_id
        )
        await crud.create(test_session, obj_in=item_in)
    
    # Get items for owner 1
    items = await crud.get_multi_by_owner(test_session, owner_id=1)
    assert len(items) == 2
    assert all(item.owner_id == 1 for item in items)
    
    # Get items for owner 2
    items = await crud.get_multi_by_owner(test_session, owner_id=2)
    assert len(items) == 3
    assert all(item.owner_id == 2 for item in items)

async def test_update(test_session: AsyncSession, crud: TestCRUD):
    """Test item update."""
    # Create test item
    item_in = TestItemCreate(
        title="Original Title",
        description="Original Description",
        owner_id=1
    )
    item = await crud.create(test_session, obj_in=item_in)
    
    # Update item
    item_update = TestItemUpdate(
        title="Updated Title",
        description="Updated Description"
    )
    updated_item = await crud.update(
        test_session,
        db_obj=item,
        obj_in=item_update
    )
    
    assert updated_item.id == item.id
    assert updated_item.title == "Updated Title"
    assert updated_item.description == "Updated Description"
    assert updated_item.owner_id == 1  # Should not change

async def test_delete(test_session: AsyncSession, crud: TestCRUD):
    """Test item deletion."""
    # Create test item
    item_in = TestItemCreate(title="Test Item", owner_id=1)
    item = await crud.create(test_session, obj_in=item_in)
    
    # Delete item
    deleted_item = await crud.remove(test_session, id=item.id)
    assert deleted_item.id == item.id
    
    # Verify item is deleted
    retrieved = await crud.get(test_session, id=item.id)
    assert retrieved is None

async def test_count(test_session: AsyncSession, crud: TestCRUD):
    """Test counting items."""
    # Create test items
    for i in range(5):
        item_in = TestItemCreate(title=f"Test Item {i}", owner_id=1)
        await crud.create(test_session, obj_in=item_in)
    
    # Count all items
    count = await crud.count(test_session)
    assert count == 5
    
    # Count items by owner
    count = await crud.count(test_session, owner_id=1)
    assert count == 5
    count = await crud.count(test_session, owner_id=2)
    assert count == 0

async def test_exists(test_session: AsyncSession, crud: TestCRUD):
    """Test checking item existence."""
    # Create test item
    item_in = TestItemCreate(title="Test Item", owner_id=1)
    item = await crud.create(test_session, obj_in=item_in)
    
    # Check existence
    assert await crud.exists(test_session, id=item.id)
    assert not await crud.exists(test_session, id=999999)

async def test_get_by_title(test_session: AsyncSession, crud: TestCRUD):
    """Test getting items by title."""
    # Create test items
    titles = ["Unique Title", "Common Title", "Common Title"]
    for title in titles:
        item_in = TestItemCreate(title=title, owner_id=1)
        await crud.create(test_session, obj_in=item_in)
    
    # Get by unique title
    items = await crud.get_by_title(test_session, title="Unique Title")
    assert len(items) == 1
    assert items[0].title == "Unique Title"
    
    # Get by common title
    items = await crud.get_by_title(test_session, title="Common Title")
    assert len(items) == 2
    assert all(item.title == "Common Title" for item in items)
    
    # Get by non-existent title
    items = await crud.get_by_title(test_session, title="Non-existent")
    assert len(items) == 0 