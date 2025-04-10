"""Security middleware for the application."""
from typing import Callable
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import structlog

from app.core.config import Settings, get_settings

logger = structlog.get_logger()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware for adding security headers to responses."""
    
    def __init__(self, app: ASGIApp, settings: Settings):
        """Initialize middleware."""
        super().__init__(app)
        self.settings = settings
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Add security headers to response."""
        response = await call_next(request)
        
        # Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = self._build_csp_header()
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
            "magnetometer=(), microphone=(), payment=(), usb=()"
        )
        
        return response
    
    def _build_csp_header(self) -> str:
        """Build Content Security Policy header."""
        # Basic CSP directives
        csp = {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'"],  # Consider removing unsafe-inline in production
            "style-src": ["'self'", "'unsafe-inline'"],
            "img-src": ["'self'", "data:", "https:"],
            "font-src": ["'self'", "https:", "data:"],
            "connect-src": ["'self'"] + self.settings.cors_origins,
            "frame-ancestors": ["'none'"],
            "form-action": ["'self'"],
            "base-uri": ["'self'"],
            "object-src": ["'none'"],
        }
        
        # Build CSP string
        return "; ".join(
            f"{key} {' '.join(values)}"
            for key, values in csp.items()
        )

def setup_security_middleware(app: FastAPI) -> None:
    """Set up security middleware for the application."""
    # NOTE: This setup function is likely obsolete now that main.py uses the consolidated setup_middleware.
    # The logic here should be integrated into app.api.middleware.setup_middleware.
    current_settings = get_settings() # Fetch settings temporarily for standalone use potential
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=current_settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=[
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
        ],
        expose_headers=[
            "Content-Length",
            "Content-Range",
        ],
        max_age=600,  # 10 minutes
    )
    
    # Add security headers middleware
    app.add_middleware(SecurityHeadersMiddleware, settings=current_settings)
    
    logger.info(
        "security_middleware_configured",
        cors_origins=current_settings.cors_origins,
    ) 