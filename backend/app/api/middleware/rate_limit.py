"""Rate limiting middleware."""
from typing import Callable, Optional
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from redis.asyncio import Redis
import jwt
import structlog
import time

from app.core.config import settings

logger = structlog.get_logger()

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting requests."""
    
    def __init__(self, app: ASGIApp, redis_client: Optional[Redis] = None):
        """Initialize middleware."""
        super().__init__(app)
        self.redis = redis_client
        self.window = settings.rate_limit_window
        self.max_requests = settings.rate_limit_requests
        self.max_auth_requests = settings.rate_limit_auth_requests
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with rate limiting."""
        try:
            # Skip rate limiting for health check endpoints
            if request.url.path == "/health":
                return await call_next(request)
            
            # Get client identifier (user ID or IP)
            client_id = await self._get_client_id(request)
            
            # Check rate limit
            if not await self._check_rate_limit(client_id):
                logger.warning(
                    "rate_limit_exceeded",
                    client_id=client_id,
                    path=request.url.path,
                )
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too Many Requests"},
                )
            
            # Process request
            return await call_next(request)
            
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
        # Try to get user ID from token
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            try:
                token = auth.split(" ")[1]
                payload = jwt.decode(
                    token,
                    settings.secret_key,
                    algorithms=[settings.algorithm],
                )
                return f"user:{payload['sub']}"
            except jwt.InvalidTokenError:
                pass
        
        # Fall back to IP address
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return f"ip:{forwarded.split(',')[0].strip()}"
        return f"ip:{request.client.host}"
    
    async def _check_rate_limit(self, client_id: str) -> bool:
        """Check if client has exceeded rate limit."""
        if not self.redis:
            return True
            
        try:
            # Get current window
            now = int(time.time())
            window_key = f"ratelimit:{client_id}:{now // self.window}"
            
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
            
            return count <= max_requests
            
        except Exception as e:
            logger.exception(
                "rate_limit_check_error",
                error=str(e),
                client_id=client_id,
            )
            return True  # Allow request through on Redis error


def setup_rate_limit_middleware(app: FastAPI, redis_client: Redis) -> None:
    """Set up rate limit middleware."""
    app.add_middleware(RateLimitMiddleware, redis_client=redis_client)
    
    logger.info(
        "rate_limit_middleware_configured",
        window=settings.rate_limit_window,
        max_requests=settings.rate_limit_requests,
        max_auth_requests=settings.rate_limit_auth_requests,
    ) 