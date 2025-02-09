"""User endpoints."""
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.crud.user import user as user_crud
from app.db.session import get_db
from app.schemas.user import UserResponse, UserCreate, UserUpdate
from app.schemas.item import Item
from app.models.item import Item as ItemModel

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def read_user_me(
    current_user: Annotated[UserResponse, Depends(get_current_user)],
) -> UserResponse:
    """Get current user."""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_user_me(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    user_in: UserUpdate,
) -> UserResponse:
    """Update current user."""
    return await user_crud.update(db, db_obj=current_user, obj_in=user_in)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    user_in: UserCreate,
) -> UserResponse:
    """Create new user."""
    # Check if current user is superuser
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can create new users",
        )
    
    # Check if email already exists
    user = await user_crud.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    return await user_crud.create(db, obj_in=user_in)


@router.get("/", response_model=List[UserResponse])
async def read_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 100,
) -> List[UserResponse]:
    """Retrieve users."""
    return await user_crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserResponse)
async def read_user(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    user_id: int,
) -> UserResponse:
    """Get user by ID."""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.get("/{user_id}/items", response_model=List[Item])
async def read_user_items(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    user_id: int,
) -> List[Item]:
    """Get all items for a specific user."""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Explicitly query items for the user
    result = await db.execute(
        select(ItemModel).where(ItemModel.owner_id == user_id)
    )
    return list(result.scalars().all())


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    user_id: int,
    user_in: UserUpdate,
) -> UserResponse:
    """Update user."""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return await user_crud.update(db, db_obj=user, obj_in=user_in)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    user_id: int,
) -> None:
    """Delete user."""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    await user_crud.remove(db, id=user_id) 