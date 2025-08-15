"""Enhanced HTTP caching helpers with optimized ETag support for pagination.

This module provides advanced caching utilities specifically designed for 
cursor-based pagination systems to maximize cache efficiency and reduce
server load while maintaining data consistency.

Key Features:
- Optimized ETag computation for pagination responses
- Context-aware cache control headers
- Cursor-specific cache validation
- Performance metrics integration
- Support for conditional requests (If-None-Match, If-Modified-Since)
"""
from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, Optional, List
from datetime import datetime, timedelta
from fastapi import Request, Response
from app.core.config import get_settings, Environment


def compute_etag(payload: Any, context: Optional[Dict[str, Any]] = None) -> str:
    """Compute an optimized ETag for JSON-serializable payload with pagination context.
    
    Args:
        payload: The data to generate ETag for
        context: Additional context (sort, filters, pagination params) for cache granularity
        
    Returns:
        Strong or weak ETag based on data characteristics
    """
    try:
        # Serialize payload with deterministic ordering
        if isinstance(payload, dict) and "data" in payload:
            # For paginated responses, include pagination metadata in ETag
            data_hash = json.dumps(payload["data"], default=str, sort_keys=True, separators=(",", ":"))
            pagination_hash = json.dumps(
                payload.get("pagination", {}), 
                default=str, 
                sort_keys=True, 
                separators=(",", ":")
            )
            body = f"{data_hash}:{pagination_hash}"
        else:
            body = json.dumps(payload, default=str, sort_keys=True, separators=(",", ":"))
        
        # Include context for more granular caching
        if context:
            context_hash = json.dumps(context, default=str, sort_keys=True, separators=(",", ":"))
            body = f"{body}:{context_hash}"
            
    except Exception:
        # Fallback to string representation
        body = repr(payload)
        if context:
            body = f"{body}:{repr(context)}"
    
    # Use SHA-256 for strong hash
    digest = hashlib.sha256(body.encode("utf-8")).hexdigest()[:16]  # Truncate for efficiency
    
    # Use strong ETag for cursor pagination (data is deterministic)
    if context and context.get("pagination_type") == "cursor":
        return f'"{digest}"'
    else:
        # Use weak ETag for offset pagination (data may vary)
        return f'W/"{digest}"'


def set_etag(response: Response, payload: Any, context: Optional[Dict[str, Any]] = None) -> str:
    """Set ETag header with enhanced context awareness."""
    etag = compute_etag(payload, context)
    response.headers["ETag"] = etag
    return etag


def not_modified(request: Request, etag: str) -> bool:
    """Enhanced conditional request handling with better parsing."""
    if_none_match = request.headers.get("If-None-Match")
    if not if_none_match:
        return False
    
    # Handle multiple ETags and wildcard
    if if_none_match == "*":
        return True
    
    # Parse comma-separated ETags
    etags = [tag.strip() for tag in if_none_match.split(",")]
    
    # Check for exact match (handling both strong and weak ETags)
    return any(etag == tag or etag.replace('W/', '') == tag.replace('W/', '') for tag in etags)


def set_cache_headers(
    response: Response,
    max_age: int = 300,
    environment: Optional[Environment] = None,
    pagination_type: str = "offset",
    is_filtered: bool = False,
    is_mutable: bool = True
) -> None:
    """Set optimized cache headers based on pagination type and environment.
    
    Args:
        response: FastAPI response object
        max_age: Cache duration in seconds
        environment: Application environment (affects caching strategy)
        pagination_type: "cursor" or "offset" (affects cache strategy)
        is_filtered: Whether response has filters applied
        is_mutable: Whether data is frequently changing
    """
    settings = environment or get_settings().environment
    
    # Base cache control directives
    directives = []
    
    if settings == Environment.PRODUCTION:
        # Production: Aggressive caching with validation
        if pagination_type == "cursor":
            # Cursor pagination: Longer cache with must-revalidate
            directives.extend(["public", f"max-age={max_age}", "must-revalidate"])
            
            # Add stale-while-revalidate for better UX
            if not is_mutable:
                directives.append(f"stale-while-revalidate={max_age // 2}")
                
        else:
            # Offset pagination: Shorter cache due to consistency issues
            cache_time = min(max_age // 2, 120)  # Max 2 minutes
            directives.extend(["public", f"max-age={cache_time}", "must-revalidate"])
            
        # Filtered responses get shorter cache times
        if is_filtered:
            cache_time = max_age // 4
            directives = ["public", f"max-age={cache_time}", "must-revalidate"]
            
    else:
        # Development/staging: Shorter cache times
        dev_cache_time = min(max_age, 60)  # Max 1 minute in dev
        directives.extend(["public", f"max-age={dev_cache_time}"])
    
    response.headers["Cache-Control"] = ", ".join(directives)
    
    # Add pagination-specific headers
    response.headers["X-Cache-Strategy"] = pagination_type
    
    # Vary header for proper cache key generation
    vary_headers = ["Accept", "Accept-Encoding"]
    if is_filtered:
        vary_headers.append("Authorization")  # Vary on user for filtered content
    response.headers["Vary"] = ", ".join(vary_headers)


def compute_cache_key(
    endpoint: str,
    params: Dict[str, Any],
    user_id: Optional[int] = None
) -> str:
    """Generate a consistent cache key for Redis caching.
    
    Args:
        endpoint: API endpoint path
        params: Query parameters and filters
        user_id: User ID for user-specific cache keys
        
    Returns:
        Consistent cache key string
    """
    # Sort parameters for consistent key generation
    sorted_params = sorted(params.items())
    params_str = "&".join(f"{k}={v}" for k, v in sorted_params if v is not None)
    
    # Include user ID for personalized cache
    key_parts = [endpoint, params_str]
    if user_id:
        key_parts.append(f"user:{user_id}")
    
    # Create hash for consistent key length
    key_string = "|".join(key_parts)
    key_hash = hashlib.md5(key_string.encode()).hexdigest()
    
    return f"api:cache:{key_hash}"


def is_cacheable_request(request: Request) -> bool:
    """Determine if a request should be cached based on headers and method.
    
    Args:
        request: FastAPI request object
        
    Returns:
        True if request is cacheable, False otherwise
    """
    # Only cache GET requests
    if request.method != "GET":
        return False
    
    # Don't cache requests with no-cache header
    cache_control = request.headers.get("Cache-Control", "")
    if "no-cache" in cache_control or "no-store" in cache_control:
        return False
    
    # Don't cache requests with authorization unless explicitly allowed
    if request.headers.get("Authorization") and not request.headers.get("X-Cache-Allowed"):
        return False
    
    return True


class CachePerformanceTracker:
    """Track cache performance metrics for monitoring and optimization."""
    
    def __init__(self):
        self.hits = 0
        self.misses = 0
        self.invalidations = 0
        self.total_requests = 0
    
    def record_hit(self):
        """Record a cache hit."""
        self.hits += 1
        self.total_requests += 1
    
    def record_miss(self):
        """Record a cache miss."""
        self.misses += 1
        self.total_requests += 1
    
    def record_invalidation(self):
        """Record a cache invalidation."""
        self.invalidations += 1
    
    @property
    def hit_rate(self) -> float:
        """Calculate cache hit rate."""
        if self.total_requests == 0:
            return 0.0
        return self.hits / self.total_requests
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics."""
        return {
            "hits": self.hits,
            "misses": self.misses,
            "invalidations": self.invalidations,
            "total_requests": self.total_requests,
            "hit_rate": self.hit_rate,
            "miss_rate": 1.0 - self.hit_rate
        }


# Global cache performance tracker
cache_tracker = CachePerformanceTracker()
