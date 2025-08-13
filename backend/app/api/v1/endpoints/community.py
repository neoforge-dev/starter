"""Community posts endpoints backed by database."""
from typing import List
from fastapi import APIRouter, Depends, Request, Response, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.crud.community_post import community_post as cp_crud
from app.schemas.community_post import CommunityPostCreate, CommunityPostRead
from app.schemas.common import PaginatedResponse
from app.utils.http_cache import set_etag, not_modified
from app.core.config import get_settings, Environment
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
    request: Request = None,
    response: Response = None,
) -> PaginatedResponse:
    skip = (page - 1) * page_size
    items, total = await cp_crud.get_multi_with_count(db, skip=skip, limit=page_size)
    pages = (total + page_size - 1) // page_size if page_size else 1
    payload = PaginatedResponse(
        items=[CommunityPostRead.model_validate(it) for it in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )
    etag = set_etag(response, payload.model_dump())
    if not_modified(request, etag):
        raise HTTPException(status_code=304, detail="Not Modified")
    settings = get_settings()
    if settings.environment != Environment.PRODUCTION:
        response.headers["Cache-Control"] = "public, max-age=30"
    return payload


@router.post("/community/posts", response_model=CommunityPostRead, status_code=201)
async def create_post(
    payload: CommunityPostCreate,
    idem: IdempotencyManager = Depends(get_idempotency_manager),
    db: AsyncSession = Depends(deps.get_db),
) -> CommunityPostRead:
    cached = await idem.precheck(payload.model_dump())
    if cached:
        # On replay, return the same representation with 200 OK semantics
        return CommunityPostRead(**cached)

    created = await cp_crud.create(db, obj_in=payload)
    await idem.store(CommunityPostRead.model_validate(created).model_dump(), status_code=201)
    return created
