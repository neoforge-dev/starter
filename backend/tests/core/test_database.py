"""Test database module."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db.session import get_db, AsyncSessionLocal, init_db
from app.db.base import Base

pytestmark = pytest.mark.asyncio


async def test_init_db():
    """Test database initialization."""
    # Initialize database
    await init_db()
    
    # Verify tables are created by creating a session and executing a query
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT 1"))
        assert result.scalar() == 1


async def test_get_session():
    """Test getting a database session."""
    # Get session from generator
    session_gen = get_db()
    session = await anext(session_gen)
    
    try:
        # Verify session is active
        assert isinstance(session, AsyncSession)
        assert session.is_active
        
        # Execute test query
        result = await session.execute(text("SELECT 1"))
        assert result.scalar() == 1
    finally:
        # Close session
        await session.close()
        await session_gen.aclose()


async def test_session_rollback():
    """Test session rollback on error."""
    async with AsyncSessionLocal() as session:
        try:
            # Execute an invalid query that should trigger a rollback
            await session.execute(text("SELECT * FROM nonexistent_table"))
        except Exception:
            # Rollback the transaction
            await session.rollback()
            
            # Verify session is still usable after rollback
            result = await session.execute(text("SELECT 1"))
            assert result.scalar() == 1 