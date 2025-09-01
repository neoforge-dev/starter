from datetime import datetime, timezone
from typing import Any, Coroutine

import factory
from app.models.admin import Admin, AdminRole
from app.models.item import Item
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel

from app.core.security import get_password_hash


class AsyncModelFactory(factory.Factory):
    """Base factory for async SQLModel instances."""

    class Meta:
        abstract = True

    @classmethod
    async def _create(
        cls,
        model_class: type[SQLModel],
        session: AsyncSession,
        *args: Any,
        **kwargs: Any,
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


class UserFactory(AsyncModelFactory):
    """Factory for creating User instances."""

    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    full_name = factory.Faker("name")
    password = factory.LazyFunction(lambda: "password123")
    hashed_password = factory.LazyAttribute(lambda obj: get_password_hash(obj.password))
    is_active = True
    is_superuser = False
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))

    @classmethod
    async def _create(
        cls,
        model_class: type[SQLModel],
        session: AsyncSession,
        *args: Any,
        **kwargs: Any,
    ) -> Coroutine[Any, Any, SQLModel]:
        """Create a User instance with hashed password."""
        # If password is provided, hash it
        if "password" in kwargs:
            password = kwargs.pop("password")
            kwargs["hashed_password"] = get_password_hash(password)

        return await super()._create(model_class, session, *args, **kwargs)

    @classmethod
    async def create_batch(
        cls, session: AsyncSession, size: int = 3, **kwargs
    ) -> list[User]:
        """Create multiple User instances."""
        users = []
        for _ in range(size):
            user = await cls.create(session=session, **kwargs)
            users.append(user)
        return users


class AdminFactory(AsyncModelFactory):
    """Factory for creating Admin instances."""

    class Meta:
        model = Admin

    role = AdminRole.ADMIN
    is_active = True
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))

    # User fields for creating the associated user
    email = factory.Sequence(lambda n: f"admin{n}@example.com")
    full_name = factory.Faker("name")
    password = factory.LazyFunction(lambda: "admin123")

    @classmethod
    async def _create(
        cls,
        model_class: type[SQLModel],
        session: AsyncSession,
        *args: Any,
        **kwargs: Any,
    ) -> Coroutine[Any, Any, SQLModel]:
        """Create both User and Admin records."""
        # Extract user-specific fields
        user_fields = {
            "email": kwargs.pop("email", cls.email.func(None)),
            "full_name": kwargs.pop("full_name", cls.full_name.generate()),
            "password": kwargs.pop("password", "admin123"),
            "is_active": kwargs.get("is_active", cls.is_active),
            "is_superuser": True,
        }

        # Create user first
        user = await UserFactory.create(session=session, **user_fields)

        # Create admin with reference to user
        kwargs["user_id"] = user.id
        admin = await super()._create(model_class, session, *args, **kwargs)
        admin.user = user
        return admin


class ItemFactory(AsyncModelFactory):
    """Factory for creating Item instances."""

    class Meta:
        model = Item

    title = factory.Faker("sentence", nb_words=4)
    description = factory.Faker("paragraph")
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))

    @classmethod
    async def _create(
        cls,
        model_class: type[SQLModel],
        session: AsyncSession,
        *args: Any,
        **kwargs: Any,
    ) -> Coroutine[Any, Any, SQLModel]:
        """Create an Item instance with owner."""
        if "owner_id" not in kwargs and "owner" not in kwargs:
            # Create a default owner if none provided
            owner = await UserFactory.create(session=session)
            kwargs["owner_id"] = owner.id

        return await super()._create(model_class, session, *args, **kwargs)
