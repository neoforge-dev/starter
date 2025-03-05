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
from app.models.admin import Admin, AdminRole
from app.schemas.user import UserCreate

# Configure faker globally
factory.Faker._DEFAULT_LOCALE = 'en_US'

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

class UserFactory(AsyncModelFactory):
    """Factory for creating User instances."""

    class Meta:
        model = User

    email = Faker("email", locale="en_US")
    full_name = Faker("name", locale="en_US")
    password = "testpass123"
    is_active = True
    is_superuser = False
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))

    @classmethod
    async def _create(cls, model_class: type[SQLModel], session: AsyncSession, *args: Any, **kwargs: Any) -> Coroutine[Any, Any, SQLModel]:
        """Create a User instance with password hashing."""
        from app.core.auth import get_password_hash  # Import here to avoid circular import
        
        # Ensure email and full_name are set
        if "email" not in kwargs:
            kwargs["email"] = cls.email.evaluate(None, None, {"locale": "en_US"})
        if "full_name" not in kwargs:
            kwargs["full_name"] = cls.full_name.evaluate(None, None, {"locale": "en_US"})

        # Handle password hashing
        if "password" in kwargs:
            kwargs['hashed_password'] = get_password_hash(kwargs.pop("password"))
        elif not kwargs.get("hashed_password"):
            kwargs["hashed_password"] = get_password_hash(cls.password)

        # Ensure is_active is set
        if "is_active" not in kwargs:
            kwargs["is_active"] = cls.is_active

        return await super()._create(model_class, session, *args, **kwargs)

    @classmethod
    async def create_batch(cls, session: AsyncSession, size: int = 1, **kwargs: Any) -> list[SQLModel]:
        """Create multiple User instances."""
        return [await cls.create(session=session, **kwargs) for _ in range(size)]

class UserCreateFactory(ModelFactory):
    """
    Factory for creating UserCreate schema instances.
    
    Useful for testing registration and user creation endpoints.
    """
    
    class Meta:
        model = UserCreate
        
    email = factory.Sequence(lambda n: f"newuser{n}@example.com")
    full_name = Faker("name", locale="en_US")
    password = factory.Faker("password", length=12, special_chars=True, digits=True, locale="en_US")
    password_confirm = factory.SelfAttribute("password")

class AdminFactory(ModelFactory):
    """Factory for creating Admin model instances."""
    
    class Meta:
        model = Admin
        
    email = Faker("email", locale="en_US")
    full_name = Faker("name", locale="en_US")
    password = "testpass123"
    is_active = True
    role = AdminRole.USER_ADMIN
    last_login = None
    
    @classmethod
    async def _create(cls, model_class: Type[Admin], session: AsyncSession, **kwargs) -> Admin:
        """Create an Admin instance with an associated User."""
        # Extract user fields with defaults
        user_fields = {
            "email": kwargs.pop("email", cls.email.evaluate(None, None, {"locale": "en_US"})),
            "full_name": kwargs.pop("full_name", cls.full_name.evaluate(None, None, {"locale": "en_US"})),
            "password": kwargs.pop("password", cls.password),
            "is_active": kwargs.pop("is_active", cls.is_active),
            "is_superuser": True  # Always set superuser for admin users
        }
        
        # Create user first
        user = await UserFactory.create(session=session, **user_fields)
        
        # Create admin with user_id
        kwargs["user_id"] = user.id
        kwargs.setdefault("role", cls.role)
        kwargs.setdefault("is_active", user.is_active)
        kwargs.setdefault("last_login", cls.last_login)
        
        admin = model_class(**kwargs)
        session.add(admin)
        await session.commit()
        await session.refresh(admin, ["user"])
        
        return admin

class ItemFactory(AsyncModelFactory):
    """Factory for creating Item instances."""

    class Meta:
        model = Item

    title = Faker("sentence", nb_words=4, locale="en_US")
    description = Faker("paragraph", locale="en_US")
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))

    @classmethod
    async def _create(cls, model_class: type[SQLModel], session: AsyncSession, *args: Any, **kwargs: Any) -> Coroutine[Any, Any, SQLModel]:
        """Create an Item instance with an owner."""
        # Ensure title and description are set
        if "title" not in kwargs:
            kwargs["title"] = cls.title.evaluate(None, None, {"locale": "en_US"})
        if "description" not in kwargs:
            kwargs["description"] = cls.description.evaluate(None, None, {"locale": "en_US"})

        # Handle owner
        if "owner_id" not in kwargs and "owner" not in kwargs:
            # Create a default owner if none provided
            owner = await UserFactory.create(session=session)
            kwargs["owner_id"] = owner.id
        elif "owner" in kwargs:
            kwargs["owner_id"] = kwargs.pop("owner").id

        return await super()._create(model_class, session, *args, **kwargs) 