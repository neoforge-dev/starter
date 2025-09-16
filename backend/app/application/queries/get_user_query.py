"""Get user query for CQRS pattern."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class GetUserQuery:
    """Query to get a user by ID."""

    user_id: UUID

    def __post_init__(self) -> None:
        """Validate query data."""
        if not self.user_id:
            raise ValueError("User ID is required")