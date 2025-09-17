"""Application factory for modular FastAPI application setup."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.openapi.docs import get_swagger_ui_html

from app.bootstrap.config import ApplicationConfig
from app.bootstrap.middleware import MiddlewareConfigurator
from app.bootstrap.routers import RouterConfigurator
from app.config.settings import get_settings


class ApplicationFactory:
    """Factory for creating and configuring FastAPI applications."""

    def __init__(self):
        """Initialize the application factory."""
        self.settings = get_settings()
        self.config = ApplicationConfig(self.settings)
        self.middleware = MiddlewareConfigurator(self.settings)
        self.routers = RouterConfigurator(self.settings)

    def create_application(self) -> FastAPI:
        """Create and configure the FastAPI application."""
        # Create FastAPI app with basic configuration
        app = self.config.create_app()

        # Configure middleware
        self.middleware.configure(app)

        # Configure routers
        self.routers.configure(app)

        # Set up custom OpenAPI
        self._setup_openapi(app)

        return app

    def _setup_openapi(self, app: FastAPI) -> None:
        """Set up custom OpenAPI configuration."""
        def custom_openapi():
            """Generate custom OpenAPI schema."""
            if app.openapi_schema:
                return app.openapi_schema

            from fastapi.openapi.utils import get_openapi

            openapi_schema = get_openapi(
                title=self.settings.app_name,
                version=self.settings.version,
                description="NeoForge Backend API. A modern, cost-efficient starter kit for bootstrapped founders.",
                routes=app.routes,
            )

            # Custom OpenAPI modifications
            openapi_schema["info"]["x-logo"] = {"url": "https://neoforge.dev/logo.png"}

            app.openapi_schema = openapi_schema
            return app.openapi_schema

        # Override the default OpenAPI schema
        app.openapi = custom_openapi

        # Custom Swagger UI
        @app.get("/docs", include_in_schema=False)
        async def custom_swagger_ui_html():
            """Custom Swagger UI."""
            return get_swagger_ui_html(
                openapi_url=app.openapi_url,
                title=f"{self.settings.app_name} - API Documentation",
                oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
                swagger_js_url="/static/swagger-ui-bundle.js",
                swagger_css_url="/static/swagger-ui.css",
            )


# Global application factory instance
factory = ApplicationFactory()

# Create the main application instance
app = factory.create_application()