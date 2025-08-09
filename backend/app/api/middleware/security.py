"""Enhanced security middleware for production-ready applications."""
from typing import Callable, Optional
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import structlog
import time
import uuid

from app.core.config import Settings, get_settings, Environment

logger = structlog.get_logger()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Comprehensive security headers middleware with environment-specific configuration."""
    
    def __init__(self, app: ASGIApp, settings: Settings):
        """Initialize middleware with settings."""
        super().__init__(app)
        self.settings = settings
        self.is_production = settings.environment == Environment.PRODUCTION
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Add comprehensive security headers to response."""
        # Generate request ID for tracing
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        response = await call_next(request)
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        # Core security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # HSTS - only in production with HTTPS
        if self.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        
        # Content Security Policy
        response.headers["Content-Security-Policy"] = self._build_csp_header()
        
        # Permissions Policy (formerly Feature-Policy)
        response.headers["Permissions-Policy"] = self._build_permissions_policy()
        
        # Additional production security headers
        if self.is_production:
            response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
            response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
            response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
            response.headers["Cross-Origin-Resource-Policy"] = "same-site"
        
        # Remove server information leakage
        response.headers.pop("server", None)
        
        return response
    
    def _build_csp_header(self) -> str:
        """Build environment-specific Content Security Policy header."""
        if self.is_production:
            # Strict production CSP
            csp = {
                "default-src": ["'self'"],
                "script-src": ["'self'"],  # No unsafe-inline in production
                "style-src": ["'self'", "'unsafe-inline'"],  # Allow inline styles for frameworks
                "img-src": ["'self'", "data:", "https:"],
                "font-src": ["'self'", "https:", "data:"],
                "connect-src": ["'self'"] + [origin for origin in self.settings.cors_origins if origin.startswith("https://")],
                "frame-ancestors": ["'none'"],
                "form-action": ["'self'"],
                "base-uri": ["'self'"],
                "object-src": ["'none'"],
                "frame-src": ["'none'"],
                "worker-src": ["'self'"],
                "manifest-src": ["'self'"],
                "media-src": ["'self'", "https:"],
                "upgrade-insecure-requests": []
            }
        else:
            # Development-friendly CSP
            csp = {
                "default-src": ["'self'"],
                "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],  # Allow eval for dev tools
                "style-src": ["'self'", "'unsafe-inline'"],
                "img-src": ["'self'", "data:", "https:", "http:"],
                "font-src": ["'self'", "https:", "data:", "http:"],
                "connect-src": ["'self'"] + self.settings.cors_origins + ["ws:", "wss:"],  # Allow websockets for dev
                "frame-ancestors": ["'none'"],
                "form-action": ["'self'"],
                "base-uri": ["'self'"],
                "object-src": ["'none'"],
                "worker-src": ["'self'", "blob:"],
                "manifest-src": ["'self'"]
            }
        
        # Build CSP string
        csp_parts = []
        for key, values in csp.items():
            if values:  # Skip empty directives like upgrade-insecure-requests
                csp_parts.append(f"{key} {' '.join(values)}")
            else:
                csp_parts.append(key)
        
        return "; ".join(csp_parts)
    
    def _build_permissions_policy(self) -> str:
        """Build Permissions Policy header."""
        if self.is_production:
            # Strict production permissions
            policies = [
                "accelerometer=()",
                "ambient-light-sensor=()",
                "autoplay=()",
                "battery=()",
                "camera=()",
                "cross-origin-isolated=()",
                "display-capture=()",
                "document-domain=()",
                "encrypted-media=()",
                "execution-while-not-rendered=()",
                "execution-while-out-of-viewport=()",
                "fullscreen=()",
                "geolocation=()",
                "gyroscope=()",
                "keyboard-map=()",
                "magnetometer=()",
                "microphone=()",
                "midi=()",
                "navigation-override=()",
                "payment=()",
                "picture-in-picture=()",
                "publickey-credentials-get=()",
                "screen-wake-lock=()",
                "sync-xhr=()",
                "usb=()",
                "web-share=()",
                "xr-spatial-tracking=()",
            ]
        else:
            # Development-friendly permissions
            policies = [
                "accelerometer=()",
                "camera=()",
                "geolocation=()",
                "gyroscope=()",
                "magnetometer=()",
                "microphone=()",
                "payment=()",
                "usb=()",
            ]
        
        return ", ".join(policies)

class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting middleware with per-endpoint configuration."""
    
    def __init__(self, app: ASGIApp, settings: Settings):
        """Initialize rate limiting middleware."""
        super().__init__(app)
        self.settings = settings
        self.requests = {}  # Simple in-memory store - use Redis in production
        self.window_size = settings.rate_limit_window
        self.max_requests = settings.rate_limit_requests
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Apply rate limiting per client IP."""
        client_ip = self._get_client_ip(request)
        current_time = time.time()
        
        # Clean old entries
        self._cleanup_old_requests(current_time)
        
        # Check rate limit
        if self._is_rate_limited(client_ip, current_time):
            logger.warning(
                "rate_limit_exceeded",
                client_ip=client_ip,
                path=request.url.path,
                method=request.method
            )
            return Response(
                content="Rate limit exceeded",
                status_code=429,
                headers={"Retry-After": str(self.window_size)}
            )
        
        # Record request
        self._record_request(client_ip, current_time)
        
        return await call_next(request)
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        # Check for forwarded headers (behind proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection IP
        return request.client.host if request.client else "unknown"
    
    def _cleanup_old_requests(self, current_time: float) -> None:
        """Remove old request entries outside the time window."""
        cutoff_time = current_time - self.window_size
        for ip in list(self.requests.keys()):
            self.requests[ip] = [
                timestamp for timestamp in self.requests[ip]
                if timestamp > cutoff_time
            ]
            if not self.requests[ip]:
                del self.requests[ip]
    
    def _is_rate_limited(self, client_ip: str, current_time: float) -> bool:
        """Check if client IP is rate limited."""
        if client_ip not in self.requests:
            return False
        
        recent_requests = [
            timestamp for timestamp in self.requests[client_ip]
            if timestamp > current_time - self.window_size
        ]
        
        return len(recent_requests) >= self.max_requests
    
    def _record_request(self, client_ip: str, current_time: float) -> None:
        """Record a new request for the client IP."""
        if client_ip not in self.requests:
            self.requests[client_ip] = []
        self.requests[client_ip].append(current_time)

def setup_security_middleware(app: FastAPI) -> None:
    """Set up comprehensive security middleware for the application."""
    current_settings = get_settings()
    
    # Add security headers middleware (should be first for all responses)
    app.add_middleware(SecurityHeadersMiddleware, settings=current_settings)
    
    # Add rate limiting middleware
    app.add_middleware(RateLimitingMiddleware, settings=current_settings)
    
    logger.info(
        "security_middleware_configured",
        environment=current_settings.environment.value,
        rate_limit_requests=current_settings.rate_limit_requests,
        rate_limit_window=current_settings.rate_limit_window,
        production_mode=current_settings.environment == Environment.PRODUCTION
    ) 