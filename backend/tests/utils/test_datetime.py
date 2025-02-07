"""Test datetime utilities."""
from datetime import datetime, timedelta, timezone

from app.utils.datetime import utc_now, make_tzaware


def test_utc_now():
    """Test getting current UTC datetime."""
    # Get current time
    now = utc_now()
    
    # Verify it's timezone-aware and in UTC
    assert now.tzinfo is not None
    assert now.tzinfo == timezone.utc
    
    # Verify it's close to current time
    system_now = datetime.now(timezone.utc)
    assert abs(now - system_now) < timedelta(seconds=1)


def test_make_tzaware():
    """Test converting naive datetime to UTC timezone-aware datetime."""
    # Test with naive datetime
    naive_dt = datetime(2024, 3, 14, 12, 0, 0)
    aware_dt = make_tzaware(naive_dt)
    assert aware_dt.tzinfo == timezone.utc
    assert aware_dt.year == 2024
    assert aware_dt.month == 3
    assert aware_dt.day == 14
    assert aware_dt.hour == 12
    assert aware_dt.minute == 0
    assert aware_dt.second == 0
    
    # Test with already timezone-aware datetime
    other_tz = timezone(timedelta(hours=2))
    aware_dt = datetime(2024, 3, 14, 12, 0, 0, tzinfo=other_tz)
    utc_dt = make_tzaware(aware_dt)
    assert utc_dt.tzinfo == timezone.utc
    assert utc_dt.hour == 10  # 12:00 in UTC+2 is 10:00 in UTC 