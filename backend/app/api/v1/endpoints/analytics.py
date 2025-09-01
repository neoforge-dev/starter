"""Minimal analytics endpoints for development (no-op)."""
from typing import Any, Dict

from fastapi import APIRouter

router = APIRouter()


@router.get("/analytics")
async def get_analytics() -> Dict[str, Any]:
    return {"metrics": [], "summary": {"events": 0}}


@router.post("/analytics/events")
async def track_event(event: Dict[str, Any]) -> Dict[str, str]:
    # Accept any event payload and return success
    return {"status": "ok"}
