#!/usr/bin/env python3
"""Create a test user for authentication testing."""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.core.config import get_settings
from app.db.session import async_session
from app.crud.user import user as user_crud
from app.schemas.user import UserCreate
from app.core.auth import get_password_hash


async def create_test_user():
    """Create a test user for authentication testing."""
    settings = get_settings()

    async with async_session() as db:
        # Check if test user already exists
        existing_user = await user_crud.get_by_email(db, email="test@example.com")
        if existing_user:
            print("Test user already exists!")
            return existing_user

        # Create test user
        user_data = UserCreate(
            email="test@example.com",
            password="testpass123",
            password_confirm="testpass123",
            full_name="Test User"
        )

        user = await user_crud.create(db, obj_in=user_data)
        await db.commit()
        await db.refresh(user)

        print(f"Test user created successfully!")
        print(f"Email: {user.email}")
        print(f"ID: {user.id}")
        print(f"Active: {user.is_active}")
        print(f"Verified: {user.is_verified}")

        return user


if __name__ == "__main__":
    asyncio.run(create_test_user())