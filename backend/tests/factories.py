"""
Test data factories for generating model instances.

Uses FactoryBoy with SQLModel integration for type-safe test data creation.
"""

from app.models.item import Item
import factory
from factory import fuzzy
from datetime import datetime, timezone
from app.models.user import User
from app.schemas.user import UserCreate
from sqlmodel import SQLModel
from typing import Any, Type, Coroutine
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
from app.core.auth import get_password_hash

class AsyncModelFactory(factory.Factory):
    """
    Base factory for async SQLModel instances with session support.
    
    Features:
    - Async session management
    - Automatic transaction handling
    - Type-safe async creation
    """
    
    @classmethod
    async def _create(
        cls,
        model_class: type[SQLModel],
        session: AsyncSession,
        *args: Any,
        **kwargs: Any
    ) -> Coroutine[Any, Any, SQLModel]:
        """
        Async creation handler for SQLModel instances.
        
        Args:
            model_class: SQLModel class to instantiate
            session: Async SQLAlchemy session
            *args: Positional arguments
            **kwargs: Keyword arguments
            
        Returns:
            Persisted SQLModel instance
        """
        obj = model_class(**kwargs)
        try:
            session.add(obj)
            await session.flush()
            return obj
        except Exception as e:
            await session.rollback()
            raise factory.FactoryError("Couldn't create instance") from e

    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        **kwargs: Any
    ) -> SQLModel:
        """Public async create method."""
        return await cls._create(model_class=cls._meta.model, session=session, **kwargs)

class ModelFactory(factory.Factory):
    """
    Base factory for all SQLModel models.
    
    Provides common functionality for all model factories.
    """
    
    @classmethod
    def _create(
        cls, 
        model_class: Type[SQLModel],
        *args: Any,
        **kwargs: Any
    ) -> SQLModel:
        """
        Custom creation handler to work with SQLModel instances.
        
        Args:
            model_class: SQLModel class to instantiate
            *args: Positional arguments
            **kwargs: Keyword arguments
            
        Returns:
            Instance of the SQLModel class
        """
        return model_class(**kwargs)

class UserFactory:
    """Factory for creating User test instances."""
    
    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        *,
        email: str | None = None,
        full_name: str | None = None,
        password: str | None = None,
        is_superuser: bool = False,
        is_active: bool = True,
        **kwargs
    ) -> User:
        """Create and persist a User with required fields."""
        email = email or f"user-{uuid4().hex}@example.com"
        full_name = full_name or "Test User"
        password = password or "securepassword123"
        
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            is_superuser=is_superuser,
            is_active=is_active,
            **kwargs
        )
        session.add(user)
        await session.commit()  # Ensure the user is committed to the database
        await session.refresh(user)  # Refresh to get the latest state
        return user

class UserCreateFactory(ModelFactory):
    """
    Factory for creating UserCreate schema instances.
    
    Useful for testing registration and user creation endpoints.
    """
    
    class Meta:
        model = UserCreate
        
    email = factory.Sequence(lambda n: f"newuser{n}@neoforge.test")
    full_name = factory.Faker("name")
    password = factory.Faker("password", length=12, special_chars=True, digits=True)
    password_confirm = factory.SelfAttribute("password")

class ItemFactory:
    """Factory for creating Item instances."""

    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        user: User | None = None,
        owner: User | None = None,
        **kwargs: Any
    ) -> Item:
        """Create an Item instance."""
        if user:
            kwargs["owner_id"] = user.id
        if owner:
            kwargs["owner_id"] = owner.id
        
        if "title" not in kwargs:
            kwargs["title"] = fuzzy.FuzzyText(length=10).fuzz()
        if "description" not in kwargs:
            kwargs["description"] = fuzzy.FuzzyText(length=30).fuzz()
        
        item = Item(**kwargs)
        session.add(item)
        await session.commit()  # Ensure the item is committed
        await session.refresh(item)  # Refresh to get the latest state
        return item 