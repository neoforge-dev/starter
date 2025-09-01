"""
Test database connection and basic operations.

This test verifies that the database connection is working properly
and that basic operations can be performed with the correct collation.
"""

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

pytestmark = pytest.mark.asyncio


@pytest.mark.asyncio
async def test_database_connection(db: AsyncSession):
    """Test that we can connect to the database and execute a query."""
    # Execute a simple query
    result = await db.execute(text("SELECT 1"))
    value = result.scalar()

    # Check that the query returned the expected result
    assert value == 1


@pytest.mark.asyncio
async def test_database_collation(db: AsyncSession):
    """Test that the database has the correct collation settings."""
    # Query the database for its collation settings
    result = await db.execute(
        text(
            "SELECT datcollate, datctype FROM pg_database WHERE datname = current_database()"
        )
    )
    row = result.fetchone()

    # Check that the collation settings are correct
    assert row is not None
    collate, ctype = row
    assert collate == "en_US.utf8"
    assert ctype == "en_US.utf8"


@pytest.mark.asyncio
async def test_unicode_handling(db: AsyncSession):
    """Test that the database can handle Unicode characters correctly."""
    # Create a temporary table
    await db.execute(
        text(
            """
        CREATE TEMPORARY TABLE test_unicode (
            id SERIAL PRIMARY KEY,
            text_value TEXT
        )
        """
        )
    )

    # Insert some Unicode data
    unicode_text = "Hello, 世界! Привет, мир! مرحبا بالعالم!"
    await db.execute(
        text("INSERT INTO test_unicode (text_value) VALUES (:text)"),
        {"text": unicode_text},
    )
    await db.commit()

    # Retrieve the data
    result = await db.execute(
        text("SELECT text_value FROM test_unicode ORDER BY id DESC LIMIT 1")
    )
    retrieved_text = result.scalar()

    # Check that the Unicode data was stored and retrieved correctly
    assert retrieved_text == unicode_text


@pytest.mark.asyncio
async def test_case_insensitive_search(db: AsyncSession):
    """Test that case-insensitive search works correctly with the current collation."""
    # Create a temporary table
    await db.execute(
        text(
            """
        CREATE TEMPORARY TABLE test_case (
            id SERIAL PRIMARY KEY,
            text_value TEXT
        )
        """
        )
    )

    # Insert test data
    test_text = "CaseSensitiveText"
    await db.execute(
        text("INSERT INTO test_case (text_value) VALUES (:text)"), {"text": test_text}
    )
    await db.commit()

    # Perform a case-insensitive search
    result = await db.execute(
        text("SELECT COUNT(*) FROM test_case WHERE text_value ILIKE :search"),
        {"search": "%casesensitive%"},
    )
    count = result.scalar()

    # Check that the case-insensitive search found the record
    assert count == 1
