"""Initialize test database."""
import asyncio
import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine
from app.db.base import Base
from tests.conftest import TEST_DATABASE_URL

async def init_test_db():
    """Create test database and initialize schema."""
    # Extract database name from URL
    db_name = TEST_DATABASE_URL.split("/")[-1]
    db_url = TEST_DATABASE_URL.replace(db_name, "postgres")  # Connect to default db first

    # Create test database
    try:
        conn = await asyncpg.connect(db_url)
        await conn.execute(f'DROP DATABASE IF EXISTS {db_name}')
        await conn.execute(f'CREATE DATABASE {db_name}')
        await conn.close()
    except Exception as e:
        print(f"Error creating test database: {e}")
        return

    # Create tables
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_test_db()) 