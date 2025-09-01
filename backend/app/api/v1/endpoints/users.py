"""User endpoints."""
from typing import Annotated, Any, List

from app.models.item import Item as ItemModel
from app.schemas.item import Item
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud, models
from app.api import deps

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def read_user_me(
    current_user: Annotated[models.User, Depends(deps.get_current_active_user)]
) -> Any:
    """Get current user."""
    return current_user


@router.get("/profile", response_model=UserResponse)
async def read_user_profile(
    current_user: Annotated[models.User, Depends(deps.get_current_active_user)]
) -> Any:
    """Alias for current user profile to match frontend client."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_user_me(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    user_in: UserUpdate,
    current_user: Annotated[models.User, Depends(deps.get_current_active_user)],
) -> Any:
    """Update current user."""
    return await crud.user.update(db, db_obj=current_user, obj_in=user_in)


@router.patch("/profile", response_model=UserResponse)
async def update_user_profile(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    user_in: UserUpdate,
    current_user: Annotated[models.User, Depends(deps.get_current_active_user)],
) -> Any:
    """Update current user profile (PATCH) to match frontend client."""
    return await crud.user.update(db, db_obj=current_user, obj_in=user_in)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    user_in: UserCreate,
    current_user: Annotated[models.User, Depends(deps.get_current_active_superuser)],
) -> Any:
    """Create new user.

    Requires superuser privileges.
    """
    # Check if current user is superuser (already handled by dependency)
    # if not current_user.is_superuser:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Not enough permissions",
    #     )

    # Check if email already exists
    user = await crud.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    return await crud.user.create(db, obj_in=user_in)


@router.get("/", response_model=List[UserResponse])
async def read_users(
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    current_user: Annotated[models.User, Depends(deps.get_current_active_superuser)],
    skip: int = 0,
    limit: int = 100,
) -> List[UserResponse]:
    """Retrieve users."""
    return await crud.user.get_multi(db, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserResponse)
async def read_user_by_id(
    user_id: int,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    current_user: Annotated[models.User, Depends(deps.get_current_active_superuser)],
) -> Any:
    """Get user by ID."""
    user = await crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.get("/{user_id}/items", response_model=List[Item])
async def read_user_items(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    current_user: Annotated[models.User, Depends(deps.get_current_active_superuser)],
    user_id: int,
) -> List[Item]:
    """Get all items for a specific user."""
    user = await crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Explicitly query items for the user
    result = await db.execute(select(ItemModel).where(ItemModel.owner_id == user_id))
    return list(result.scalars().all())


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    user_id: int,
    user_in: UserUpdate,
    current_user: Annotated[models.User, Depends(deps.get_current_active_superuser)],
) -> Any:
    """Update user."""
    user = await crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return await crud.user.update(db, db_obj=user, obj_in=user_in)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    current_user: Annotated[models.User, Depends(deps.get_current_active_superuser)],
    user_id: int,
) -> None:
    """Delete user."""
    user = await crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    await crud.user.remove(db, id=user_id)
