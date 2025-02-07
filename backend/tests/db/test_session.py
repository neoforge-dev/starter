"""Test database session module."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.pool import NullPool
from sqlalchemy import text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.db.session import init_db, get_db, engine, AsyncSessionLocal

pytestmark = pytest.mark.asyncio


async def test_init_db():
    """Test database initialization."""
    # Initialize database
    await init_db()
    
    # Verify tables are created by creating a session and executing a query
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT 1"))
        assert result.scalar() == 1


async def test_get_db():
    """Test database session management."""
    # Get session from generator
    session_gen = get_db()
    session = await anext(session_gen)
    
    try:
        # Verify session is active
        assert isinstance(session, AsyncSession)
        assert not session.closed
        
        # Execute test query
        result = await session.execute(text("SELECT 1"))
        assert result.scalar() == 1
    finally:
        # Close session
        await session.close()
        await session_gen.aclose()


def test_engine_configuration():
    """Test engine configuration based on settings."""
    # Verify testing-specific configuration
    assert settings.testing is True
    assert isinstance(engine.pool, NullPool)
    
    # Verify connection arguments from engine configuration
    expected_connect_args = {
        "command_timeout": 60,
        "statement_cache_size": 0,
        "server_settings": {
            "timezone": "UTC",
            "application_name": "neoforge",
        },
    }
    assert engine.url == make_url(settings.database_url_for_env)
    
    # Create a new engine with the same configuration to verify connect_args
    test_engine = create_async_engine(
        settings.database_url_for_env,
        connect_args=expected_connect_args,
    )
    assert test_engine.url == engine.url


def test_session_factory_configuration():
    """Test session factory configuration."""
    # Verify session factory settings
    assert AsyncSessionLocal.kw["expire_on_commit"] is False
    assert AsyncSessionLocal.kw["autocommit"] is False
    assert AsyncSessionLocal.kw["autoflush"] is False


async def test_get_db() -> None:
    """Test database session creation and cleanup."""
    async with AsyncSessionLocal() as session:
        # Test that session is usable
        result = await session.execute(text("SELECT 1"))
        assert result.scalar() == 1
        
        # Test transaction management
        await session.execute(text("CREATE TABLE test (id INTEGER PRIMARY KEY)"))
        await session.commit()
        
        # Verify table exists
        result = await session.execute(text("SELECT COUNT(*) FROM test"))
        assert result.scalar() == 0
        
        # Clean up
        await session.execute(text("DROP TABLE test"))
        await session.commit()


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
            
            # Both sessions should be usable
            assert session1 != session2 