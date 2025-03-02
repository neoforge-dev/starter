"""
Test data factories for generating model instances.

Uses FactoryBoy with SQLModel integration for type-safe test data creation.
"""

import factory
from factory import fuzzy
from factory.faker import Faker
from datetime import datetime, timezone
from typing import Any, Type, Coroutine
from uuid import uuid4

from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.item import Item
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

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

class UserFactory(factory.Factory):
    """Factory for creating User objects for testing."""
    
    class Meta:
        model = User
    
    email = Faker('email')
    full_name = Faker('name')
    hashed_password = factory.LazyFunction(lambda: get_password_hash("password123"))
    is_active = True
    is_superuser = False
    
    @classmethod
    async def create(cls, session: AsyncSession, **kwargs):
        """Create a user and add it to the database.
        
        Args:
            session: SQLAlchemy async session
            **kwargs: Attributes to override defaults
            
        Returns:
            User: Created user object
        """
        # Create user with factory
        user = cls(**kwargs)
        
        # If password is provided, hash it
        if "password" in kwargs:
            user.hashed_password = get_password_hash(kwargs["password"])
            
        # Add to database
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        return user
    
    @classmethod
    async def create_batch(cls, session: AsyncSession, size: int, **kwargs):
        """Create multiple users and add them to the database.
        
        Args:
            session: SQLAlchemy async session
            size: Number of users to create
            **kwargs: Attributes to override defaults
            
        Returns:
            list[User]: List of created user objects
        """
        users = []
        for _ in range(size):
            user = await cls.create(session=session, **kwargs)
            users.append(user)
        return users

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