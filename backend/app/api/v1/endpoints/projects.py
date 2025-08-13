"""Projects endpoints backed by database models."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.crud.project import project as project_crud
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectRead
from app.schemas.common import PaginatedResponse
from app.utils.idempotency import (
    get_idempotency_manager,
    IdempotencyManager,
)
from app.utils.http_cache import set_etag, not_modified
from app.core.config import get_settings, Environment
from app.utils.audit import audit_event
import json

router = APIRouter()


@router.get("/projects", response_model=PaginatedResponse)
async def list_projects(
    db: AsyncSession = Depends(deps.get_db),
    page: int = 1,
    page_size: int = 10,
    request: Request = None,
    response: Response = None,
) -> PaginatedResponse:
    skip = (page - 1) * page_size
    items, total = await project_crud.get_multi_with_count(db, skip=skip, limit=page_size)
    pages = (total + page_size - 1) // page_size if page_size else 1
    payload = PaginatedResponse(
        items=[ProjectRead.model_validate(it) for it in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )
    # ETag for list
    etag = set_etag(response, payload.model_dump())
    if not_modified(request, etag):
        raise HTTPException(status_code=304, detail="Not Modified")
    # Dev-only Cache-Control
    settings = get_settings()
    if settings.environment != Environment.PRODUCTION:
        response.headers["Cache-Control"] = "public, max-age=30"
    return payload


@router.get("/projects/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: int,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(deps.get_db),
) -> ProjectRead:
    proj = await project_crud.get(db, id=project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    payload = ProjectRead.model_validate(proj).model_dump()
    etag = set_etag(response, payload)
    if not_modified(request, etag):
        # FastAPI will still return 200 if we just return None; explicitly raise
        raise HTTPException(status_code=304, detail="Not Modified")
    return ProjectRead(**payload)


@router.post("/projects", response_model=ProjectRead, status_code=201)
async def create_project(
    payload: ProjectCreate,
    idem: IdempotencyManager = Depends(get_idempotency_manager),
    db: AsyncSession = Depends(deps.get_db),
) -> ProjectRead:
    cached = await idem.precheck(payload.model_dump())
    if cached:
        return ProjectRead(**cached)

    created = await project_crud.create(db, obj_in=payload)
    # Audit (best-effort)
    await audit_event(db, user_id=None, action="project.create", resource=f"project:{created.id}")
    await idem.store(ProjectRead.model_validate(created).model_dump(), status_code=201)
    return created


@router.patch("/projects/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: int,
    payload: ProjectUpdate,
    idem: IdempotencyManager = Depends(get_idempotency_manager),
    db: AsyncSession = Depends(deps.get_db),
) -> ProjectRead:
    proj = await project_crud.get(db, id=project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    cached = await idem.precheck(payload.model_dump(exclude_unset=True))
    if cached:
        return ProjectRead(**cached)

    updated = await project_crud.update(db, db_obj=proj, obj_in=payload)
    await audit_event(db, user_id=None, action="project.update", resource=f"project:{proj.id}")
    await idem.store(ProjectRead.model_validate(updated).model_dump(), status_code=200)
    return updated


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(project_id: int, db: AsyncSession = Depends(deps.get_db)) -> None:
    proj = await project_crud.get(db, id=project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    await project_crud.remove(db, id=project_id)
    await audit_event(db, user_id=None, action="project.delete", resource=f"project:{project_id}")
    return None
