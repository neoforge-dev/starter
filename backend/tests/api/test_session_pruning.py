import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_session import UserSession
from app.crud.user_session import user_session as user_session_crud


@pytest.mark.asyncio
async def test_prune_expired_and_revoked(db: AsyncSession):
    now = datetime.utcnow()
    # Create: one revoked, one expired old, one active
    revoked = UserSession(
        user_id=1,
        hashed_refresh_token="h1",
        created_at=now - timedelta(days=40),
        expires_at=now + timedelta(days=10),
        revoked_at=now - timedelta(days=1),
    )
    expired_old = UserSession(
        user_id=1,
        hashed_refresh_token="h2",
        created_at=now - timedelta(days=60),
        expires_at=now - timedelta(days=31),
        revoked_at=None,
    )
    active = UserSession(
        user_id=1,
        hashed_refresh_token="h3",
        created_at=now,
        expires_at=now + timedelta(days=29),
        revoked_at=None,
    )
    db.add_all([revoked, expired_old, active])
    await db.commit()

    pruned = await user_session_crud.prune_expired_and_revoked(db, older_than_days=30)
    assert pruned >= 2

    # Verify only active remains
    from sqlalchemy import select
    res = await db.execute(select(UserSession))
    rows = list(res.scalars().all())
    assert len(rows) == 1
    assert rows[0].hashed_refresh_token == "h3"
