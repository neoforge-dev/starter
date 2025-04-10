"""Database session module."""
from typing import AsyncGenerator, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import AsyncAdaptedQueuePool, NullPool

from app.core.config import Settings, get_settings
from app.db.base_class import Base

def get_engine_args(settings: Settings) -> Dict[str, Any]:
    """Get database engine arguments based on environment."""
    common_args = {
        "echo": settings.debug,
        "future": True,
        "pool_pre_ping": True,
        "connect_args": {
            "command_timeout": 60,
            "statement_cache_size": 0 if settings.testing else 1000,
            "prepared_statement_cache_size": 0 if settings.testing else 500,
            "server_settings": {
                "timezone": "UTC",
                "application_name": "neoforge",
                "jit": "off",
                "work_mem": "64MB",
                "maintenance_work_mem": "128MB",
                "effective_cache_size": "1GB",
                "effective_io_concurrency": "200",
                "random_page_cost": "1.1",
                "cpu_tuple_cost": "0.03",
                "cpu_index_tuple_cost": "0.01",
            },
        },
    }

    # Use a small pool for testing to enable pool metrics
    if settings.testing:
        common_args.update({
            "poolclass": AsyncAdaptedQueuePool,
            "pool_size": 5,
            "max_overflow": 2,
            "pool_timeout": 5,
            "pool_recycle": 300,
        })
    else:
        common_args.update({
            "poolclass": AsyncAdaptedQueuePool,
            "pool_size": 20,
            "max_overflow": 10,
            "pool_timeout": 30,
            "pool_recycle": 1800,
        })

    return common_args

# Get settings instance once
current_settings = get_settings()

# Create async engine with timezone support and optimized pooling
engine = create_async_engine(
    current_settings.database_url_for_env,
    **get_engine_args(current_settings),
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