"""Projects endpoints backed by database models with optimized cursor-based pagination."""
import json
from typing import Any, Dict, List, Optional, Union

from app.crud.project import project as project_crud
from app.models.project import Project
from app.schemas.common import (
    CursorPaginatedResponse,
    CursorPaginationParams,
    PaginatedResponse,
)
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.utils.audit import audit_event
from app.utils.cursor_pagination import CursorPaginationManager, get_cursor_manager
from app.utils.http_cache import not_modified, set_etag
from app.utils.idempotency import IdempotencyManager, get_idempotency_manager
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.config import Environment, get_settings

router = APIRouter()


@router.get(
    "/projects", response_model=Union[PaginatedResponse, CursorPaginatedResponse]
)
async def list_projects(
    db: AsyncSession = Depends(deps.get_db),
    request: Request = None,
    response: Response = None,
    # Cursor-based pagination parameters (preferred for performance)
    cursor: Optional[str] = Query(
        None, description="Pagination cursor for efficient large dataset handling"
    ),
    limit: int = Query(20, ge=1, le=100, description="Number of items per page"),
    sort_by: str = Query(
        "created_at", description="Field to sort by (created_at, updated_at, name)"
    ),
    sort_direction: str = Query("desc", description="Sort direction (asc, desc)"),
    include_total: bool = Query(
        False, description="Include total count (expensive for large datasets)"
    ),
    # Filters
    owner_id: Optional[int] = Query(None, description="Filter by owner ID"),
    name_like: Optional[str] = Query(
        None, description="Search projects by name (partial match)"
    ),
    # Backward compatibility: offset pagination
    page: Optional[int] = Query(
        None, ge=1, description="Page number (offset pagination - legacy)"
    ),
    page_size: Optional[int] = Query(
        None, ge=1, le=100, description="Items per page (offset pagination - legacy)"
    ),
    cursor_manager: CursorPaginationManager = Depends(get_cursor_manager),
) -> Union[PaginatedResponse, CursorPaginatedResponse]:
    """List projects with high-performance cursor-based pagination.

    **Performance Benefits:**
    - Cursor pagination: O(log n) performance vs O(n) for offset pagination
    - Efficient for large datasets (100k+ projects)
    - Consistent <200ms response times

    **Pagination Methods:**
    1. **Cursor-based (Recommended)**: Use `cursor`, `limit`, `sort_by`, `sort_direction`
    2. **Offset-based (Legacy)**: Use `page`, `page_size` for backward compatibility

    **Available Sort Fields:**
    - `created_at`: Project creation date (default)
    - `updated_at`: Last modification date
    - `name`: Project name (alphabetical)

    **Filtering:**
    - `owner_id`: Filter by project owner
    - `name_like`: Search by project name (case-insensitive partial match)
    """

    # Validate sort field
    valid_sort_fields = ["created_at", "updated_at", "name"]
    if sort_by not in valid_sort_fields:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sort_by field. Must be one of: {valid_sort_fields}",
        )

    # Backward compatibility: detect offset pagination
    use_offset_pagination = page is not None or page_size is not None

    if use_offset_pagination:
        # Legacy offset-based pagination
        page = page or 1
        page_size = page_size or 10

        skip = (page - 1) * page_size
        items, total = await project_crud.get_multi_with_count(
            db, skip=skip, limit=page_size
        )
        pages = (total + page_size - 1) // page_size if page_size else 1

        payload = PaginatedResponse(
            items=[ProjectRead.model_validate(it) for it in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

        # ETag for caching
        etag = set_etag(response, payload.model_dump())
        if not_modified(request, etag):
            raise HTTPException(status_code=304, detail="Not Modified")

        # Cache headers (dev only)
        settings = get_settings()
        if settings.environment != Environment.PRODUCTION:
            response.headers["Cache-Control"] = "public, max-age=30"

        return payload

    else:
        # Modern cursor-based pagination

        # Build filters
        filters = {}
        if owner_id is not None:
            filters["owner_id"] = owner_id
        if name_like is not None:
            filters["name_like"] = name_like

        # Base query
        base_query = select(Project)

        # Execute cursor-based pagination
        paginated_result = await cursor_manager.paginate(
            db=db,
            base_query=base_query,
            model=Project,
            cursor=cursor,
            limit=limit,
            include_total=include_total,
            filters=filters,
            sort_by=sort_by,
            sort_direction=sort_direction,
        )

        # Convert to response schema
        project_data = [
            ProjectRead.model_validate(project) for project in paginated_result.data
        ]

        response_data = CursorPaginatedResponse(
            data=project_data,
            pagination=paginated_result.pagination,
            filters=filters if filters else None,
            sort_options=valid_sort_fields,
        )

        # Enhanced ETag for cursor pagination (includes sort and filters)
        etag_data = {
            "data": [item.model_dump() for item in project_data],
            "pagination": paginated_result.pagination.model_dump(),
            "filters": filters,
            "sort": f"{sort_by}_{sort_direction}",
        }
        etag = set_etag(response, etag_data)
        if not_modified(request, etag):
            raise HTTPException(status_code=304, detail="Not Modified")

        # Optimized cache headers for cursor pagination
        settings = get_settings()
        if settings.environment != Environment.PRODUCTION:
            # Shorter cache for cursor pagination due to real-time nature
            response.headers["Cache-Control"] = "public, max-age=60"
        else:
            # Production: Longer cache with ETag validation
            response.headers["Cache-Control"] = "public, max-age=300, must-revalidate"

        # Performance headers
        response.headers["X-Pagination-Type"] = "cursor"
        response.headers["X-Total-Available"] = str(include_total).lower()

        return response_data


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
    await audit_event(
        db, user_id=None, action="project.create", resource=f"project:{created.id}"
    )
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
    await audit_event(
        db, user_id=None, action="project.update", resource=f"project:{proj.id}"
    )
    await idem.store(ProjectRead.model_validate(updated).model_dump(), status_code=200)
    return updated


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(
    project_id: int, db: AsyncSession = Depends(deps.get_db)
) -> None:
    proj = await project_crud.get(db, id=project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    await project_crud.remove(db, id=project_id)
    await audit_event(
        db, user_id=None, action="project.delete", resource=f"project:{project_id}"
    )
    return None
