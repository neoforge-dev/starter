"""Support ticket model."""
from datetime import datetime

from app.db.base_class import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    email: Mapped[str] = mapped_column(index=True)
    subject: Mapped[str]
    message: Mapped[str]
    status: Mapped[str] = mapped_column(default="open", index=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )
