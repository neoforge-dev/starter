"""Article model for RealWorld API."""
import re
from datetime import datetime
from typing import List

from app.db.base_class import Base
from app.models.associations import article_tags, favorites
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func


class Article(Base):
    """Article model for RealWorld API."""

    __tablename__ = "articles"

    slug: Mapped[str] = mapped_column(unique=True, index=True)
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(nullable=False)
    body: Mapped[str] = mapped_column(nullable=False)

    # Foreign key to user
    author_id: Mapped[int] = mapped_column(index=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    author = relationship(
        "User",
        back_populates="articles",
        lazy="selectin",
    )

    comments = relationship(
        "Comment",
        back_populates="article",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    tags = relationship(
        "Tag",
        secondary=article_tags,
        back_populates="articles",
        lazy="selectin",
    )

    # Favorites relationship (many-to-many with users)
    favorited_by = relationship(
        "User",
        secondary=favorites,
        back_populates="favorites",
        lazy="selectin",
    )

    @property
    def favorites_count(self) -> int:
        """Get the number of users who favorited this article."""
        return len(self.favorited_by)

    def generate_slug(self) -> str:
        """Generate a unique slug from the title."""
        # Simple slug generation without external dependencies
        base_slug = re.sub(r'[^\w\s-]', '', self.title.lower())
        base_slug = re.sub(r'[-\s]+', '-', base_slug).strip('-')

        # If slug already exists, append a number
        # This will be handled in the CRUD layer
        return base_slug

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.slug and self.title:
            self.slug = self.generate_slug()