"""Performance optimization utilities for cost-efficient operations.

This module provides various performance optimizations specifically designed
for bootstrapped applications that need to maximize efficiency while minimizing
costs. Includes response compression, request deduplication, and background
job optimization.
"""
import gzip
import json
import time
import asyncio
from typing import Dict, Any, Optional, Callable, Set, List, Union
from datetime import datetime, timedelta
from functools import wraps
from collections import defaultdict

import structlog
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from redis.asyncio import Redis

from app.core.cache import get_cache, Cache
from app.core.config import get_settings, Environment

logger = structlog.get_logger()


class ResponseCompressor:
    """Intelligent response compression for cost optimization.
    
    Provides adaptive compression based on content type, size, and client support.
    Optimized for bootstrapped applications to reduce bandwidth costs.
    """
    
    def __init__(self, min_size: int = 1024, compression_level: int = 6):
        """Initialize compressor with cost-optimized defaults.
        
        Args:
            min_size: Minimum response size to compress (bytes)
            compression_level: Compression level (1-9, 6 is optimal for speed/size)
        """
        self.min_size = min_size
        self.compression_level = compression_level
        self.compressible_types = {
            "application/json",
            "application/javascript", 
            "text/plain",
            "text/html",
            "text/css",
            "text/csv"
        }
        
        # Track compression metrics for cost analysis
        self.stats = {
            "requests_processed": 0,
            "responses_compressed": 0,
            "original_bytes": 0,
            "compressed_bytes": 0,
            "compression_time_ms": 0
        }
    
    def should_compress(self, response: Response, request: Request) -> bool:
        """Determine if response should be compressed."""
        # Check client support
        accept_encoding = request.headers.get("accept-encoding", "")
        if "gzip" not in accept_encoding:
            return False
        
        # Check content type
        content_type = response.headers.get("content-type", "").split(";")[0]
        if content_type not in self.compressible_types:
            return False
        
        # Check response size
        if hasattr(response, 'body') and response.body:
            if len(response.body) < self.min_size:
                return False
        
        # Don't double-compress
        if response.headers.get("content-encoding"):
            return False
        
        return True
    
    def compress_response(self, response: Response, request: Request) -> Response:
        """Compress response if beneficial."""
        start_time = time.time()
        self.stats["requests_processed"] += 1
        
        if not self.should_compress(response, request):
            return response
        
        try:
            # Get response content
            if hasattr(response, 'body') and response.body:
                original_content = response.body
                original_size = len(original_content)
                
                # Compress content
                compressed_content = gzip.compress(
                    original_content, 
                    compresslevel=self.compression_level
                )
                compressed_size = len(compressed_content)
                
                # Only use compression if it provides significant savings
                savings_ratio = (original_size - compressed_size) / original_size
                if savings_ratio < 0.1:  # Less than 10% savings
                    return response
                
                # Update response
                response.body = compressed_content
                response.headers["content-encoding"] = "gzip"
                response.headers["content-length"] = str(compressed_size)
                
                # Update statistics
                self.stats["responses_compressed"] += 1
                self.stats["original_bytes"] += original_size
                self.stats["compressed_bytes"] += compressed_size
                
                compression_time = (time.time() - start_time) * 1000
                self.stats["compression_time_ms"] += compression_time
                
                logger.debug(
                    "response_compressed",
                    original_size=original_size,
                    compressed_size=compressed_size,
                    savings_ratio=round(savings_ratio, 3),
                    compression_time_ms=round(compression_time, 2)
                )
                
        except Exception as e:
            logger.warning(
                "compression_failed",
                error=str(e),
                error_type=type(e).__name__
            )
        
        return response
    
    def get_compression_stats(self) -> Dict[str, Any]:
        """Get compression performance statistics."""
        total_requests = self.stats["requests_processed"]
        compressed_requests = self.stats["responses_compressed"]
        
        return {
            "total_requests": total_requests,
            "compressed_responses": compressed_requests,
            "compression_rate": compressed_requests / max(total_requests, 1),
            "original_bytes": self.stats["original_bytes"],
            "compressed_bytes": self.stats["compressed_bytes"],
            "bytes_saved": self.stats["original_bytes"] - self.stats["compressed_bytes"],
            "average_compression_ratio": (
                self.stats["compressed_bytes"] / max(self.stats["original_bytes"], 1)
            ),
            "average_compression_time_ms": (
                self.stats["compression_time_ms"] / max(compressed_requests, 1)
            )
        }


class RequestDeduplicator:
    """Request deduplication for cost optimization.
    
    Prevents duplicate expensive operations by caching in-flight requests
    and returning cached results for identical concurrent requests.
    """
    
    def __init__(self, cache_ttl: int = 60, max_concurrent: int = 100):
        """Initialize request deduplicator.
        
        Args:
            cache_ttl: How long to cache in-flight requests (seconds)
            max_concurrent: Maximum concurrent unique requests to track
        """
        self.cache_ttl = cache_ttl
        self.max_concurrent = max_concurrent
        self.in_flight: Dict[str, asyncio.Future] = {}
        self.request_counts: Dict[str, int] = defaultdict(int)
        self.stats = {
            "total_requests": 0,
            "deduplicated_requests": 0,
            "active_requests": 0
        }
    
    def _generate_request_key(self, request: Request) -> str:
        """Generate unique key for request deduplication."""
        # Include method, path, query params, and user context
        path = request.url.path
        query = str(sorted(request.query_params.items()))
        method = request.method
        user_id = getattr(request.state, "user_id", "anonymous")
        
        # Create hash for consistent key length
        import hashlib
        key_data = f"{method}:{path}:{query}:{user_id}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    async def deduplicate_request(
        self, 
        request: Request, 
        handler: Callable
    ) -> Any:
        """Deduplicate request execution."""
        self.stats["total_requests"] += 1
        
        # Only deduplicate GET requests
        if request.method != "GET":
            return await handler()
        
        request_key = self._generate_request_key(request)
        self.request_counts[request_key] += 1
        
        # Check if request is already in flight
        if request_key in self.in_flight:
            self.stats["deduplicated_requests"] += 1
            
            logger.debug(
                "request_deduplicated",
                request_key=request_key,
                path=request.url.path,
                duplicate_count=self.request_counts[request_key]
            )
            
            try:
                # Wait for the in-flight request to complete
                result = await self.in_flight[request_key]
                return result
            except Exception as e:
                # If the original request failed, remove it and try again
                self.in_flight.pop(request_key, None)
                raise e
        
        # Limit concurrent requests for memory management
        if len(self.in_flight) >= self.max_concurrent:
            logger.warning(
                "max_concurrent_requests_reached",
                max_concurrent=self.max_concurrent,
                current_count=len(self.in_flight)
            )
            # Execute without deduplication
            return await handler()
        
        # Create new future for this request
        future = asyncio.create_task(self._execute_with_cleanup(
            request_key, handler
        ))
        self.in_flight[request_key] = future
        self.stats["active_requests"] = len(self.in_flight)
        
        try:
            result = await future
            return result
        except Exception as e:
            # Clean up on error
            self.in_flight.pop(request_key, None)
            raise e
    
    async def _execute_with_cleanup(self, request_key: str, handler: Callable) -> Any:
        """Execute handler and clean up request tracking."""
        try:
            result = await handler()
            return result
        finally:
            # Clean up completed request
            self.in_flight.pop(request_key, None)
            self.stats["active_requests"] = len(self.in_flight)
    
    def get_deduplication_stats(self) -> Dict[str, Any]:
        """Get request deduplication statistics."""
        total_requests = self.stats["total_requests"]
        deduplicated_requests = self.stats["deduplicated_requests"]
        
        return {
            "total_requests": total_requests,
            "deduplicated_requests": deduplicated_requests,
            "deduplication_rate": deduplicated_requests / max(total_requests, 1),
            "active_requests": self.stats["active_requests"],
            "requests_saved": deduplicated_requests,
            "top_duplicate_requests": sorted(
                self.request_counts.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:10]
        }


class BackgroundJobOptimizer:
    """Optimize background job processing for cost efficiency."""
    
    def __init__(self):
        self.job_stats = defaultdict(lambda: {
            "count": 0,
            "total_time": 0.0,
            "errors": 0,
            "last_run": None
        })
    
    def track_job_execution(self, job_name: str, duration: float, success: bool):
        """Track job execution metrics."""
        stats = self.job_stats[job_name]
        stats["count"] += 1
        stats["total_time"] += duration
        stats["last_run"] = datetime.now()
        
        if not success:
            stats["errors"] += 1
    
    def get_job_recommendations(self) -> Dict[str, Any]:
        """Get recommendations for job optimization."""
        recommendations = []
        
        for job_name, stats in self.job_stats.items():
            avg_time = stats["total_time"] / max(stats["count"], 1)
            error_rate = stats["errors"] / max(stats["count"], 1)
            
            if avg_time > 30:  # Jobs taking more than 30 seconds
                recommendations.append({
                    "job": job_name,
                    "issue": "long_execution_time",
                    "avg_time": avg_time,
                    "suggestion": "Consider breaking into smaller tasks or optimizing queries"
                })
            
            if error_rate > 0.1:  # More than 10% error rate
                recommendations.append({
                    "job": job_name,
                    "issue": "high_error_rate",
                    "error_rate": error_rate,
                    "suggestion": "Review error handling and add retry logic"
                })
        
        return {
            "job_stats": dict(self.job_stats),
            "recommendations": recommendations
        }


# Global instances for performance optimization
response_compressor = ResponseCompressor()
request_deduplicator = RequestDeduplicator()
background_job_optimizer = BackgroundJobOptimizer()


def compress_response(handler: Callable) -> Callable:
    """Decorator to compress API responses."""
    @wraps(handler)
    async def wrapper(request: Request, *args, **kwargs) -> Response:
        response = await handler(request, *args, **kwargs)
        return response_compressor.compress_response(response, request)
    return wrapper


def deduplicate_requests(handler: Callable) -> Callable:
    """Decorator to deduplicate identical requests."""
    @wraps(handler)
    async def wrapper(request: Request, *args, **kwargs):
        return await request_deduplicator.deduplicate_request(
            request, 
            lambda: handler(request, *args, **kwargs)
        )
    return wrapper


async def get_performance_stats() -> Dict[str, Any]:
    """Get comprehensive performance statistics."""
    return {
        "compression": response_compressor.get_compression_stats(),
        "deduplication": request_deduplicator.get_deduplication_stats(),
        "background_jobs": background_job_optimizer.get_job_recommendations(),
        "timestamp": datetime.now().isoformat()
    }


def optimize_for_cost(
    enable_compression: bool = True,
    enable_deduplication: bool = True,
    compression_min_size: int = 1024
) -> Callable:
    """Decorator to apply cost optimization strategies.
    
    Args:
        enable_compression: Enable response compression
        enable_deduplication: Enable request deduplication
        compression_min_size: Minimum size for compression
    """
    def decorator(handler: Callable) -> Callable:
        @wraps(handler)
        async def wrapper(request: Request, *args, **kwargs):
            # Apply deduplication first
            if enable_deduplication and request.method == "GET":
                return await request_deduplicator.deduplicate_request(
                    request, 
                    lambda: handler(request, *args, **kwargs)
                )
            else:
                response = await handler(request, *args, **kwargs)
                
                # Apply compression if enabled
                if enable_compression and isinstance(response, Response):
                    response = response_compressor.compress_response(response, request)
                
                return response
        
        return wrapper
    return decorator