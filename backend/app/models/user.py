"""User model."""
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

if TYPE_CHECKING:
    from .item import Item
    from .admin import Admin
    from .event import Event
    from .ab_test import AbTest, AbTestAssignment


class User(Base):
    """User model for authentication and authorization."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(unique=True, index=True)
    full_name: Mapped[str] = mapped_column(nullable=False)
    hashed_password: Mapped[str] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)
    is_superuser: Mapped[bool] = mapped_column(default=False)
    is_verified: Mapped[bool] = mapped_column(default=False, nullable=False)
    email_verified_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    # Relationships
    items: Mapped[List["Item"]] = relationship(
        "Item",
        back_populates="owner",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    admin: Mapped[Optional["Admin"]] = relationship(
        "Admin",
        back_populates="user",
        uselist=False,
        lazy="selectin",
    )
    events: Mapped[List["Event"]] = relationship(
        "Event",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    # A/B Testing relationships
    created_ab_tests: Mapped[List["AbTest"]] = relationship(
        "AbTest",
        back_populates="creator",
        cascade="all, delete-orphan",
        lazy="select",
        foreign_keys="AbTest.created_by"
    )
    ab_test_assignments: Mapped[List["AbTestAssignment"]] = relationship(
        "AbTestAssignment",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select",
    ) 