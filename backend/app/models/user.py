"""User model."""
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from app.db.base_class import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

if TYPE_CHECKING:
    from .ab_test import AbTest, AbTestAssignment
    from .admin import Admin
    from .event import Event
    from .item import Item


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

    # Account lifecycle fields
    deactivated_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    deactivation_reason: Mapped[Optional[str]] = mapped_column(nullable=True)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    last_login_ip: Mapped[Optional[str]] = mapped_column(nullable=True)
    password_changed_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    failed_login_attempts: Mapped[int] = mapped_column(default=0)
    locked_until: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    data_retention_until: Mapped[Optional[datetime]] = mapped_column(nullable=True)

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
        foreign_keys="AbTest.created_by",
    )
    ab_test_assignments: Mapped[List["AbTestAssignment"]] = relationship(
        "AbTestAssignment",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def is_account_locked(self) -> bool:
        """Check if the account is currently locked."""
        if not self.locked_until:
            return False
        return datetime.utcnow() < self.locked_until

    def is_account_deactivated(self) -> bool:
        """Check if the account is deactivated."""
        return self.deactivated_at is not None

    def can_login(self) -> bool:
        """Check if the user can log in (active, verified, not locked, not deactivated)."""
        return (
            self.is_active
            and self.is_verified
            and not self.is_account_locked()
            and not self.is_account_deactivated()
        )

    def should_be_deleted(self) -> bool:
        """Check if the account should be deleted based on data retention policy."""
        if not self.data_retention_until:
            return False
        return datetime.utcnow() >= self.data_retention_until
