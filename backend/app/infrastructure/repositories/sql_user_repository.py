"""SQL implementation of UserRepository using existing CRUD operations."""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.user import user as crud_user
from app.domain.entities.user import User as DomainUser
from app.domain.repositories.user_repository import UserRepository
from app.domain.value_objects.email import Email


class SQLUserRepository(UserRepository):
    """SQL implementation of UserRepository."""

    def __init__(self, session: AsyncSession):
        """Initialize with database session."""
        self.session = session

    async def get_by_email(self, email: Email) -> Optional[DomainUser]:
        """Get user by email address."""
        user_model = await crud_user.get_by_email(self.session, email=email.value)
        if not user_model:
            return None

        return DomainUser(
            id=user_model.id,
            email=Email(user_model.email),
            hashed_password=user_model.hashed_password,
            full_name=user_model.full_name,
            is_active=user_model.is_active,
            is_superuser=user_model.is_superuser,
            is_verified=getattr(user_model, 'is_verified', False),
            created_at=user_model.created_at,
            updated_at=user_model.updated_at,
        )

    async def get_by_id(self, user_id: int) -> Optional[DomainUser]:
        """Get user by ID."""
        user_model = await crud_user.get(self.session, id=user_id)
        if not user_model:
            return None

        return DomainUser(
            id=user_model.id,
            email=Email(user_model.email),
            hashed_password=user_model.hashed_password,
            full_name=user_model.full_name,
            is_active=user_model.is_active,
            is_superuser=user_model.is_superuser,
            is_verified=getattr(user_model, 'is_verified', False),
            created_at=user_model.created_at,
            updated_at=user_model.updated_at,
        )

    async def save(self, user: DomainUser) -> DomainUser:
        """Save user to database."""
        # Convert domain user to schema for CRUD operations
        from app.schemas.user import UserCreate, UserUpdate

        if user.id is None:
            # Create new user - this should be handled by use case with proper password
            raise ValueError("Cannot create user without password. Use CreateUserUseCase instead.")
        else:
            # Update existing user
            user_data = UserUpdate(
                email=user.email.value,
                full_name=user.full_name,
                is_active=user.is_active,
                is_superuser=user.is_superuser,
            )
            existing_user = await crud_user.get(self.session, id=user.id)
            if not existing_user:
                raise ValueError(f"User with id {user.id} not found")

            user_model = await crud_user.update(
                self.session, db_obj=existing_user, obj_in=user_data
            )

        # Return updated domain user
        return DomainUser(
            id=user_model.id,
            email=Email(user_model.email),
            hashed_password=user_model.hashed_password,
            full_name=user_model.full_name,
            is_active=user_model.is_active,
            is_superuser=user_model.is_superuser,
            is_verified=getattr(user_model, 'is_verified', False),
            created_at=user_model.created_at,
            updated_at=user_model.updated_at,
        )

    async def exists_by_email(self, email: Email) -> bool:
        """Check if user exists by email."""
        user = await self.get_by_email(email)
        return user is not None

    async def delete(self, user_id: int) -> None:
        """Delete user by ID."""
        await crud_user.remove(self.session, id=user_id)