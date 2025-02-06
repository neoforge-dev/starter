"""CRUD operations for items."""
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate


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


item = CRUDItem(Item) 