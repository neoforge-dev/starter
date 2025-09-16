"""Authentication DTOs for API layer."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Login request DTO."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="User password")


class RegisterRequest(BaseModel):
    """User registration request DTO."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")
    full_name: str = Field(..., min_length=1, max_length=100, description="User full name")


class RefreshTokenRequest(BaseModel):
    """Refresh token request DTO."""

    refresh_token: str = Field(..., description="Refresh token")


class TokenResponse(BaseModel):
    """Token response DTO."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    refresh_token: str = Field(..., description="Refresh token")
    expires_in: int | None = Field(None, description="Token expiration time in seconds")


class UserResponse(BaseModel):
    """User response DTO."""

    id: int = Field(..., description="User ID")
    email: EmailStr = Field(..., description="User email address")
    full_name: str = Field(..., description="User full name")
    is_active: bool = Field(..., description="User active status")
    is_verified: bool = Field(..., description="Email verification status")
    created_at: str = Field(..., description="User creation timestamp")


class RegisterResponse(BaseModel):
    """Registration response DTO."""

    message: str = Field(..., description="Success message")
    user: UserResponse = Field(..., description="Created user information")
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    refresh_token: str = Field(..., description="Refresh token")


class LoginResponse(BaseModel):
    """Login response DTO."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    refresh_token: str = Field(..., description="Refresh token")
    user_id: int = Field(..., description="User ID")
    message: str = Field(..., description="Success message")


class AuthErrorResponse(BaseModel):
    """Authentication error response DTO."""

    detail: str = Field(..., description="Error description")
    error_code: str | None = Field(None, description="Error code for programmatic handling")