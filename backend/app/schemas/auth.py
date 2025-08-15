"""Authentication schemas."""
from typing import Optional
from datetime import datetime

from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    """Token schema."""
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None


class TokenPayload(BaseModel):
    """Token payload schema."""
    sub: Optional[int] = None


class TokenData(BaseModel):
    """Token data schema."""
    email: Optional[str] = None


class Login(BaseModel):
    """Login schema."""
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    """Password reset request schema."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirm schema."""
    token: str
    new_password: str


class EmailVerification(BaseModel):
    """Email verification schema."""
    token: str


class ResendVerification(BaseModel):
    """Resend verification email schema."""
    email: EmailStr 


class SessionOut(BaseModel):
    """User session representation for listing/revocation APIs."""
    id: int
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    revoked_at: Optional[datetime] = None
    # is_current is not computed server-side yet; clients may compute via refresh token


class RevokeOthersRequest(BaseModel):
    """Request body to revoke all sessions except one."""
    keep_session_id: int


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""
    refresh_token: str