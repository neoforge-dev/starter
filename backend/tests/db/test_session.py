"""Test database session management."""
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db, AsyncSessionLocal

pytestmark = pytest.mark.asyncio


async def test_get_db() -> None:
    """Test database session creation and cleanup."""
    async with AsyncSessionLocal() as session:
        # Test that session is usable
        result = await session.execute(text("SELECT 1"))
        assert result.scalar() == 1
        
        # Test transaction management
        async with session.begin():
            await session.execute(text("CREATE TABLE test (id INTEGER PRIMARY KEY)"))
            await session.rollback()
        
        # Table should not exist after rollback
        with pytest.raises(Exception):
            await session.execute(text("SELECT * FROM test"))


async def test_db_fixture_isolation(db: AsyncSession) -> None:
    """Test database fixture provides proper isolation."""
    # Create a test table
    await db.execute(text("CREATE TABLE test_isolation (id INTEGER PRIMARY KEY)"))
    await db.execute(text("INSERT INTO test_isolation (id) VALUES (1)"))
    
    # Verify data exists within transaction
    result = await db.execute(text("SELECT COUNT(*) FROM test_isolation"))
    assert result.scalar() == 1
    
    # Get a new session to verify isolation
    async with AsyncSessionLocal() as other_session:
        # Should not see the table in a different session
        # as the transaction hasn't been committed
        with pytest.raises(Exception):
            await other_session.execute(text("SELECT * FROM test_isolation"))


async def test_multiple_sessions() -> None:
    """Test multiple database sessions."""
    # First session
    async with AsyncSessionLocal() as session1:
        result1 = await session1.execute(text("SELECT 1"))
        assert result1.scalar() == 1
    
    # Second session
    async with AsyncSessionLocal() as session2:
        result2 = await session2.execute(text("SELECT 1"))
        assert result2.scalar() == 1 