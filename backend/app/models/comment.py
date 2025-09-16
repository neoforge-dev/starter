"""Comment model for RealWorld API."""
from datetime import datetime

from app.db.base_class import Base
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func


class Comment(Base):
    """Comment model for RealWorld API."""

    __tablename__ = "comments"

    body: Mapped[str] = mapped_column(nullable=False)

    # Foreign keys
    article_id: Mapped[int] = mapped_column(ForeignKey("articles.id"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    article = relationship(
        "Article",
        back_populates="comments",
        lazy="selectin",
    )

    author = relationship(
        "User",
        back_populates="comments",
        lazy="selectin",
    )