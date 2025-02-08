"""User CRUD operations."""
from typing import Any, Dict, Optional, Union

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    """User CRUD operations."""

    def __init__(self):
        """Initialize with User model."""
        super().__init__(User)

    async def get_by_email(
        self, db: AsyncSession, *, email: str
    ) -> Optional[User]:
        """
        Get user by email.
        
        Args:
            db: Database session
            email: User email
            
        Returns:
            User if found, None otherwise
        """
        result = await db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def create(
        self, db: AsyncSession, *, obj_in: UserCreate
    ) -> User:
        """
        Create new user.
        
        Args:
            db: Database session
            obj_in: User data
            
        Returns:
            Created user
        """
        db_obj = User(
            email=obj_in.email,
            hashed_password=get_password_hash(obj_in.password),
            full_name=obj_in.full_name,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: User,
        obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        """
        Update user.
        
        Args:
            db: Database session
            db_obj: Existing user
            obj_in: Update data
            
        Returns:
            Updated user
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        if update_data.get("password"):
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        return await super().update(db, db_obj=db_obj, obj_in=update_data)

    async def authenticate(
        self, db: AsyncSession, *, email: str, password: str
    ) -> Optional[User]:
        """
        Authenticate user.
        
        Args:
            db: Database session
            email: User email
            password: User password
            
        Returns:
            User if authenticated, None otherwise
        """
        user = await self.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def is_active(self, user: User) -> bool:
        """
        Check if user is active.
        
        Args:
            user: User object
            
        Returns:
            True if user is active, False otherwise
        """
        return user.is_active

    def is_superuser(self, user: User) -> bool:
        """
        Check if user is superuser.
        
        Args:
            user: User object
            
        Returns:
            True if user is superuser, False otherwise
        """
        return user.is_superuser


user = CRUDUser() 