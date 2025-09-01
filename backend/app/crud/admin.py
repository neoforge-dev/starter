"""Admin CRUD operations."""
from typing import Any, Dict, List, Optional, Union

from app.crud.base import CRUDBase
from app.models.admin import Admin
from app.schemas.admin import AdminCreate, AdminUpdate
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload


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
        result = await db.execute(select(Admin).where(Admin.user_id == user_id))
        return result.scalar_one_or_none()

    async def get_multi_with_users(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> List[tuple[Admin, "User"]]:
        """
        Get multiple admins with their associated users.

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of tuples containing (admin, user) pairs
        """
        from app.models.user import User

        result = await db.execute(
            select(Admin, User)
            .join(User, Admin.user_id == User.id)
            .offset(skip)
            .limit(limit)
        )
        return list(result.all())

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

    async def remove(
        self,
        db: AsyncSession,
        *,
        id: int,
        actor_id: int,
    ) -> Admin:
        """
        Remove admin by ID.

        Args:
            db: Database session
            id: Admin ID
            actor_id: ID of the admin performing the action

        Returns:
            Removed admin
        """
        # Get admin
        admin = await self.get(db, id=id)
        if not admin:
            raise ValueError(f"Admin with ID {id} not found")

        # Delete admin
        await db.delete(admin)
        await db.commit()

        return admin


admin = CRUDAdmin()
