"""SQLAlchemy base model class."""
from datetime import datetime, timezone
from typing import Any

from app.db.types import TZDateTime
from app.utils.datetime import utc_now
from sqlalchemy import Column, DateTime, MetaData
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Recommended naming convention used by Alembic
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Base class for all models."""

    metadata = MetaData(naming_convention=convention)

    @declared_attr.directive
    def __tablename__(cls) -> str:
        """Generate __tablename__ automatically."""
        return cls.__name__.lower()

    id: Mapped[int] = mapped_column(primary_key=True)

    created_at: Mapped[datetime] = mapped_column(
        TZDateTime, default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        TZDateTime, default=utc_now, onupdate=utc_now, nullable=False
    )

    def __repr__(self) -> str:
        """String representation."""
        attrs = []
        for key in self.__mapper__.columns.keys():
            if key not in {"created_at", "updated_at"}:
                attrs.append(f"{key}={getattr(self, key)}")
        return f"{self.__class__.__name__}({', '.join(attrs)})"
