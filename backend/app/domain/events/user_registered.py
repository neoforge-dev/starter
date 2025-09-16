"""Domain events for User aggregate."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from ..value_objects.email import Email


@dataclass(frozen=True)
class UserRegistered:
    """Event raised when a new user is registered."""

    user_id: UUID
    email: Email
    full_name: str
    occurred_at: datetime = datetime.utcnow()

    @property
    def event_type(self) -> str:
        """Event type identifier."""
        return "user.registered"


@dataclass(frozen=True)
class UserEmailVerified:
    """Event raised when user email is verified."""

    user_id: UUID
    email: Email
    occurred_at: datetime = datetime.utcnow()

    @property
    def event_type(self) -> str:
        """Event type identifier."""
        return "user.email_verified"


@dataclass(frozen=True)
class UserProfileUpdated:
    """Event raised when user profile is updated."""

    user_id: UUID
    old_email: Email | None
    new_email: Email | None
    old_full_name: str | None
    new_full_name: str | None
    occurred_at: datetime = datetime.utcnow()

    @property
    def event_type(self) -> str:
        """Event type identifier."""
        return "user.profile_updated"


@dataclass(frozen=True)
class UserSubscriptionUpdated:
    """Event raised when user subscription is updated."""

    user_id: UUID
    old_status: str
    new_status: str
    occurred_at: datetime = datetime.utcnow()

    @property
    def event_type(self) -> str:
        """Event type identifier."""
        return "user.subscription_updated"


@dataclass(frozen=True)
class UserDeactivated:
    """Event raised when user account is deactivated."""

    user_id: UUID
    reason: str | None
    occurred_at: datetime = datetime.utcnow()

    @property
    def event_type(self) -> str:
        """Event type identifier."""
        return "user.deactivated"