from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Tuple

from app.models.audit_log import AuditLog
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession


class CRUDAuditLog:
    async def create(
        self,
        db: AsyncSession,
        *,
        user_id: Optional[int],
        action: str,
        resource: Optional[str] = None,
        metadata: Optional[str] = None,
    ) -> AuditLog:
        entry = AuditLog(
            user_id=user_id, action=action, resource=resource, event_metadata=metadata
        )
        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        return entry

    async def list(
        self,
        db: AsyncSession,
        *,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        since: Optional[datetime] = None,
        until: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[AuditLog], int]:
        conditions = []
        if user_id is not None:
            conditions.append(AuditLog.user_id == user_id)
        if action:
            conditions.append(AuditLog.action == action)
        if since:
            conditions.append(AuditLog.created_at >= since)
        if until:
            conditions.append(AuditLog.created_at <= until)

        where_clause = and_(*conditions) if conditions else None

        stmt = select(AuditLog)
        if where_clause is not None:
            stmt = stmt.where(where_clause)
        stmt_items = stmt.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)

        result_items = await db.execute(stmt_items)
        items = list(result_items.scalars().all())

        stmt_count = select(AuditLog)
        if where_clause is not None:
            stmt_count = stmt_count.where(where_clause)
        result_count = await db.execute(stmt_count)
        total = len(list(result_count.scalars().all()))

        return items, total


audit_log = CRUDAuditLog()
