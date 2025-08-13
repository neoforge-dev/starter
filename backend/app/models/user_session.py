from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class UserSession(SQLModel, table=True):
    __tablename__ = "user_sessions"

    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    user_id: int = Field(index=True)
    hashed_refresh_token: str = Field(index=True, description="SHA256 of refresh token")
    user_agent: Optional[str] = Field(default=None)
    ip_address: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    expires_at: datetime = Field(index=True)
    revoked_at: Optional[datetime] = Field(default=None, index=True)
