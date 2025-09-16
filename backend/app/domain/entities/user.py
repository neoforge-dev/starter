"""User domain entity."""

from __future__ import annotations

from datetime import datetime
from typing import Self

from pydantic import BaseModel, Field

from app.domain.value_objects.email import Email


class User(BaseModel):
    """User aggregate root."""

    id: int | None = None
    email: Email
    full_name: str
    hashed_password: str
    is_active: bool = True
    is_superuser: bool = False
    is_verified: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @classmethod
    def create(
        cls,
        email: str,
        full_name: str,
        hashed_password: str,
    ) -> Self:
        """Factory method to create a new user."""
        email_vo = Email.create(email)

        return cls(
            email=email_vo,
            full_name=full_name.strip(),
            hashed_password=hashed_password,
        )

    def update_profile(self, full_name: str | None = None, email: str | None = None) -> None:
        """Update user profile information."""
        if full_name is not None:
            self.full_name = full_name.strip()

        if email is not None:
            self.email = Email.create(email)

        self.updated_at = datetime.utcnow()

    def change_password(self, new_hashed_password: str) -> None:
        """Change user password."""
        self.hashed_password = new_hashed_password
        self.updated_at = datetime.utcnow()

    def verify_email(self) -> None:
        """Mark user email as verified."""
        self.is_verified = True
        self.updated_at = datetime.utcnow()

    def activate(self) -> None:
        """Activate user account."""
        self.is_active = True
        self.updated_at = datetime.utcnow()

    def deactivate(self) -> None:
        """Deactivate user account."""
        self.is_active = False
        self.updated_at = datetime.utcnow()

    def __str__(self) -> str:
        """String representation of user."""
        return f"User(id={self.id}, email={self.email}, name={self.full_name})"

    def __eq__(self, other: object) -> bool:
        """Equality comparison based on ID."""
        if not isinstance(other, User):
            return NotImplemented
        return self.id == other.id

    def __hash__(self) -> int:
        """Hash based on ID."""
        return hash(self.id)