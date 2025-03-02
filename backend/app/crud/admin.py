"""Admin CRUD operations."""
from typing import Any, Dict, Optional, Union, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.crud.base import CRUDBase
from app.models.admin import Admin
from app.schemas.admin import AdminCreate, AdminUpdate


class CRUDAdmin(CRUDBase[Admin, AdminCreate, AdminUpdate]):
    """Admin CRUD operations."""

    def __init__(self):
        """Initialize with Admin model."""
        super().__init__(Admin)

    async def get_by_user_id(
        self, db: AsyncSession, *, user_id: int
    ) -> Optional[Admin]:
        """
        Get admin by user ID.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Admin if found, None otherwise
        """
        result = await db.execute(
            select(Admin).where(Admin.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_multi_with_users(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Admin]:
        """
        Get multiple admins with their associated users.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of admins with their users
        """
        result = await db.execute(
            select(Admin)
            .options(joinedload(Admin.user))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create(
        self,
        db: AsyncSession,
        *,
        obj_in: AdminCreate,
        actor_id: int,
        user_id: int,
    ) -> Admin:
        """
        Create new admin.
        
        Args:
            db: Database session
            obj_in: Admin data
            actor_id: ID of the user creating the admin
            user_id: ID of the user to associate with this admin
            
        Returns:
            Created admin
        """
        db_obj = Admin(
            user_id=user_id,
            role=obj_in.role,
            is_active=obj_in.is_active,
            created_by=actor_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: Admin,
        obj_in: Union[AdminUpdate, Dict[str, Any]],
        actor_id: int,
    ) -> Admin:
        """
        Update admin.
        
        Args:
            db: Database session
            db_obj: Existing admin
            obj_in: Update data
            actor_id: ID of the user updating the admin
            
        Returns:
            Updated admin
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        update_data["updated_by"] = actor_id
        return await super().update(db, db_obj=db_obj, obj_in=update_data)


admin = CRUDAdmin() 