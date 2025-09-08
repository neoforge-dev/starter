"""Comment schemas for RealWorld API."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# Shared properties
class CommentBase(BaseModel):
    """Base Comment schema."""

    body: str


# Properties to receive on comment creation
class CommentCreate(CommentBase):
    """Comment creation schema."""

    pass


# Properties shared by models stored in DB
class CommentInDBBase(CommentBase):
    """Base Comment DB schema."""

    id: int
    article_id: int
    author_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        """Schema configuration."""

        from_attributes = True


# Additional properties to return via API
class CommentResponse(CommentInDBBase):
    """Comment response schema."""

    pass


# Comment with author information
class CommentWithAuthor(CommentResponse):
    """Comment with author profile information."""

    author: "ProfileResponse"


# List response for multiple comments
class CommentListResponse(BaseModel):
    """Response for list of comments."""

    comments: list[CommentWithAuthor]


# Single comment response
class SingleCommentResponse(BaseModel):
    """Response for single comment."""

    comment: CommentWithAuthor


# Forward reference for ProfileResponse
from .profile import ProfileResponse

CommentWithAuthor.model_rebuild()