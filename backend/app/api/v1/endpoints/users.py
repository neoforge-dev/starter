"""User endpoints."""
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.user import user as user_crud
from app.db.session import get_db
from app.schemas.user import User, UserCreate, UserUpdate
from app.schemas.item import Item

router = APIRouter()


@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    user_in: UserCreate,
) -> User:
    """Create new user."""
    user = await user_crud.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    return await user_crud.create(db, obj_in=user_in)


@router.get("/", response_model=List[User])
async def read_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100,
) -> List[User]:
    """Retrieve users."""
    return await user_crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=User)
async def read_user(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: int,
) -> User:
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
    user_id: int,
) -> List[Item]:
    """Get items for a specific user."""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user.items


@router.put("/{user_id}", response_model=User)
async def update_user(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: int,
    user_in: UserUpdate,
) -> User:
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