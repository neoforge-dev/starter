"""Test user CRUD operations."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.user import user as user_crud
from app.schemas.user import UserCreate
from app.models.user import User
from tests.factories import UserCreateFactory


async def test_get_by_email(db: AsyncSession):
    """Test getting user by email."""
    user = await user_crud.create(
        db,
        obj_in=UserCreateFactory(
            email="test@example.com",
            password="testpassword",
            full_name="Test User",
        ),
    )
    
    # Test getting existing user
    found_user = await user_crud.get_by_email(db, email=user.email)
    assert found_user is not None
    assert found_user.id == user.id
    assert found_user.email == user.email
    
    # Test getting non-existent user
    not_found = await user_crud.get_by_email(db, email="nonexistent@example.com")
    assert not_found is None


async def test_authenticate(db: AsyncSession):
    """Test user authentication."""
    # Create user with known password
    user_in = UserCreate(
        email="test@example.com",
        password="testpassword",
        full_name="Test User",
    )
    user = await user_crud.create(db, obj_in=user_in)
    
    # Test successful authentication
    authenticated = await user_crud.authenticate(
        db, email="test@example.com", password="testpassword"
    )
    assert authenticated is not None
    assert authenticated.id == user.id
    
    # Test failed authentication - wrong password
    failed = await user_crud.authenticate(
        db, email="test@example.com", password="wrongpassword"
    )
    assert failed is None
    
    # Test failed authentication - wrong email
    failed = await user_crud.authenticate(
        db, email="wrong@example.com", password="testpassword"
    )
    assert failed is None


@pytest.mark.skip_asyncio
def test_is_active():
    """Test checking if user is active."""
    # Test active user
    active_user = User(
        email="active@example.com",
        full_name="Active User",
        hashed_password="hash",
        is_active=True,
    )
    assert user_crud.is_active(active_user) is True
    
    # Test inactive user
    inactive_user = User(
        email="inactive@example.com",
        full_name="Inactive User",
        hashed_password="hash",
        is_active=False,
    )
    assert user_crud.is_active(inactive_user) is False


@pytest.mark.skip_asyncio
def test_is_superuser():
    """Test checking if user is superuser."""
    # Test superuser
    superuser = User(
        email="admin@example.com",
        full_name="Admin User",
        hashed_password="hash",
        is_superuser=True,
    )
    assert user_crud.is_superuser(superuser) is True
    
    # Test regular user
    regular_user = User(
        email="user@example.com",
        full_name="Regular User",
        hashed_password="hash",
        is_superuser=False,
    )
    assert user_crud.is_superuser(regular_user) is False 