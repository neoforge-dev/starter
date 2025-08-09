"""Password reset token CRUD operations."""
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.crud.base import CRUDBase


class CRUDPasswordResetToken(CRUDBase[PasswordResetToken, None, None]):
    """CRUD operations for password reset tokens."""

    @staticmethod
    def generate_secure_token() -> str:
        """Generate a cryptographically secure random token."""
        return secrets.token_urlsafe(32)

    @staticmethod
    def hash_token(token: str) -> str:
        """Hash a token for secure storage."""
        return hashlib.sha256(token.encode()).hexdigest()

    async def create_for_user(
        self, 
        db: AsyncSession, 
        user: User, 
        expires_hours: int = 24
    ) -> tuple[PasswordResetToken, str]:
        """
        Create a new password reset token for a user.
        
        Returns:
            tuple: (PasswordResetToken instance, plain token string)
        """
        # Generate token and hash it
        plain_token = self.generate_secure_token()
        token_hash = self.hash_token(plain_token)
        
        # Create the token record
        token_record = PasswordResetToken(
            token_hash=token_hash,
            user_id=user.id,
            expires_at=PasswordResetToken.create_expiration_date(expires_hours),
            is_used=False
        )
        
        db.add(token_record)
        await db.flush()  # Get the ID without committing
        await db.refresh(token_record)
        
        return token_record, plain_token

    async def get_by_token(
        self, 
        db: AsyncSession, 
        token: str
    ) -> Optional[PasswordResetToken]:
        """Get a password reset token by the plain token."""
        token_hash = self.hash_token(token)
        result = await db.execute(
            select(PasswordResetToken)
            .where(PasswordResetToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def get_valid_token_for_user(
        self,
        db: AsyncSession,
        user_id: int,
        token: str
    ) -> Optional[PasswordResetToken]:
        """Get a valid (not expired, not used) token for a specific user."""
        token_hash = self.hash_token(token)
        result = await db.execute(
            select(PasswordResetToken)
            .where(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.user_id == user_id,
                PasswordResetToken.is_used == False,
                PasswordResetToken.expires_at > datetime.utcnow()
            )
        )
        return result.scalar_one_or_none()

    async def mark_as_used(
        self,
        db: AsyncSession,
        token: PasswordResetToken
    ) -> None:
        """Mark a token as used."""
        token.mark_as_used()
        await db.flush()

    async def cleanup_expired_tokens(
        self,
        db: AsyncSession
    ) -> int:
        """Remove all expired tokens. Returns count of deleted tokens."""
        result = await db.execute(
            delete(PasswordResetToken)
            .where(PasswordResetToken.expires_at < datetime.utcnow())
        )
        return result.rowcount

    async def cleanup_tokens_for_user(
        self,
        db: AsyncSession,
        user_id: int
    ) -> int:
        """Remove all existing tokens for a user. Returns count of deleted tokens."""
        result = await db.execute(
            delete(PasswordResetToken)
            .where(PasswordResetToken.user_id == user_id)
        )
        return result.rowcount

    async def has_recent_token(
        self,
        db: AsyncSession,
        user_id: int,
        minutes_threshold: int = 5
    ) -> bool:
        """Check if user has requested a reset token within the threshold period."""
        threshold_time = datetime.utcnow() - timedelta(minutes=minutes_threshold)
        result = await db.execute(
            select(PasswordResetToken)
            .where(
                PasswordResetToken.user_id == user_id,
                PasswordResetToken.created_at > threshold_time
            )
        )
        return result.scalar_one_or_none() is not None


# Create instance
password_reset_token = CRUDPasswordResetToken(PasswordResetToken)