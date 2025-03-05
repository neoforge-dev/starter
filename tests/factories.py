from factory import AsyncSQLModelFactory, factory
from factory.faker import Faker
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime, timezone
from typing import Any, Coroutine
from app.models.user import User
from app.models.admin import Admin, AdminRole
from app.core.security import get_password_hash

class UserFactory(AsyncSQLModelFactory):
    """Factory for creating User instances."""

    class Meta:
        model = User

    email = factory.Faker('email', locale='en_US')
    full_name = factory.Faker('name', locale='en_US')
    password = 'testpass123'
    hashed_password = factory.LazyAttribute(lambda o: get_password_hash(o.password))
    is_active = True
    is_superuser = False
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))

    @classmethod
    async def _create(cls, model_class: type[SQLModel], session: AsyncSession, *args: Any, **kwargs: Any) -> Coroutine[Any, Any, SQLModel]:
        """
        Handle password hashing during user creation.
        """
        if 'password' in kwargs and 'hashed_password' not in kwargs:
            kwargs['hashed_password'] = get_password_hash(kwargs['password'])
        return await super()._create(model_class, session, *args, **kwargs)

    @classmethod
    async def create_batch(cls, session: AsyncSession, size: int = 1, **kwargs: Any) -> list[SQLModel]:
        """Create multiple instances."""
        return [await cls.create(session=session, **kwargs) for _ in range(size)]

class AdminFactory(AsyncSQLModelFactory):
    """Factory for creating Admin instances."""

    class Meta:
        model = Admin

    email = factory.Faker('email', locale='en_US')
    full_name = factory.Faker('name', locale='en_US')
    password = 'admin123'
    role = AdminRole.USER_ADMIN
    is_active = True
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))

    @classmethod
    async def _create(cls, model_class: type[SQLModel], session: AsyncSession, *args: Any, **kwargs: Any) -> Coroutine[Any, Any, SQLModel]:
        """
        Create both User and Admin records.
        """
        # Extract user fields
        user_fields = {
            'email': kwargs.get('email', cls.email.evaluate(None, None, {'locale': 'en_US'})),
            'full_name': kwargs.get('full_name', cls.full_name.evaluate(None, None, {'locale': 'en_US'})),
            'password': kwargs.get('password', cls.password),
            'is_active': kwargs.get('is_active', cls.is_active),
        }

        # Create user first
        user = await UserFactory.create(session=session, **user_fields)
        kwargs['user_id'] = user.id

        return await super()._create(model_class, session, *args, **kwargs)

class ItemFactory(AsyncSQLModelFactory):
    """Factory for creating Item instances."""

    class Meta:
        model = Item

    title = factory.Faker('sentence', nb_words=4)
    description = factory.Faker('paragraph')
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))

    @classmethod
    async def _create(cls, model_class: type[SQLModel], session: AsyncSession, *args: Any, **kwargs: Any) -> Coroutine[Any, Any, SQLModel]:
        """Create an Item instance with owner."""
        # Create owner if not provided
        if 'owner_id' not in kwargs and 'owner' not in kwargs:
            user = await UserFactory.create(session=session)
            kwargs['owner_id'] = user.id

        return await super()._create(model_class, session, *args, **kwargs)
 