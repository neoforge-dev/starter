"""Datetime utilities."""
from datetime import datetime, timezone


def utc_now() -> datetime:
    """Get current UTC datetime with timezone information."""
    return datetime.now(timezone.utc)


def make_tzaware(dt: datetime) -> datetime:
    """Convert naive datetime to UTC timezone-aware datetime."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc) 