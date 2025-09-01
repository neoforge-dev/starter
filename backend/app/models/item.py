"""Item model."""
from typing import TYPE_CHECKING

from app.db.base_class import Base
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .user import User


class Item(Base):
    """Item model."""

    __tablename__ = "items"

    title: Mapped[str] = mapped_column(index=True)
    description: Mapped[str | None]
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    owner: Mapped["User"] = relationship(
        "User",
        back_populates="items",
        lazy="joined",
        innerjoin=True,  # Since owner_id is not nullable
    )
