"""Custom database types."""
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import DateTime, TypeDecorator


class TZDateTime(TypeDecorator):
    """Timezone-aware DateTime type.
    
    Ensures all datetimes are stored in UTC and returned as timezone-aware.
    """

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Any) -> datetime | None:
        """Convert datetime to UTC before storing."""
        if value is not None:
            if value.tzinfo is None:
                value = value.replace(tzinfo=timezone.utc)
            else:
                value = value.astimezone(timezone.utc)
        return value

    def process_result_value(self, value: datetime | None, dialect: Any) -> datetime | None:
        """Ensure retrieved datetime has UTC timezone."""
        if value is not None and value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value 