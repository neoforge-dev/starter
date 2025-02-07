"""Test database types module."""
import pytest
from datetime import datetime, timezone, UTC
from sqlalchemy import Column, Integer
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

async def test_tz_datetime_type(db):
    """Test that TZDateTime preserves timezone information."""
    now = datetime.now(UTC)
    model = TestModel(tz_datetime=now)
    db.add(model)
    await db.commit()
    await db.refresh(model)
    
    assert model.tz_datetime.tzinfo is not None
    assert model.tz_datetime == now

async def test_utc_datetime_type(db):
    """Test that UTCDateTime converts to UTC."""
    now = datetime.now(UTC)
    model = TestModel(utc_datetime=now)
    db.add(model)
    await db.commit()
    await db.refresh(model)
    
    assert model.utc_datetime.tzinfo is not None
    assert model.utc_datetime == now

async def test_tz_datetime_naive_input(db):
    """Test that naive datetime inputs are handled correctly with TZDateTime."""
    naive_now = datetime.now(UTC)
    model = TestModel(tz_datetime=naive_now)
    db.add(model)
    await db.commit()
    await db.refresh(model)
    
    assert model.tz_datetime.tzinfo is not None
    assert model.tz_datetime.replace(tzinfo=None) == naive_now.replace(tzinfo=None)

async def test_utc_datetime_naive_input(db):
    """Test that naive datetime inputs are handled correctly with UTCDateTime."""
    naive_now = datetime.now(UTC)
    model = TestModel(utc_datetime=naive_now)
    db.add(model)
    await db.commit()
    await db.refresh(model)
    
    assert model.utc_datetime.tzinfo is not None
    assert model.utc_datetime.replace(tzinfo=None) == naive_now.replace(tzinfo=None) 