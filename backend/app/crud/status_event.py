"""CRUD for StatusEvent."""
from app.crud.base import CRUDBase
from app.models.status_event import StatusEvent
from app.schemas.status_event import StatusEventCreate
from sqlalchemy.ext.asyncio import AsyncSession


class CRUDStatusEvent(CRUDBase[StatusEvent, StatusEventCreate, StatusEventCreate]):
    pass


status_event = CRUDStatusEvent(StatusEvent)
