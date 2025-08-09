"""User CRUD operations."""
from datetime import datetime
from typing import Any, Dict, Optional, Union

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
import logging

logger = logging.getLogger(__name__)

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
        create_data = obj_in.model_dump()
        db_obj = User(
            email=create_data["email"],
            hashed_password=get_password_hash(create_data["password"]),
            full_name=create_data["full_name"],
            is_superuser=create_data.get("is_superuser", False),
        )
        db.add(db_obj)
        await db.flush()
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
        logger.debug(f"Attempting to authenticate user: {email}")
        user = await self.get_by_email(db, email=email)
        if not user:
            logger.warning(f"Authentication failed: User {email} not found.")
            return None
        
        logger.debug(f"User found: {user.email}, ID: {user.id}. Verifying password...")
        logger.debug(f"Stored hash: {user.hashed_password}")
        
        # Log the first few chars of the provided password for debugging (AVOID logging full password)
        provided_password_snippet = password[:3] + "..."
        logger.debug(f"Provided password snippet: {provided_password_snippet}")

        if not verify_password(password, user.hashed_password):
            logger.warning(f"Authentication failed: Incorrect password for user {email}.")
            return None
            
        if not user.is_active:
            logger.warning(f"Authentication failed: User {email} is inactive.")
            return None
            
        logger.info(f"User {email} authenticated successfully.")
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

    async def verify_email(self, db: AsyncSession, *, user_id: int) -> Optional[User]:
        """
        Mark user's email as verified.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Updated user if found, None otherwise
        """
        user = await self.get(db, id=user_id)
        if not user:
            return None
        
        # Mark as verified with timestamp
        user.is_verified = True
        user.email_verified_at = datetime.utcnow()
        
        await db.flush()
        await db.refresh(user)
        return user

    def is_verified(self, user: User) -> bool:
        """
        Check if user's email is verified.
        
        Args:
            user: User object
            
        Returns:
            True if user is verified, False otherwise
        """
        return user.is_verified


user = CRUDUser() 