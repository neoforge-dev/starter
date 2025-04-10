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

@pytest.fixture(scope="function")
async def test_session(test_settings: Settings) -> AsyncSession:
    """Create a test database session."""
    engine = create_async_engine(test_settings.database_url_for_env)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
        await session.rollback()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()

async def test_tz_datetime_type_utc(test_session: AsyncSession):
    """Test that TZDateTime preserves UTC timezone information."""
    now = datetime.now(timezone.utc)
    model = TestModel(tz_datetime=now)
    test_session.add(model)
    await test_session.commit()
    await test_session.refresh(model)
    
    assert model.tz_datetime.tzinfo is not None
    assert model.tz_datetime.tzinfo == timezone.utc
    assert model.tz_datetime == now

async def test_tz_datetime_type_non_utc(test_session: AsyncSession):
    """Test that TZDateTime preserves non-UTC timezone information."""
    # Test with different timezones
    timezones = ["America/New_York", "Europe/London", "Asia/Tokyo"]
    
    for tz_name in timezones:
        tz = ZoneInfo(tz_name)
        now = datetime.now(tz)
        
        model = TestModel(tz_datetime=now)
        test_session.add(model)
        await test_session.commit()
        await test_session.refresh(model)
        
        assert model.tz_datetime.tzinfo is not None
        assert model.tz_datetime.tzinfo.utcoffset(None) == tz.utcoffset(None)
        assert model.tz_datetime == now

async def test_utc_datetime_type_from_utc(test_session: AsyncSession):
    """Test that UTCDateTime handles UTC input correctly."""
    now = datetime.now(timezone.utc)
    model = TestModel(utc_datetime=now)
    test_session.add(model)
    await test_session.commit()
    await test_session.refresh(model)
    
    assert model.utc_datetime.tzinfo == timezone.utc
    assert model.utc_datetime == now

async def test_utc_datetime_type_from_non_utc(test_session: AsyncSession):
    """Test that UTCDateTime converts non-UTC input to UTC."""
    # Create a datetime in EST
    est = ZoneInfo("America/New_York")
    now = datetime.now(est)
    
    model = TestModel(utc_datetime=now)
    test_session.add(model)
    await test_session.commit()
    await test_session.refresh(model)
    
    assert model.utc_datetime.tzinfo == timezone.utc
    assert model.utc_datetime == now.astimezone(timezone.utc)

async def test_tz_datetime_naive_input(test_session: AsyncSession):
    """Test that naive datetime inputs are handled correctly with TZDateTime."""
    naive_now = datetime.now()
    model = TestModel(tz_datetime=naive_now)
    test_session.add(model)
    await test_session.commit()
    await test_session.refresh(model)
    
    assert model.tz_datetime.tzinfo is not None
    assert model.tz_datetime.tzinfo == timezone.utc
    assert model.tz_datetime.replace(tzinfo=None) == naive_now

async def test_utc_datetime_naive_input(test_session: AsyncSession):
    """Test that naive datetime inputs are handled correctly with UTCDateTime."""
    naive_now = datetime.now()
    model = TestModel(utc_datetime=naive_now)
    test_session.add(model)
    await test_session.commit()
    await test_session.refresh(model)
    
    assert model.utc_datetime.tzinfo == timezone.utc
    assert model.utc_datetime.replace(tzinfo=None) == naive_now

async def test_tz_datetime_dst_handling(test_session: AsyncSession):
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
        test_session.add(model)
        await test_session.commit()
        await test_session.refresh(model)
        
        assert model.tz_datetime.tzinfo is not None
        assert model.tz_datetime == dt

async def test_utc_datetime_dst_handling(test_session: AsyncSession):
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
        test_session.add(model)
        await test_session.commit()
        await test_session.refresh(model)
        
        assert model.utc_datetime.tzinfo == timezone.utc
        assert model.utc_datetime == dt.astimezone(timezone.utc)

async def test_tz_datetime_comparison(test_session: AsyncSession):
    """Test datetime comparison operations with TZDateTime."""
    now_utc = datetime.now(timezone.utc)
    now_est = now_utc.astimezone(ZoneInfo("America/New_York"))
    
    # Create two records with same time in different timezones
    model1 = TestModel(tz_datetime=now_utc)
    model2 = TestModel(tz_datetime=now_est)
    
    test_session.add_all([model1, model2])
    await test_session.commit()
    await test_session.refresh(model1)
    await test_session.refresh(model2)
    
    # Times should be equal regardless of timezone
    assert model1.tz_datetime == model2.tz_datetime
    
    # Test ordering
    later_time = now_utc + timedelta(hours=1)
    model3 = TestModel(tz_datetime=later_time)
    test_session.add(model3)
    await test_session.commit()
    await test_session.refresh(model3)
    
    assert model1.tz_datetime < model3.tz_datetime
    assert model2.tz_datetime < model3.tz_datetime