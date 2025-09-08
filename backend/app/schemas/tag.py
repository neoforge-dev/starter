"""Tag schemas for RealWorld API."""
from pydantic import BaseModel


# Tag response schema
class TagResponse(BaseModel):
    """Tag response schema."""

    name: str

    class Config:
        """Schema configuration."""

        from_attributes = True


# List response for multiple tags
class TagListResponse(BaseModel):
    """Response for list of tags."""

    tags: list[str]