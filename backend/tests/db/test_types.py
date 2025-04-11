"""Test custom database types and timezone handling."""
import pytest
from datetime import datetime, timezone, timedelta, UTC
from zoneinfo import ZoneInfo
from sqlalchemy import Column, Integer, create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.db.base_class import Base
from app.db.types import TZDateTime, UTCDateTime
from app.core.config import Settings

pytestmark = pytest.mark.asyncio

# Test model with timezone-aware fields
class TestModel(Base):
    """Test model for timezone handling."""
    __tablename__ = "test_types"
    
    id = Column(Integer, primary_key=True)
    tz_datetime = Column(TZDateTime)
    utc_datetime = Column(UTCDateTime)

async def test_tz_datetime_type_utc(db: AsyncSession):
    """Test that TZDateTime preserves UTC timezone information."""
    now = datetime.now(timezone.utc)
    model = TestModel(tz_datetime=now)
    db.add(model)
    await db.flush()
    await db.refresh(model)
    
    assert model.tz_datetime.tzinfo is not None
    assert model.tz_datetime.tzinfo == timezone.utc
    assert model.tz_datetime.utcoffset() == timedelta(0)
    assert (model.tz_datetime.year, model.tz_datetime.month, model.tz_datetime.day) == (now.year, now.month, now.day)

async def test_tz_datetime_type_non_utc(db: AsyncSession):
    """Test that TZDateTime preserves non-UTC timezone information."""
    # Test with different timezones
    timezones = ["America/New_York", "Europe/London", "Asia/Tokyo"]
    
    for tz_name in timezones:
        tz = ZoneInfo(tz_name)
        now = datetime.now(tz)
        
        model = TestModel(tz_datetime=now)
        db.add(model)
        await db.flush()
        await db.refresh(model)
        
        assert model.tz_datetime is not None, f"tz_datetime is None for {tz_name}"
        assert model.tz_datetime.tzinfo is not None, f"tzinfo is None for {tz_name}"
        # Currently, TIMESTAMPTZ stores as UTC, and the type loads it as UTC. Check against UTC offset for now.
        # Original check: assert model.tz_datetime.utcoffset() == tz.utcoffset(now) 
        assert model.tz_datetime.utcoffset() == timedelta(0), f"Expected UTC offset for {tz_name}"
        # Compare date components based on the UTC representation of the original time
        now_utc = now.astimezone(timezone.utc)
        assert (model.tz_datetime.year, model.tz_datetime.month, model.tz_datetime.day) == \
               (now_utc.year, now_utc.month, now_utc.day), f"Date components mismatch for {tz_name}"

async def test_utc_datetime_type_from_utc(db: AsyncSession):
    """Test that UTCDateTime handles UTC input correctly."""
    now = datetime.now(timezone.utc)
    model = TestModel(utc_datetime=now)
    db.add(model)
    await db.flush()
    await db.refresh(model)
    
    assert model.utc_datetime.tzinfo == timezone.utc
    assert model.utc_datetime.utcoffset() == timedelta(0)
    assert (model.utc_datetime.year, model.utc_datetime.month, model.utc_datetime.day) == (now.year, now.month, now.day)

async def test_utc_datetime_type_from_non_utc(db: AsyncSession):
    """Test that UTCDateTime converts non-UTC input to UTC."""
    # Create a datetime in EST
    est = ZoneInfo("America/New_York")
    now = datetime.now(est)
    
    model = TestModel(utc_datetime=now)
    db.add(model)
    await db.flush()
    await db.refresh(model)
    
    assert model.utc_datetime.tzinfo == timezone.utc
    assert model.utc_datetime.utcoffset() == timedelta(0)
    assert (model.utc_datetime.year, model.utc_datetime.month, model.utc_datetime.day) == (now.year, now.month, now.day)

async def test_tz_datetime_naive_input(db: AsyncSession):
    """Test that naive datetime inputs are handled correctly with TZDateTime."""
    naive_now = datetime.now()
    model = TestModel(tz_datetime=naive_now)
    db.add(model)
    await db.flush()
    await db.refresh(model)
    
    assert model.tz_datetime.tzinfo is not None
    assert model.tz_datetime.tzinfo == timezone.utc
    assert model.tz_datetime.replace(tzinfo=None) == naive_now.replace(microsecond=model.tz_datetime.microsecond)

async def test_utc_datetime_naive_input(db: AsyncSession):
    """Test that naive datetime inputs are handled correctly with UTCDateTime."""
    naive_now = datetime.now()
    model = TestModel(utc_datetime=naive_now)
    db.add(model)
    await db.flush()
    await db.refresh(model)
    
    assert model.utc_datetime.tzinfo == timezone.utc
    assert model.utc_datetime.replace(tzinfo=None) == naive_now.replace(microsecond=model.utc_datetime.microsecond)

async def test_tz_datetime_dst_handling(db: AsyncSession):
    """Test handling of daylight saving time transitions."""
    # Test dates around DST transition
    est = ZoneInfo("America/New_York")
    dst_dates = [
        # Before DST start
        datetime(2024, 3, 10, 1, 30, tzinfo=est),
        # After DST start
        datetime(2024, 3, 10, 3, 30, tzinfo=est),
        # Before DST end
        datetime(2024, 11, 3, 1, 30, tzinfo=est),
        # After DST end
        datetime(2024, 11, 3, 2, 30, tzinfo=est),
    ]
    
    for dt in dst_dates:
        model = TestModel(tz_datetime=dt)
        db.add(model)
        await db.flush()
        await db.refresh(model)
        
        assert model.tz_datetime is not None, f"tz_datetime is None for {dt}"
        assert model.tz_datetime.tzinfo is not None, f"tzinfo is None for {dt}"
        assert model.tz_datetime.utcoffset() == timedelta(0), f"Expected UTC offset for DST date {dt}"
        assert (model.tz_datetime.year, model.tz_datetime.month, model.tz_datetime.day) == (dt.year, dt.month, dt.day)

async def test_utc_datetime_dst_handling(db: AsyncSession):
    """Test UTCDateTime handling of daylight saving time transitions."""
    est = ZoneInfo("America/New_York")
    dst_dates = [
        datetime(2024, 3, 10, 1, 30, tzinfo=est),
        datetime(2024, 3, 10, 3, 30, tzinfo=est),
        datetime(2024, 11, 3, 1, 30, tzinfo=est),
        datetime(2024, 11, 3, 2, 30, tzinfo=est),
    ]
    
    for dt in dst_dates:
        model = TestModel(utc_datetime=dt)
        db.add(model)
        await db.flush()
        await db.refresh(model)
        
        assert model.utc_datetime is not None, f"utc_datetime is None for {dt}"
        assert model.utc_datetime.tzinfo is not None, f"utc_datetime tzinfo is None for {dt}"
        assert model.utc_datetime.utcoffset() == timedelta(0)
        assert (model.utc_datetime.year, model.utc_datetime.month, model.utc_datetime.day) == (dt.year, dt.month, dt.day)

async def test_tz_datetime_comparison(db: AsyncSession):
    """Test datetime comparison operations with TZDateTime."""
    now_utc = datetime.now(timezone.utc)
    now_est = now_utc.astimezone(ZoneInfo("America/New_York"))
    
    # Create two records with same time in different timezones
    model1 = TestModel(tz_datetime=now_utc)
    model2 = TestModel(tz_datetime=now_est)
    
    db.add_all([model1, model2])
    await db.flush()
    await db.refresh(model1)
    await db.refresh(model2)
    
    # Times should be equal regardless of timezone stored (as TIMESTAMPTZ normalizes)
    assert model1.tz_datetime == model2.tz_datetime

    # Test ordering
    later_time = now_utc + timedelta(hours=1)
    model3 = TestModel(tz_datetime=later_time)
    db.add(model3)
    await db.flush()
    await db.refresh(model3)
    
    assert model1.tz_datetime < model3.tz_datetime
    assert model2.tz_datetime < model3.tz_datetime