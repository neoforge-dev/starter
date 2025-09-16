"""User domain entity."""

from __future__ import annotations

from datetime import datetime
from typing import Self
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from app.domain.value_objects.email import Email
from app.domain.value_objects.money import Money
from app.domain.value_objects.subscription_status import SubscriptionStatus


class User(BaseModel):
    """User aggregate root."""

    id: UUID = Field(default_factory=uuid4)
    email: Email
    full_name: str
    hashed_password: str
    is_active: bool = True
    is_verified: bool = False
    subscription_status: SubscriptionStatus = SubscriptionStatus.TRIAL
    subscription_amount: Money = Field(default_factory=lambda: Money.zero())
    trial_ends_at: datetime | None = None
    subscription_ends_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @classmethod
    def create(
        cls,
        email: str,
        full_name: str,
        hashed_password: str,
        subscription_amount: Money | None = None,
        trial_days: int = 14,
    ) -> Self:
        """Factory method to create a new user."""
        email_vo = Email.create(email)

        # Set trial period
        trial_ends_at = None
        if trial_days > 0:
            from datetime import timedelta
            trial_ends_at = datetime.utcnow() + timedelta(days=trial_days)

        return cls(
            email=email_vo,
            full_name=full_name.strip(),
            hashed_password=hashed_password,
            subscription_amount=subscription_amount or Money.zero(),
            trial_ends_at=trial_ends_at,
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

    def update_subscription(
        self,
        status: SubscriptionStatus,
        amount: Money | None = None,
        ends_at: datetime | None = None,
    ) -> None:
        """Update subscription information."""
        self.subscription_status = status
        if amount is not None:
            self.subscription_amount = amount
        if ends_at is not None:
            self.subscription_ends_at = ends_at
        self.updated_at = datetime.utcnow()

    def is_trial_active(self) -> bool:
        """Check if user is currently in active trial period."""
        if self.trial_ends_at is None:
            return False
        return datetime.utcnow() < self.trial_ends_at

    def is_subscription_active(self) -> bool:
        """Check if user has active subscription."""
        return (
            self.subscription_status.is_active() and
            (self.subscription_ends_at is None or datetime.utcnow() < self.subscription_ends_at)
        )

    def can_access_premium_features(self) -> bool:
        """Check if user can access premium features."""
        return self.is_trial_active() or self.is_subscription_active()

    def days_until_trial_ends(self) -> int | None:
        """Get days remaining in trial period."""
        if self.trial_ends_at is None:
            return None

        remaining = self.trial_ends_at - datetime.utcnow()
        return max(0, remaining.days)

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