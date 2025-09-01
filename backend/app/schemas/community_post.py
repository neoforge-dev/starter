"""Community post schemas."""
from typing import Optional

from pydantic import BaseModel


class CommunityPostBase(BaseModel):
    title: str
    content: str
    author: Optional[str] = None


class CommunityPostCreate(CommunityPostBase):
    pass


class CommunityPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = None


class CommunityPostRead(CommunityPostBase):
    id: int

    class Config:
        from_attributes = True
