import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Generic, TypeVar, Type
from unittest.mock import MagicMock

from app.crud.base import CRUDBase
from app.db.base_class import Base # Assuming TestItem inherits from Base
from tests.factories import UserFactory # For creating owner

# --- Mock Models & Schemas for Testing --- 

# Mock SQLAlchemy Model
class TestItem(Base):
    __tablename__ = "test_items"
    id: int = MagicMock() # Mock ID attribute
    title: str
    description: str | None = None
    owner_id: int 
    # Add other necessary attributes/relationships if your base model needs them

# Mock Pydantic Schemas
class TestItemCreate(BaseModel):
    title: str
    description: str | None = None
    owner_id: int

class TestItemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

# --- Test CRUD Class (inheriting from CRUDBase) ---

class TestCRUD(CRUDBase[TestItem, TestItemCreate, TestItemUpdate]):
    def __init__(self, model: Type[ModelType], user_id: int):
        super().__init__(model)
        self.user_id = user_id # Store user_id if needed for tests

# --- Fixtures --- 

@pytest_asyncio.fixture(scope="function")
async def crud(db: AsyncSession) -> TestCRUD:
    """Fixture to provide CRUD operations for testing."""
    # Initialize user for ownership testing
    user = await UserFactory.create(session=db)
    await db.commit()
    await db.refresh(user) # Ensure user has an ID
    # Initialize the CRUD class with the model
    return TestCRUD(TestItem, user_id=user.id)

# --- CRUD Base Class Tests --- 
class TestCRUDBase:

    @pytest.mark.asyncio
    async def test_create(self, db: AsyncSession, crud: TestCRUD):
        """Test item creation."""
        item_in = TestItemCreate(
            title="Test Item",
            description="Test Description",
            owner_id=crud.user_id # Use owner_id from fixture
        )
        # Pass db fixture correctly
        item = await crud.create(db, obj_in=item_in)

        assert item.id is not None
        assert item.title == "Test Item"
        assert item.description == "Test Description"
        assert item.owner_id == crud.user_id

    @pytest.mark.asyncio
    async def test_get(self, db: AsyncSession, crud: TestCRUD):
        """Test getting a single item."""
        # Create test item
        item_in = TestItemCreate(title="Test Item", owner_id=crud.user_id)
        # Pass db fixture correctly
        item = await crud.create(db, obj_in=item_in)

        # Get item
        # Pass db fixture correctly
        retrieved = await crud.get(db, id=item.id)
        assert retrieved is not None
        assert retrieved.id == item.id
        assert retrieved.title == item.title

        # Test non-existent item
        # Pass db fixture correctly
        non_existent = await crud.get(db, id=999999)
        assert non_existent is None

    @pytest.mark.asyncio
    async def test_get_multi(self, db: AsyncSession, crud: TestCRUD):
        """Test getting multiple items."""
        # Create multiple items
        item1 = await crud.create(db, obj_in=TestItemCreate(title="Item 1", owner_id=crud.user_id))
        item2 = await crud.create(db, obj_in=TestItemCreate(title="Item 2", owner_id=crud.user_id))
        other_owner = await UserFactory.create(session=db) # Create another owner
        await db.commit()
        await db.refresh(other_owner)
        await crud.create(db, obj_in=TestItemCreate(title="Other Owner Item", owner_id=other_owner.id))
        
        # Get multiple items for the specific owner
        items = await crud.get_multi(db, owner_id=crud.user_id, skip=0, limit=10)
        assert len(items) == 2
        item_ids = {item.id for item in items}
        assert item1.id in item_ids
        assert item2.id in item_ids

        # Test pagination (skip)
        items_skip = await crud.get_multi(db, owner_id=crud.user_id, skip=1, limit=10)
        assert len(items_skip) == 1
        assert items_skip[0].id == item2.id # Assuming default ordering by ID

        # Test pagination (limit)
        items_limit = await crud.get_multi(db, owner_id=crud.user_id, skip=0, limit=1)
        assert len(items_limit) == 1
        assert items_limit[0].id == item1.id # Assuming default ordering
        
        # Test getting all items (no owner filter)
        # This assumes CRUDBase.get_multi doesn't filter by default
        all_items = await crud.get_multi(db, skip=0, limit=10) 
        assert len(all_items) >= 3 # Should include item from other owner

    @pytest.mark.asyncio
    async def test_update(self, db: AsyncSession, crud: TestCRUD):
        """Test updating an item."""
        item = await crud.create(db, obj_in=TestItemCreate(title="Original", owner_id=crud.user_id))
        update_data = TestItemUpdate(description="Updated Description")
        updated_item = await crud.update(db, db_obj=item, obj_in=update_data)

        assert updated_item.id == item.id
        assert updated_item.title == "Original"
        assert updated_item.description == "Updated Description"

        # Test updating with a dictionary
        update_dict = {"title": "Updated Title"}
        updated_item_dict = await crud.update(db, db_obj=updated_item, obj_in=update_dict)
        assert updated_item_dict.title == "Updated Title"
        assert updated_item_dict.description == "Updated Description" # Description should persist

    @pytest.mark.asyncio
    async def test_remove(self, db: AsyncSession, crud: TestCRUD):
        """Test removing an item."""
        item = await crud.create(db, obj_in=TestItemCreate(title="To Delete", owner_id=crud.user_id))
        item_id = item.id
        removed_item = await crud.remove(db, id=item_id)

        assert removed_item.id == item_id
        assert removed_item.title == "To Delete"

        # Verify item is actually deleted
        deleted_check = await crud.get(db, id=item_id)
        assert deleted_check is None

        # Test removing non-existent item
        # Expect remove to return None or raise an exception depending on implementation
        non_existent_remove = await crud.remove(db, id=999999) 
        assert non_existent_remove is None # Assuming remove returns None if not found 