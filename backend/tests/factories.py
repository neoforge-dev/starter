"""Model factories for testing."""
import factory
from factory.declarations import LazyFunction
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models.user import User


class UserFactory(factory.Factory):
    """User model factory."""

    class Meta:
        model = User

    email = factory.Faker("email")
    full_name = factory.Faker("name")
    hashed_password = LazyFunction(lambda: get_password_hash("testpassword"))
    is_active = True
    is_superuser = False

    @classmethod
    async def _create(cls, model_class, *args, **kwargs) -> User:
        """Override _create to handle async session."""
        session: AsyncSession = kwargs.pop("session", None)
        if not session:
            raise ValueError("Session is required")
        
        obj = model_class(*args, **kwargs)
        session.add(obj)
        await session.commit()
        await session.refresh(obj)
        return obj 