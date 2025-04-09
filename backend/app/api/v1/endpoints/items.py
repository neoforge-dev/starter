"""Item endpoints."""
from typing import Annotated, Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import structlog
from sqlalchemy import select

from app import crud, models
from app.api import deps
from app.schemas.item import Item, ItemCreate, ItemUpdate
from app.core.security import get_current_user
from app.schemas.user import UserResponse
from app.models.item import Item as ItemModel

router = APIRouter()
logger = structlog.get_logger()


@router.post("/", response_model=Item, status_code=status.HTTP_201_CREATED)
async def create_item(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    item_in: ItemCreate,
    current_user: Annotated[models.User, Depends(deps.get_current_active_user)],
) -> Any:
    """Create new item."""
    logger.info(
        "create_item_request",
        item_data=item_in.model_dump(),
        user_id=current_user.id,
    )
    try:
        item = await crud.item.create(db, obj_in=item_in, owner_id=current_user.id)
        return item
    except Exception as e:
        logger.error(
            "create_item_error",
            error=str(e),
            item_data=item_in.model_dump(),
            user_id=current_user.id,
        )
        raise


@router.get("/", response_model=List[Item])
async def read_items(
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    current_user: Annotated[models.User, Depends(deps.get_current_active_user)],
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Retrieve items."""
    result = await db.execute(
        select(ItemModel)
        .where(ItemModel.owner_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


@router.get("/{item_id}", response_model=Item)
async def read_item(
    item_id: int,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    current_user: Annotated[models.User, Depends(deps.get_current_active_user)],
) -> Any:
    """Get item by ID."""
    item = await crud.item.get(db, id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )
    if item.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return item


@router.put("/{item_id}", response_model=Item)
async def update_item(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    item_id: int,
    item_in: ItemUpdate,
    current_user: Annotated[models.User, Depends(deps.get_current_active_user)],
) -> Any:
    """Update item."""
    item = await crud.item.get(db, id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )
    if item.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return await crud.item.update(db, db_obj=item, obj_in=item_in)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    item_id: int,
    current_user: Annotated[models.User, Depends(deps.get_current_active_user)],
) -> None:
    """Delete item."""
    item = await crud.item.get(db, id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )
    if item.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    await crud.item.remove(db, id=item_id) 