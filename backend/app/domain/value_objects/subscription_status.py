"""Subscription status value object for domain layer."""

from __future__ import annotations

from enum import Enum
from typing import Self


class SubscriptionStatus(Enum):
    """Subscription status enumeration."""

    TRIAL = "trial"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    UNPAID = "unpaid"
    INCOMPLETE = "incomplete"
    INCOMPLETE_EXPIRED = "incomplete_expired"
    PAUSED = "paused"

    @classmethod
    def create(cls, status: str) -> Self:
        """Factory method to create SubscriptionStatus from string."""
        try:
            return cls(status.lower())
        except ValueError:
            raise ValueError(f"Invalid subscription status: {status}")

    def is_active(self) -> bool:
        """Check if subscription is in an active state."""
        return self in {self.TRIAL, self.ACTIVE}

    def is_incomplete(self) -> bool:
        """Check if subscription is in an incomplete state."""
        return self in {self.INCOMPLETE, self.INCOMPLETE_EXPIRED}

    def can_be_canceled(self) -> bool:
        """Check if subscription can be canceled."""
        return self in {self.TRIAL, self.ACTIVE, self.PAST_DUE, self.PAUSED}

    def can_be_reactivated(self) -> bool:
        """Check if subscription can be reactivated."""
        return self in {self.CANCELED, self.PAST_DUE, self.UNPAID}

    def requires_payment(self) -> bool:
        """Check if subscription requires payment action."""
        return self in {self.PAST_DUE, self.UNPAID, self.INCOMPLETE}

    def __str__(self) -> str:
        """String representation of subscription status."""
        return self.value