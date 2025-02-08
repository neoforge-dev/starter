"""Database session module."""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import AsyncAdaptedQueuePool, NullPool

from app.core.config import settings
from app.db.base_class import Base

# Create async engine with timezone support and optimized pooling
engine = create_async_engine(
    settings.database_url_for_env,
    echo=settings.debug,
    future=True,
    pool_pre_ping=True,
    # Use NullPool for tests, optimized AsyncAdaptedQueuePool for production
    poolclass=NullPool if settings.testing else AsyncAdaptedQueuePool,
    # Pool settings
    pool_size=20,  # Maximum number of connections in the pool
    max_overflow=10,  # Maximum number of connections that can be created beyond pool_size
    pool_timeout=30,  # Seconds to wait before giving up on getting a connection from the pool
    pool_recycle=1800,  # Recycle connections after 30 minutes
    # Enable timezone support and optimize for production
    connect_args={
        "command_timeout": 60,
        "statement_cache_size": 0 if settings.testing else 1000,  # Increased cache size
        "prepared_statement_cache_size": 0 if settings.testing else 500,  # Enable prepared statements
        "server_settings": {
            "timezone": "UTC",
            "application_name": "neoforge",
            "jit": "off",  # Disable JIT for more predictable performance
            "work_mem": "64MB",  # Memory for sorting and hash operations
            "maintenance_work_mem": "128MB",  # Memory for maintenance operations
            "effective_cache_size": "1GB",  # Estimate of disk cache size
            "effective_io_concurrency": 200,  # Concurrent I/O operations
            "random_page_cost": 1.1,  # Cost of random disk access
            "cpu_tuple_cost": 0.03,  # Cost of processing each row
            "cpu_index_tuple_cost": 0.01,  # Cost of processing each index entry
        },
    },
)

# Create async session factory with optimized settings
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
    
    This function provides a database session with optimized connection pooling.
    The session is automatically closed when the request is complete.
    
    Yields:
        Database session with optimized connection pooling
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close() 