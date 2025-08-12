"""HTTP caching helpers (ETag support)."""
from __future__ import annotations

import hashlib
import json
from typing import Any

from fastapi import Request, Response


def compute_etag(payload: Any) -> str:
    """Compute a weak ETag for a JSON-serializable payload."""
    try:
        body = json.dumps(payload, default=str, sort_keys=True, separators=(",", ":"))
    except Exception:
        body = repr(payload)
    digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
    return f"W/\"{digest}\""


def set_etag(response: Response, payload: Any) -> str:
    etag = compute_etag(payload)
    response.headers["ETag"] = etag
    return etag


def not_modified(request: Request, etag: str) -> bool:
    inm = request.headers.get("If-None-Match")
    if not inm:
        return False
    # simple match on ETag value
    return etag in inm
