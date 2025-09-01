"""CSP Reporting endpoint (report-only) for collecting violations.

Note: Keep payload minimal and avoid storing PII. Intended for non-production
or report-only mode to observe potential violations safely.
"""
from typing import Any, Dict

import structlog
from fastapi import APIRouter, Request
from pydantic import BaseModel

logger = structlog.get_logger()
router = APIRouter()


class CSPReport(BaseModel):
    """Minimal CSP report schema (relaxed to accept various UA formats)."""

    csp_report: Dict[str, Any] | None = None


@router.post("/security/report")
async def csp_report_endpoint(request: Request) -> Dict[str, str]:
    try:
        data = await request.json()
    except Exception:
        data = {"_error": "invalid_json"}
    # Redact potentially sensitive fields
    redacted = {
        "violated-directive": data.get("csp-report", {}).get("violated-directive")
        if isinstance(data.get("csp-report"), dict)
        else data.get("violated-directive"),
        "blocked-uri": data.get("csp-report", {}).get("blocked-uri")
        if isinstance(data.get("csp-report"), dict)
        else data.get("blocked-uri"),
        "document-uri": None,  # do not log full URLs
        "effective-directive": data.get("csp-report", {}).get("effective-directive")
        if isinstance(data.get("csp-report"), dict)
        else data.get("effective-directive"),
    }
    logger.warning("csp_violation_report", **{k: v for k, v in redacted.items() if v})
    return {"status": "ok"}
