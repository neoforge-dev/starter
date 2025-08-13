from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.audit_log import audit_log as audit_crud


async def audit_event(
    db: AsyncSession,
    *,
    user_id: Optional[int],
    action: str,
    resource: Optional[str] = None,
    metadata: Optional[str] = None,
) -> None:
    """Record an audit event. Fails silently to avoid impacting main flow."""
    try:
        await audit_crud.create(db, user_id=user_id, action=action, resource=resource, metadata=metadata)
    except Exception:
        # Intentionally ignore audit failures
        pass
