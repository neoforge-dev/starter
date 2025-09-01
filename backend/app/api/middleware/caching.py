"""Advanced caching middleware for API performance optimization.

This middleware provides intelligent HTTP response caching with:
- Redis-based response caching for expensive operations
- Smart cache invalidation based on request patterns
- ETags and conditional request support
- Performance metrics and monitoring
- Cost-efficient caching strategies for bootstrapped applications
"""
import hashlib
import json
import time
from datetime import timedelta
from typing import Any, Callable, Dict, Optional, Set

import structlog
from app.utils.http_cache import (
    cache_tracker,
    compute_cache_key,
    is_cacheable_request,
    not_modified,
    set_cache_headers,
)
from fastapi import HTTPException, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.cache import Cache, get_cache
from app.core.config import Environment, get_settings

logger = structlog.get_logger()


class ResponseCachingMiddleware(BaseHTTPMiddleware):
    """Intelligent response caching middleware for cost optimization."""

    def __init__(
        self,
        app: ASGIApp,
        cache_ttl: int = 300,  # 5 minutes default
        max_cache_size: int = 1000,  # Maximum cached responses
        cache_patterns: Optional[Set[str]] = None,
        skip_patterns: Optional[Set[str]] = None,
    ):
        super().__init__(app)
        self.cache_ttl = cache_ttl
        self.max_cache_size = max_cache_size
        self.settings = get_settings()

        # Default patterns for caching
        self.cache_patterns = cache_patterns or {
            "/api/v1/projects",
            "/api/v1/community/posts",
            "/api/v1/support/tickets",
            "/api/v1/users",
            "/api/v1/health",
            "/api/v1/config",
        }

        # Patterns to skip caching
        self.skip_patterns = skip_patterns or {
            "/api/v1/auth",
            "/api/v1/metrics",
            "/api/v1/webhooks",
        }

        # Cache statistics
        self.stats = {
            "requests": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "cache_errors": 0,
        }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with intelligent caching logic."""
        start_time = time.time()
        self.stats["requests"] += 1

        # Check if request should be cached
        if not self._should_cache_request(request):
            response = await call_next(request)
            return self._add_cache_headers(response, cached=False)

        # Check cache for existing response
        cache_key = self._generate_cache_key(request)
        cached_response = await self._get_cached_response(cache_key, request)

        if cached_response:
            self.stats["cache_hits"] += 1
            cache_tracker.record_hit()

            # Add performance headers
            process_time = time.time() - start_time
            cached_response.headers["X-Process-Time"] = str(
                round(process_time * 1000, 2)
            )
            cached_response.headers["X-Cache-Status"] = "HIT"

            logger.debug(
                "cache_hit",
                path=request.url.path,
                cache_key=cache_key,
                process_time_ms=round(process_time * 1000, 2),
            )

            return cached_response

        # Cache miss - execute request
        self.stats["cache_misses"] += 1
        cache_tracker.record_miss()

        try:
            response = await call_next(request)
            process_time = time.time() - start_time

            # Cache successful responses
            if self._should_cache_response(response):
                await self._cache_response(cache_key, response, request)
                cache_status = "MISS-CACHED"
            else:
                cache_status = "MISS-SKIP"

            # Add performance and cache headers
            response.headers["X-Process-Time"] = str(round(process_time * 1000, 2))
            response.headers["X-Cache-Status"] = cache_status

            logger.debug(
                "cache_miss",
                path=request.url.path,
                cache_key=cache_key,
                process_time_ms=round(process_time * 1000, 2),
                status=cache_status,
            )

            return self._add_cache_headers(response, cached=True)

        except Exception as e:
            self.stats["cache_errors"] += 1
            logger.error(
                "cache_middleware_error",
                path=request.url.path,
                error=str(e),
                error_type=type(e).__name__,
            )
            # Don't let cache errors break the request
            response = await call_next(request)
            return self._add_cache_headers(response, cached=False)

    def _should_cache_request(self, request: Request) -> bool:
        """Determine if request should be cached based on patterns and conditions."""
        # Only cache GET requests
        if request.method != "GET":
            return False

        path = request.url.path

        # Check skip patterns first
        if any(pattern in path for pattern in self.skip_patterns):
            return False

        # Check cache patterns
        should_cache = any(pattern in path for pattern in self.cache_patterns)

        # Additional checks
        if should_cache:
            should_cache = is_cacheable_request(request)

        return should_cache

    def _should_cache_response(self, response: Response) -> bool:
        """Determine if response should be cached."""
        # Only cache successful responses
        if response.status_code != 200:
            return False

        # Don't cache responses with cache-control no-cache
        cache_control = response.headers.get("cache-control", "")
        if "no-cache" in cache_control or "no-store" in cache_control:
            return False

        # Don't cache very large responses (cost optimization)
        content_length = response.headers.get("content-length")
        if content_length and int(content_length) > 100000:  # 100KB limit
            return False

        return True

    def _generate_cache_key(self, request: Request) -> str:
        """Generate cache key from request parameters."""
        # Extract query parameters
        params = dict(request.query_params)

        # Include user context if available (for user-specific caching)
        user_id = getattr(request.state, "user_id", None)

        return compute_cache_key(
            endpoint=request.url.path, params=params, user_id=user_id
        )

    async def _get_cached_response(
        self, cache_key: str, request: Request
    ) -> Optional[Response]:
        """Retrieve cached response if available and valid."""
        try:
            cache = await get_cache()
            cached_data = await cache.get(cache_key)

            if not cached_data:
                return None

            # Parse cached response data
            response_data = (
                json.loads(cached_data) if isinstance(cached_data, str) else cached_data
            )

            # Create response from cached data
            response = JSONResponse(
                content=response_data.get("content"),
                status_code=response_data.get("status_code", 200),
                headers=response_data.get("headers", {}),
            )

            # Check ETags for conditional requests
            etag = response.headers.get("etag")
            if etag and not_modified(request, etag):
                return Response(status_code=304)

            return response

        except Exception as e:
            logger.warning("cache_get_error", cache_key=cache_key, error=str(e))
            return None

    async def _cache_response(
        self, cache_key: str, response: Response, request: Request
    ) -> None:
        """Cache response for future requests."""
        try:
            # Extract response content
            content = None
            if hasattr(response, "body"):
                try:
                    content = (
                        json.loads(response.body.decode()) if response.body else None
                    )
                except (json.JSONDecodeError, AttributeError):
                    content = response.body.decode() if response.body else None

            # Prepare cache data
            cache_data = {
                "content": content,
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "cached_at": time.time(),
            }

            # Determine cache TTL based on request type
            ttl = self._calculate_cache_ttl(request, response)

            cache = await get_cache()
            await cache.set(cache_key, cache_data, expire=ttl)

            logger.debug(
                "response_cached",
                cache_key=cache_key,
                ttl_seconds=ttl,
                response_size=len(str(cache_data)),
            )

        except Exception as e:
            logger.warning("cache_set_error", cache_key=cache_key, error=str(e))

    def _calculate_cache_ttl(self, request: Request, response: Response) -> int:
        """Calculate appropriate cache TTL based on request characteristics."""
        path = request.url.path

        # Cost-optimized caching strategy
        if self.settings.environment == Environment.PRODUCTION:
            # Production: Longer cache times for cost efficiency
            if "projects" in path or "community" in path:
                return 600  # 10 minutes for user-generated content
            elif "support" in path:
                return 120  # 2 minutes for support tickets (more dynamic)
            elif "health" in path or "config" in path:
                return 1800  # 30 minutes for static-ish content
            else:
                return self.cache_ttl
        else:
            # Development: Shorter cache times
            return min(self.cache_ttl, 120)  # Max 2 minutes in dev

    def _add_cache_headers(self, response: Response, cached: bool) -> Response:
        """Add appropriate cache headers to response."""
        if cached and response.status_code == 200:
            # Use environment-aware cache headers
            set_cache_headers(
                response=response,
                max_age=self.cache_ttl,
                environment=self.settings.environment,
                pagination_type="cursor",  # Assume cursor for performance
                is_filtered="filter" in str(response.headers.get("vary", "")).lower(),
                is_mutable=True,
            )

        # Always add cache statistics
        response.headers["X-Cache-Stats"] = json.dumps(
            {
                "hit_rate": f"{(self.stats['cache_hits'] / max(self.stats['requests'], 1) * 100):.1f}%",
                "total_requests": self.stats["requests"],
            }
        )

        return response

    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics."""
        hit_rate = self.stats["cache_hits"] / max(self.stats["requests"], 1)

        return {
            "middleware_stats": self.stats,
            "hit_rate": hit_rate,
            "miss_rate": 1.0 - hit_rate,
            "cache_patterns": list(self.cache_patterns),
            "skip_patterns": list(self.skip_patterns),
            "cache_ttl": self.cache_ttl,
            "global_cache_stats": cache_tracker.get_stats(),
        }


def setup_caching_middleware(
    app: ASGIApp,
    cache_ttl: int = 300,
    max_cache_size: int = 1000,
    enable_middleware: bool = True,
) -> None:
    """Setup response caching middleware with optimized defaults.

    Args:
        app: FastAPI application
        cache_ttl: Default cache TTL in seconds
        max_cache_size: Maximum number of cached responses
        enable_middleware: Whether to enable the middleware
    """
    settings = get_settings()

    # Only enable in production and staging for cost optimization
    if enable_middleware and settings.environment in [
        Environment.PRODUCTION,
        Environment.STAGING,
    ]:
        logger.info(
            "caching_middleware_enabled",
            cache_ttl=cache_ttl,
            max_cache_size=max_cache_size,
            environment=settings.environment.value,
        )

        app.add_middleware(
            ResponseCachingMiddleware,
            cache_ttl=cache_ttl,
            max_cache_size=max_cache_size,
        )
    else:
        logger.info(
            "caching_middleware_disabled",
            reason="development_environment"
            if not enable_middleware
            else "explicit_disable",
            environment=settings.environment.value,
        )
