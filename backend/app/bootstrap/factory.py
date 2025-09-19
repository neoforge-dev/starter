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
                description="NeoForge Backend API - Enterprise SaaS Platform. A modern, cost-efficient starter kit for bootstrapped founders.",
                routes=app.routes,
            )

            # Enhanced OpenAPI metadata for better developer experience
            openapi_schema["info"].update({
                "x-logo": {"url": "https://neoforge.dev/logo.png"},
                "contact": {
                    "name": "NeoForge API Support",
                    "url": "https://neoforge.dev/support",
                    "email": "support@neoforge.dev"
                },
                "license": {
                    "name": "MIT",
                    "url": "https://opensource.org/licenses/MIT"
                },
                "termsOfService": "https://neoforge.dev/terms",
                "x-apisguru-categories": ["developer_tools"],
                "x-preferred": True
            })

            # Add global security definitions
            openapi_schema["components"]["securitySchemes"] = {
                "BearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT",
                    "description": "JWT token obtained from /api/v1/auth/login endpoint"
                },
                "ApiKeyAuth": {
                    "type": "apiKey",
                    "in": "header",
                    "name": "X-API-Key",
                    "description": "API key for programmatic access"
                }
            }

            # Add comprehensive server information
            openapi_schema["servers"] = [
                {
                    "url": "https://api.neoforge.dev",
                    "description": "Production API"
                },
                {
                    "url": "https://staging-api.neoforge.dev",
                    "description": "Staging API"
                },
                {
                    "url": "http://localhost:8000",
                    "description": "Local development"
                }
            ]

            # Add global tags for better organization
            openapi_schema["tags"] = [
                {
                    "name": "authentication",
                    "description": "User authentication and session management",
                    "externalDocs": {
                        "description": "Authentication guide",
                        "url": "https://docs.neoforge.dev/authentication"
                    }
                },
                {
                    "name": "users",
                    "description": "User management and profiles"
                },
                {
                    "name": "organizations",
                    "description": "Multi-tenant organization management"
                },
                {
                    "name": "projects",
                    "description": "Project and workspace management"
                },
                {
                    "name": "billing",
                    "description": "Subscription and billing management with Stripe integration"
                },
                {
                    "name": "rbac",
                    "description": "Role-based access control and permissions"
                },
                {
                    "name": "analytics",
                    "description": "Analytics and reporting endpoints"
                },
                {
                    "name": "webhooks",
                    "description": "Webhook management and event subscriptions"
                }
            ]

            # Add code examples to common operations
            self._add_code_examples(openapi_schema)

            app.openapi_schema = openapi_schema
            return app.openapi_schema

        # Override the default OpenAPI schema
        app.openapi = custom_openapi

    def _add_code_examples(self, schema: dict) -> None:
        """Add comprehensive code examples to API endpoints."""
        examples = {
            # Authentication examples
            "/api/v1/auth/login": {
                "post": {
                    "x-codegen-request-body-name": "credentials",
                    "x-code-samples": [
                        {
                            "lang": "curl",
                            "source": """curl -X POST "https://api.neoforge.dev/api/v1/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "user@example.com",
    "password": "your-secure-password"
  }'"""
                        },
                        {
                            "lang": "javascript",
                            "source": """const response = await fetch('https://api.neoforge.dev/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'user@example.com',
    password: 'your-secure-password'
  })
});

const { access_token } = await response.json();"""
                        },
                        {
                            "lang": "python",
                            "source": """import requests

response = requests.post(
    'https://api.neoforge.dev/api/v1/auth/login',
    json={
        'username': 'user@example.com',
        'password': 'your-secure-password'
    }
)

access_token = response.json()['access_token']"""
                        }
                    ]
                }
            },
            # Projects examples
            "/api/v1/projects": {
                "get": {
                    "x-code-samples": [
                        {
                            "lang": "curl",
                            "source": """curl -X GET "https://api.neoforge.dev/api/v1/projects" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -G -d "limit=20" -d "cursor=eyJpZCI6MTIzfQ"""
                        },
                        {
                            "lang": "javascript",
                            "source": """const response = await fetch('https://api.neoforge.dev/api/v1/projects?limit=20', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  }
});

const { items, pagination } = await response.json();"""
                        }
                    ]
                },
                "post": {
                    "x-code-samples": [
                        {
                            "lang": "curl",
                            "source": """curl -X POST "https://api.neoforge.dev/api/v1/projects" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My New Project",
    "description": "A revolutionary application",
    "settings": {
      "privacy": "private",
      "features": ["analytics", "webhooks"]
    }
  }'"""
                        }
                    ]
                }
            }
        }

        # Apply examples to the schema
        if "paths" in schema:
            for path, path_item in schema["paths"].items():
                if path in examples:
                    for method, method_examples in examples[path].items():
                        if method in path_item:
                            path_item[method].update(method_examples)

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