import pytest
from datetime import datetime, timezone, UTC
from sqlalchemy import Column, Integer, create_engine
from sqlalchemy.orm import DeclarativeBase

from app.db.base_class import Base
from app.db.types import TZDateTime, UTCDateTime

pytestmark = pytest.mark.asyncio

# This is a legitimate SQLAlchemy model class, not a test class
@pytest.mark.filterwarnings("ignore::pytest.PytestCollectionWarning")
class TestModel(Base):
    __tablename__ = "test_types"
    
    id = Column(Integer, primary_key=True)
    tz_datetime = Column(TZDateTime)
    utc_datetime = Column(UTCDateTime)

async def test_tz_datetime_type(session):
    """Test that TZDateTime preserves timezone information."""
    now = datetime.now(timezone.utc)
    model = TestModel(tz_datetime=now)
    session.add(model)
    await session.commit()
    await session.refresh(model)
    
    assert model.tz_datetime.tzinfo is not None
    assert model.tz_datetime == now

async def test_utc_datetime_type(session):
    """Test that UTCDateTime converts to UTC."""
    now = datetime.now(timezone.utc)
    model = TestModel(utc_datetime=now)
    session.add(model)
    await session.commit()
    await session.refresh(model)
    
    assert model.utc_datetime.tzinfo is not None
    assert model.utc_datetime == now

async def test_tz_datetime_naive_input(session):
    """Test that naive datetime inputs are handled correctly with TZDateTime."""
    naive_now = datetime.now(UTC)
    model = TestModel(tz_datetime=naive_now)
    session.add(model)
    await session.commit()
    await session.refresh(model)
    
    assert model.tz_datetime.tzinfo is not None
    assert model.tz_datetime.replace(tzinfo=None) == naive_now.replace(tzinfo=None)

async def test_utc_datetime_naive_input(session):
    """Test that naive datetime inputs are handled correctly with UTCDateTime."""
    naive_now = datetime.now(UTC)
    model = TestModel(utc_datetime=naive_now)
    session.add(model)
    await session.commit()
    await session.refresh(model)
    
    assert model.utc_datetime.tzinfo is not None
    assert model.utc_datetime.replace(tzinfo=None) == naive_now.replace(tzinfo=None)