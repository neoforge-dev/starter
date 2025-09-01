"""User utilities for testing."""
import uuid
from datetime import timedelta

from app.crud.user import user
from app.models.user import User
from app.schemas.user import UserCreate
from fastapi import Depends
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.security import create_access_token


def random_lower_string(length: int = 10) -> str:
    """Generate a random lowercase string."""
    import random
    import string

    return "".join(random.choice(string.ascii_lowercase) for _ in range(length))


def random_email() -> str:
    """Generate a random email."""
    return f"{random_lower_string()}@{random_lower_string()}.com"


async def create_random_user(db: AsyncSession = None, superuser: bool = False) -> User:
    """
    Create a random user for testing.

    Args:
        db: Database session
        superuser: Whether to create a superuser

    Returns:
        Created user
    """
    from tests.factories import UserFactory

    if db is None:
        # Handle case where db might be passed as None in some tests
        # This is just a placeholder - in real usage, db would be required
        return User(
            id=999,
            email=f"test_{uuid.uuid4()}@example.com",
            hashed_password="test_hashed_password",
            is_superuser=superuser,
            is_active=True,
            password="testpassword",  # Mock for tests
        )

    # Use the UserFactory to create the user properly
    user = await UserFactory.create(session=db, is_superuser=superuser, is_active=True)
    await db.flush()
    await db.refresh(user)

    # Add password attribute for test compatibility
    user.password = "testpassword"  # For test fixtures that need plaintext password

    return user


async def authentication_token_from_email(
    client: AsyncClient,
    email: str,
    password: str,
    db_session: AsyncSession = None,
    settings: Settings = Depends(get_settings),
) -> dict[str, str]:
    """
    Get authentication token from email.

    Args:
        client: AsyncClient for making requests
        email: User email
        password: User password
        db_session: Database session
        settings: Application settings

    Returns:
        Dict with authorization header
    """
    # For tests, we can directly create a token without making API calls
    if db_session:
        db_user = await user.get_by_email(db_session, email=email)
        if db_user:
            token = create_access_token(
                subject=str(db_user.id),
                settings=settings,
                expires_delta=timedelta(minutes=60),
            )
            return {"Authorization": f"Bearer {token}"}

    # Fall back to a mock token if needed
    token = create_access_token(
        subject="999",  # Mock user ID
        settings=settings,
        expires_delta=timedelta(minutes=60),
    )
    return {"Authorization": f"Bearer {token}"}


# Create an alias for backward compatibility
get_authentication_token_from_email = authentication_token_from_email
