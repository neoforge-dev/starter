"""Rate limiting middleware."""
from typing import Callable, Optional, Tuple, NamedTuple
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from redis.asyncio import Redis
import jwt
import structlog
import time

from app.core.config import settings

logger = structlog.get_logger()

class RateLimitInfo(NamedTuple):
    """Rate limit information."""
    is_allowed: bool
    remaining: int
    limit: int

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting requests."""
    
    def __init__(self, app: ASGIApp, redis_client: Optional[Redis] = None):
        """Initialize middleware."""
        super().__init__(app)
        self.redis = redis_client
        self.window = settings.rate_limit_window
        self.max_requests = settings.rate_limit_requests
        self.max_auth_requests = settings.rate_limit_auth_requests
    
    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Process request with rate limiting."""
        try:
            # Skip rate limiting for health check endpoints
            if request.url.path == "/health":
                return await call_next(request)
            
            # Get client identifier (user ID or IP)
            client_id = await self._get_client_id(request)
            
            # Skip rate limiting for authenticated users
            if client_id.startswith("user:"):
                response = await call_next(request)
                return response
            
            # Check rate limit and get remaining requests
            rate_limit_info = await self._check_rate_limit(client_id)
            if not rate_limit_info.is_allowed:
                response = JSONResponse(
                    status_code=429,
                    content={"detail": "Too Many Requests"}
                )
                self._add_rate_limit_headers(response, rate_limit_info)
                return response

            # Process the request
            response = await call_next(request)

            # Add rate limit headers
            self._add_rate_limit_headers(response, rate_limit_info)

            return response
            
        except Exception as e:
            logger.exception(
                "rate_limit_error",
                error=str(e),
                path=request.url.path,
            )
            # Allow request through if Redis is down
            return await call_next(request)
    
    async def _get_client_id(self, request: Request) -> str:
        """Get client identifier from request."""
        try:
            token = request.headers.get("Authorization", "").replace("Bearer ", "")
            if not token:
                return request.client.host or "unknown"
            
            payload = jwt.decode(
                token,
                settings.secret_key.get_secret_value(),
                algorithms=["HS256"]
            )
            return f"user:{payload.get('sub', request.client.host or 'unknown')}"
        except Exception as e:
            logger.error(
                "Rate limit error",
                extra={
                    "error": str(e),
                    "path": request.url.path
                },
                exc_info=True
            )
            return request.client.host or "unknown"
    
    async def _check_rate_limit(self, client_id: str) -> RateLimitInfo:
        """Check if client has exceeded rate limit.
        
        Returns:
            RateLimitInfo containing:
            - is_allowed: Whether the request is allowed
            - remaining: Number of remaining requests
            - limit: Maximum number of requests allowed
        """
        if not self.redis:
            return RateLimitInfo(True, self.max_requests, self.max_requests)
            
        try:
            # Get current window
            now = int(time.time())
            window_key = f"ratelimit:{client_id}:{now // self.window}"
            
            # Get current count before incrementing
            current_count = await self.redis.get(window_key)
            current_count = int(current_count) if current_count else 0
            
            # Increment request count
            count = await self.redis.incr(window_key)
            if count == 1:
                await self.redis.expire(window_key, self.window)
            
            # Check limit based on client type
            max_requests = (
                self.max_auth_requests
                if client_id.startswith("user:")
                else self.max_requests
            )
            
            # Calculate remaining requests based on count before increment
            remaining = max(0, max_requests - count)
            return RateLimitInfo(count <= max_requests, remaining, max_requests)
            
        except Exception as e:
            logger.exception(
                "rate_limit_check_error",
                error=str(e),
                client_id=client_id,
            )
            return RateLimitInfo(True, self.max_requests, self.max_requests)  # Allow request through on Redis error
            
    def _add_rate_limit_headers(self, response: Response, rate_limit_info: RateLimitInfo) -> None:
        """Add rate limit headers to response."""
        response.headers["X-RateLimit-Limit"] = str(rate_limit_info.limit)
        response.headers["X-RateLimit-Remaining"] = str(rate_limit_info.remaining)
        if rate_limit_info.remaining == 0:
            response.headers["Retry-After"] = str(self.window)


def setup_rate_limit_middleware(app: FastAPI, redis_client: Redis) -> None:
    """Set up rate limit middleware."""
    app.add_middleware(RateLimitMiddleware, redis_client=redis_client)
    
    logger.info(
        "rate_limit_middleware_configured",
        window=settings.rate_limit_window,
        max_requests=settings.rate_limit_requests,
        max_auth_requests=settings.rate_limit_auth_requests,
    ) 