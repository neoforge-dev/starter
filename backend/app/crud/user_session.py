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

    async def revoke_all_except(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        keep_session_id: int,
    ) -> int:
        """Revoke all sessions for a user except the specified session.

        Returns the number of sessions revoked.
        """
        res = await db.execute(
            select(UserSession).where(
                UserSession.user_id == user_id,
            )
        )
        sessions = list(res.scalars().all())
        revoked_count = 0
        now = datetime.utcnow()
        for s in sessions:
            if s.id != keep_session_id and s.revoked_at is None:
                s.revoked_at = now
                revoked_count += 1
        await db.commit()
        return revoked_count

    async def revoke_all_for_user(
        self,
        db: AsyncSession,
        *,
        user_id: int,
    ) -> int:
        """Revoke all active sessions for a user.

        Returns the number of sessions revoked.
        """
        res = await db.execute(
            select(UserSession).where(
                UserSession.user_id == user_id,
                UserSession.revoked_at.is_(None)
            )
        )
        sessions = list(res.scalars().all())
        revoked_count = 0
        now = datetime.utcnow()
        for s in sessions:
            s.revoked_at = now
            revoked_count += 1
        await db.commit()
        return revoked_count

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

    async def prune_expired_and_revoked(
        self,
        db: AsyncSession,
        *,
        older_than_days: int = 30,
    ) -> int:
        """Delete revoked sessions and expired sessions older than threshold.

        Returns number of sessions pruned.
        """
        cutoff = datetime.utcnow() - timedelta(days=older_than_days)
        # Fetch candidates, then delete
        res = await db.execute(
            select(UserSession).where(
                (UserSession.revoked_at.is_not(None)) | (UserSession.expires_at < cutoff)
            )
        )
        sessions = list(res.scalars().all())
        count = len(sessions)
        for s in sessions:
            await db.delete(s)
        await db.commit()
        return count


user_session = CRUDUserSession()
