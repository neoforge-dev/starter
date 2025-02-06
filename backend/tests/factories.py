"""Test factories for generating test data."""
from datetime import datetime
from typing import Any, Dict, Optional

import factory
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.item import Item
from app.core.security import get_password_hash


class UserFactory(factory.Factory):
    """Factory for creating test users."""
    
    class Meta:
        model = User
        
    email = factory.Faker("email")
    full_name = factory.Faker("name")
    hashed_password = factory.LazyFunction(lambda: get_password_hash("testpassword"))
    is_active = True
    is_superuser = False
    
    @classmethod
    async def _create(cls, model_class: User, *args: Any, **kwargs: Dict[str, Any]) -> User:
        """Override _create to handle async session."""
        session: AsyncSession = kwargs.pop("session", None)
        if not session:
            raise ValueError("Session is required")
        
        obj = model_class(*args, **kwargs)
        session.add(obj)
        await session.commit()
        await session.refresh(obj)
        return obj


class ItemFactory(factory.Factory):
    """Factory for creating test items."""
    
    class Meta:
        model = Item
        
    title = factory.Faker("sentence", nb_words=4)
    description = factory.Faker("paragraph")
    owner_id = None  # This will be set in _create if not provided
    
    @classmethod
    async def create_with_owner(
        cls,
        session: AsyncSession,
        owner: Optional[User] = None,
        **kwargs: Any,
    ) -> Item:
        """Create item with owner."""
        if owner is None:
            owner = await UserFactory(session=session)
        
        return await cls(
            session=session,
            owner_id=owner.id,
            **kwargs,
        )
    
    @classmethod
    async def _create(cls, model_class: Item, *args: Any, **kwargs: Dict[str, Any]) -> Item:
        """Override _create to handle async session."""
        session: AsyncSession = kwargs.pop("session", None)
        if not session:
            raise ValueError("Session is required")
        
        # Handle owner relationship
        owner = kwargs.pop("owner", None)
        if owner and not kwargs.get("owner_id"):
            if not getattr(owner, "id", None):
                await session.refresh(owner)
            kwargs["owner_id"] = owner.id
        elif not owner and not kwargs.get("owner_id"):
            owner = await UserFactory(session=session)
            kwargs["owner_id"] = owner.id
        
        obj = model_class(*args, **kwargs)
        session.add(obj)
        await session.commit()
        await session.refresh(obj)
        return obj 