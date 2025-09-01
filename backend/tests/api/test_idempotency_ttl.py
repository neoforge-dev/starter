from datetime import datetime, timedelta

import pytest
from app.models.idempotency_key import IdempotencyKey
from app.utils.idempotency import cleanup_idempotency_keys
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_idempotency_ttl_cleanup_removes_expired_entries(db: AsyncSession):
    # Insert two keys: one expired (expires_at in the past), one active (future)
    expired = IdempotencyKey(
        key="ttl-expired",
        method="POST",
        path="/api/v1/projects",
        user_id=None,
        request_hash="h1",
        response_body="{}",
        status_code=201,
        created_at=datetime.utcnow() - timedelta(days=2),
        expires_at=datetime.utcnow() - timedelta(seconds=10),
    )
    active = IdempotencyKey(
        key="ttl-active",
        method="POST",
        path="/api/v1/projects",
        user_id=None,
        request_hash="h2",
        response_body="{}",
        status_code=201,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=1),
    )
    db.add_all([expired, active])
    await db.commit()

    # Run cleanup for any expired entries
    await cleanup_idempotency_keys(db, max_age_seconds=86400)

    # Verify expired was removed, active remains
    from sqlalchemy import select

    rows = (
        (
            await db.execute(
                select(IdempotencyKey).where(
                    IdempotencyKey.key.in_(["ttl-expired", "ttl-active"])
                )
            )
        )
        .scalars()
        .all()
    )
    keys = {r.key for r in rows}
    assert "ttl-active" in keys
    assert "ttl-expired" not in keys
