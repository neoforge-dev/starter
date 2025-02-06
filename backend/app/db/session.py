"""Database session module."""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.db.base_class import Base

# Create async engine with timezone support
engine = create_async_engine(
    settings.database_url_for_env,
    echo=settings.debug,
    future=True,
    pool_pre_ping=True,
    # Disable connection pooling in tests
    poolclass=NullPool if settings.testing else None,
    # Enable timezone support
    connect_args={
        "command_timeout": 60,
        "statement_cache_size": 0 if settings.testing else 100,
        "server_settings": {
            "timezone": "UTC",
            "application_name": "neoforge",
        },
    },
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db() -> None:
    """Initialize database."""
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Get database session.
    
    Yields:
        Database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close() 