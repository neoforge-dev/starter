"""StatusEvent model."""
from datetime import datetime

from app.db.base_class import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class StatusEvent(Base):
    __tablename__ = "status_events"

    service_id: Mapped[str] = mapped_column(index=True)
    status: Mapped[str] = mapped_column(index=True)
    description: Mapped[str] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
