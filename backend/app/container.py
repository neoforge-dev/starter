"""Dependency injection container for the application."""

from __future__ import annotations

# Ensure proper Python path for imports
import sys
from pathlib import Path

# Add parent directory to Python path to enable app imports
current_dir = Path(__file__).parent
backend_dir = current_dir.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Import from the new config location
from app.config.settings import get_settings


class Container:
    """Simple dependency injection container."""

    def __init__(self):
        """Initialize container with settings."""
        self._settings = get_settings()

    @property
    def settings(self):
        """Get application settings."""
        return self._settings

    # TODO: Add infrastructure services
    # TODO: Add repositories
    # TODO: Add use cases
    # TODO: Add application services


# Global container instance
container = Container()