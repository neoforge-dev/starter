"""Test database session module."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import text
from sqlalchemy.engine import URL, make_url

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
    """Test database engine configuration."""
    engine = create_async_engine(
        str(settings.database_url),  # Convert PostgresDsn to string
        echo=settings.debug,
        future=True,
        poolclass=NullPool,
    )

    # The URL will have the password masked as '***'
    assert engine.url.render_as_string().replace("***", "postgres") == str(settings.database_url)
    assert engine.echo == settings.debug


def test_session_factory_configuration():
    """Test session factory configuration."""
    engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        future=True,
        poolclass=NullPool,
    )

    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    # Create a session to verify configuration
    session = session_factory()
    assert isinstance(session, AsyncSession)
    assert session.bind == engine
    # Check that the session factory was created with the correct parameters
    assert session_factory.kw["bind"] == engine
    assert session_factory.kw["expire_on_commit"] is False


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