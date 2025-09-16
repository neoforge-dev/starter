"""Base repository interface for domain layer."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, TypeVar
from uuid import UUID

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    """Abstract base repository interface."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> T | None:
        """Get entity by ID."""
        pass

    @abstractmethod
    async def save(self, entity: T) -> None:
        """Save entity."""
        pass

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Delete entity by ID. Returns True if deleted."""
        pass

    @abstractmethod
    async def exists(self, id: UUID) -> bool:
        """Check if entity exists."""
        pass

    @abstractmethod
    async def count(self) -> int:
        """Count total entities."""
        pass