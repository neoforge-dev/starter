"""Tag model for RealWorld API."""
from app.db.base_class import Base
from app.models.associations import article_tags
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Tag(Base):
    """Tag model for RealWorld API."""

    __tablename__ = "tags"

    name: Mapped[str] = mapped_column(unique=True, index=True, nullable=False)

    # Relationships
    articles = relationship(
        "Article",
        secondary=article_tags,
        back_populates="tags",
        lazy="selectin",
    )