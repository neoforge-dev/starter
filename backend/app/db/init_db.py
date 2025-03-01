"""Database initialization script."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.db.base import Base

async def init_db():
    """Initialize database tables."""
    engine = create_async_engine(settings.database_url_for_env)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db()) 