from typing import Generic, Type, TypeVar
from unittest.mock import MagicMock

import pytest
import pytest_asyncio
from app.crud.base import CRUDBase
from app.db.base_class import Base  # Assuming TestItem inherits from Base
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import UserFactory  # For creating owner

# --- Mock Models & Schemas for Testing ---


# Mock SQLAlchemy Model
class TestItem(Base):
    __tablename__ = "test_items"
    id: int = MagicMock()  # Mock ID attribute
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
        self.user_id = user_id  # Store user_id if needed for tests


# --- Fixtures ---


@pytest_asyncio.fixture(scope="function")
async def crud(db: AsyncSession) -> TestCRUD:
    """Fixture to provide CRUD operations for testing."""
    # Initialize user for ownership testing
    user = await UserFactory.create(session=db)
    await db.commit()
    await db.refresh(user)  # Ensure user has an ID
    # Initialize the CRUD class with the model
    return TestCRUD(TestItem, user_id=user.id)


# --- CRUD Base Class Tests ---
class TestCRUDBase:
    @pytest.mark.asyncio
    async def test_create(self, crud: TestCRUD, db: AsyncSession):
        """Test creating an item."""
        item_in = TestItemCreate(title="Test Item", description="Test Description")
        user = await UserFactory.create(session=db)
        item = await crud.create(db=db, obj_in=item_in, user_id=user.id)
        assert item.title == item_in.title
        assert item.description == item_in.description
        assert item.owner_id == user.id

    @pytest.mark.asyncio
    async def test_get(self, crud: TestCRUD, db: AsyncSession):
        """Test getting an item by ID."""
        # Create an item first
        item_in = TestItemCreate(
            title="Test Item Get", description="Test Get Description"
        )
        user = await UserFactory.create(session=db)
        created_item = await crud.create(db=db, obj_in=item_in, user_id=user.id)

        # Now try to get it
        retrieved_item = await crud.get(db=db, id=created_item.id)
        assert retrieved_item
        assert retrieved_item.id == created_item.id
        assert retrieved_item.title == item_in.title

    @pytest.mark.asyncio
    async def test_get_multi(self, crud: TestCRUD, db: AsyncSession):
        """Test getting multiple items."""
        user = await UserFactory.create(session=db)
        await crud.create(db=db, obj_in=TestItemCreate(title="Item 1"), user_id=user.id)
        await crud.create(db=db, obj_in=TestItemCreate(title="Item 2"), user_id=user.id)

        items = await crud.get_multi(db=db)
        assert len(items) >= 2  # Could be more if other tests ran

    @pytest.mark.asyncio
    async def test_update(self, crud: TestCRUD, db: AsyncSession):
        """Test updating an item."""
        item_in = TestItemCreate(title="Test Item Update", description="Initial Desc")
        user = await UserFactory.create(session=db)
        created_item = await crud.create(db=db, obj_in=item_in, user_id=user.id)

        update_data = TestItemUpdate(description="Updated Desc")
        updated_item = await crud.update(db=db, db_obj=created_item, obj_in=update_data)
        assert updated_item.description == "Updated Desc"
        assert updated_item.title == created_item.title  # Title should remain unchanged

    @pytest.mark.asyncio
    async def test_remove(self, crud: TestCRUD, db: AsyncSession):
        """Test removing an item."""
        item_in = TestItemCreate(title="Test Item Remove")
        user = await UserFactory.create(session=db)
        created_item = await crud.create(db=db, obj_in=item_in, user_id=user.id)

        await crud.remove(db=db, id=created_item.id)
        removed_item = await crud.get(db=db, id=created_item.id)
        assert removed_item is None
