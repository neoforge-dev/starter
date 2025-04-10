"""Database initialization script."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import get_settings
from app.db.base import Base

async def init_db():
    """Initialize database tables."""
    current_settings = get_settings()
    engine = create_async_engine(current_settings.database_url_for_env)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db()) 