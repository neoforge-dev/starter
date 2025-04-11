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
    async def get_multi_by_owner(
        self, db: AsyncSession, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> list[TestItem]:
        result = await db.execute(
            select(self.model)
            .where(self.model.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

@pytest.fixture
async def crud(db: AsyncSession) -> TestCRUD:
    """Create CRUD instance and an initial item."""
    # Initialize the crud object
    crud_obj = TestCRUD(TestItem)
    # Create an initial test item *after* initializing crud_obj
    # Use a distinct owner_id to avoid interfering with specific test counts
    item_in = TestItemCreate(title="Initial Item", owner_id=999)
    await crud_obj.create(db, obj_in=item_in)
    return crud_obj

async def test_create(db: AsyncSession, crud: TestCRUD):
    """Test item creation."""
    item_in = TestItemCreate(
        title="Test Item",
        description="Test Description",
        owner_id=1
    )
    item = await crud.create(db, obj_in=item_in)
    
    assert item.id is not None
    assert item.title == "Test Item"
    assert item.description == "Test Description"
    assert item.owner_id == 1

async def test_get(db: AsyncSession, crud: TestCRUD):
    """Test getting a single item."""
    # Create test item
    item_in = TestItemCreate(title="Test Item", owner_id=1)
    item = await crud.create(db, obj_in=item_in)
    
    # Get item
    retrieved = await crud.get(db, id=item.id)
    assert retrieved is not None
    assert retrieved.id == item.id
    assert retrieved.title == item.title
    
    # Test non-existent item
    non_existent = await crud.get(db, id=999999)
    assert non_existent is None

async def test_get_multi(db: AsyncSession, crud: TestCRUD):
    """Test getting multiple items with pagination."""
    # Create test items
    items = []
    for i in range(15):  # Create 15 items
        item_in = TestItemCreate(
            title=f"Test Item {i}",
            owner_id=1
        )
        item = await crud.create(db, obj_in=item_in)
        items.append(item)
    
    # Test default pagination (skip=0, limit=100 - CRUDBase default)
    result_default = await crud.get_multi(db) 
    assert len(result_default) == 16 # Should get all 15 items + the initial one

    # Test custom pagination (skip=5, limit=5)
    result_paginated = await crud.get_multi(db, skip=5, limit=5)
    assert len(result_paginated) == 5
    # Optionally, verify the specific items returned based on skip/limit

async def test_get_multi_by_owner(db: AsyncSession, crud: TestCRUD):
    """Test getting items by owner."""
    # Initial item with owner_id=999 exists from fixture setup
    # Create items for different owners for this specific test
    owner_ids = [1, 1, 2, 2, 2]
    for owner_id in owner_ids:
        item_in = TestItemCreate(
            title=f"Test Item for owner {owner_id}",
            owner_id=owner_id
        )
        await crud.create(db, obj_in=item_in)

    # Get items for owner 1
    items_owner1 = await crud.get_multi_by_owner(db, owner_id=1)
    assert len(items_owner1) == 2, f"Expected 2 items for owner 1, got {len(items_owner1)}"
    assert all(item.owner_id == 1 for item in items_owner1)

    # Get items for owner 2
    items_owner2 = await crud.get_multi_by_owner(db, owner_id=2)
    assert len(items_owner2) == 3, f"Expected 3 items for owner 2, got {len(items_owner2)}"
    assert all(item.owner_id == 2 for item in items_owner2)

    # Get items for owner 999 (the one from the fixture)
    items_owner999 = await crud.get_multi_by_owner(db, owner_id=999)
    assert len(items_owner999) == 1, f"Expected 1 item for owner 999, got {len(items_owner999)}"
    assert items_owner999[0].title == "Initial Item"

    # Test pagination within get_multi_by_owner
    items_owner2_paginated = await crud.get_multi_by_owner(db, owner_id=2, skip=1, limit=1)
    assert len(items_owner2_paginated) == 1, f"Expected 1 paginated item for owner 2, got {len(items_owner2_paginated)}"

async def test_update(db: AsyncSession, crud: TestCRUD):
    """Test item update."""
    # Create test item
    item_in = TestItemCreate(
        title="Original Title",
        description="Original Description",
        owner_id=1
    )
    item = await crud.create(db, obj_in=item_in)
    
    # Update item
    item_update = TestItemUpdate(
        title="Updated Title",
        description="Updated Description"
    )
    updated_item = await crud.update(
        db,
        db_obj=item,
        obj_in=item_update
    )
    
    assert updated_item.id == item.id
    assert updated_item.title == "Updated Title"
    assert updated_item.description == "Updated Description"
    assert updated_item.owner_id == 1  # Should not change

async def test_delete(db: AsyncSession, crud: TestCRUD):
    """Test item deletion."""
    # Create test item
    item_in = TestItemCreate(title="Test Item", owner_id=1)
    item = await crud.create(db, obj_in=item_in)
    
    # Delete item
    deleted_item = await crud.remove(db, id=item.id)
    assert deleted_item.id == item.id
    
    # Verify item is deleted
    retrieved = await crud.get(db, id=item.id)
    assert retrieved is None

async def test_count(db: AsyncSession, crud: TestCRUD):
    """Test counting items."""
    # Create test items
    for i in range(5):
        item_in = TestItemCreate(title=f"Test Item {i}", owner_id=1)
        await crud.create(db, obj_in=item_in)
    
    # Count all items
    count = await crud.count(db)
    assert count == 5
    
    # Count items by owner
    count = await crud.count(db, owner_id=1)
    assert count == 5
    count = await crud.count(db, owner_id=2)
    assert count == 0

async def test_exists(db: AsyncSession, crud: TestCRUD):
    """Test checking item existence."""
    # Create test item
    item_in = TestItemCreate(title="Test Item", owner_id=1)
    item = await crud.create(db, obj_in=item_in)
    
    # Check existence
    assert await crud.exists(db, id=item.id)
    assert not await crud.exists(db, id=999999)

async def test_get_by_title(db: AsyncSession, crud: TestCRUD):
    """Test getting items by title."""
    # Create test items
    titles = ["Unique Title", "Common Title", "Common Title"]
    for title in titles:
        item_in = TestItemCreate(title=title, owner_id=1)
        await crud.create(db, obj_in=item_in)
    
    # Get by unique title
    items = await crud.get_by_title(db, title="Unique Title")
    assert len(items) == 1
    assert items[0].title == "Unique Title"
    
    # Get by common title
    items = await crud.get_by_title(db, title="Common Title")
    assert len(items) == 2
    assert all(item.title == "Common Title" for item in items)
    
    # Get by non-existent title
    items = await crud.get_by_title(db, title="Non-existent")
    assert len(items) == 0 