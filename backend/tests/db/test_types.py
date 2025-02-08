"""Test database types module."""
import pytest
import pytest_asyncio
from datetime import datetime, timezone, UTC
from sqlalchemy import Column, Integer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base_class import Base
from app.db.types import TZDateTime, UTCDateTime

pytestmark = pytest.mark.asyncio

class _TestModel(Base):
    """Test model for custom types."""
    __tablename__ = "test_types"
    
    id = Column(Integer, primary_key=True)
    tz_dt = Column(TZDateTime)
    utc_dt = Column(UTCDateTime)

async def test_tz_datetime_type(db: AsyncSession) -> None:
    """Test that TZDateTime preserves timezone information."""
    now = datetime.now(UTC)
    model = _TestModel(tz_dt=now)
    db.add(model)
    await db.commit()
    await db.refresh(model)
    
    assert model.tz_dt.tzinfo is not None
    assert model.tz_dt == now

async def test_utc_datetime_type(db):
    """Test that UTCDateTime converts to UTC."""
    now = datetime.now(UTC)
    model = _TestModel(utc_dt=now)
    db.add(model)
    await db.commit()
    await db.refresh(model)
    
    assert model.utc_dt.tzinfo is not None
    assert model.utc_dt == now

async def test_tz_datetime_naive_input(db):
    """Test that naive datetime inputs are handled correctly with TZDateTime."""
    naive_now = datetime.now(UTC)
    model = _TestModel(tz_dt=naive_now)
    db.add(model)
    await db.commit()
    await db.refresh(model)
    
    assert model.tz_dt.tzinfo is not None
    assert model.tz_dt.replace(tzinfo=None) == naive_now.replace(tzinfo=None)

async def test_utc_datetime_naive_input(db):
    """Test that naive datetime inputs are handled correctly with UTCDateTime."""
    naive_now = datetime.now(UTC)
    model = _TestModel(utc_dt=naive_now)
    db.add(model)
    await db.commit()
    await db.refresh(model)
    
    assert model.utc_dt.tzinfo is not None
    assert model.utc_dt.replace(tzinfo=None) == naive_now.replace(tzinfo=None) 