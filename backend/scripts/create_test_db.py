"""Create test database."""
import asyncio
import sys
from typing import AsyncGenerator

import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel

from app.core.config import settings


async def create_database() -> None:
    """Create test database if it doesn't exist."""
    # Connect to default database to create test database
    conn = await asyncpg.connect(
        user="postgres",
        password="postgres",
        database="postgres",
        host="db",
    )
    
    try:
        # Check if database exists
        result = await conn.fetchrow(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            "test",
        )
        
        if not result:
            # Create database
            await conn.execute("CREATE DATABASE test")
            print("Test database created successfully")
        else:
            print("Test database already exists")
            
    finally:
        await conn.close()


async def drop_database() -> None:
    """Drop test database."""
    # Connect to default database to drop test database
    conn = await asyncpg.connect(
        user="postgres",
        password="postgres",
        database="postgres",
        host="db",
    )
    
    try:
        # Terminate all connections to the test database
        await conn.execute("""
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = 'test'
            AND pid <> pg_backend_pid()
        """)
        
        # Drop database
        await conn.execute("DROP DATABASE IF EXISTS test")
        print("Test database dropped successfully")
            
    finally:
        await conn.close()


async def create_tables() -> None:
    """Create all tables in test database."""
    # Create async engine for test database
    engine = create_async_engine(settings.database_url_for_env)
    
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    await engine.dispose()
    print("Tables created successfully")


async def main() -> None:
    """Main function."""
    if len(sys.argv) < 2:
        print("Usage: python create_test_db.py [create|drop]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "create":
        await create_database()
        await create_tables()
    elif command == "drop":
        await drop_database()
    else:
        print("Invalid command. Use 'create' or 'drop'")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main()) 