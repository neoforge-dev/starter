"""
Test database module functionality.

This test verifies that the database module works correctly, including:
- Database pool initialization
- Cached query functionality
- Error handling

All tests use mocking to avoid actual database connections.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import hashlib

from app.core.database import init_db, cached_query, cache


@pytest.fixture
def mock_cache():
    """Create a mock cache."""
    mock = AsyncMock()
    mock.get = AsyncMock(return_value=None)
    mock.set = AsyncMock()
    return mock


@patch('app.core.database.create_pool', new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_init_db(mock_create_pool):
    """Test database pool initialization."""
    # Setup
    # Configure the AsyncMock to return a MagicMock when awaited
    pool_mock = MagicMock() 
    mock_create_pool.return_value = pool_mock
    
    # Execute
    result = await init_db()
    
    # Verify
    mock_create_pool.assert_called_once()
    # Check that the result is the mock pool object we configured
    assert result == pool_mock
    
    # Verify connection parameters
    call_kwargs = mock_create_pool.call_args.kwargs
    assert 'dsn' in call_kwargs
    assert call_kwargs['min_size'] == 5
    assert call_kwargs['max_size'] == 20
    assert call_kwargs['max_queries'] == 50000
    assert call_kwargs['max_inactive_connection_lifetime'] == 300


@pytest.mark.skip(reason="Requires rework: Patch target for DB interaction needs verification.")
@patch('app.core.database.cache')
@patch('app.core.database.db')
@pytest.mark.asyncio
async def test_cached_query_cache_miss(mock_db, mock_cache):
    """Test cached query with cache miss."""
    # Setup
    query = "SELECT * FROM users"
    expected_result = [{"id": 1, "name": "Test User"}]
    key = hashlib.sha256(query.encode()).hexdigest()
    
    mock_cache.get = AsyncMock(return_value=None)
    mock_cache.set = AsyncMock()
    mock_db.fetch = AsyncMock(return_value=expected_result)
    
    # Execute
    result = await cached_query(query)
    
    # Verify
    mock_cache.get.assert_called_once_with(key)
    mock_db.fetch.assert_called_once_with(query)
    mock_cache.set.assert_called_once_with(key, expected_result, ttl=300)
    assert result == expected_result


@patch('app.core.database.cache')
@patch('app.core.database.db')
@pytest.mark.asyncio
async def test_cached_query_cache_hit(mock_db, mock_cache):
    """Test cached query with cache hit."""
    # Setup
    query = "SELECT * FROM users"
    expected_result = [{"id": 1, "name": "Test User"}]
    key = hashlib.sha256(query.encode()).hexdigest()
    
    mock_cache.get = AsyncMock(return_value=expected_result)
    mock_db.fetch = AsyncMock()
    
    # Execute
    result = await cached_query(query)
    
    # Verify
    mock_cache.get.assert_called_once_with(key)
    mock_db.fetch.assert_not_called()
    assert result == expected_result


@patch('app.core.database.cache')
@patch('app.core.database.db')
@pytest.mark.asyncio
async def test_cached_query_custom_ttl(mock_db, mock_cache):
    """Test cached query with custom TTL."""
    # Setup
    query = "SELECT * FROM users"
    expected_result = [{"id": 1, "name": "Test User"}]
    key = hashlib.sha256(query.encode()).hexdigest()
    custom_ttl = 600
    
    mock_cache.get = AsyncMock(return_value=None)
    mock_cache.set = AsyncMock()
    mock_db.fetch = AsyncMock(return_value=expected_result)
    
    # Execute
    result = await cached_query(query, ttl=custom_ttl)
    
    # Verify
    mock_cache.get.assert_called_once_with(key)
    mock_db.fetch.assert_called_once_with(query)
    mock_cache.set.assert_called_once_with(key, expected_result, ttl=custom_ttl)
    assert result == expected_result


@patch('app.core.database.cache')
@patch('app.core.database.db')
@pytest.mark.asyncio
async def test_cached_query_db_error(mock_db, mock_cache):
    """Test cached query with database error."""
    # Setup
    query = "SELECT * FROM users"
    key = hashlib.sha256(query.encode()).hexdigest()
    
    mock_cache.get = AsyncMock(return_value=None)
    mock_db.fetch = AsyncMock(side_effect=Exception("Database error"))
    
    # Execute and verify exception is propagated
    with pytest.raises(Exception) as excinfo:
        await cached_query(query)
    
    # Verify
    assert "Database error" in str(excinfo.value)
    mock_cache.get.assert_called_once_with(key)
    mock_db.fetch.assert_called_once_with(query)


@patch('app.core.database.cache')
@patch('app.core.database.db')
@pytest.mark.asyncio
async def test_cached_query_cache_error(mock_db, mock_cache):
    """Test cached query with cache error."""
    # Setup
    query = "SELECT * FROM users"
    expected_result = [{"id": 1, "name": "Test User"}]
    key = hashlib.sha256(query.encode()).hexdigest()
    
    mock_cache.get = AsyncMock(side_effect=Exception("Cache error"))
    mock_db.fetch = AsyncMock(return_value=expected_result)
    
    # Execute and verify exception is propagated
    with pytest.raises(Exception) as excinfo:
        await cached_query(query)
    
    # Verify
    assert "Cache error" in str(excinfo.value)
    mock_cache.get.assert_called_once_with(key)
    mock_db.fetch.assert_not_called() 