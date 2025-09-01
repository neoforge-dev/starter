"""StatusEvent schemas."""
from typing import Optional

from pydantic import BaseModel


class StatusEventCreate(BaseModel):
    service_id: str
    status: str
    description: Optional[str] = None


class StatusEventRead(StatusEventCreate):
    id: int

    class Config:
        from_attributes = True
