"""Community posts endpoints backed by database with optimized cursor-based pagination."""
from typing import List, Optional, Dict, Any, Union
from fastapi import APIRouter, Depends, Request, Response, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api import deps
from app.crud.community_post import community_post as cp_crud
from app.schemas.community_post import CommunityPostCreate, CommunityPostRead
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
from app.models.community_post import CommunityPost
import json

router = APIRouter()


@router.get("/community/posts", response_model=Union[PaginatedResponse, CursorPaginatedResponse])
async def list_posts(
    db: AsyncSession = Depends(deps.get_db),
    request: Request = None,
    response: Response = None,
    # Cursor-based pagination parameters (preferred for performance)
    cursor: Optional[str] = Query(None, description="Pagination cursor for efficient large dataset handling"),
    limit: int = Query(20, ge=1, le=100, description="Number of items per page"),
    sort_by: str = Query("created_at", description="Field to sort by (created_at, updated_at, title)"),
    sort_direction: str = Query("desc", description="Sort direction (asc, desc)"),
    include_total: bool = Query(False, description="Include total count (expensive for large datasets)"),
    # Filters
    author: Optional[str] = Query(None, description="Filter by exact author name"),
    author_like: Optional[str] = Query(None, description="Search posts by author (partial match)"),
    title_like: Optional[str] = Query(None, description="Search posts by title (partial match)"),
    content_like: Optional[str] = Query(None, description="Search posts by content (partial match)"),
    # Backward compatibility: offset pagination
    page: Optional[int] = Query(None, ge=1, description="Page number (offset pagination - legacy)"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Items per page (offset pagination - legacy)"),
    cursor_manager: CursorPaginationManager = Depends(get_cursor_manager),
) -> Union[PaginatedResponse, CursorPaginatedResponse]:
    """List community posts with high-performance cursor-based pagination.
    
    **Performance Benefits:**
    - Cursor pagination: O(log n) performance vs O(n) for offset pagination
    - Efficient for large datasets (100k+ posts)
    - Consistent <200ms response times
    - Optimized for community engagement workflows
    
    **Pagination Methods:**
    1. **Cursor-based (Recommended)**: Use `cursor`, `limit`, `sort_by`, `sort_direction`
    2. **Offset-based (Legacy)**: Use `page`, `page_size` for backward compatibility
    
    **Available Sort Fields:**
    - `created_at`: Post creation date (default, best for timeline views)
    - `updated_at`: Last modification date (useful for recently active posts)
    - `title`: Post title (alphabetical sorting)
    
    **Filtering:**
    - `author`: Filter by exact author name
    - `author_like`: Search by author name (case-insensitive partial match)
    - `title_like`: Search by post title (case-insensitive partial match)
    - `content_like`: Search by post content (case-insensitive partial match)
    
    **Common Use Cases:**
    - Latest posts: `sort_by=created_at&sort_direction=desc` (default)
    - Recently updated: `sort_by=updated_at&sort_direction=desc`
    - Author posts: `author=username`
    - Content search: `title_like=keyword` or `content_like=keyword`
    """
    
    # Validate sort field
    valid_sort_fields = ["created_at", "updated_at", "title"]
    if sort_by not in valid_sort_fields:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid sort_by field. Must be one of: {valid_sort_fields}"
        )
    
    # Backward compatibility: detect offset pagination
    use_offset_pagination = page is not None or page_size is not None
    
    if use_offset_pagination:
        # Legacy offset-based pagination
        page = page or 1
        page_size = page_size or 10
        
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
        if author is not None:
            filters["author"] = author
        if author_like is not None:
            filters["author_like"] = author_like
        if title_like is not None:
            filters["title_like"] = title_like
        if content_like is not None:
            filters["content_like"] = content_like
        
        # Base query
        base_query = select(CommunityPost)
        
        # Execute cursor-based pagination
        paginated_result = await cursor_manager.paginate(
            db=db,
            base_query=base_query,
            model=CommunityPost,
            cursor=cursor,
            limit=limit,
            include_total=include_total,
            filters=filters,
            sort_by=sort_by,
            sort_direction=sort_direction
        )
        
        # Convert to response schema
        post_data = [CommunityPostRead.model_validate(post) for post in paginated_result.data]
        
        response_data = CursorPaginatedResponse(
            data=post_data,
            pagination=paginated_result.pagination,
            filters=filters if filters else None,
            sort_options=valid_sort_fields
        )
        
        # Enhanced ETag for cursor pagination (includes sort and filters)
        etag_data = {
            "data": [item.model_dump() for item in post_data],
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
            # Community posts can be cached longer (less dynamic than support tickets)
            response.headers["Cache-Control"] = "public, max-age=120"
        else:
            # Production: Longer cache for community content
            response.headers["Cache-Control"] = "public, max-age=600, must-revalidate"
        
        # Performance headers
        response.headers["X-Pagination-Type"] = "cursor"
        response.headers["X-Total-Available"] = str(include_total).lower()
        response.headers["X-Filter-Count"] = str(len(filters))
        
        return response_data


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
