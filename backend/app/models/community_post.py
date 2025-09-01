"""Community post model."""
from datetime import datetime
from typing import Optional

from app.db.base_class import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class CommunityPost(Base):
    __tablename__ = "community_posts"

    title: Mapped[str]
    content: Mapped[str]
    author: Mapped[Optional[str]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )
