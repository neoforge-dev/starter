"""Simplified conftest for running tests without database dependencies."""

import asyncio
from typing import Generator

import pytest

from app.core.config import Settings, get_settings

# Environment variable to check for database availability
SKIP_DATABASE_TESTS = True  # Set to False when database is available


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    """Return test settings without database connection requirement."""
    settings = get_settings()
    # Make sure it's a Settings instance
    assert isinstance(
        settings, Settings
    ), "test_settings should return a Settings instance"
    return settings


@pytest.fixture(autouse=True)
def clear_settings_cache():
    """Fixture to automatically clear the get_settings cache before each test."""
    get_settings.cache_clear()
