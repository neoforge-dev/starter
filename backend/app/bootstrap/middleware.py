"""Middleware configuration module for FastAPI setup."""

from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.caching import CacheMiddleware, cache_middleware

if TYPE_CHECKING:
    from app.config.settings import Settings


class MiddlewareConfigurator:
    """Handles middleware setup and configuration for FastAPI applications."""

    def __init__(self, settings: Settings):
        """Initialize middleware configurator."""
        self.settings = settings

    def configure(self, app: FastAPI) -> None:
        """Configure all middleware for the FastAPI application."""
        self._setup_cors_middleware(app)
        self._setup_http_metrics_middleware(app)
        self._setup_security_middleware(app)
        self._setup_validation_middleware(app)
        self._setup_tenant_middleware(app)
        self._setup_caching_middleware(app)
        self._setup_memory_optimization_middleware(app)

    def _setup_cors_middleware(self, app: FastAPI) -> None:
        """Set up CORS middleware."""
        if self.settings.cors_origins:
            app.add_middleware(
                CORSMiddleware,
                allow_origins=[str(origin) for origin in self.settings.cors_origins],
                allow_credentials=self.settings.cors_credentials,
                allow_methods=self.settings.cors_methods,
                allow_headers=self.settings.cors_headers,
            )

    def _setup_http_metrics_middleware(self, app: FastAPI) -> None:
        """Set up HTTP metrics middleware."""
        try:
            from app.api.middleware import setup_http_metrics_middleware
            setup_http_metrics_middleware(app)
        except ImportError:
            pass  # Middleware not available

    def _setup_security_middleware(self, app: FastAPI) -> None:
        """Set up security middleware."""
        try:
            from app.api.middleware import setup_security_middleware
            setup_security_middleware(app)
        except ImportError:
            pass  # Middleware not available

    def _setup_validation_middleware(self, app: FastAPI) -> None:
        """Set up validation middleware."""
        try:
            from app.api.middleware import setup_validation_middleware
            setup_validation_middleware(app)
        except ImportError:
            pass  # Middleware not available

    def _setup_tenant_middleware(self, app: FastAPI) -> None:
        """Set up tenant middleware for multi-tenant architecture."""
        try:
            from app.api.middleware.tenant import TenantMiddleware
            app.add_middleware(
                TenantMiddleware,
                default_tenant_slug="default",
                cache_ttl=300,  # 5 minutes
                enable_domain_resolution=True,
                enable_header_resolution=True,
            )
        except ImportError:
            pass  # Middleware not available

    def _setup_caching_middleware(self, app: FastAPI) -> None:
        """Set up HTTP caching middleware."""
        try:
            from app.api.middleware.caching import setup_caching_middleware
            setup_caching_middleware(
                app,
                cache_ttl=600,  # 10 minutes for production efficiency
                max_cache_size=2000,  # Increased cache size for better hit rates
                enable_middleware=True,
            )
        except ImportError:
            pass  # Middleware not available

    def _setup_memory_optimization_middleware(self, app: FastAPI) -> None:
        """Set up memory optimization middleware."""
        try:
            from app.utils.memory_optimization import setup_memory_optimization
            setup_memory_optimization(app)
        except ImportError:
            pass  # Middleware not available