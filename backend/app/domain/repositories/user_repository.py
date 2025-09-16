"""User repository interface for domain layer."""

from __future__ import annotations

from abc import abstractmethod
from typing import List
from uuid import UUID

from .base_repository import BaseRepository


class UserRepository(BaseRepository["User"]):
    """Abstract repository interface for User entities."""

    @abstractmethod
    async def get_by_email(self, email: str) -> "User" | None:
        """Get user by email address."""
        pass

    @abstractmethod
    async def get_active_users(self) -> List["User"]:
        """Get all active users."""
        pass

    @abstractmethod
    async def get_trial_users(self) -> List["User"]:
        """Get users currently in trial period."""
        pass

    @abstractmethod
    async def get_users_with_expired_trials(self) -> List["User"]:
        """Get users with expired trial periods."""
        pass

    @abstractmethod
    async def get_users_with_active_subscriptions(self) -> List["User"]:
        """Get users with active subscriptions."""
        pass

    @abstractmethod
    async def count_by_subscription_status(self, status: str) -> int:
        """Count users by subscription status."""
        pass

    @abstractmethod
    async def exists_by_email(self, email: str) -> bool:
        """Check if user exists by email."""
        pass

    @abstractmethod
    async def update_last_login(self, user_id: UUID) -> None:
        """Update user's last login timestamp."""
        pass

    @abstractmethod
    async def search_users(self, query: str, limit: int = 50) -> List["User"]:
        """Search users by name or email."""
        pass


# Import here to avoid circular imports
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..entities.user import User