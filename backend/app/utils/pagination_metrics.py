"""Performance monitoring and metrics collection for cursor-based pagination.

This module provides comprehensive monitoring and metrics collection for
pagination performance to ensure the system maintains <200ms response times
and tracks optimization opportunities.

Key Features:
- Query execution time monitoring
- Cache hit/miss rate tracking
- Database index usage analysis
- Response time distribution metrics
- Performance alerting thresholds
- Cursor security audit logging
"""

import time
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from prometheus_client import Counter, Histogram, Gauge

logger = logging.getLogger(__name__)


@dataclass
class PaginationMetrics:
    """Container for pagination performance metrics."""
    
    # Query performance
    query_duration: float
    total_duration: float
    db_query_count: int
    
    # Pagination info
    pagination_type: str  # "cursor" or "offset"
    page_size: int
    has_filters: bool
    sort_field: str
    sort_direction: str
    
    # Cache metrics
    cache_hit: bool = False
    cache_key: Optional[str] = None
    
    # Database metrics
    index_used: bool = True
    query_plan_cost: Optional[float] = None
    
    # Response metrics
    item_count: int = 0
    cursor_size: Optional[int] = None
    response_size: int = 0
    
    # Context
    endpoint: str = ""
    user_id: Optional[int] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)


class PaginationPerformanceMonitor:
    """Monitor and collect pagination performance metrics."""
    
    def __init__(self):
        self.slow_query_threshold = 200  # milliseconds
        self.very_slow_query_threshold = 500  # milliseconds
        self.metrics_buffer: List[PaginationMetrics] = []
        self.buffer_size = 1000
        
        # Prometheus metrics
        self.query_duration_histogram = Histogram(
            "pagination_query_duration_seconds",
            "Time spent executing pagination queries",
            ["pagination_type", "endpoint", "has_filters"]
        )
        
        self.cache_hit_counter = Counter(
            "pagination_cache_hits_total",
            "Number of pagination cache hits",
            ["pagination_type", "endpoint"]
        )
        
        self.cache_miss_counter = Counter(
            "pagination_cache_misses_total", 
            "Number of pagination cache misses",
            ["pagination_type", "endpoint"]
        )
        
        self.slow_query_counter = Counter(
            "pagination_slow_queries_total",
            "Number of slow pagination queries",
            ["pagination_type", "endpoint", "severity"]
        )
        
        self.cursor_size_histogram = Histogram(
            "pagination_cursor_size_bytes",
            "Size of pagination cursors in bytes",
            ["endpoint"]
        )
        
        self.response_size_histogram = Histogram(
            "pagination_response_size_bytes",
            "Size of pagination responses in bytes",
            ["pagination_type", "endpoint"]
        )
        
        self.active_queries_gauge = Gauge(
            "pagination_active_queries",
            "Number of active pagination queries"
        )
    
    @asynccontextmanager
    async def monitor_query(
        self,
        endpoint: str,
        pagination_type: str,
        page_size: int = 20,
        has_filters: bool = False,
        sort_field: str = "created_at",
        sort_direction: str = "desc",
        user_id: Optional[int] = None
    ):
        """Context manager to monitor pagination query performance."""
        
        start_time = time.time()
        query_count = 0
        
        # Track active query
        self.active_queries_gauge.inc()
        
        try:
            # Yield a query tracker
            query_tracker = QueryTracker()
            yield query_tracker
            
            # Calculate metrics
            total_duration = (time.time() - start_time) * 1000  # Convert to ms
            query_duration = query_tracker.total_query_time * 1000
            query_count = query_tracker.query_count
            
            # Create metrics object
            metrics_data = PaginationMetrics(
                query_duration=query_duration,
                total_duration=total_duration,
                db_query_count=query_count,
                pagination_type=pagination_type,
                page_size=page_size,
                has_filters=has_filters,
                sort_field=sort_field,
                sort_direction=sort_direction,
                endpoint=endpoint,
                user_id=user_id,
                index_used=query_tracker.index_used,
                query_plan_cost=query_tracker.estimated_cost,
                item_count=query_tracker.result_count,
                cursor_size=query_tracker.cursor_size,
                response_size=query_tracker.response_size,
                cache_hit=query_tracker.cache_hit,
                cache_key=query_tracker.cache_key
            )
            
            # Record metrics
            await self._record_metrics(metrics_data)
            
        except Exception as e:
            logger.error(f"Error monitoring pagination query for {endpoint}: {e}")
            
        finally:
            self.active_queries_gauge.dec()
    
    async def _record_metrics(self, metrics_data: PaginationMetrics):
        """Record metrics to monitoring systems."""
        
        # Prometheus metrics
        labels = {
            "pagination_type": metrics_data.pagination_type,
            "endpoint": metrics_data.endpoint,
            "has_filters": str(metrics_data.has_filters).lower()
        }
        
        # Query duration
        self.query_duration_histogram.labels(**labels).observe(
            metrics_data.query_duration / 1000  # Convert to seconds
        )
        
        # Cache metrics
        cache_labels = {
            "pagination_type": metrics_data.pagination_type,
            "endpoint": metrics_data.endpoint
        }
        
        if metrics_data.cache_hit:
            self.cache_hit_counter.labels(**cache_labels).inc()
        else:
            self.cache_miss_counter.labels(**cache_labels).inc()
        
        # Slow query detection
        if metrics_data.total_duration > self.very_slow_query_threshold:
            self.slow_query_counter.labels(
                pagination_type=metrics_data.pagination_type,
                endpoint=metrics_data.endpoint,
                severity="critical"
            ).inc()
            logger.warning(
                f"Very slow pagination query detected: {metrics_data.total_duration:.2f}ms "
                f"for {metrics_data.endpoint} ({metrics_data.pagination_type})"
            )
        elif metrics_data.total_duration > self.slow_query_threshold:
            self.slow_query_counter.labels(
                pagination_type=metrics_data.pagination_type,
                endpoint=metrics_data.endpoint,
                severity="warning"
            ).inc()
            logger.info(
                f"Slow pagination query detected: {metrics_data.total_duration:.2f}ms "
                f"for {metrics_data.endpoint} ({metrics_data.pagination_type})"
            )
        
        # Cursor and response size metrics
        if metrics_data.cursor_size:
            self.cursor_size_histogram.labels(
                endpoint=metrics_data.endpoint
            ).observe(metrics_data.cursor_size)
        
        if metrics_data.response_size:
            self.response_size_histogram.labels(
                pagination_type=metrics_data.pagination_type,
                endpoint=metrics_data.endpoint
            ).observe(metrics_data.response_size)
        
        # Store metrics for analysis
        self._buffer_metrics(metrics_data)
        
        # Log detailed metrics for slow queries
        if metrics_data.total_duration > self.slow_query_threshold:
            await self._log_detailed_metrics(metrics_data)
    
    def _buffer_metrics(self, metrics_data: PaginationMetrics):
        """Buffer metrics for batch analysis."""
        self.metrics_buffer.append(metrics_data)
        
        # Trim buffer if it gets too large
        if len(self.metrics_buffer) > self.buffer_size:
            self.metrics_buffer = self.metrics_buffer[-self.buffer_size:]
    
    async def _log_detailed_metrics(self, metrics_data: PaginationMetrics):
        """Log detailed metrics for performance analysis."""
        logger.info(
            f"Pagination Performance Metrics:\n"
            f"  Endpoint: {metrics_data.endpoint}\n"
            f"  Type: {metrics_data.pagination_type}\n"
            f"  Total Duration: {metrics_data.total_duration:.2f}ms\n"
            f"  Query Duration: {metrics_data.query_duration:.2f}ms\n"
            f"  DB Queries: {metrics_data.db_query_count}\n"
            f"  Page Size: {metrics_data.page_size}\n"
            f"  Items Returned: {metrics_data.item_count}\n"
            f"  Has Filters: {metrics_data.has_filters}\n"
            f"  Sort: {metrics_data.sort_field} {metrics_data.sort_direction}\n"
            f"  Index Used: {metrics_data.index_used}\n"
            f"  Cache Hit: {metrics_data.cache_hit}\n"
            f"  Response Size: {metrics_data.response_size} bytes\n"
            f"  Cursor Size: {metrics_data.cursor_size} bytes\n"
            f"  Query Cost: {metrics_data.query_plan_cost}"
        )
    
    def get_performance_summary(self, last_hours: int = 24) -> Dict[str, Any]:
        """Get performance summary for the last N hours."""
        cutoff_time = datetime.utcnow() - timedelta(hours=last_hours)
        recent_metrics = [
            m for m in self.metrics_buffer 
            if m.timestamp > cutoff_time
        ]
        
        if not recent_metrics:
            return {"error": "No recent metrics available"}
        
        # Calculate statistics
        total_queries = len(recent_metrics)
        cursor_queries = [m for m in recent_metrics if m.pagination_type == "cursor"]
        offset_queries = [m for m in recent_metrics if m.pagination_type == "offset"]
        
        slow_queries = [m for m in recent_metrics if m.total_duration > self.slow_query_threshold]
        cache_hits = [m for m in recent_metrics if m.cache_hit]
        
        avg_duration = sum(m.total_duration for m in recent_metrics) / total_queries
        p95_duration = sorted([m.total_duration for m in recent_metrics])[int(total_queries * 0.95)] if total_queries > 0 else 0
        
        return {
            "summary": {
                "total_queries": total_queries,
                "cursor_queries": len(cursor_queries),
                "offset_queries": len(offset_queries),
                "slow_queries": len(slow_queries),
                "cache_hit_rate": len(cache_hits) / total_queries if total_queries > 0 else 0,
                "avg_duration_ms": round(avg_duration, 2),
                "p95_duration_ms": round(p95_duration, 2),
                "period_hours": last_hours
            },
            "performance_by_type": {
                "cursor": {
                    "avg_duration": round(sum(m.total_duration for m in cursor_queries) / len(cursor_queries), 2) if cursor_queries else 0,
                    "slow_queries": len([m for m in cursor_queries if m.total_duration > self.slow_query_threshold])
                },
                "offset": {
                    "avg_duration": round(sum(m.total_duration for m in offset_queries) / len(offset_queries), 2) if offset_queries else 0,
                    "slow_queries": len([m for m in offset_queries if m.total_duration > self.slow_query_threshold])
                }
            },
            "endpoint_performance": self._get_endpoint_performance(recent_metrics),
            "optimization_recommendations": self._get_optimization_recommendations(recent_metrics)
        }
    
    def _get_endpoint_performance(self, metrics: List[PaginationMetrics]) -> Dict[str, Any]:
        """Analyze performance by endpoint."""
        endpoint_stats = {}
        
        for endpoint in set(m.endpoint for m in metrics):
            endpoint_metrics = [m for m in metrics if m.endpoint == endpoint]
            
            endpoint_stats[endpoint] = {
                "total_queries": len(endpoint_metrics),
                "avg_duration": round(sum(m.total_duration for m in endpoint_metrics) / len(endpoint_metrics), 2),
                "slow_queries": len([m for m in endpoint_metrics if m.total_duration > self.slow_query_threshold]),
                "cache_hit_rate": len([m for m in endpoint_metrics if m.cache_hit]) / len(endpoint_metrics)
            }
        
        return endpoint_stats
    
    def _get_optimization_recommendations(self, metrics: List[PaginationMetrics]) -> List[str]:
        """Generate optimization recommendations based on metrics."""
        recommendations = []
        
        # Check cursor adoption
        cursor_rate = len([m for m in metrics if m.pagination_type == "cursor"]) / len(metrics) if metrics else 0
        if cursor_rate < 0.5:
            recommendations.append("Consider migrating more queries to cursor-based pagination for better performance")
        
        # Check cache hit rate
        cache_hit_rate = len([m for m in metrics if m.cache_hit]) / len(metrics) if metrics else 0
        if cache_hit_rate < 0.7:
            recommendations.append("Improve cache hit rate by optimizing cache keys and TTL settings")
        
        # Check slow queries
        slow_queries = [m for m in metrics if m.total_duration > self.slow_query_threshold]
        if len(slow_queries) > len(metrics) * 0.1:  # More than 10% slow queries
            recommendations.append("Investigate slow queries - consider database index optimization")
        
        # Check index usage
        no_index_queries = [m for m in metrics if not m.index_used]
        if len(no_index_queries) > 0:
            recommendations.append("Some queries are not using database indices - review query plans")
        
        # Check response sizes
        large_responses = [m for m in metrics if m.response_size and m.response_size > 1024 * 1024]  # 1MB
        if len(large_responses) > 0:
            recommendations.append("Consider reducing page sizes for queries with large response payloads")
        
        return recommendations


class QueryTracker:
    """Track individual query performance metrics."""
    
    def __init__(self):
        self.query_count = 0
        self.total_query_time = 0.0
        self.index_used = True
        self.estimated_cost = None
        self.result_count = 0
        self.cursor_size = None
        self.response_size = 0
        self.cache_hit = False
        self.cache_key = None
        self._query_start_time = None
    
    def start_query(self):
        """Mark the start of a database query."""
        self._query_start_time = time.time()
    
    def end_query(self, result_count: int = 0):
        """Mark the end of a database query."""
        if self._query_start_time:
            query_time = time.time() - self._query_start_time
            self.total_query_time += query_time
            self.query_count += 1
            self.result_count = result_count
            self._query_start_time = None
    
    def set_cache_info(self, hit: bool, key: Optional[str] = None):
        """Set cache hit/miss information."""
        self.cache_hit = hit
        self.cache_key = key
    
    def set_cursor_size(self, size: int):
        """Set cursor size in bytes."""
        self.cursor_size = size
    
    def set_response_size(self, size: int):
        """Set response size in bytes."""
        self.response_size = size
    
    def set_index_info(self, used: bool, cost: Optional[float] = None):
        """Set database index usage information."""
        self.index_used = used
        self.estimated_cost = cost


# Global performance monitor instance
performance_monitor = PaginationPerformanceMonitor()


def get_performance_monitor() -> PaginationPerformanceMonitor:
    """Dependency injection for performance monitor."""
    return performance_monitor