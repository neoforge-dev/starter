"""CRUD operations for items."""
from typing import List, Optional

from app.crud.base import CRUDBase
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class CRUDItem(CRUDBase[Item, ItemCreate, ItemUpdate]):
    """CRUD operations for items."""

    async def get_by_title(
        self,
        db: AsyncSession,
        *,
        title: str,
    ) -> Optional[Item]:
        """Get item by title."""
        result = await db.execute(
            select(self.model).where(self.model.title == title),
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        db: AsyncSession,
        *,
        obj_in: ItemCreate,
        owner_id: int,
    ) -> Item:
        """Create a new item with owner."""
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data, owner_id=owner_id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj


item = CRUDItem(Item)
