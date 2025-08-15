from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, validator


class PaginationParams(BaseModel):
    """Parameters for offset-based pagination (backward compatibility)."""
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=10, ge=1, le=100, description="Number of items per page")


class CursorPaginationParams(BaseModel):
    """Parameters for cursor-based pagination."""
    cursor: Optional[str] = Field(None, description="Pagination cursor")
    limit: int = Field(default=20, ge=1, le=100, description="Number of items per page")
    sort_by: str = Field(default="created_at", description="Field to sort by")
    sort_direction: str = Field(default="desc", description="Sort direction (asc/desc)")
    include_total: bool = Field(default=False, description="Include expensive total count")
    
    @validator("sort_direction")
    def validate_sort_direction(cls, v):
        if v not in ["asc", "desc"]:
            raise ValueError("sort_direction must be 'asc' or 'desc'")
        return v


class PaginationInfo(BaseModel):
    """Enhanced pagination information supporting both cursor and offset pagination."""
    # Cursor pagination fields
    has_next: bool = Field(description="Whether there are more items after current page")
    has_previous: bool = Field(description="Whether there are items before current page")
    next_cursor: Optional[str] = Field(None, description="Cursor for next page")
    previous_cursor: Optional[str] = Field(None, description="Cursor for previous page")
    current_sort: Optional[str] = Field(None, description="Current sort field")
    current_direction: Optional[str] = Field(None, description="Current sort direction")
    
    # Optional total count (expensive for large datasets)
    total_count: Optional[int] = Field(None, description="Total count (expensive for large datasets)")
    
    # Backward compatibility fields
    total: Optional[int] = Field(None, description="Backward compatibility: total count")
    page: Optional[int] = Field(None, description="Backward compatibility: current page")
    page_size: Optional[int] = Field(None, description="Backward compatibility: items per page")
    pages: Optional[int] = Field(None, description="Backward compatibility: total pages")


class PaginatedResponse(BaseModel):
    """Generic response model for paginated results (backward compatibility)."""
    items: List[Any]
    total: int
    page: int
    page_size: int
    pages: int


class CursorPaginatedResponse(BaseModel):
    """Enhanced paginated response with cursor support."""
    data: List[Any] = Field(description="Page data items")
    pagination: PaginationInfo = Field(description="Pagination metadata")
    
    # Optional metadata
    filters: Optional[Dict[str, Any]] = Field(None, description="Applied filters")
    sort_options: Optional[List[str]] = Field(None, description="Available sort fields")


class ErrorResponse(BaseModel):
    """Standard error response format."""
    error: str = Field(description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    code: Optional[str] = Field(None, description="Error code")


class HealthResponse(BaseModel):
    """Health check response format."""
    status: str = Field(description="Service status")
    timestamp: str = Field(description="Check timestamp")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional health details") 