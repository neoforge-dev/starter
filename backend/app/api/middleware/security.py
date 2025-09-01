"""Enhanced security middleware for production-ready applications."""
import hashlib
import re
import time
import uuid
from contextlib import asynccontextmanager
from typing import Callable, Optional

import structlog
from app.db.session import get_db
from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from structlog import contextvars as structlog_contextvars

from app.core.config import Environment, Settings, get_settings
from app.core.metrics import get_metrics
from app.core.security_audit import (
    SecurityEventType,
    SecuritySeverity,
    security_auditor,
)

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
        # Bind request_id into structured log context so all logs include it
        try:
            structlog_contextvars.bind_contextvars(request_id=request_id)
        except Exception:
            pass

        response = await call_next(request)

        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        # Add trace correlation header if available (OpenTelemetry)
        try:
            from opentelemetry import trace as _otel_trace

            span = _otel_trace.get_current_span()
            ctx = span.get_span_context() if span else None
            if ctx and getattr(ctx, "trace_id", 0):
                trace_id_hex = f"{ctx.trace_id:032x}"
                response.headers["X-Trace-Id"] = trace_id_hex
        except Exception:
            pass

        # Core security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # HSTS - only in production with HTTPS
        if self.is_production:
            response.headers[
                "Strict-Transport-Security"
            ] = "max-age=31536000; includeSubDomains; preload"

        # Content Security Policy
        response.headers["Content-Security-Policy"] = self._build_csp_header()
        # Optionally add report-only header in non-production for observability
        if not self.is_production:
            response.headers["Content-Security-Policy-Report-Only"] = response.headers[
                "Content-Security-Policy"
            ]
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

        try:
            # Avoid leaking context across requests
            structlog_contextvars.unbind_contextvars("request_id")
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
                "style-src": [
                    "'self'",
                    "'unsafe-inline'",
                ],  # Allow inline styles for frameworks
                "img-src": ["'self'", "data:", "https:"],
                "font-src": ["'self'", "https:", "data:"],
                "connect-src": ["'self'"]
                + [
                    origin
                    for origin in self.settings.cors_origins
                    if origin.startswith("https://")
                ],
                "frame-ancestors": ["'none'"],
                "form-action": ["'self'"],
                "base-uri": ["'self'"],
                "object-src": ["'none'"],
                "frame-src": ["'none'"],
                "worker-src": ["'self'"],
                "manifest-src": ["'self'"],
                "media-src": ["'self'", "https:"],
                "upgrade-insecure-requests": [],
            }
        else:
            # Development-friendly CSP
            csp = {
                "default-src": ["'self'"],
                "script-src": [
                    "'self'",
                    "'unsafe-inline'",
                    "'unsafe-eval'",
                ],  # Allow eval for dev tools
                "style-src": ["'self'", "'unsafe-inline'"],
                "img-src": ["'self'", "data:", "https:", "http:"],
                "font-src": ["'self'", "https:", "data:", "http:"],
                "connect-src": ["'self'"]
                + self.settings.cors_origins
                + [
                    "ws:",
                    "wss:",
                    "http://localhost:8000",
                    "http://localhost:3000",
                ],  # Allow websockets for dev
                "frame-ancestors": ["'none'"],
                "form-action": ["'self'"],
                "base-uri": ["'self'"],
                "object-src": ["'none'"],
                "worker-src": ["'self'", "blob:"],
                "manifest-src": ["'self'"],
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


class ThreatDetectionMiddleware(BaseHTTPMiddleware):
    """Advanced threat detection and blocking middleware."""

    def __init__(self, app: ASGIApp, settings: Settings, redis_client=None):
        """Initialize threat detection middleware."""
        super().__init__(app)
        self.settings = settings
        self.redis = redis_client

        # Suspicious patterns for detection
        self.sql_injection_patterns = [
            r"('|(\-\-)|(;)|(\||\|)|(\*|\*))",
            r"((\%27)|(\'))(\%6F|o|\%4F)(\%72|r|\%52)",
            r"((\%27)|(\'))union",
            r"exec(\s|\+)+(s|x)p\w+",
            r"UNION.+SELECT",
            r"SELECT.+FROM.+WHERE",
            r"INSERT.+INTO.+VALUES",
            r"UPDATE.+SET.+WHERE",
            r"DELETE.+FROM.+WHERE",
        ]

        self.xss_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",
            r"<iframe[^>]*>.*?</iframe>",
            r"<object[^>]*>.*?</object>",
            r"<embed[^>]*>.*?</embed>",
            r"<link[^>]*>.*?</link>",
            r"<meta[^>]*refresh",
        ]

        self.suspicious_user_agents = [
            r"sqlmap",
            r"nikto",
            r"netsparker",
            r"acunetix",
            r"burpsuite",
            r"w3af",
            r"masscan",
            r"nmap",
            r"dirb",
            r"gobuster",
            r"wpscan",
            r"hydra",
        ]

        self.suspicious_paths = [
            r"/wp-admin",
            r"/wp-login",
            r"/admin",
            r"/phpmyadmin",
            r"/xmlrpc",
            r"/config",
            r"/backup",
            r"/test",
            r"/debug",
            r"/.env",
            r"/robots.txt",
            r"/sitemap.xml",
            r"/.git",
            r"/.svn",
            r"/shell",
        ]

        # Compile regex patterns for performance
        self.compiled_sql_patterns = [
            re.compile(p, re.IGNORECASE) for p in self.sql_injection_patterns
        ]
        self.compiled_xss_patterns = [
            re.compile(p, re.IGNORECASE) for p in self.xss_patterns
        ]
        self.compiled_ua_patterns = [
            re.compile(p, re.IGNORECASE) for p in self.suspicious_user_agents
        ]
        self.compiled_path_patterns = [
            re.compile(p, re.IGNORECASE) for p in self.suspicious_paths
        ]

    async def _get_redis(self):
        """Get Redis connection."""
        if not self.redis:
            from app.core.redis import get_redis

            self.redis = await anext(get_redis())
        return self.redis

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"

    def _generate_request_fingerprint(self, request: Request, client_ip: str) -> str:
        """Generate unique fingerprint for request analysis."""
        fingerprint_data = {
            "ip": client_ip,
            "user_agent": request.headers.get("user-agent", ""),
            "accept": request.headers.get("accept", ""),
            "accept_language": request.headers.get("accept-language", ""),
            "accept_encoding": request.headers.get("accept-encoding", ""),
        }

        fingerprint_string = "|".join(str(v) for v in fingerprint_data.values())
        return hashlib.sha256(fingerprint_string.encode()).hexdigest()[:16]

    async def _is_ip_blocked(self, client_ip: str) -> bool:
        """Check if IP is temporarily blocked."""
        try:
            redis = await self._get_redis()
            if not redis:
                return False

            blocked_key = f"blocked_ip:{client_ip}"
            is_blocked = await redis.get(blocked_key)
            return is_blocked is not None
        except Exception as e:
            logger.error(f"Error checking IP block status: {e}")
            return False

    async def _block_ip(self, client_ip: str, duration: int = 3600) -> None:
        """Block IP temporarily."""
        try:
            redis = await self._get_redis()
            if not redis:
                return

            blocked_key = f"blocked_ip:{client_ip}"
            await redis.setex(blocked_key, duration, "blocked")

            logger.warning(
                "ip_blocked",
                client_ip=client_ip,
                duration_seconds=duration,
                blocked_at=time.time(),
            )
        except Exception as e:
            logger.error(f"Error blocking IP {client_ip}: {e}")

    def _detect_sql_injection(self, request: Request) -> bool:
        """Detect potential SQL injection attempts."""
        # Check URL parameters
        query_string = str(request.url.query)
        for pattern in self.compiled_sql_patterns:
            if pattern.search(query_string):
                return True

        # Check URL path
        path = str(request.url.path)
        for pattern in self.compiled_sql_patterns:
            if pattern.search(path):
                return True

        return False

    def _detect_xss_attempt(self, request: Request) -> bool:
        """Detect potential XSS attempts."""
        query_string = str(request.url.query)
        for pattern in self.compiled_xss_patterns:
            if pattern.search(query_string):
                return True

        path = str(request.url.path)
        for pattern in self.compiled_xss_patterns:
            if pattern.search(path):
                return True

        return False

    def _detect_suspicious_user_agent(self, request: Request) -> bool:
        """Detect suspicious user agents."""
        user_agent = request.headers.get("user-agent", "")
        for pattern in self.compiled_ua_patterns:
            if pattern.search(user_agent):
                return True
        return False

    def _detect_suspicious_path(self, request: Request) -> bool:
        """Detect access to suspicious paths."""
        path = str(request.url.path)
        for pattern in self.compiled_path_patterns:
            if pattern.search(path):
                return True
        return False

    async def _log_security_event(
        self,
        event_type: SecurityEventType,
        request: Request,
        client_ip: str,
        details: dict,
    ) -> None:
        """Log security event to audit system."""
        try:
            # Get database session for logging
            db_gen = get_db()
            db = await anext(db_gen)

            await security_auditor.log_security_event(
                db=db,
                event_type=event_type,
                ip_address=client_ip,
                user_agent=request.headers.get("user-agent"),
                resource=str(request.url.path),
                details=details,
                severity=SecuritySeverity.HIGH,
                success=False,
            )

            await db.commit()

        except Exception as e:
            logger.error(f"Failed to log security event: {e}")

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Detect and block threats."""
        client_ip = self._get_client_ip(request)

        # Skip threat detection for health endpoints
        if request.url.path in ["/health", "/metrics"]:
            return await call_next(request)

        # Check if IP is already blocked
        if await self._is_ip_blocked(client_ip):
            logger.warning(
                "blocked_ip_attempt",
                client_ip=client_ip,
                path=request.url.path,
                method=request.method,
            )
            return JSONResponse(
                status_code=403,
                content={"detail": "Access denied. IP temporarily blocked."},
                headers={"X-Blocked-Reason": "IP temporarily blocked"},
            )

        # Generate request fingerprint
        fingerprint = self._generate_request_fingerprint(request, client_ip)
        request.state.fingerprint = fingerprint

        # Threat detection checks
        threats_detected = []

        if self._detect_sql_injection(request):
            threats_detected.append("sql_injection")

        if self._detect_xss_attempt(request):
            threats_detected.append("xss_attempt")

        if self._detect_suspicious_user_agent(request):
            threats_detected.append("suspicious_user_agent")

        if self._detect_suspicious_path(request):
            threats_detected.append("suspicious_path")

        # Handle detected threats
        if threats_detected:
            # Log security event
            event_type = (
                SecurityEventType.SQL_INJECTION_ATTEMPT
                if "sql_injection" in threats_detected
                else SecurityEventType.XSS_ATTEMPT
            )

            details = {
                "threats": threats_detected,
                "user_agent": request.headers.get("user-agent", ""),
                "query_params": dict(request.query_params),
                "path": str(request.url.path),
                "method": request.method,
                "fingerprint": fingerprint,
            }

            await self._log_security_event(event_type, request, client_ip, details)

            # Block IP for repeated threats
            try:
                redis = await self._get_redis()
                if redis:
                    threat_key = f"threats:{client_ip}"
                    threat_count = await redis.incr(threat_key)
                    await redis.expire(threat_key, 3600)  # 1 hour window

                    if threat_count >= 3:  # Block after 3 threats in 1 hour
                        await self._block_ip(client_ip, 3600)  # Block for 1 hour
            except Exception as e:
                logger.error(f"Error tracking threats for IP {client_ip}: {e}")

            logger.warning(
                "security_threat_detected",
                client_ip=client_ip,
                threats=threats_detected,
                path=request.url.path,
                method=request.method,
                user_agent=request.headers.get("user-agent", "")[
                    :100
                ],  # Truncate for logging
                fingerprint=fingerprint,
            )

            return JSONResponse(
                status_code=403,
                content={"detail": "Request blocked due to security policy."},
                headers={
                    "X-Blocked-Reason": "Security policy violation",
                    "X-Threat-Types": ",".join(threats_detected),
                },
            )

        # Request passed all security checks
        return await call_next(request)


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
                algorithms=[self.settings.jwt_algorithm],
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

    def _get_rate_limit_key(
        self, request: Request, client_ip: str, user_id=None
    ) -> str:
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

        limited, headers = await self._rate_limit_check_and_headers(
            request, client_ip, user_id
        )
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
                headers={
                    **headers,
                    "Retry-After": str(self.settings.rate_limit_window),
                },
            )

        response = await call_next(request)
        for key, value in headers.items():
            response.headers[key] = value
        return response

    async def _rate_limit_check_and_headers(
        self, request: Request, client_ip: str, user_id=None
    ) -> tuple[bool, dict[str, str]]:
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
                self.settings.rate_limit_auth_requests
                if user_id
                else self.settings.rate_limit_requests
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
                client_ip=client_ip,
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
        metrics = get_metrics()

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
                request_id=getattr(request.state, "request_id", None),
                trace_id=self._get_trace_id(),
            )

            # Count any 5xx responses (including HTTPException cases not caught below)
            try:
                if response.status_code >= 500:
                    metrics = get_metrics()
                    metrics["http_5xx_responses"].labels(
                        method=request.method, endpoint=request.url.path
                    ).inc()
            except Exception:
                pass

            return response

        except RequestValidationError as e:
            # Handle validation errors
            logger.warning(
                "validation_error",
                method=request.method,
                url=str(request.url),
                errors=str(e.errors()),
                request_id=getattr(request.state, "request_id", None),
                trace_id=self._get_trace_id(),
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
                request_id=getattr(request.state, "request_id", None),
                trace_id=self._get_trace_id(),
            )
            try:
                metrics["http_5xx_responses"].labels(
                    method=request.method, endpoint=request.url.path
                ).inc()
            except Exception:
                pass
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
                request_id=getattr(request.state, "request_id", None),
                trace_id=self._get_trace_id(),
            )
            try:
                metrics["http_5xx_responses"].labels(
                    method=request.method, endpoint=request.url.path
                ).inc()
            except Exception:
                pass
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

    # 4. Add threat detection middleware (before rate limiting)
    app.add_middleware(ThreatDetectionMiddleware, settings=current_settings)

    # 5. Add rate limiting middleware (conditionally, should be last)
    if current_settings.enable_rate_limiting:
        app.add_middleware(RateLimitingMiddleware, settings=current_settings)

    logger.info(
        "comprehensive_middleware_configured",
        environment=current_settings.environment.value,
        cors_origins=len(current_settings.cors_origins)
        if current_settings.cors_origins
        else 0,
        rate_limiting_enabled=current_settings.enable_rate_limiting,
        rate_limit_requests=current_settings.rate_limit_requests,
        rate_limit_window=current_settings.rate_limit_window,
        production_mode=current_settings.environment == Environment.PRODUCTION,
    )


def _get_trace_id(self) -> str | None:
    try:
        from opentelemetry import trace as _otel_trace

        span = _otel_trace.get_current_span()
        ctx = span.get_span_context() if span else None
        if ctx and getattr(ctx, "trace_id", 0):
            return f"{ctx.trace_id:032x}"
    except Exception:
        return None
    return None
