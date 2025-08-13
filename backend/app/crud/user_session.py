from __future__ import annotations

import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_session import UserSession


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class CRUDUserSession:
    async def create(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        refresh_token: str,
        user_agent: Optional[str],
        ip_address: Optional[str],
        expires_in_days: int,
    ) -> UserSession:
        entry = UserSession(
            user_id=user_id,
            hashed_refresh_token=hash_token(refresh_token),
            user_agent=user_agent,
            ip_address=ip_address,
            expires_at=datetime.utcnow() + timedelta(days=expires_in_days),
        )
        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        return entry

    async def get_by_hashed(self, db: AsyncSession, *, hashed: str) -> Optional[UserSession]:
        res = await db.execute(select(UserSession).where(UserSession.hashed_refresh_token == hashed))
        return res.scalar_one_or_none()

    async def revoke(self, db: AsyncSession, *, session: UserSession) -> UserSession:
        session.revoked_at = datetime.utcnow()
        await db.commit()
        await db.refresh(session)
        return session

    async def list_for_user(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[UserSession], int]:
        res_items = await db.execute(
            select(UserSession)
            .where(UserSession.user_id == user_id)
            .order_by(UserSession.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        items = list(res_items.scalars().all())
        # total count (simple way)
        res_all = await db.execute(select(UserSession).where(UserSession.user_id == user_id))
        total = len(list(res_all.scalars().all()))
        return items, total


user_session = CRUDUserSession()
