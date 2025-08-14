"""Pagination performance metrics endpoint.

Provides monitoring and analytics endpoints for pagination system performance.
Used for operational monitoring and optimization analysis.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.utils.pagination_metrics import get_performance_monitor, PaginationPerformanceMonitor
from app.core.config import get_settings, Environment

router = APIRouter()


@router.get("/pagination/metrics", response_model=Dict[str, Any])
async def get_pagination_metrics(
    hours: int = Query(24, ge=1, le=168, description="Hours of metrics to analyze (1-168)"),
    monitor: PaginationPerformanceMonitor = Depends(get_performance_monitor),
) -> Dict[str, Any]:
    """Get pagination performance metrics and analysis.
    
    **Performance Insights:**
    - Query execution times by pagination type
    - Cache hit rates and optimization opportunities  
    - Database index usage analysis
    - Response time distribution and SLA compliance
    
    **Operational Use Cases:**
    - Monitor <200ms response time SLA compliance
    - Identify slow queries requiring optimization
    - Track cursor pagination adoption rates
    - Analyze cache performance and hit rates
    
    **Optimization Recommendations:**
    - Automatically generated based on performance patterns
    - Database index optimization suggestions
    - Cache configuration improvements
    - Query pattern optimization opportunities
    """
    settings = get_settings()
    
    # Only allow metrics access in development or with proper permissions
    if settings.environment == Environment.PRODUCTION:
        # In production, you might want to add authentication/authorization here
        # For now, we'll allow it but could be restricted to admin users
        pass
    
    try:
        performance_summary = monitor.get_performance_summary(last_hours=hours)
        
        # Add additional context
        performance_summary["meta"] = {
            "collection_period_hours": hours,
            "environment": settings.environment.value,
            "sla_threshold_ms": 200,
            "slow_query_threshold_ms": monitor.slow_query_threshold,
            "very_slow_query_threshold_ms": monitor.very_slow_query_threshold
        }
        
        # Calculate SLA compliance
        if "summary" in performance_summary:
            total_queries = performance_summary["summary"]["total_queries"]
            p95_duration = performance_summary["summary"]["p95_duration_ms"]
            
            performance_summary["sla_compliance"] = {
                "target_response_time_ms": 200,
                "p95_response_time_ms": p95_duration,
                "meets_sla": p95_duration <= 200,
                "performance_grade": _calculate_performance_grade(p95_duration),
                "total_queries_analyzed": total_queries
            }
        
        return performance_summary
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to retrieve pagination metrics: {str(e)}"
        )


@router.get("/pagination/health", response_model=Dict[str, Any])
async def get_pagination_health(
    monitor: PaginationPerformanceMonitor = Depends(get_performance_monitor),
) -> Dict[str, Any]:
    """Get real-time pagination system health status.
    
    **Health Indicators:**
    - Current active query count
    - Recent performance trends (last hour)
    - SLA compliance status
    - Alert-worthy performance issues
    
    **Use Cases:**
    - Health check monitoring integration
    - Real-time performance dashboard
    - Automated alerting systems
    - Operational status reporting
    """
    try:
        # Get recent performance data
        recent_summary = monitor.get_performance_summary(last_hours=1)
        
        # Determine health status
        health_status = "healthy"
        alerts = []
        
        if "summary" in recent_summary:
            summary = recent_summary["summary"]
            
            # Check response time SLA
            p95_duration = summary.get("p95_duration_ms", 0)
            if p95_duration > 500:  # Critical threshold
                health_status = "critical"
                alerts.append("P95 response time exceeds 500ms")
            elif p95_duration > 200:  # Warning threshold
                health_status = "degraded" if health_status == "healthy" else health_status
                alerts.append("P95 response time exceeds 200ms SLA")
            
            # Check slow query rate
            total_queries = summary.get("total_queries", 0)
            slow_queries = summary.get("slow_queries", 0)
            if total_queries > 0:
                slow_query_rate = slow_queries / total_queries
                if slow_query_rate > 0.2:  # More than 20% slow queries
                    health_status = "degraded" if health_status == "healthy" else health_status
                    alerts.append(f"High slow query rate: {slow_query_rate:.1%}")
            
            # Check cache hit rate
            cache_hit_rate = summary.get("cache_hit_rate", 0)
            if cache_hit_rate < 0.5:  # Less than 50% cache hit rate
                health_status = "degraded" if health_status == "healthy" else health_status
                alerts.append(f"Low cache hit rate: {cache_hit_rate:.1%}")
        
        # Current active queries
        active_queries = monitor.active_queries_gauge._value._value if hasattr(monitor.active_queries_gauge, '_value') else 0
        
        return {
            "status": health_status,
            "timestamp": recent_summary.get("summary", {}).get("timestamp", ""),
            "active_queries": active_queries,
            "alerts": alerts,
            "recent_performance": {
                "queries_last_hour": recent_summary.get("summary", {}).get("total_queries", 0),
                "p95_response_time_ms": recent_summary.get("summary", {}).get("p95_duration_ms", 0),
                "cache_hit_rate": recent_summary.get("summary", {}).get("cache_hit_rate", 0),
                "slow_query_count": recent_summary.get("summary", {}).get("slow_queries", 0)
            },
            "sla_compliance": {
                "target_ms": 200,
                "current_p95_ms": recent_summary.get("summary", {}).get("p95_duration_ms", 0),
                "meets_sla": recent_summary.get("summary", {}).get("p95_duration_ms", 0) <= 200
            }
        }
        
    except Exception as e:
        return {
            "status": "unknown",
            "error": str(e),
            "timestamp": "",
            "active_queries": 0,
            "alerts": ["Failed to retrieve health metrics"]
        }


@router.get("/pagination/recommendations", response_model=Dict[str, Any])
async def get_optimization_recommendations(
    hours: int = Query(24, ge=1, le=168, description="Hours of data to analyze for recommendations"),
    monitor: PaginationPerformanceMonitor = Depends(get_performance_monitor),
) -> Dict[str, Any]:
    """Get automated optimization recommendations based on performance analysis.
    
    **Recommendation Categories:**
    - Database index optimization
    - Cache configuration improvements  
    - Query pattern optimization
    - Pagination strategy improvements
    
    **Analysis Factors:**
    - Response time patterns
    - Cache hit/miss rates
    - Database index usage
    - Query complexity patterns
    - Error rates and patterns
    """
    try:
        performance_summary = monitor.get_performance_summary(last_hours=hours)
        
        recommendations = performance_summary.get("optimization_recommendations", [])
        
        # Add priority and impact estimates
        prioritized_recommendations = []
        for i, rec in enumerate(recommendations):
            priority = _determine_recommendation_priority(rec, performance_summary)
            impact = _estimate_performance_impact(rec)
            
            prioritized_recommendations.append({
                "id": i + 1,
                "recommendation": rec,
                "priority": priority,
                "estimated_impact": impact,
                "category": _categorize_recommendation(rec)
            })
        
        # Sort by priority
        prioritized_recommendations.sort(key=lambda x: {"high": 3, "medium": 2, "low": 1}[x["priority"]], reverse=True)
        
        return {
            "analysis_period_hours": hours,
            "total_recommendations": len(prioritized_recommendations),
            "recommendations": prioritized_recommendations,
            "performance_summary": {
                "total_queries": performance_summary.get("summary", {}).get("total_queries", 0),
                "avg_duration_ms": performance_summary.get("summary", {}).get("avg_duration_ms", 0),
                "cache_hit_rate": performance_summary.get("summary", {}).get("cache_hit_rate", 0)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate optimization recommendations: {str(e)}"
        )


def _calculate_performance_grade(p95_duration_ms: float) -> str:
    """Calculate performance grade based on P95 response time."""
    if p95_duration_ms <= 100:
        return "A"
    elif p95_duration_ms <= 200:
        return "B"
    elif p95_duration_ms <= 300:
        return "C"
    elif p95_duration_ms <= 500:
        return "D"
    else:
        return "F"


def _determine_recommendation_priority(recommendation: str, performance_data: Dict[str, Any]) -> str:
    """Determine priority of a recommendation based on performance data."""
    # High priority for critical performance issues
    if "slow queries" in recommendation.lower() or "index" in recommendation.lower():
        slow_queries = performance_data.get("summary", {}).get("slow_queries", 0)
        total_queries = performance_data.get("summary", {}).get("total_queries", 1)
        if slow_queries / total_queries > 0.1:  # More than 10% slow queries
            return "high"
    
    # Medium priority for cache optimization
    if "cache" in recommendation.lower():
        cache_hit_rate = performance_data.get("summary", {}).get("cache_hit_rate", 1)
        if cache_hit_rate < 0.7:
            return "medium"
    
    # Low priority for general optimizations
    return "low"


def _estimate_performance_impact(recommendation: str) -> str:
    """Estimate performance impact of implementing a recommendation."""
    if "cursor" in recommendation.lower():
        return "high"  # Cursor pagination can provide significant improvements
    elif "index" in recommendation.lower():
        return "high"  # Database index optimization usually has high impact
    elif "cache" in recommendation.lower():
        return "medium"  # Cache improvements provide moderate impact
    else:
        return "low"


def _categorize_recommendation(recommendation: str) -> str:
    """Categorize a recommendation by type."""
    if "cursor" in recommendation.lower() or "pagination" in recommendation.lower():
        return "pagination_strategy"
    elif "index" in recommendation.lower() or "queries" in recommendation.lower():
        return "database_optimization"
    elif "cache" in recommendation.lower():
        return "cache_optimization"
    else:
        return "general_optimization"