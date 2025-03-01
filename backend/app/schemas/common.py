from pydantic import BaseModel, Field

class PaginationParams(BaseModel):
    """Parameters for pagination."""
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=10, ge=1, le=100, description="Number of items per page")

class PaginatedResponse(BaseModel):
    """Generic response model for paginated results."""
    items: list
    total: int
    page: int
    page_size: int
    pages: int 