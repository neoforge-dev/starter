"""Authentication command objects."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class LoginCommand(BaseModel):
    """Command for user login."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="User password")


class RegisterCommand(BaseModel):
    """Command for user registration."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")
    full_name: str = Field(..., min_length=1, max_length=100, description="User full name")


class RefreshTokenCommand(BaseModel):
    """Command for token refresh."""

    refresh_token: str = Field(..., description="Refresh token")