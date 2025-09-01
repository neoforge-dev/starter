"""Project model."""
from datetime import datetime
from typing import Optional

from app.db.base_class import Base
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func


class Project(Base):
    __tablename__ = "projects"

    name: Mapped[str] = mapped_column(index=True)
    description: Mapped[Optional[str]] = mapped_column(nullable=True)
    owner_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )
