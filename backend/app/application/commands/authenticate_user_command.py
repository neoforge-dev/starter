"""Authenticate user command for CQRS pattern."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AuthenticateUserCommand:
    """Command to authenticate a user."""

    email: str
    password: str

    def __post_init__(self) -> None:
        """Validate command data."""
        if not self.email or not self.email.strip():
            raise ValueError("Email is required")

        if not self.password:
            raise ValueError("Password is required")