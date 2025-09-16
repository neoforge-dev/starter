"""Create user command for CQRS pattern."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class CreateUserCommand:
    """Command to create a new user."""

    email: str
    full_name: str
    password: str
    subscription_amount: float | None = None
    trial_days: int = 14

    def __post_init__(self) -> None:
        """Validate command data."""
        if not self.email or not self.email.strip():
            raise ValueError("Email is required")

        if not self.full_name or not self.full_name.strip():
            raise ValueError("Full name is required")

        if not self.password or len(self.password) < 8:
            raise ValueError("Password must be at least 8 characters")

        if self.trial_days < 0:
            raise ValueError("Trial days cannot be negative")

        if self.subscription_amount is not None and self.subscription_amount < 0:
            raise ValueError("Subscription amount cannot be negative")