"""Articles endpoints for RealWorld API."""
from typing import Annotated, Optional

from app.api import deps
from app.crud.article import article as article_crud
from app.models.user import User
from app.schemas.article import (
    ArticleCreate,
    ArticleListResponse,
    ArticleUpdate,
    ArticleWithAuthor,
    SingleArticleResponse,
)
from app.schemas.common import PaginatedResponse
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("/articles", response_model=ArticleListResponse)
async def list_articles(
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    current_user: Annotated[Optional[User], Depends(deps.get_current_user_optional)],
    # Pagination
    limit: int = Query(20, ge=1, le=100, description="Number of articles per page"),
    offset: int = Query(0, ge=0, description="Number of articles to skip"),
    # Filters
    tag: Optional[str] = Query(None, description="Filter by tag"),
    author: Optional[str] = Query(None, description="Filter by author username"),
    favorited: Optional[str] = Query(None, description="Filter by username of favoriter"),
) -> ArticleListResponse:
    """
    List articles with optional filtering and pagination.

    Supports filtering by:
    - tag: Filter articles by tag
    - author: Filter articles by author username
    - favorited: Filter articles favorited by a user
    """
    articles, total = await article_crud.get_multi_with_filters(
        db=db,
        current_user=current_user,
        limit=limit,
        offset=offset,
        tag=tag,
        author=author,
        favorited=favorited,
    )

    return ArticleListResponse(
        articles=articles,
        articles_count=total,
    )


@router.get("/articles/feed", response_model=ArticleListResponse)
async def feed_articles(
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
    # Pagination
    limit: int = Query(20, ge=1, le=100, description="Number of articles per page"),
    offset: int = Query(0, ge=0, description="Number of articles to skip"),
) -> ArticleListResponse:
    """
    Get articles from users that the current user follows.

    Requires authentication.
    """
    articles, total = await article_crud.get_feed(
        db=db,
        current_user=current_user,
        limit=limit,
        offset=offset,
    )

    return ArticleListResponse(
        articles=articles,
        articles_count=total,
    )


@router.get("/articles/{slug}", response_model=SingleArticleResponse)
async def get_article(
    slug: str,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    current_user: Annotated[Optional[User], Depends(deps.get_current_user_optional)],
) -> SingleArticleResponse:
    """Get a single article by slug."""
    article = await article_crud.get_by_slug(db=db, slug=slug, current_user=current_user)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found",
        )

    return SingleArticleResponse(article=article)


@router.post("/articles", response_model=SingleArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_article(
    article_in: ArticleCreate,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
) -> SingleArticleResponse:
    """Create a new article. Requires authentication."""
    article = await article_crud.create_with_author(
        db=db,
        obj_in=article_in,
        author=current_user,
    )

    return SingleArticleResponse(article=article)


@router.put("/articles/{slug}", response_model=SingleArticleResponse)
async def update_article(
    slug: str,
    article_in: ArticleUpdate,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
) -> SingleArticleResponse:
    """Update an article. Only the author can update their articles."""
    article = await article_crud.get_by_slug(db=db, slug=slug, current_user=current_user)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found",
        )

    # Check if current user is the author
    if article.author.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the author can update this article",
        )

    article = await article_crud.update(db=db, db_obj=article, obj_in=article_in)

    return SingleArticleResponse(article=article)


@router.delete("/articles/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    slug: str,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
) -> None:
    """Delete an article. Only the author can delete their articles."""
    article = await article_crud.get_by_slug(db=db, slug=slug, current_user=current_user)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found",
        )

    # Check if current user is the author
    if article.author.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the author can delete this article",
        )

    await article_crud.remove(db=db, id=article.id)


@router.post("/articles/{slug}/favorite", response_model=SingleArticleResponse)
async def favorite_article(
    slug: str,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
) -> SingleArticleResponse:
    """Favorite an article. Requires authentication."""
    article = await article_crud.favorite(db=db, slug=slug, user=current_user)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found",
        )

    return SingleArticleResponse(article=article)


@router.delete("/articles/{slug}/favorite", response_model=SingleArticleResponse)
async def unfavorite_article(
    slug: str,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
) -> SingleArticleResponse:
    """Unfavorite an article. Requires authentication."""
    article = await article_crud.unfavorite(db=db, slug=slug, user=current_user)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found",
        )

    return SingleArticleResponse(article=article)