"""API middleware for error handling and request validation."""
from typing import Callable, Optional
import time
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware
from redis.asyncio import Redis
import structlog
import jwt

from app.core.config import settings
from app.core.redis import get_redis

logger = structlog.get_logger()

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
            )
            
            return response
            
        except RequestValidationError as e:
            # Handle validation errors
            logger.warning(
                "validation_error",
                method=request.method,
                url=str(request.url),
                errors=str(e.errors()),
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
            )
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal Server Error",
                    "message": "An unexpected error occurred",
                },
            )

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting requests."""
    
    def __init__(self, app: FastAPI, redis_client: Optional[Redis] = None):
        """Initialize middleware."""
        super().__init__(app)
        self.redis: Optional[Redis] = redis_client
    
    async def _get_redis(self) -> Redis:
        """Get Redis connection."""
        if not self.redis:
            self.redis = await anext(get_redis())
        return self.redis
    
    async def _get_user_id(self, request: Request) -> Optional[str]:
        """Extract user ID from JWT token if present."""
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
            
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(
                token,
                settings.secret_key,
                algorithms=[settings.algorithm]
            )
            return str(payload.get("sub"))
        except jwt.InvalidTokenError:
            return None
    
    def _get_rate_limit_key(self, request: Request, client_ip: str, user_id: Optional[str] = None) -> str:
        """Generate rate limit key based on IP and/or user ID."""
        # Base key includes the path to separate limits by endpoint
        base_key = f"ratelimit:{request.url.path}"
        
        if user_id and settings.rate_limit_by_key:
            # Use user ID if available and rate_limit_by_key is enabled
            return f"{base_key}:user:{user_id}"
        elif settings.rate_limit_by_ip:
            # Fall back to IP-based limiting if enabled
            return f"{base_key}:ip:{client_ip}"
        else:
            # Global rate limiting if neither option is enabled
            return base_key
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process the request and apply rate limiting."""
        # Skip rate limiting for certain paths
        if request.url.path in ["/health", "/metrics"]:
            return await call_next(request)
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Get user ID if authenticated
        user_id = await self._get_user_id(request)
        
        # Check if request should be rate limited
        should_limit = await self._should_rate_limit(request, client_ip, user_id)
        if should_limit:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too Many Requests",
                    "message": "Please try again later",
                },
            )
        
        return await call_next(request)
    
    async def _should_rate_limit(
        self,
        request: Request,
        client_ip: str,
        user_id: Optional[str] = None
    ) -> bool:
        """Check if request should be rate limited based on rules."""
        redis = await self._get_redis()
        if not redis:
            logger.error("Redis connection not available for rate limiting")
            return False
        
        # Get appropriate rate limit based on authentication
        rate_limit = (
            settings.rate_limit_auth_requests
            if user_id
            else settings.rate_limit_requests
        )
        
        # Get rate limit key
        key = self._get_rate_limit_key(request, client_ip, user_id)
        
        try:
            # Use Redis pipeline for atomic operations
            pipe = redis.pipeline()
            
            # Increment request count and set expiry
            pipe.incr(key)
            pipe.expire(key, settings.rate_limit_window)
            
            # Execute pipeline
            results = await pipe.execute()
            request_count = results[0]  # Get count from increment result
            
            logger.info(
                "rate_limit_check",
                key=key,
                count=request_count,
                limit=rate_limit,
                window_start=int(time.time()) - settings.rate_limit_window,
                now=int(time.time()),
            )
            
            # Check if rate limit exceeded
            if request_count > rate_limit:
                logger.warning(
                    "rate_limit_exceeded",
                    key=key,
                    count=request_count,
                    limit=rate_limit,
                )
                return True
            
            return False
            
        except Exception as e:
            logger.exception(
                "rate_limit_error",
                key=key,
                error=str(e),
            )
            return False

def setup_middleware(app: FastAPI) -> None:
    """Set up all middleware for the application."""
    # Add error handling middleware
    app.add_middleware(ErrorHandlerMiddleware)
    
    # Add rate limiting middleware
    if settings.enable_rate_limiting:
        app.add_middleware(RateLimitMiddleware) 