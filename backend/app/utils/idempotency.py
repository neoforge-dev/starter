"""Idempotency utilities for deduplicating non-GET requests.

Initial implementation: endpoint-level helpers to pre-check an Idempotency-Key
and store the response after successful processing.
"""
from __future__ import annotations

import hashlib
import json
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.idempotency_key import IdempotencyKey
from fastapi import Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps


def compute_request_hash(method: str, path: str, body: Any) -> str:
    """Compute a stable hash for a request (method+path+body).

    Body can be dict/list/str/bytes/None. We normalize to a JSON string.
    """
    if body is None:
        body_str = "null"
    elif isinstance(body, (dict, list)):
        body_str = json.dumps(body, sort_keys=True, separators=(",", ":"))
    elif isinstance(body, (str, bytes)):
        body_str = body.decode("utf-8") if isinstance(body, bytes) else body
    else:
        # Fallback to repr
        body_str = repr(body)

    full = f"{method.upper()}|{path}|{body_str}"
    return hashlib.sha256(full.encode("utf-8")).hexdigest()


async def get_existing_response(
    db: AsyncSession,
    *,
    key: str,
    method: str,
    path: str,
    request_hash: str,
) -> Optional[tuple[int, Optional[str]]]:
    """Return (status_code, response_body) if an idempotent result exists."""
    result = await db.execute(
        select(IdempotencyKey).where(
            IdempotencyKey.key == key,
            IdempotencyKey.method == method.upper(),
            IdempotencyKey.path == path,
            IdempotencyKey.request_hash == request_hash,
        )
    )
    row = result.scalar_one_or_none()
    if row and row.status_code is not None:
        return row.status_code, row.response_body
    return None


async def store_response(
    db: AsyncSession,
    *,
    key: str,
    method: str,
    path: str,
    user_id: Optional[int],
    request_hash: str,
    response_body: Optional[str],
    status_code: int,
) -> None:
    """Persist idempotent response for future duplicate requests."""
    entry = IdempotencyKey(
        key=key,
        method=method.upper(),
        path=path,
        user_id=user_id,
        request_hash=request_hash,
        response_body=response_body,
        status_code=status_code,
    )
    db.add(entry)
    await db.commit()


class IdempotencyManager:
    """Helper to manage idempotency pre-check and store for a request."""

    def __init__(self, db: AsyncSession, request: Request):
        self.db = db
        self.request = request
        self.key: Optional[str] = request.headers.get("Idempotency-Key")
        self._req_hash: Optional[str] = None

    def _ensure_hash(self, body: Any) -> Optional[str]:
        if not self.key:
            return None
        self._req_hash = compute_request_hash(self.request.method, self.request.url.path, body)
        return self._req_hash

    async def precheck(self, body: Any) -> Optional[Any]:
        """Return stored JSON-decoded response if existing, else None."""
        if not self.key:
            return None
        req_hash = self._ensure_hash(body)
        if not req_hash:
            return None
        existing = await get_existing_response(
            self.db,
            key=self.key,
            method=self.request.method,
            path=self.request.url.path,
            request_hash=req_hash,
        )
        if existing:
            _, body = existing
            try:
                return json.loads(body) if body else None
            except Exception:
                return None
        return None

    async def store(self, body: Any, status_code: int, user_id: Optional[int] = None) -> None:
        if not self.key:
            return
        if self._req_hash is None:
            self._ensure_hash(body)
        resp_body = json.dumps(body)
        await store_response(
            self.db,
            key=self.key,
            method=self.request.method,
            path=self.request.url.path,
            user_id=user_id,
            request_hash=self._req_hash or "",
            response_body=resp_body,
            status_code=status_code,
        )


async def get_idempotency_manager(
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
) -> IdempotencyManager:
    return IdempotencyManager(db=db, request=request)


async def cleanup_idempotency_keys(db: AsyncSession, max_age_seconds: int = 86400) -> None:
    """Delete idempotency entries older than max_age_seconds if no explicit expires_at set."""
    from sqlalchemy import text
    # Use a parameterized interval expression compatible with Postgres
    await db.execute(
        text(
            """
            DELETE FROM idempotency_keys
            WHERE (expires_at IS NOT NULL AND expires_at < NOW())
               OR (expires_at IS NULL AND created_at < (NOW() - (:age || ' seconds')::interval))
            """
        ),
        {"age": max_age_seconds},
    )
    await db.commit()
