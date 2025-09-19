"""
Monitoring and Alerting API Endpoints

Provides comprehensive monitoring dashboard, alert management,
and system health visibility for NeoForge platform.
"""

import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from prometheus_client import REGISTRY, generate_latest
from pydantic import BaseModel

from app.api.deps import get_current_active_superuser, get_current_user
from app.models.user import User
from app.services.alerting_service import AlertSeverity, AlertStatus, alerting_service

router = APIRouter()


# Response Models
class AlertResponse(BaseModel):
    rule_name: str
    severity: AlertSeverity
    status: AlertStatus
    message: str
    labels: Dict[str, str]
    annotations: Dict[str, str]
    started_at: datetime
    resolved_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None


class AlertStatsResponse(BaseModel):
    total_active: int
    critical: int
    warning: int
    info: int
    rules_configured: int
    rules_enabled: int


class SystemHealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    active_alerts: int
    critical_alerts: int
    services: Dict[str, Dict[str, Any]]
    metrics_summary: Dict[str, float]
    last_updated: datetime


class MetricDataPoint(BaseModel):
    timestamp: float
    value: float


class MetricResponse(BaseModel):
    name: str
    help: str
    type: str
    data_points: List[MetricDataPoint]


# Global startup time for uptime calculation
startup_time = time.time()


@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(
    severity: Optional[AlertSeverity] = None,
    status: Optional[AlertStatus] = None,
    current_user: User = Depends(get_current_user)
) -> List[AlertResponse]:
    """
    Get current alerts with optional filtering.
    
    Available to all authenticated users for transparency.
    """
    alerts = alerting_service.get_active_alerts()
    
    # Apply filters
    if severity:
        alerts = [alert for alert in alerts if alert.severity == severity]
    
    if status:
        alerts = [alert for alert in alerts if alert.status == status]
    
    return [
        AlertResponse(
            rule_name=alert.rule_name,
            severity=alert.severity,
            status=alert.status,
            message=alert.message,
            labels=alert.labels,
            annotations=alert.annotations,
            started_at=alert.started_at,
            resolved_at=alert.resolved_at,
            acknowledged_at=alert.acknowledged_at,
            acknowledged_by=alert.acknowledged_by
        )
        for alert in alerts
    ]


@router.post("/alerts/{alert_key}/acknowledge")
async def acknowledge_alert(
    alert_key: str,
    current_user: User = Depends(get_current_active_superuser)
) -> JSONResponse:
    """
    Acknowledge an active alert.
    
    Requires superuser privileges.
    """
    success = await alerting_service.acknowledge_alert(alert_key, current_user.email)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_key} not found or already resolved"
        )
    
    return JSONResponse(
        content={"message": f"Alert {alert_key} acknowledged by {current_user.email}"}
    )


@router.get("/alerts/stats", response_model=AlertStatsResponse)
async def get_alert_stats(
    current_user: User = Depends(get_current_user)
) -> AlertStatsResponse:
    """
    Get alerting statistics summary.
    
    Available to all authenticated users.
    """
    stats = alerting_service.get_alert_stats()
    return AlertStatsResponse(**stats)


@router.get("/health/system", response_model=SystemHealthResponse)
async def get_system_health(
    current_user: User = Depends(get_current_user)
) -> SystemHealthResponse:
    """
    Get comprehensive system health overview.
    
    Combines alerts, metrics, and service status into unified health view.
    """
    alerts = alerting_service.get_active_alerts()
    alert_stats = alerting_service.get_alert_stats()
    
    # Calculate overall system status
    critical_count = alert_stats["critical"]
    warning_count = alert_stats["warning"]
    
    if critical_count > 0:
        overall_status = "critical"
    elif warning_count > 0:
        overall_status = "warning"
    else:
        overall_status = "healthy"
    
    # Collect metric summaries
    metrics_summary = {}
    try:
        for metric_family in REGISTRY.collect():
            for sample in metric_family.samples:
                if sample.name in [
                    "http_requests_total",
                    "http_5xx_responses_total", 
                    "db_connections_active",
                    "db_slow_queries_total",
                    "redis_errors_total",
                    "celery_queue_depth"
                ]:
                    metrics_summary[sample.name] = sample.value
    except Exception:
        pass  # Metrics collection is optional for health check
    
    # Service status summary
    services = {
        "api": {
            "status": "healthy" if critical_count == 0 else "degraded",
            "alerts": len([a for a in alerts if a.labels.get("component") == "api"])
        },
        "database": {
            "status": "healthy" if not any(
                a.labels.get("component") == "database" and a.severity == AlertSeverity.CRITICAL 
                for a in alerts
            ) else "critical",
            "alerts": len([a for a in alerts if a.labels.get("component") == "database"])
        },
        "redis": {
            "status": "healthy" if not any(
                a.labels.get("component") == "redis" and a.severity == AlertSeverity.CRITICAL
                for a in alerts
            ) else "critical",
            "alerts": len([a for a in alerts if a.labels.get("component") == "redis"])
        },
        "celery": {
            "status": "healthy" if not any(
                a.labels.get("component") == "celery" and a.severity == AlertSeverity.CRITICAL
                for a in alerts
            ) else "degraded",
            "alerts": len([a for a in alerts if a.labels.get("component") == "celery"])
        }
    }
    
    return SystemHealthResponse(
        status=overall_status,
        uptime_seconds=time.time() - startup_time,
        active_alerts=alert_stats["total_active"],
        critical_alerts=critical_count,
        services=services,
        metrics_summary=metrics_summary,
        last_updated=datetime.utcnow()
    )


@router.get("/metrics/prometheus")
async def get_prometheus_metrics(
    current_user: User = Depends(get_current_active_superuser)
) -> str:
    """
    Get Prometheus-formatted metrics for scraping.
    
    Requires superuser privileges for security.
    """
    return generate_latest(REGISTRY)


@router.get("/metrics/{metric_name}")
async def get_metric_data(
    metric_name: str,
    hours: int = Query(default=1, ge=1, le=24),
    current_user: User = Depends(get_current_user)
) -> MetricResponse:
    """
    Get historical data for a specific metric.
    
    Currently returns current value only.
    TODO: Implement time-series storage for historical data.
    """
    # Find metric in registry
    metric_found = None
    metric_help = ""
    metric_type = ""
    current_value = 0.0
    
    try:
        for metric_family in REGISTRY.collect():
            if metric_family.name == metric_name:
                metric_found = metric_family
                metric_help = metric_family.documentation
                metric_type = metric_family.type
                
                # Get current value
                for sample in metric_family.samples:
                    if sample.name == metric_name:
                        current_value = sample.value
                        break
                break
    except Exception:
        pass
    
    if not metric_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Metric {metric_name} not found"
        )
    
    # Return current value as single data point
    # TODO: Replace with actual time-series data from storage
    current_time = time.time()
    
    return MetricResponse(
        name=metric_name,
        help=metric_help,
        type=metric_type,
        data_points=[
            MetricDataPoint(
                timestamp=current_time,
                value=current_value
            )
        ]
    )


@router.get("/dashboard/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get monitoring dashboard summary with key metrics and alerts.
    
    Provides high-level overview for monitoring dashboard UI.
    """
    alerts = alerting_service.get_active_alerts()
    alert_stats = alerting_service.get_alert_stats()
    
    # Get key performance indicators
    kpis = {}
    try:
        for metric_family in REGISTRY.collect():
            for sample in metric_family.samples:
                # HTTP performance
                if sample.name == "http_requests_total":
                    kpis["total_requests"] = sample.value
                elif sample.name == "http_5xx_responses_total":
                    kpis["error_count"] = sample.value
                
                # Database performance  
                elif sample.name == "db_connections_active":
                    kpis["db_connections"] = sample.value
                elif sample.name == "db_slow_queries_total":
                    kpis["slow_queries"] = sample.value
                
                # Queue health
                elif sample.name == "celery_queue_depth":
                    kpis["queue_depth"] = sample.value
                
                # Email delivery
                elif sample.name == "email_sent_total":
                    kpis["emails_sent"] = sample.value
                elif sample.name == "email_failed_total":
                    kpis["emails_failed"] = sample.value
    except Exception:
        pass
    
    # Calculate derived metrics
    if "total_requests" in kpis and "error_count" in kpis and kpis["total_requests"] > 0:
        kpis["error_rate"] = (kpis["error_count"] / kpis["total_requests"]) * 100
    else:
        kpis["error_rate"] = 0.0
    
    if "emails_sent" in kpis and "emails_failed" in kpis and kpis["emails_sent"] > 0:
        kpis["email_success_rate"] = ((kpis["emails_sent"] - kpis["emails_failed"]) / kpis["emails_sent"]) * 100
    else:
        kpis["email_success_rate"] = 100.0
    
    # Recent critical alerts
    recent_critical = [
        {
            "rule_name": alert.rule_name,
            "message": alert.message,
            "started_at": alert.started_at.isoformat(),
            "status": alert.status
        }
        for alert in alerts 
        if alert.severity == AlertSeverity.CRITICAL
    ][:5]  # Last 5 critical alerts
    
    return {
        "system_status": "healthy" if alert_stats["critical"] == 0 else "critical",
        "uptime_hours": round((time.time() - startup_time) / 3600, 1),
        "alert_summary": {
            "total": alert_stats["total_active"],
            "critical": alert_stats["critical"],
            "warning": alert_stats["warning"]
        },
        "kpis": kpis,
        "recent_critical_alerts": recent_critical,
        "last_updated": datetime.utcnow().isoformat()
    }


@router.get("/health/readiness")
async def readiness_check() -> JSONResponse:
    """
    Kubernetes/container readiness check.
    
    Returns 200 if system is ready to serve traffic.
    Public endpoint - no authentication required.
    """
    # Check for any critical alerts that would prevent serving traffic
    alerts = alerting_service.get_active_alerts()
    critical_alerts = [a for a in alerts if a.severity == AlertSeverity.CRITICAL]
    
    # Specific critical conditions that affect readiness
    blocking_alerts = [
        a for a in critical_alerts 
        if a.labels.get("component") in ["database", "redis"] or
           a.rule_name in ["database_connection_pool_exhausted", "redis_connection_errors"]
    ]
    
    if blocking_alerts:
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "reason": "critical_infrastructure_alerts",
                "blocking_alerts": [a.rule_name for a in blocking_alerts]
            }
        )
    
    return JSONResponse(
        content={
            "status": "ready",
            "uptime_seconds": time.time() - startup_time,
            "active_alerts": len(alerts)
        }
    )


@router.get("/health/liveness")
async def liveness_check() -> JSONResponse:
    """
    Kubernetes/container liveness check.
    
    Returns 200 if application is alive (not deadlocked).
    Public endpoint - no authentication required.
    """
    return JSONResponse(
        content={
            "status": "alive",
            "timestamp": datetime.utcnow().isoformat(),
            "uptime_seconds": time.time() - startup_time
        }
    )