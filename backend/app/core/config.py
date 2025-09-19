"""Compatibility shim for settings import.

This module re-exports the Settings and get_settings symbols from
app.config.settings to maintain backward compatibility with older
imports that reference app.core.config.
"""

from app.config.settings import (  # noqa: F401
    Settings,
    Environment,
    parse_bool_str,
    parse_environment,
    get_settings,
    settings,
)


