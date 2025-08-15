"""Performance monitoring and optimization endpoints.

Provides comprehensive performance metrics, cache statistics, and
cost optimization insights for bootstrapped applications.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.api import deps
from app.core.performance import get_performance_stats
from app.core.cache import get_cache
from app.utils.http_cache import cache_tracker
from app.utils.pagination_metrics import get_performance_monitor
from app.core.config import get_settings, Environment

router = APIRouter()


class PerformanceMetrics(BaseModel):
    """Performance metrics response model."""
    timestamp: datetime
    cache_performance: Dict[str, Any]
    pagination_performance: Dict[str, Any]
    compression_stats: Dict[str, Any]
    deduplication_stats: Dict[str, Any]
    cost_optimization: Dict[str, Any]
    database_stats: Optional[Dict[str, Any]] = None


class CacheStatus(BaseModel):
    """Cache system status model."""
    redis_connected: bool
    cache_hit_rate: float
    total_operations: int
    memory_usage: Optional[str] = None
    key_count: Optional[int] = None


@router.get("/performance/metrics", response_model=PerformanceMetrics)
async def get_performance_metrics(
    include_db_stats: bool = Query(False, description="Include database performance stats"),
    db: AsyncSession = Depends(deps.get_db)
) -> PerformanceMetrics:
    """Get comprehensive performance metrics for cost optimization analysis.
    
    Returns detailed metrics about:
    - Cache performance (Redis hits/misses, memory usage)
    - Pagination performance (cursor vs offset, response times)
    - Response compression (bandwidth savings)
    - Request deduplication (CPU savings)
    - Cost optimization insights
    """
    try:
        # Get core performance stats
        perf_stats = await get_performance_stats()
        
        # Get cache performance
        cache_stats = cache_tracker.get_stats()
        
        cache_performance = {
            "http_cache": cache_stats,
            "combined_hit_rate": cache_stats.get("hit_rate", 0)
        }
        
        # Get pagination metrics
        try:
            pagination_monitor = get_performance_monitor()
            pagination_stats = pagination_monitor.get_performance_summary(last_hours=24)
        except Exception as e:
            pagination_stats = {"error": str(e), "cursor_usage": "unknown"}
        
        # Calculate cost optimization insights
        cost_insights = _calculate_cost_optimization(perf_stats)
        
        # Database stats (optional, can be expensive)
        db_stats = None
        if include_db_stats:
            db_stats = await _get_database_stats(db)
        
        return PerformanceMetrics(
            timestamp=datetime.now(),
            cache_performance=cache_performance,
            pagination_performance=pagination_stats,
            compression_stats=perf_stats.get("compression", {}),
            deduplication_stats=perf_stats.get("deduplication", {}),
            cost_optimization=cost_insights,
            database_stats=db_stats
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve performance metrics: {str(e)}"
        )


@router.get("/performance/cache/status", response_model=CacheStatus)
async def get_cache_status() -> CacheStatus:
    """Get current cache system status and health."""
    try:
        cache = await get_cache()
        
        # Test Redis connectivity
        redis_connected = False
        memory_usage = None
        key_count = None
        
        try:
            # Try to ping Redis
            await cache.redis.ping()
            redis_connected = True
            
            # Get Redis info
            redis_info = await cache.redis.info()
            memory_usage = redis_info.get("used_memory_human", "unknown")
            
            # Get key count (expensive operation, use with caution)
            key_count = await cache.redis.dbsize()
            
        except Exception:
            redis_connected = False
        
        # Get hit rate from cache tracker
        cache_stats = cache_tracker.get_stats()
        hit_rate = cache_stats.get("hit_rate", 0.0)
        total_operations = cache_stats.get("total_requests", 0)
        
        return CacheStatus(
            redis_connected=redis_connected,
            cache_hit_rate=hit_rate,
            total_operations=total_operations,
            memory_usage=memory_usage,
            key_count=key_count
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get cache status: {str(e)}"
        )


@router.post("/performance/cache/clear")
async def clear_cache(
    pattern: Optional[str] = Query(None, description="Pattern to match keys for deletion")
) -> Dict[str, Any]:
    """Clear cache entries (use with caution in production).
    
    Args:
        pattern: Optional pattern to match keys (e.g., 'crud_*', 'api:cache:*')
                If not provided, clears all cache entries.
    """
    settings = get_settings()
    
    # Restrict cache clearing in production
    if settings.environment == Environment.PRODUCTION:
        raise HTTPException(
            status_code=403,
            detail="Cache clearing is restricted in production environment"
        )
    
    try:
        cache = await get_cache()
        
        if pattern:
            cleared_count = await cache.clear_prefix(pattern.rstrip(":*"))
            return {
                "success": True,
                "message": f"Cleared {cleared_count} cache entries matching pattern '{pattern}'",
                "cleared_count": cleared_count,
                "pattern": pattern
            }
        else:
            success = await cache.clear_cache()
            return {
                "success": success,
                "message": "All cache entries cleared" if success else "Failed to clear cache",
                "cleared_count": "all" if success else 0
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear cache: {str(e)}"
        )


@router.get("/performance/optimization/recommendations")
async def get_optimization_recommendations() -> Dict[str, Any]:
    """Get performance optimization recommendations based on current metrics."""
    try:
        perf_stats = await get_performance_stats()
        cache_stats = cache_tracker.get_stats()
        
        recommendations = []
        
        # Cache optimization recommendations
        hit_rate = cache_stats.get("hit_rate", 0)
        if hit_rate < 0.6:  # Less than 60% hit rate
            recommendations.append({
                "category": "caching",
                "priority": "high",
                "issue": "Low cache hit rate",
                "current_value": f"{hit_rate:.1%}",
                "recommendation": "Increase cache TTL for frequently accessed data",
                "impact": "Reduce database load and improve response times"
            })
        
        # Compression recommendations
        compression_stats = perf_stats.get("compression", {})
        compression_rate = compression_stats.get("compression_rate", 0)
        if compression_rate < 0.3:  # Less than 30% of responses compressed
            recommendations.append({
                "category": "compression",
                "priority": "medium",
                "issue": "Low compression usage",
                "current_value": f"{compression_rate:.1%}",
                "recommendation": "Enable response compression for more endpoints",
                "impact": "Reduce bandwidth costs by 40-60%"
            })
        
        # Request deduplication recommendations
        dedup_stats = perf_stats.get("deduplication", {})
        dedup_rate = dedup_stats.get("deduplication_rate", 0)
        if dedup_rate > 0.1:  # More than 10% duplicate requests
            recommendations.append({
                "category": "deduplication",
                "priority": "medium",
                "issue": "High duplicate request rate",
                "current_value": f"{dedup_rate:.1%}",
                "recommendation": "Consider implementing client-side caching",
                "impact": "Reduce server load and improve user experience"
            })
        
        # Cost optimization insights
        monthly_savings = _estimate_monthly_savings(perf_stats, cache_stats)
        
        return {
            "recommendations": recommendations,
            "performance_score": _calculate_performance_score(perf_stats, cache_stats),
            "cost_optimization": {
                "estimated_monthly_savings": monthly_savings,
                "optimization_opportunities": len(recommendations),
                "next_priority": recommendations[0]["category"] if recommendations else "none"
            },
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


def _calculate_cost_optimization(perf_stats: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate cost optimization insights from performance stats."""
    compression_stats = perf_stats.get("compression", {})
    dedup_stats = perf_stats.get("deduplication", {})
    
    # Estimate bandwidth savings from compression
    bytes_saved = compression_stats.get("bytes_saved", 0)
    bandwidth_cost_per_gb = 0.12  # AWS CloudFront pricing estimate
    monthly_bandwidth_savings = (bytes_saved / (1024**3)) * bandwidth_cost_per_gb
    
    # Estimate compute savings from deduplication
    requests_saved = dedup_stats.get("requests_saved", 0)
    compute_cost_per_request = 0.0000002  # Lambda pricing estimate
    monthly_compute_savings = requests_saved * compute_cost_per_request
    
    return {
        "bandwidth_savings_gb": bytes_saved / (1024**3),
        "requests_deduplicated": requests_saved,
        "estimated_monthly_savings_usd": monthly_bandwidth_savings + monthly_compute_savings,
        "optimization_score": _calculate_optimization_score(compression_stats, dedup_stats)
    }


def _calculate_optimization_score(compression_stats: Dict, dedup_stats: Dict) -> float:
    """Calculate optimization score (0-100)."""
    compression_rate = compression_stats.get("compression_rate", 0)
    dedup_rate = min(dedup_stats.get("deduplication_rate", 0), 0.2)  # Cap at 20%
    
    # Weight compression more heavily as it has bigger impact
    score = (compression_rate * 70) + ((0.2 - dedup_rate) * 30) * 100
    return min(max(score, 0), 100)


async def _get_database_stats(db: AsyncSession) -> Dict[str, Any]:
    """Get database performance statistics (expensive operation)."""
    try:
        from sqlalchemy import text
        
        # Get connection pool stats
        pool = db.bind.pool
        pool_stats = {
            "size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": getattr(pool, '_overflow', 0),
        }
        
        # Get basic database stats (be careful with these queries)
        result = await db.execute(text("""
            SELECT 
                schemaname,
                tablename,
                n_tup_ins as inserts,
                n_tup_upd as updates,
                n_tup_del as deletes
            FROM pg_stat_user_tables 
            WHERE schemaname = 'public'
            ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC
            LIMIT 5
        """))
        
        table_stats = [dict(row) for row in result]
        
        return {
            "connection_pool": pool_stats,
            "top_active_tables": table_stats,
            "note": "Database stats collection is expensive and should be used sparingly"
        }
        
    except Exception as e:
        return {"error": f"Failed to collect database stats: {str(e)}"}


def _estimate_monthly_savings(perf_stats: Dict[str, Any], cache_stats: Dict[str, Any]) -> float:
    """Estimate monthly cost savings from optimizations."""
    # This is a simplified calculation - real savings depend on traffic and infrastructure
    
    compression_savings = perf_stats.get("compression", {}).get("bytes_saved", 0) * 0.0001
    dedup_savings = perf_stats.get("deduplication", {}).get("requests_saved", 0) * 0.001
    cache_savings = cache_stats.get("hits", 0) * 0.0001
    
    return compression_savings + dedup_savings + cache_savings


def _calculate_performance_score(perf_stats: Dict[str, Any], cache_stats: Dict[str, Any]) -> int:
    """Calculate overall performance score (0-100)."""
    hit_rate = cache_stats.get("hit_rate", 0)
    compression_rate = perf_stats.get("compression", {}).get("compression_rate", 0)
    
    # Simple weighted score
    score = (hit_rate * 60) + (compression_rate * 40)
    return int(score * 100)