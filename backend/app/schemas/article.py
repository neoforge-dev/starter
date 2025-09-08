"""Article schemas for RealWorld API."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# Shared properties
class ArticleBase(BaseModel):
    """Base Article schema."""

    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=500)
    body: str = Field(..., min_length=1)
    tag_list: Optional[List[str]] = Field(default_factory=list)


# Properties to receive on article creation
class ArticleCreate(ArticleBase):
    """Article creation schema."""

    pass


# Properties to receive on article update
class ArticleUpdate(BaseModel):
    """Article update schema."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    body: Optional[str] = Field(None, min_length=1)
    tag_list: Optional[List[str]] = None


# Properties shared by models stored in DB
class ArticleInDBBase(ArticleBase):
    """Base Article DB schema."""

    id: int
    slug: str
    author_id: int
    created_at: datetime
    updated_at: datetime
    favorites_count: int = 0
    favorited: bool = False
    following: bool = False

    class Config:
        """Schema configuration."""

        from_attributes = True


# Additional properties to return via API
class ArticleResponse(ArticleInDBBase):
    """Article response schema."""

    pass


# Article with author information
class ArticleWithAuthor(ArticleResponse):
    """Article with author profile information."""

    author: "ProfileResponse"


# List response for multiple articles
class ArticleListResponse(BaseModel):
    """Response for list of articles."""

    articles: List[ArticleWithAuthor]
    articles_count: int


# Single article response
class SingleArticleResponse(BaseModel):
    """Response for single article."""

    article: ArticleWithAuthor


# Forward reference for ProfileResponse
from .profile import ProfileResponse

ArticleWithAuthor.model_rebuild()