"""Test CRUD base class."""
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

from app.crud.base import CRUDBase
from app.models.item import Item
from tests.factories import ItemFactory, UserFactory
from app.db.base_class import Base

# Mark these classes to be ignored by pytest collection
pytestmark = pytest.mark.usefixtures("db")

class _TestItemCreate(BaseModel):
    """Test item creation schema."""
    title: str
    description: str | None = None
    owner_id: int

class _TestItemUpdate(BaseModel):
    """Test item update schema."""
    title: str | None = None
    description: str | None = None
    owner_id: int | None = None

class _Item(Base):
    """Test item model."""
    __tablename__ = "test_items"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)

class _TestCRUD(CRUDBase[Item, _TestItemCreate, _TestItemUpdate]):
    """Test CRUD operations."""
    pass

@pytest_asyncio.fixture
async def crud() -> AsyncGenerator[_TestCRUD, None]:
    """Get test CRUD instance."""
    yield _TestCRUD(Item)

async def test_crud_create(db: AsyncSession, crud: _TestCRUD) -> None:
    """Test CRUD create operation."""
    user = await UserFactory.create(session=db)
    item_in = _TestItemCreate(
        title="Test Item",
        description="Test Description",
        owner_id=user.id,
    )
    
    item = await crud.create(db, obj_in=item_in)
    assert item.title == item_in.title
    assert item.description == item_in.description
    assert item.owner_id == user.id


async def test_crud_update(db: AsyncSession, crud: _TestCRUD) -> None:
    """Test CRUD update operation."""
    user = await UserFactory.create(session=db)
    item = await ItemFactory.create(session=db, user=user)
    
    # Test update with model
    update_data = _TestItemUpdate(title="Updated Title")
    updated_item = await crud.update(db, db_obj=item, obj_in=update_data)
    assert updated_item.title == "Updated Title"
    assert updated_item.owner_id == user.id
    
    # Test update with dict
    dict_update = {"description": "Updated Description"}
    updated_item = await crud.update(db, db_obj=item, obj_in=dict_update)
    assert updated_item.description == "Updated Description"
    assert updated_item.title == "Updated Title"


async def test_crud_get_multi(db: AsyncSession, crud: _TestCRUD):
    """Test CRUD get_multi operation."""
    user = await UserFactory.create(session=db)
    items = [
        await ItemFactory.create(session=db, user=user),
        await ItemFactory.create(session=db, user=user),
        await ItemFactory.create(session=db, user=user),
    ]
    
    # Test default pagination
    result = await crud.get_multi(db)
    assert len(result) == 3
    
    # Test with skip and limit
    result = await crud.get_multi(db, skip=1, limit=1)
    assert len(result) == 1
    assert result[0].id == items[1].id


async def test_crud_remove(db: AsyncSession, crud: _TestCRUD):
    """Test CRUD remove operation."""
    user = await UserFactory.create(session=db)
    item = await ItemFactory.create(session=db, user=user)
    
    # Remove item
    removed_item = await crud.remove(db, id=item.id)
    assert removed_item.id == item.id
    
    # Verify item is removed
    result = await crud.get(db, id=item.id)
    assert result is None 