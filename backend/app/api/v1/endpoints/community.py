"""Community posts endpoints backed by database."""
from typing import List
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.crud.community_post import community_post as cp_crud
from app.schemas.community_post import CommunityPostCreate, CommunityPostRead
from app.schemas.common import PaginatedResponse
from app.utils.idempotency import (
    get_idempotency_manager,
    IdempotencyManager,
)
import json

router = APIRouter()


@router.get("/community/posts", response_model=PaginatedResponse)
async def list_posts(
    db: AsyncSession = Depends(deps.get_db),
    page: int = 1,
    page_size: int = 10,
) -> PaginatedResponse:
    skip = (page - 1) * page_size
    items, total = await cp_crud.get_multi_with_count(db, skip=skip, limit=page_size)
    pages = (total + page_size - 1) // page_size if page_size else 1
    return PaginatedResponse(
        items=[CommunityPostRead.model_validate(it) for it in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.post("/community/posts", response_model=CommunityPostRead, status_code=201)
async def create_post(
    payload: CommunityPostCreate,
    idem: IdempotencyManager = Depends(get_idempotency_manager),
    db: AsyncSession = Depends(deps.get_db),
) -> CommunityPostRead:
    cached = await idem.precheck(payload.model_dump())
    if cached:
        return CommunityPostRead(**cached)

    created = await cp_crud.create(db, obj_in=payload)
    await idem.store(CommunityPostRead.model_validate(created).model_dump(), status_code=201)
    return created
