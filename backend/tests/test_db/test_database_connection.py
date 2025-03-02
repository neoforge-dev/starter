"""
Test database connection and basic operations.

This test verifies that the database connection is working properly
and that basic operations can be performed with the correct collation.
"""

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_database_connection(db_session: AsyncSession):
    """Test that we can connect to the database and execute a query."""
    # Execute a simple query
    result = await db_session.execute(text("SELECT 1"))
    value = result.scalar()
    
    # Check that the query returned the expected result
    assert value == 1


@pytest.mark.asyncio
async def test_database_collation(db_session: AsyncSession):
    """Test that the database has the correct collation settings."""
    # Query the database for its collation settings
    result = await db_session.execute(
        text("SELECT datcollate, datctype FROM pg_database WHERE datname = current_database()")
    )
    row = result.fetchone()
    
    # Check that the collation settings are correct
    assert row is not None
    collate, ctype = row
    assert collate == "en_US.utf8"
    assert ctype == "en_US.utf8"


@pytest.mark.asyncio
async def test_unicode_handling(db_session: AsyncSession):
    """Test that the database can handle Unicode characters correctly."""
    # Create a temporary table
    await db_session.execute(
        text("""
        CREATE TEMPORARY TABLE test_unicode (
            id SERIAL PRIMARY KEY,
            text_value TEXT
        )
        """)
    )
    
    # Insert some Unicode data
    unicode_text = "Hello, 世界! Привет, мир! مرحبا بالعالم!"
    await db_session.execute(
        text("INSERT INTO test_unicode (text_value) VALUES (:text)"),
        {"text": unicode_text}
    )
    await db_session.commit()
    
    # Retrieve the data
    result = await db_session.execute(
        text("SELECT text_value FROM test_unicode WHERE id = 1")
    )
    retrieved_text = result.scalar()
    
    # Check that the Unicode data was stored and retrieved correctly
    assert retrieved_text == unicode_text


@pytest.mark.asyncio
async def test_case_insensitive_search(db_session: AsyncSession):
    """Test that case-insensitive search works correctly with the current collation."""
    # Create a temporary table
    await db_session.execute(
        text("""
        CREATE TEMPORARY TABLE test_case (
            id SERIAL PRIMARY KEY,
            text_value TEXT
        )
        """)
    )
    
    # Insert test data
    test_text = "CaseSensitiveText"
    await db_session.execute(
        text("INSERT INTO test_case (text_value) VALUES (:text)"),
        {"text": test_text}
    )
    await db_session.commit()
    
    # Perform a case-insensitive search
    result = await db_session.execute(
        text("SELECT COUNT(*) FROM test_case WHERE text_value ILIKE :search"),
        {"search": "%casesensitive%"}
    )
    count = result.scalar()
    
    # Check that the case-insensitive search found the record
    assert count == 1 