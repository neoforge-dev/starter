"""Idempotency key model for deduplicating non-GET requests."""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.db.base_class import Base


class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"

    key: Mapped[str] = mapped_column(index=True, unique=True)
    method: Mapped[str]
    path: Mapped[str]
    user_id: Mapped[Optional[int]] = mapped_column(nullable=True)
    request_hash: Mapped[str]
    response_body: Mapped[Optional[str]] = mapped_column(nullable=True)
    status_code: Mapped[Optional[int]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    expires_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
