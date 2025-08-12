"""Support ticket endpoints backed by database."""
from typing import List
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.crud.support_ticket import support_ticket as st_crud
from app.schemas.support_ticket import (
    SupportTicketCreate,
    SupportTicketUpdate,
    SupportTicketRead,
)
from app.schemas.common import PaginatedResponse
from app.utils.idempotency import (
    get_idempotency_manager,
    IdempotencyManager,
)
import json

router = APIRouter()


@router.post("/support/tickets", response_model=SupportTicketRead, status_code=201)
async def create_ticket(
    payload: SupportTicketCreate,
    idem: IdempotencyManager = Depends(get_idempotency_manager),
    db: AsyncSession = Depends(deps.get_db),
) -> SupportTicketRead:
    cached = await idem.precheck(payload.model_dump())
    if cached:
        return SupportTicketRead(**cached)

    created = await st_crud.create(db, obj_in=payload)
    await idem.store(SupportTicketRead.model_validate(created).model_dump(), status_code=201)
    return created


@router.get("/support/tickets", response_model=PaginatedResponse)
async def list_tickets(
    db: AsyncSession = Depends(deps.get_db),
    page: int = 1,
    page_size: int = 10,
) -> PaginatedResponse:
    skip = (page - 1) * page_size
    items, total = await st_crud.get_multi_with_count(db, skip=skip, limit=page_size)
    pages = (total + page_size - 1) // page_size if page_size else 1
    return PaginatedResponse(
        items=[SupportTicketRead.model_validate(it) for it in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.patch("/support/tickets/{ticket_id}", response_model=SupportTicketRead)
async def update_ticket(
    ticket_id: int,
    payload: SupportTicketUpdate,
    db: AsyncSession = Depends(deps.get_db),
) -> SupportTicketRead:
    ticket = await st_crud.get(db, id=ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return await st_crud.update(db, db_obj=ticket, obj_in=payload)
