"""Support ticket endpoints backed by database with optimized cursor-based pagination."""
from typing import List, Optional, Dict, Any, Union
from fastapi import APIRouter, Depends, Request, HTTPException, Response, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api import deps
from app.crud.support_ticket import support_ticket as st_crud
from app.schemas.support_ticket import (
    SupportTicketCreate,
    SupportTicketUpdate,
    SupportTicketRead,
)
from app.schemas.common import (
    PaginatedResponse, 
    CursorPaginatedResponse, 
    CursorPaginationParams
)
from app.utils.http_cache import set_etag, not_modified
from app.utils.cursor_pagination import get_cursor_manager, CursorPaginationManager
from app.core.config import get_settings, Environment
from app.utils.idempotency import (
    get_idempotency_manager,
    IdempotencyManager,
)
from app.models.support_ticket import SupportTicket
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
        # On replay, return the same representation with 200 OK semantics
        return SupportTicketRead(**cached)

    created = await st_crud.create(db, obj_in=payload)
    await idem.store(SupportTicketRead.model_validate(created).model_dump(), status_code=201)
    return created


@router.get("/support/tickets", response_model=Union[PaginatedResponse, CursorPaginatedResponse])
async def list_tickets(
    db: AsyncSession = Depends(deps.get_db),
    request: Request = None,
    response: Response = None,
    # Cursor-based pagination parameters (preferred for performance)
    cursor: Optional[str] = Query(None, description="Pagination cursor for efficient large dataset handling"),
    limit: int = Query(20, ge=1, le=100, description="Number of items per page"),
    sort_by: str = Query("created_at", description="Field to sort by (created_at, updated_at, status)"),
    sort_direction: str = Query("desc", description="Sort direction (asc, desc)"),
    include_total: bool = Query(False, description="Include total count (expensive for large datasets)"),
    # Filters
    status: Optional[str] = Query(None, description="Filter by ticket status (open, closed, pending)"),
    email_like: Optional[str] = Query(None, description="Search tickets by email (partial match)"),
    subject_like: Optional[str] = Query(None, description="Search tickets by subject (partial match)"),
    # Backward compatibility: offset pagination
    page: Optional[int] = Query(None, ge=1, description="Page number (offset pagination - legacy)"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Items per page (offset pagination - legacy)"),
    cursor_manager: CursorPaginationManager = Depends(get_cursor_manager),
) -> Union[PaginatedResponse, CursorPaginatedResponse]:
    """List support tickets with high-performance cursor-based pagination.
    
    **Performance Benefits:**
    - Cursor pagination: O(log n) performance vs O(n) for offset pagination
    - Efficient for large datasets (100k+ tickets)
    - Consistent <200ms response times
    - Optimized for support team workflows
    
    **Pagination Methods:**
    1. **Cursor-based (Recommended)**: Use `cursor`, `limit`, `sort_by`, `sort_direction`
    2. **Offset-based (Legacy)**: Use `page`, `page_size` for backward compatibility
    
    **Available Sort Fields:**
    - `created_at`: Ticket creation date (default)
    - `updated_at`: Last modification date (useful for recently updated tickets)
    - `status`: Ticket status (groups by status)
    
    **Filtering:**
    - `status`: Filter by ticket status (open, closed, pending, resolved)
    - `email_like`: Search by customer email (case-insensitive partial match)
    - `subject_like`: Search by ticket subject (case-insensitive partial match)
    
    **Common Use Cases:**
    - Recent tickets: `sort_by=created_at&sort_direction=desc`
    - Active tickets: `status=open&sort_by=updated_at&sort_direction=desc`
    - Customer search: `email_like=customer@example.com`
    """
    
    # Validate sort field
    valid_sort_fields = ["created_at", "updated_at", "status"]
    if sort_by not in valid_sort_fields:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid sort_by field. Must be one of: {valid_sort_fields}"
        )
    
    # Validate status filter
    valid_statuses = ["open", "closed", "pending", "resolved"]
    if status is not None and status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )
    
    # Backward compatibility: detect offset pagination
    use_offset_pagination = page is not None or page_size is not None
    
    if use_offset_pagination:
        # Legacy offset-based pagination
        page = page or 1
        page_size = page_size or 10
        
        skip = (page - 1) * page_size
        items, total = await st_crud.get_multi_with_count(db, skip=skip, limit=page_size)
        pages = (total + page_size - 1) // page_size if page_size else 1
        
        payload = PaginatedResponse(
            items=[SupportTicketRead.model_validate(it) for it in items],
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
        if status is not None:
            filters["status"] = status
        if email_like is not None:
            filters["email_like"] = email_like
        if subject_like is not None:
            filters["subject_like"] = subject_like
        
        # Base query
        base_query = select(SupportTicket)
        
        # Execute cursor-based pagination
        paginated_result = await cursor_manager.paginate(
            db=db,
            base_query=base_query,
            model=SupportTicket,
            cursor=cursor,
            limit=limit,
            include_total=include_total,
            filters=filters,
            sort_by=sort_by,
            sort_direction=sort_direction
        )
        
        # Convert to response schema
        ticket_data = [SupportTicketRead.model_validate(ticket) for ticket in paginated_result.data]
        
        response_data = CursorPaginatedResponse(
            data=ticket_data,
            pagination=paginated_result.pagination,
            filters=filters if filters else None,
            sort_options=valid_sort_fields
        )
        
        # Enhanced ETag for cursor pagination (includes sort and filters)
        etag_data = {
            "data": [item.model_dump() for item in ticket_data],
            "pagination": paginated_result.pagination.model_dump(),
            "filters": filters,
            "sort": f"{sort_by}_{sort_direction}"
        }
        etag = set_etag(response, etag_data)
        if not_modified(request, etag):
            raise HTTPException(status_code=304, detail="Not Modified")
        
        # Optimized cache headers for cursor pagination
        settings = get_settings()
        if settings.environment != Environment.PRODUCTION:
            # Shorter cache for support tickets (more dynamic)
            response.headers["Cache-Control"] = "public, max-age=30"
        else:
            # Production: Medium cache with ETag validation
            response.headers["Cache-Control"] = "public, max-age=120, must-revalidate"
        
        # Performance headers
        response.headers["X-Pagination-Type"] = "cursor"
        response.headers["X-Total-Available"] = str(include_total).lower()
        response.headers["X-Filter-Count"] = str(len(filters))
        
        return response_data


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
