from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    user_id: Optional[int] = Field(default=None, index=True)
    action: str = Field(index=True, description="Action performed, e.g., project.create")
    resource: Optional[str] = Field(default=None, index=True, description="Resource id, e.g., project:123")
    metadata: Optional[str] = Field(default=None, description="JSON-encoded metadata about the event")
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
