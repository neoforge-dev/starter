import jwt
import logging
from fastapi import Request, FastAPI, Response
from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from redis.asyncio import Redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: FastAPI, redis_client: Optional[Redis] = None):
        super().__init__(app)
        self.redis = redis_client
        self.rate_limit_requests = settings.rate_limit_requests
        self.rate_limit_window = settings.rate_limit_window

    async def get_rate_limit_key(self, request: Request) -> str:
        """Get rate limit key based on client IP."""
        return f"rate_limit:ip:{request.client.host}"

    async def dispatch(self, request: Request, call_next) -> Response:
        """Handle rate limiting."""
        if not self.redis:
            logger.warning("Redis client not available, skipping rate limiting")
            return await call_next(request)

        # Skip rate limiting for health check endpoints
        if request.url.path.startswith("/health"):
            return await call_next(request)

        # Skip rate limiting for authenticated users with valid tokens
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header[7:]
                jwt.decode(
                    token, 
                    settings.secret_key.get_secret_value(), 
                    algorithms=["HS256"]
                )
                # Valid token, skip rate limiting
                return await call_next(request)
            except jwt.InvalidTokenError:
                # Invalid token, apply rate limiting
                pass

        try:
            key = await self.get_rate_limit_key(request)
            current = await self.redis.incr(key)
            
            if current == 1:
                await self.redis.expire(key, self.rate_limit_window)

            remaining = max(0, self.rate_limit_requests - current)
            # Calculate reset time (can be simplified to window for fixed window)
            # ttl = await self.redis.ttl(key)
            # reset_time = ttl if ttl > 0 else self.rate_limit_window
            reset_time = self.rate_limit_window # Fixed window reset

            headers = {
                "X-RateLimit-Limit": str(self.rate_limit_requests),
                "X-RateLimit-Remaining": str(remaining),
                "X-RateLimit-Reset": str(reset_time), # Add reset header
            }

            if current > self.rate_limit_requests:
                # Add Retry-After header for rate limited responses
                headers["Retry-After"] = str(reset_time) # Use reset_time here too
                return Response(
                    content='{"detail":"Too Many Requests"}',
                    status_code=429,
                    media_type="application/json",
                    headers=headers
                )

            response = await call_next(request)
            # Add rate limit headers to successful response
            for header, value in headers.items():
                response.headers[header] = value
            return response

        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            # On Redis errors, allow the request but log the error
            return await call_next(request)

async def setup_rate_limit_middleware(app: FastAPI, redis_client: Optional[Redis] = None) -> None:
    """Set up rate limiting middleware for the FastAPI application."""
    app.add_middleware(RateLimitMiddleware, redis_client=redis_client) 