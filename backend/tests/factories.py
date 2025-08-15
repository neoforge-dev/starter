"""
Test data factories for generating model instances.

Uses FactoryBoy with SQLModel integration for type-safe test data creation.
"""

import factory
from factory import fuzzy
from factory.faker import Faker
from datetime import datetime, timezone
from typing import Any, Type, Coroutine, Generic, List, Optional, Sequence, TypeVar
from uuid import uuid4
import asyncio

from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError

from app.models.item import Item
from app.models.user import User
from app.models.admin import Admin, AdminRole
from app.models.project import Project
from app.models.support_ticket import SupportTicket
from app.models.community_post import CommunityPost
from app.models.event import Event
from app.schemas.user import UserCreate
from app.schemas.event import EventType, EventSource

# Configure faker globally
factory.Faker._DEFAULT_LOCALE = 'en_US'

# Import the context variable from the new file
from tests.session_context import current_test_session

T = TypeVar("T", bound=SQLModel)

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
        await session.flush()
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


class ProjectFactory(ModelFactory):
    """Factory for creating Project instances."""

    class Meta:
        model = Project

    name = Faker("company", locale="en_US")
    description = Faker("paragraph", locale="en_US")
    owner_id = fuzzy.FuzzyInteger(1, 100)
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))


class SupportTicketFactory(ModelFactory):
    """Factory for creating SupportTicket instances."""

    class Meta:
        model = SupportTicket

    email = Faker("email", locale="en_US")
    subject = Faker("sentence", nb_words=6, locale="en_US")
    message = Faker("paragraph", locale="en_US")
    status = fuzzy.FuzzyChoice(["open", "closed", "pending", "resolved"])
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))


class CommunityPostFactory(ModelFactory):
    """Factory for creating CommunityPost instances."""

    class Meta:
        model = CommunityPost

    title = Faker("sentence", nb_words=8, locale="en_US")
    content = Faker("text", max_nb_chars=500, locale="en_US")
    author = Faker("name", locale="en_US")
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))


class EventFactory(AsyncModelFactory):
    """Factory for creating Event instances for testing analytics."""

    class Meta:
        model = Event

    event_id = factory.LazyFunction(lambda: str(uuid4()))
    event_type = fuzzy.FuzzyChoice([e.value for e in EventType])
    event_name = fuzzy.FuzzyChoice([
        "page_view", "button_click", "form_submit", "api_response_time",
        "conversion", "error_occurred", "user_login", "user_logout"
    ])
    source = fuzzy.FuzzyChoice([e.value for e in EventSource])
    
    # Optional fields
    page_url = factory.Maybe(
        'event_type',
        yes_declaration=Faker("url", locale="en_US"),
        no_declaration=None
    )
    user_agent = factory.Maybe(
        'source',
        yes_declaration="Mozilla/5.0 (compatible; TestBot/1.0)",
        no_declaration=None
    )
    ip_address = factory.Maybe(
        'user_id',
        yes_declaration=Faker("ipv4", locale="en_US"),
        no_declaration=None
    )
    session_id = factory.Maybe(
        'user_id',
        yes_declaration=factory.LazyFunction(lambda: str(uuid4())[:32]),
        no_declaration=None
    )
    
    # Event data
    properties = factory.LazyFunction(lambda: {
        "test_property": "test_value",
        "element_id": "test_button",
        "timestamp": datetime.utcnow().isoformat()
    })
    value = fuzzy.FuzzyFloat(0.0, 1000.0)
    
    # Timing
    timestamp = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    
    # Privacy and retention
    anonymized = False
    retention_date = factory.LazyFunction(
        lambda: datetime.now(timezone.utc).replace(hour=0, minute=0, second=0) + 
        factory.Faker("timedelta", days=365).evaluate(None, None, {})
    )
    
    # Timestamps
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))

    @classmethod
    async def create_interaction_event(cls, session: AsyncSession, **kwargs):
        """Create a specific interaction event."""
        defaults = {
            "event_type": EventType.INTERACTION.value,
            "event_name": "button_click",
            "source": EventSource.WEB.value,
            "properties": {
                "element_id": "submit_button",
                "element_text": "Submit",
                "page_section": "form"
            }
        }
        defaults.update(kwargs)
        return await cls.create(session=session, **defaults)

    @classmethod
    async def create_performance_event(cls, session: AsyncSession, **kwargs):
        """Create a specific performance event."""
        defaults = {
            "event_type": EventType.PERFORMANCE.value,
            "event_name": "api_response_time",
            "source": EventSource.API.value,
            "value": 150.0,
            "properties": {
                "endpoint": "/api/v1/users",
                "method": "GET",
                "status_code": 200
            }
        }
        defaults.update(kwargs)
        return await cls.create(session=session, **defaults)

    @classmethod
    async def create_business_event(cls, session: AsyncSession, **kwargs):
        """Create a specific business event."""
        defaults = {
            "event_type": EventType.BUSINESS.value,
            "event_name": "conversion",
            "source": EventSource.WEB.value,
            "value": 99.99,
            "properties": {
                "conversion_type": "purchase",
                "product_id": "prod_123",
                "revenue": 99.99
            }
        }
        defaults.update(kwargs)
        return await cls.create(session=session, **defaults)

    @classmethod
    async def create_error_event(cls, session: AsyncSession, **kwargs):
        """Create a specific error event."""
        defaults = {
            "event_type": EventType.ERROR.value,
            "event_name": "api_error",
            "source": EventSource.API.value,
            "properties": {
                "error_type": "validation_error",
                "error_message": "Invalid input data",
                "status_code": 422,
                "severity": "warning"
            }
        }
        defaults.update(kwargs)
        return await cls.create(session=session, **defaults) 