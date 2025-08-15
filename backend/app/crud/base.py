"""Base class for CRUD operations with Redis caching support."""
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from datetime import timedelta

from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.db.base_class import Base
from app.core.cache import Cache, cached
from app.utils.cursor_pagination import CursorPaginationManager

logger = structlog.get_logger()

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Base class for CRUD operations with Redis caching support."""

    def __init__(self, model: Type[ModelType]):
        """Initialize with SQLAlchemy model."""
        self.model = model
        self.model_name = model.__name__.lower()
        
        # Cache configuration per model
        self.cache_ttl = timedelta(minutes=15)  # Default 15 minutes
        self.list_cache_ttl = timedelta(minutes=5)  # Shorter for list operations

    async def get(
        self,
        db: AsyncSession,
        id: Any,
    ) -> Optional[ModelType]:
        """Get a record by ID."""
        result = await db.execute(
            select(self.model).where(self.model.id == id),
        )
        return result.scalar_one_or_none()
    
    @cached(ttl=timedelta(minutes=15), prefix="crud_get")
    async def get_cached(
        self,
        db: AsyncSession,
        id: Any,
    ) -> Optional[ModelType]:
        """Get a record by ID with Redis caching.
        
        Caches individual records for 15 minutes to reduce database load
        for frequently accessed items.
        """
        return await self.get(db, id)

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ModelType]:
        """Get multiple records with pagination."""
        result = await db.execute(
            select(self.model).offset(skip).limit(limit),
        )
        return list(result.scalars().all())

    async def get_multi_with_count(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[ModelType], int]:
        """Get multiple records with pagination and total count."""
        # Items
        items_result = await db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        items = list(items_result.scalars().all())
        # Total count
        count_result = await db.execute(select(func.count()).select_from(self.model))
        total = int(count_result.scalar() or 0)
        return items, total

    async def create(
        self,
        db: AsyncSession,
        *,
        obj_in: CreateSchemaType,
    ) -> ModelType:
        """Create a new record."""
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        
        # Invalidate list caches since a new record was created
        await self._invalidate_cache()
        
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: UpdateSchemaType | Dict[str, Any],
    ) -> ModelType:
        """Update a record."""
        obj_data = db_obj.__dict__
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        await db.commit()
        
        # Invalidate cache for this specific record and lists
        await self._invalidate_cache(db_obj.id)
        
        return db_obj

    async def remove(
        self,
        db: AsyncSession,
        *,
        id: int,
    ) -> ModelType:
        """Delete a record."""
        obj = await db.get(self.model, id)
        await db.delete(obj)
        await db.commit()
        
        # Invalidate cache for this record
        await self._invalidate_cache(id)
        
        return obj
    
    async def _invalidate_cache(self, id: Optional[Any] = None) -> None:
        """Invalidate cache entries for this model.
        
        Args:
            id: Specific record ID to invalidate, or None for all
        """
        try:
            from app.core.cache import get_cache
            cache = await get_cache()
            
            if id is not None:
                # Invalidate specific record cache
                await cache.delete(f"crud_get:{self.model_name}:{id}")
            
            # Invalidate list caches (pattern-based deletion)
            await cache.clear_prefix(f"crud_list:{self.model_name}")
            await cache.clear_prefix(f"crud_count:{self.model_name}")
            
            logger.info(
                "cache_invalidated",
                model=self.model_name,
                record_id=id,
                scope="specific" if id else "all"
            )
            
        except Exception as e:
            # Cache invalidation failures shouldn't break the application
            logger.warning(
                "cache_invalidation_failed",
                model=self.model_name,
                record_id=id,
                error=str(e)
            )
    
    @cached(ttl=timedelta(minutes=5), prefix="crud_list")
    async def get_multi_cached(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[ModelType]:
        """Get multiple records with caching for common queries.
        
        Caches list results for 5 minutes. Use for frequently accessed
        lists that don't change often.
        """
        query = select(self.model)
        
        # Apply basic filters if provided
        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field) and value is not None:
                    query = query.where(getattr(self.model, field) == value)
        
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @cached(ttl=timedelta(minutes=10), prefix="crud_count")
    async def count_cached(
        self,
        db: AsyncSession,
        filters: Optional[Dict[str, Any]] = None,
    ) -> int:
        """Get total count with caching.
        
        Caches count queries for 10 minutes since they're expensive
        but don't need to be real-time accurate.
        """
        query = select(func.count()).select_from(self.model)
        
        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field) and value is not None:
                    query = query.where(getattr(self.model, field) == value)
        
        result = await db.execute(query)
        return int(result.scalar() or 0) 