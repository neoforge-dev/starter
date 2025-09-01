"""
HTTP Caching Middleware for NeoForge Backend

Implements intelligent HTTP caching with:
- ETag generation for response caching
- Cache-Control headers for browser caching
- Conditional requests (If-None-Match, If-Modified-Since)
- Cache invalidation strategies
- Redis-based cache storage for server-side caching
"""

import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Callable, Union
from fastapi import Request, Response
from fastapi.responses import JSONResponse

# Use standard logging instead of structlog for compatibility
import logging
logger = logging.getLogger(__name__)


class CacheMiddleware:
    """
    HTTP Caching Middleware with Redis backend support

    Features:
    - ETag generation and validation
    - Conditional request handling
    - Cache-Control header management
    - Server-side response caching
    - Cache invalidation
    """

    def __init__(self, redis_client=None, default_ttl: int = 300):
        self.redis = redis_client
        self.default_ttl = default_ttl
        self.cache_hits = 0
        self.cache_misses = 0

    async def __call__(self, request: Request, call_next: Callable) -> Response:
        """
        Middleware entry point - handles caching for all requests
        """
        # Skip caching for non-GET requests
        if request.method != "GET":
            return await call_next(request)

        # Skip caching for auth endpoints
        if request.url.path.startswith(("/api/v1/auth/", "/api/token")):
            return await call_next(request)

        # Check for conditional requests
        if_none_match = request.headers.get("if-none-match")
        if_modified_since = request.headers.get("if-modified-since")

        # Generate cache key
        cache_key = self._generate_cache_key(request)

        # Try server-side cache first (if Redis is available)
        if self.redis:
            cached_response = await self._get_cached_response(cache_key)
            if cached_response:
                self.cache_hits += 1
                response = JSONResponse(
                    content=cached_response["content"],
                    status_code=cached_response["status_code"],
                    headers=cached_response["headers"]
                )

                # Check conditional request
                if self._is_conditional_match(if_none_match, cached_response.get("etag")):
                    response.status_code = 304
                    response.body = b""
                    response.headers["content-length"] = "0"

                return response

        self.cache_misses += 1

        # Process request
        response = await call_next(request)

        # Add caching headers to successful GET responses
        if response.status_code == 200 and hasattr(response, 'body'):
            await self._add_caching_headers(request, response, cache_key)

        return response

    def _generate_cache_key(self, request: Request) -> str:
        """Generate a unique cache key for the request"""
        key_data = {
            "method": request.method,
            "path": request.url.path,
            "query": dict(request.query_params),
            "user_agent": request.headers.get("user-agent", ""),
        }

        # Add user ID to cache key if authenticated
        if hasattr(request, "user") and request.user:
            key_data["user_id"] = getattr(request.user, "id", None)

        key_string = json.dumps(key_data, sort_keys=True)
        return f"cache:{hashlib.md5(key_string.encode()).hexdigest()}"

    async def _get_cached_response(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached response from Redis"""
        if not self.redis:
            return None

        try:
            cached_data = await self.redis.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Cache retrieval failed: {str(e)}")

        return None

    async def _cache_response(self, cache_key: str, response_data: Dict[str, Any], ttl: Optional[int] = None):
        """Cache response in Redis"""
        if not self.redis:
            return

        try:
            ttl = ttl or self.default_ttl
            await self.redis.setex(cache_key, ttl, json.dumps(response_data))
        except Exception as e:
            logger.warning(f"Cache storage failed: {str(e)}")

    def _generate_etag(self, content: str) -> str:
        """Generate ETag for response content"""
        return f'"{hashlib.md5(content.encode()).hexdigest()}"'

    def _is_conditional_match(self, if_none_match: Optional[str], etag: Optional[str]) -> bool:
        """Check if conditional request matches"""
        if not if_none_match or not etag:
            return False
        return if_none_match == etag or if_none_match == "*" or etag in if_none_match.split(",")

    async def _add_caching_headers(self, request: Request, response: Response, cache_key: str):
        """Add appropriate caching headers to response"""
        # Generate ETag
        if hasattr(response, 'body') and response.body:
            content = response.body.decode('utf-8') if isinstance(response.body, bytes) else str(response.body)
            etag = self._generate_etag(content)
            response.headers["etag"] = etag

        # Set Cache-Control based on content type and endpoint
        path = request.url.path

        if path.startswith("/api/v1/"):
            # API responses - short cache for data, no cache for user-specific data
            if "user" in path or "profile" in path:
                response.headers["cache-control"] = "private, max-age=60"
            else:
                response.headers["cache-control"] = "public, max-age=300"
        elif path.startswith("/static/") or path.endswith((".css", ".js", ".png", ".jpg", ".svg")):
            # Static assets - long cache with immutable directive
            response.headers["cache-control"] = "public, max-age=31536000, immutable"
        else:
            # Other content - short cache
            response.headers["cache-control"] = "public, max-age=300"

        # Add Last-Modified header
        response.headers["last-modified"] = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT")

        # Cache in Redis for server-side caching (if available)
        if self.redis and response.status_code == 200:
            try:
                content = response.body.decode('utf-8') if isinstance(response.body, bytes) else str(response.body)
                cache_data = {
                    "content": json.loads(content) if content.strip().startswith('{') else content,
                    "status_code": response.status_code,
                    "headers": dict(response.headers),
                    "etag": response.headers.get("etag"),
                    "cached_at": datetime.utcnow().isoformat()
                }
                await self._cache_response(cache_key, cache_data)
            except Exception as e:
                logger.warning(f"Response caching failed: {str(e)}")

    async def invalidate_cache(self, pattern: str = "*"):
        """Invalidate cache entries matching pattern"""
        if not self.redis:
            return

        try:
            if pattern == "*":
                await self.redis.flushdb()
                logger.info("Cache completely invalidated")
            else:
                # Find and delete keys matching pattern
                keys = await self.redis.keys(f"cache:{pattern}")
                if keys:
                    await self.redis.delete(*keys)
                    logger.info(f"Invalidated {len(keys)} cache entries for pattern: {pattern}")
        except Exception as e:
            logger.warning(f"Cache invalidation failed: {str(e)}")

    def get_cache_stats(self) -> Dict[str, Union[int, float]]:
        """Get cache performance statistics"""
        total_requests = self.cache_hits + self.cache_misses
        hit_rate = (self.cache_hits / total_requests * 100) if total_requests > 0 else 0

        return {
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "total_requests": total_requests,
            "hit_rate_percent": round(hit_rate, 2)
        }


# Global cache middleware instance
cache_middleware = CacheMiddleware()


async def get_cache_middleware():
    """Dependency injection for cache middleware"""
    return cache_middleware