"""Item schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ItemBase(BaseModel):
    """Base item schema."""

    title: str
    description: Optional[str] = None


class ItemCreate(ItemBase):
    """Schema for creating an item."""
    owner_id: int


class ItemUpdate(ItemBase):
    """Schema for updating an item."""

    title: Optional[str] = None
    owner_id: Optional[int] = None


class Item(ItemBase):
    """Schema for item responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime 