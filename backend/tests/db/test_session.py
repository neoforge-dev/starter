"""Test database session management."""
import pytest
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
    AsyncEngine
)
from sqlalchemy.pool import NullPool, QueuePool
from sqlalchemy import text, select
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import Settings
from app.db.session import get_db, AsyncSessionLocal
from app.db.base import Base
from app.models.user import User

pytestmark = pytest.mark.asyncio

@pytest.fixture(scope="function")
async def test_engine(test_settings: Settings) -> AsyncGenerator[AsyncEngine, None]:
    """Create test database engine."""
    engine = create_async_engine(
        test_settings.database_url_for_env,
        echo=test_settings.debug,
        future=True,
        poolclass=NullPool,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture(scope="function")
async def test_session_factory(test_engine: AsyncEngine) -> async_sessionmaker:
    """Create test session factory."""
    return async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )

async def test_engine_configuration(test_settings: Settings):
    """Test database engine configuration."""
    engine = create_async_engine(
        test_settings.database_url_for_env,
        echo=test_settings.debug,
        poolclass=NullPool,
    )
    assert engine.dialect.name == "postgresql"
    assert engine.echo == test_settings.debug

async def test_session_factory_configuration(test_engine: AsyncEngine):
    """Test session factory configuration."""
    session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    session = session_factory()
    assert isinstance(session, AsyncSession)
    assert session.bind.dialect.name == "postgresql"
    await session.close()

async def test_session_context_manager(test_session_factory: async_sessionmaker):
    """Test session context manager behavior."""
    s = None
    async with test_session_factory() as session:
        s = session # Keep a reference for later check
        # Session should be active
        assert session.is_active

        # Execute test query
        result = await session.execute(text("SELECT 1"))
        assert result.scalar() == 1

    # After exiting the context manager, the session should be inactive
    assert not s.is_active, "Session should be inactive after context manager exits."

async def test_session_commit_rollback(test_session_factory: async_sessionmaker):
    """Test session commit and rollback behavior."""
    async with test_session_factory() as session:
        # Test successful commit
        await session.execute(
            text("CREATE TABLE test_table (id INTEGER PRIMARY KEY)")
        )
        await session.commit()
        
        # Verify table exists
        result = await session.execute(
            text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_table')")
        )
        assert result.scalar()
        
        # Test rollback
        await session.execute(text("DROP TABLE test_table"))
        await session.rollback()
        
        # Verify table still exists
        result = await session.execute(
            text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_table')")
        )
        assert result.scalar()

async def test_session_transaction_error(test_session_factory: async_sessionmaker):
    """Test session error handling in transactions."""
    async with test_session_factory() as session:
        # Start transaction
        async with session.begin():
            # Execute valid query
            await session.execute(
                text("CREATE TABLE test_table (id INTEGER PRIMARY KEY)")
            )
            
            try:
                # Execute invalid query
                await session.execute(text("SELECT * FROM nonexistent_table"))
            except SQLAlchemyError:
                # Transaction should be rolled back
                result = await session.execute(
                    text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_table')")
                )
                assert not result.scalar()

async def test_session_nested_transaction(test_session_factory: async_sessionmaker):
    """Test nested transaction behavior."""
    async with test_session_factory() as session:
        # Start outer transaction
        async with session.begin():
            await session.execute(
                text("CREATE TABLE test_table (id INTEGER PRIMARY KEY)")
            )
            
            # Start nested transaction
            async with session.begin_nested():
                await session.execute(
                    text("INSERT INTO test_table (id) VALUES (1)")
                )
                # Rollback nested transaction
                await session.rollback()
            
            # Table should exist but be empty
            result = await session.execute(text("SELECT COUNT(*) FROM test_table"))
            assert result.scalar() == 0

async def test_session_concurrent_access(test_session_factory: async_sessionmaker):
    """Test concurrent session access."""
    async def worker(id: int) -> None:
        async with test_session_factory() as session:
            await session.execute(
                text("SELECT pg_sleep(0.1)")  # Simulate work
            )
            await session.commit()
    
    # Run concurrent workers
    await asyncio.gather(*[
        worker(i) for i in range(5)
    ])

async def test_session_pool_behavior(test_settings: Settings):
    """Test session pool behavior."""
    # Create engine with connection pool
    engine = create_async_engine(
        test_settings.database_url_for_env,
        echo=test_settings.debug,
        future=True,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
    )
    
    # Create session factory
    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    # Create multiple sessions
    sessions = []
    for _ in range(7):  # More than pool_size but less than max_overflow
        session = session_factory()
        sessions.append(session)
        await session.execute(text("SELECT 1"))
    
    # Close sessions
    for session in sessions:
        await session.close()
    
    await engine.dispose()

async def test_get_db_generator():
    """Test database session generator."""
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
        await session.close()
        await session_gen.aclose()

async def test_async_session_local():
    """Test AsyncSessionLocal configuration."""
    async with AsyncSessionLocal() as session:
        # Verify session configuration
        assert isinstance(session, AsyncSession)
        assert not session.sync_session.expire_on_commit
        
        # Test query execution
        result = await session.execute(text("SELECT 1"))
        assert result.scalar() == 1 