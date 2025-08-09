"""Authentication schemas."""
from typing import Optional

from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    """Token schema."""
    access_token: str
    token_type: str


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