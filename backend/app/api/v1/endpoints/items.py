"""Item endpoints."""
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.item import item as item_crud
from app.db.session import get_db
from app.schemas.item import Item, ItemCreate, ItemUpdate

router = APIRouter()


@router.post("/", response_model=Item, status_code=status.HTTP_201_CREATED)
async def create_item(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    item_in: ItemCreate,
) -> Item:
    """Create new item."""
    return await item_crud.create(db, obj_in=item_in)


@router.get("/", response_model=List[Item])
async def read_items(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100,
) -> List[Item]:
    """Retrieve items."""
    return await item_crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{item_id}", response_model=Item)
async def read_item(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    item_id: int,
) -> Item:
    """Get item by ID."""
    item = await item_crud.get(db, id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )
    return item


@router.put("/{item_id}", response_model=Item)
async def update_item(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    item_id: int,
    item_in: ItemUpdate,
) -> Item:
    """Update item."""
    item = await item_crud.get(db, id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )
    return await item_crud.update(db, db_obj=item, obj_in=item_in)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    item_id: int,
) -> None:
    """Delete item."""
    item = await item_crud.get(db, id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )
    await item_crud.remove(db, id=item_id) 