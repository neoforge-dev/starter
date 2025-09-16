"""Email value object for domain layer."""

from __future__ import annotations

import re
from typing import Self

from pydantic import BaseModel, EmailStr, field_validator


class Email(BaseModel):
    """Email value object with validation."""

    value: EmailStr

    @field_validator("value")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        """Validate email format and business rules."""
        if not v or not v.strip():
            raise ValueError("Email cannot be empty")

        # Additional business rules can be added here
        # e.g., domain restrictions, disposable email checks, etc.

        return v.lower().strip()

    @classmethod
    def create(cls, email: str) -> Self:
        """Factory method to create Email value object."""
        return cls(value=email)

    def __str__(self) -> str:
        """String representation of email."""
        return self.value

    def __eq__(self, other: object) -> bool:
        """Equality comparison."""
        if not isinstance(other, Email):
            return NotImplemented
        return self.value == other.value

    def __hash__(self) -> int:
        """Hash for use in sets and dictionaries."""
        return hash(self.value)

    @property
    def domain(self) -> str:
        """Extract domain from email."""
        return self.value.split("@")[1]

    @property
    def local_part(self) -> str:
        """Extract local part from email."""
        return self.value.split("@")[0]