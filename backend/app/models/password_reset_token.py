"""Password reset token model."""
from datetime import datetime, timedelta
from typing import TYPE_CHECKING

from app.db.base_class import Base
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .user import User


class PasswordResetToken(Base):
    """Password reset token model for secure password resets."""

    __tablename__ = "password_reset_tokens"

    # Token is stored hashed for security
    token_hash: Mapped[str] = mapped_column(unique=True, index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    is_used: Mapped[bool] = mapped_column(default=False, nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(nullable=True)

    # Relationship to user
    user: Mapped["User"] = relationship("User", lazy="selectin")

    @classmethod
    def create_expiration_date(cls, hours: int = 24) -> datetime:
        """Create expiration date for token (default 24 hours from now)."""
        return datetime.utcnow() + timedelta(hours=hours)

    def is_expired(self) -> bool:
        """Check if token is expired."""
        return datetime.utcnow() > self.expires_at

    def is_valid(self) -> bool:
        """Check if token is valid (not expired and not used)."""
        return not self.is_expired() and not self.is_used

    def mark_as_used(self) -> None:
        """Mark token as used."""
        self.is_used = True
        self.used_at = datetime.utcnow()
