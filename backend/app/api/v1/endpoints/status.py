"""System status endpoints with basic persistence for events."""
from typing import Dict, List
from fastapi import APIRouter, Depends, Request, Response, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.api import deps
from app.crud.status_event import status_event as se_crud
from app.schemas.status_event import StatusEventCreate, StatusEventRead
from app.schemas.common import PaginatedResponse
from app.models.status_event import StatusEvent
from sqlalchemy import select, desc
from app.utils.http_cache import set_etag, not_modified
from app.core.config import get_settings, Environment

router = APIRouter()


@router.get("/status", response_model=Dict[str, str])
async def get_status(db: AsyncSession = Depends(deps.get_db)) -> Dict[str, str]:
    # Compute overall status from most recent events per service
    recent = await db.execute(
        select(StatusEvent).order_by(desc(StatusEvent.created_at)).limit(100)
    )
    latest_by_service: Dict[str, str] = {}
    for ev in recent.scalars():
        if ev.service_id not in latest_by_service:
            latest_by_service[ev.service_id] = ev.status
    overall = "operational" if all(s == "operational" for s in latest_by_service.values()) else "degraded"
    return {"status": overall}


@router.get("/status/services/{service_id}", response_model=Dict[str, str])
async def get_service_status(service_id: str, db: AsyncSession = Depends(deps.get_db)) -> Dict[str, str]:
    res = await db.execute(
        select(StatusEvent).where(StatusEvent.service_id == service_id).order_by(desc(StatusEvent.created_at)).limit(1)
    )
    ev = res.scalar_one_or_none()
    status = ev.status if ev else "unknown"
    return {"id": service_id, "status": status}


class StatusSubscribe(BaseModel):
    email: str


@router.post("/status/subscribe", response_model=Dict[str, str])
async def subscribe_status(_: StatusSubscribe) -> Dict[str, str]:
    return {"message": "Subscribed to status updates"}


@router.post("/status/events", response_model=StatusEventRead, status_code=201)
async def create_status_event(
    payload: StatusEventCreate, db: AsyncSession = Depends(deps.get_db)
) -> StatusEventRead:
    return await se_crud.create(db, obj_in=payload)


@router.get("/status/events", response_model=PaginatedResponse)
async def list_status_events(
    db: AsyncSession = Depends(deps.get_db),
    page: int = 1,
    page_size: int = 20,
    request: Request = None,
    response: Response = None,
) -> PaginatedResponse:
    skip = (page - 1) * page_size
    items, total = await se_crud.get_multi_with_count(db, skip=skip, limit=page_size)
    pages = (total + page_size - 1) // page_size if page_size else 1
    payload = PaginatedResponse(
        items=[StatusEventRead.model_validate(it) for it in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )
    # ETag for list
    etag = set_etag(response, payload.model_dump())
    if not_modified(request, etag):
        raise HTTPException(status_code=304, detail="Not Modified")

    # Dev-only Cache-Control to improve perf
    settings = get_settings()
    if settings.environment != Environment.PRODUCTION:
        response.headers["Cache-Control"] = "public, max-age=30"
    return payload
