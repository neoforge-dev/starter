"""Admin utilities for testing."""
import uuid

from app.models.admin import Admin
from app.schemas.admin import AdminRole
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload


async def create_random_admin(
    db: AsyncSession, user_id: int = None, role: AdminRole = AdminRole.USER_ADMIN
) -> Admin:
    """
    Create a random admin for testing.

    Args:
        db: Database session
        user_id: User ID to associate with admin (optional)
        role: Admin role

    Returns:
        Created admin
    """
    from tests.factories import AdminFactory, UserFactory

    # Create admin with associated user
    admin = await AdminFactory.create(
        session=db,
        role=role,
        is_active=True,
        user_id=user_id,  # Will be ignored if None and AdminFactory will create a user
    )
    await db.flush()

    # Eagerly load the user relationship using joinedload
    stmt = select(Admin).options(joinedload(Admin.user)).filter(Admin.id == admin.id)
    result = await db.execute(stmt)
    admin = result.unique().scalar_one()

    return admin
