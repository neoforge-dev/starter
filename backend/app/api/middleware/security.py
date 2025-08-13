"""Enhanced security middleware for production-ready applications."""
from typing import Callable, Optional
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from sqlalchemy.exc import SQLAlchemyError
import structlog
import time
import uuid

from app.core.config import Settings, get_settings, Environment
from prometheus_client import Counter

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
        # Optionally add report-only header in non-production for observability
        if not self.is_production:
            response.headers["Content-Security-Policy-Report-Only"] = (
                response.headers["Content-Security-Policy"]
            )
            response.headers["Report-To"] = (
                '{"group":"csp-endpoint","max_age":10886400,'
                '"endpoints":[{"url":"/api/v1/security/report"}],"include_subdomains":true}'
            )
        
        # Permissions Policy (formerly Feature-Policy)
        response.headers["Permissions-Policy"] = self._build_permissions_policy()
        
        # Additional production security headers
        if self.is_production:
            response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
            response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
            response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
            response.headers["Cross-Origin-Resource-Policy"] = "same-site"
        
        # Remove server information leakage (MutableHeaders supports deletion via del)
        try:
            if "server" in response.headers:
                del response.headers["server"]
        except Exception:
            pass
        
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
                "connect-src": ["'self'"] + self.settings.cors_origins + ["ws:", "wss:", "http://localhost:8000", "http://localhost:3000"],  # Allow websockets for dev
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
    """Production-ready rate limiting middleware with Redis backend and JWT support."""
    
    def __init__(self, app: ASGIApp, settings: Settings, redis_client=None):
        """Initialize rate limiting middleware."""
        super().__init__(app)
        self.settings = settings
        self.redis = redis_client
        # Metrics
        self.rate_limit_violations = Counter(
            "rate_limit_violations_total",
            "Total number of HTTP requests blocked due to rate limiting",
            ["endpoint"],
        )
        
    async def _get_redis(self):
        """Get Redis connection."""
        if not self.redis:
            from app.core.redis import get_redis
            self.redis = await anext(get_redis())
        return self.redis
    
    async def _get_user_id(self, request: Request):
        """Extract user ID from JWT token if present."""
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
            
        token = auth_header.split(" ")[1]
        try:
            import jwt
            payload = jwt.decode(
                token,
                self.settings.secret_key.get_secret_value(),
                algorithms=[self.settings.jwt_algorithm]
            )
            return str(payload.get("sub"))
        except jwt.InvalidTokenError:
            return None
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request with proxy support."""
        # Check for forwarded headers (behind proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection IP
        return request.client.host if request.client else "unknown"
    
    def _get_rate_limit_key(self, request: Request, client_ip: str, user_id=None) -> str:
        """Generate rate limit key based on IP and/or user ID."""
        # Base key includes the path to separate limits by endpoint
        base_key = f"ratelimit:{request.url.path}"
        
        if user_id and self.settings.rate_limit_by_key:
            # Use user ID if available and rate_limit_by_key is enabled
            return f"{base_key}:user:{user_id}"
        elif self.settings.rate_limit_by_ip:
            # Fall back to IP-based limiting if enabled
            return f"{base_key}:ip:{client_ip}"
        else:
            # Global rate limiting if neither option is enabled
            return base_key
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Apply rate limiting per client IP and/or user, attach standard headers."""
        # Skip rate limiting for health/monitoring endpoints
        if request.url.path in ["/health", "/metrics"]:
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        user_id = await self._get_user_id(request)

        limited, headers = await self._rate_limit_check_and_headers(request, client_ip, user_id)
        if limited:
            logger.warning(
                "rate_limit_exceeded",
                client_ip=client_ip,
                user_id=user_id,
                path=request.url.path,
                method=request.method,
            )
            try:
                self.rate_limit_violations.labels(endpoint=request.url.path).inc()
            except Exception:
                pass
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please try again later."},
                headers={**headers, "Retry-After": str(self.settings.rate_limit_window)},
            )

        response = await call_next(request)
        for key, value in headers.items():
            response.headers[key] = value
        return response
    
    async def _rate_limit_check_and_headers(self, request: Request, client_ip: str, user_id=None) -> tuple[bool, dict[str, str]]:
        """Check limit and compute X-RateLimit headers."""
        redis = await self._get_redis()
        if not redis:
            logger.error("Redis connection not available for rate limiting")
            now = int(time.time())
            headers = {
                "X-RateLimit-Limit": str(self.settings.rate_limit_requests),
                "X-RateLimit-Remaining": str(self.settings.rate_limit_requests),
                "X-RateLimit-Reset": str(now + self.settings.rate_limit_window),
            }
            return False, headers
        
        # Get appropriate rate limit based on authentication and endpoint
        is_login = request.url.path.endswith("/auth/token")
        if is_login:
            rate_limit = self.settings.rate_limit_login_requests
        else:
            rate_limit = (
                self.settings.rate_limit_auth_requests if user_id else self.settings.rate_limit_requests
            )
        
        # Get rate limit key
        key = self._get_rate_limit_key(request, client_ip, user_id)
        
        try:
            # Use Redis pipeline for atomic operations
            pipe = redis.pipeline()
            
            # Increment request count and set expiry
            pipe.incr(key)
            pipe.expire(key, self.settings.rate_limit_window)
            
            # Execute pipeline
            results = await pipe.execute()
            request_count = results[0]  # Get count from increment result
            
            logger.info(
                "rate_limit_check",
                key=key,
                count=request_count,
                limit=rate_limit,
                window_start=int(time.time()) - self.settings.rate_limit_window,
                user_id=user_id,
                client_ip=client_ip
            )
            # Compute headers
            now = int(time.time())
            limited = int(request_count) > int(rate_limit)
            remaining = max(0, int(rate_limit) - int(request_count))
            headers = {
                "X-RateLimit-Limit": str(rate_limit),
                "X-RateLimit-Remaining": str(0 if limited else remaining),
                "X-RateLimit-Reset": str(now + self.settings.rate_limit_window),
            }
            return limited, headers
            
        except Exception as e:
            logger.exception(
                "rate_limit_error",
                key=key,
                error=str(e),
            )
            now = int(time.time())
            headers = {
                "X-RateLimit-Limit": str(self.settings.rate_limit_requests),
                "X-RateLimit-Remaining": str(self.settings.rate_limit_requests),
                "X-RateLimit-Reset": str(now + self.settings.rate_limit_window),
            }
            return False, headers

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Middleware for handling errors and logging requests."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process the request and handle any errors."""
        start_time = time.time()
        
        try:
            response = await call_next(request)
            
            # Log request details
            process_time = (time.time() - start_time) * 1000
            logger.info(
                "request_processed",
                method=request.method,
                url=str(request.url),
                status_code=response.status_code,
                processing_time_ms=round(process_time, 2),
                request_id=getattr(request.state, 'request_id', None)
            )
            
            return response
            
        except RequestValidationError as e:
            # Handle validation errors
            logger.warning(
                "validation_error",
                method=request.method,
                url=str(request.url),
                errors=str(e.errors()),
                request_id=getattr(request.state, 'request_id', None)
            )
            return JSONResponse(
                status_code=422,
                content={
                    "detail": "Validation Error",
                    "errors": e.errors(),
                },
            )
            
        except SQLAlchemyError as e:
            # Handle database errors
            logger.error(
                "database_error",
                method=request.method,
                url=str(request.url),
                error=str(e),
                request_id=getattr(request.state, 'request_id', None)
            )
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Database Error",
                    "message": "An error occurred while processing your request",
                },
            )
            
        except Exception as e:
            # Handle unexpected errors
            logger.exception(
                "unexpected_error",
                method=request.method,
                url=str(request.url),
                error=str(e),
                request_id=getattr(request.state, 'request_id', None)
            )
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal Server Error",
                    "message": "An unexpected error occurred",
                },
            )

def setup_security_middleware(app: FastAPI) -> None:
    """Set up comprehensive security and middleware for the application."""
    current_settings = get_settings()
    
    # 1. Add CORS middleware (must be early in the chain)
    if current_settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in current_settings.cors_origins],
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
                "X-Request-ID",
            ],
            max_age=600,  # 10 minutes
        )
    
    # 2. Add security headers middleware (should be early for all responses)
    app.add_middleware(SecurityHeadersMiddleware, settings=current_settings)
    
    # 3. Add error handling middleware (must be after CORS/Security headers)
    app.add_middleware(ErrorHandlerMiddleware)
    
    # 4. Add rate limiting middleware (conditionally, should be last)
    if current_settings.enable_rate_limiting:
        app.add_middleware(RateLimitingMiddleware, settings=current_settings)
    
    logger.info(
        "comprehensive_middleware_configured",
        environment=current_settings.environment.value,
        cors_origins=len(current_settings.cors_origins) if current_settings.cors_origins else 0,
        rate_limiting_enabled=current_settings.enable_rate_limiting,
        rate_limit_requests=current_settings.rate_limit_requests,
        rate_limit_window=current_settings.rate_limit_window,
        production_mode=current_settings.environment == Environment.PRODUCTION
    ) 