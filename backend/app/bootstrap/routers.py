"""Router configuration module for FastAPI setup."""

from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import FastAPI

if TYPE_CHECKING:
    from app.config.settings import Settings


class RouterConfigurator:
    """Handles router setup and configuration for FastAPI applications."""

    def __init__(self, settings: Settings):
        """Initialize router configurator."""
        self.settings = settings

    def configure(self, app: FastAPI) -> None:
        """Configure all routers for the FastAPI application."""
        self._setup_api_router(app)
        self._setup_metrics_router(app)
        self._setup_test_router(app)

    def _setup_api_router(self, app: FastAPI) -> None:
        """Set up the main API router."""
        try:
            from app.api.v1.api import api_router
            app.include_router(api_router, prefix=self.settings.api_v1_str)
        except ImportError:
            pass  # API router not available

    def _setup_metrics_router(self, app: FastAPI) -> None:
        """Set up the metrics router."""
        try:
            from app.api.endpoints import metrics
            app.include_router(metrics.router, tags=["monitoring"])
        except ImportError:
            pass  # Metrics router not available

    def _setup_test_router(self, app: FastAPI) -> None:
        """Set up test-specific routes if in test environment."""
        if self.settings.environment == "test":
            try:
                from app.api import deps
                from app.schemas.user import UserResponse
                from fastapi import APIRouter, Depends

                test_deps_router = APIRouter()

                @test_deps_router.get(
                    "/test-deps/current-user",
                    response_model=UserResponse,
                    tags=["test_dependencies"],
                )
                async def test_get_current_user_dependency(
                    current_user: UserResponse = Depends(deps.get_current_user)
                ) -> UserResponse:
                    """Test endpoint specifically for testing get_current_user dependency."""
                    return current_user

                app.include_router(test_deps_router)
            except ImportError:
                pass  # Test dependencies not available