"""
Comprehensive Alerting Service for NeoForge Platform

Provides automated monitoring, threshold-based alerting, and multi-channel notifications
for production system health, performance, and business metrics.
"""

import asyncio
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional

import httpx
from prometheus_client import REGISTRY
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.redis import get_redis
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


class AlertSeverity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class AlertStatus(str, Enum):
    FIRING = "firing"
    RESOLVED = "resolved"
    ACKNOWLEDGED = "acknowledged"


@dataclass
class AlertRule:
    """Definition of an alerting rule with thresholds and conditions."""
    name: str
    description: str
    metric_name: str
    threshold: float
    comparison: str  # "gt", "lt", "eq", "gte", "lte"
    duration: int  # seconds - how long condition must persist
    severity: AlertSeverity
    labels: Dict[str, str]
    annotations: Dict[str, str]
    enabled: bool = True


@dataclass
class Alert:
    """Active alert instance."""
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


class AlertingService:
    """
    Comprehensive alerting service for production monitoring.
    
    Features:
    - Metric-based alerting with configurable thresholds
    - Multi-channel notifications (Email, Slack, PagerDuty)
    - Alert lifecycle management (firing, acknowledged, resolved)
    - Business metric monitoring
    - SLA/SLO tracking
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.email_service = EmailService()
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_rules: List[AlertRule] = []
        self.last_evaluation = {}
        self.notification_channels = []
        self._initialize_default_rules()
    
    def _initialize_default_rules(self):
        """Initialize default alerting rules for production monitoring."""
        self.alert_rules = [
            # System Health Alerts
            AlertRule(
                name="high_error_rate",
                description="HTTP 5xx error rate is too high",
                metric_name="http_5xx_responses_total",
                threshold=10.0,  # 10 errors per minute
                comparison="gt",
                duration=60,  # 1 minute
                severity=AlertSeverity.CRITICAL,
                labels={"component": "api", "type": "error_rate"},
                annotations={
                    "summary": "High API error rate detected",
                    "runbook": "Check application logs and recent deployments"
                }
            ),
            AlertRule(
                name="high_response_time",
                description="API response time is too slow",
                metric_name="http_request_duration_seconds",
                threshold=2.0,  # 2 seconds P95
                comparison="gt",
                duration=120,  # 2 minutes
                severity=AlertSeverity.WARNING,
                labels={"component": "api", "type": "performance"},
                annotations={
                    "summary": "API response time degraded",
                    "runbook": "Check database performance and system resources"
                }
            ),
            AlertRule(
                name="database_slow_queries",
                description="Too many slow database queries",
                metric_name="db_slow_queries_total",
                threshold=5.0,  # 5 slow queries per minute
                comparison="gt",
                duration=300,  # 5 minutes
                severity=AlertSeverity.WARNING,
                labels={"component": "database", "type": "performance"},
                annotations={
                    "summary": "Database performance degraded",
                    "runbook": "Check slow query log and optimize queries"
                }
            ),
            AlertRule(
                name="database_connection_pool_exhausted",
                description="Database connection pool near exhaustion",
                metric_name="db_connections_active",
                threshold=80.0,  # 80% of pool size
                comparison="gt",
                duration=60,  # 1 minute
                severity=AlertSeverity.CRITICAL,
                labels={"component": "database", "type": "resources"},
                annotations={
                    "summary": "Database connection pool exhaustion",
                    "runbook": "Check for connection leaks and scale database"
                }
            ),
            AlertRule(
                name="redis_connection_errors",
                description="Redis connection errors detected",
                metric_name="redis_errors_total",
                threshold=5.0,  # 5 errors per minute
                comparison="gt",
                duration=60,  # 1 minute
                severity=AlertSeverity.CRITICAL,
                labels={"component": "redis", "type": "connectivity"},
                annotations={
                    "summary": "Redis connectivity issues",
                    "runbook": "Check Redis server health and network connectivity"
                }
            ),
            AlertRule(
                name="celery_queue_backlog",
                description="Celery queue has high backlog",
                metric_name="celery_queue_depth",
                threshold=100.0,  # 100 pending tasks
                comparison="gt",
                duration=300,  # 5 minutes
                severity=AlertSeverity.WARNING,
                labels={"component": "celery", "type": "queue"},
                annotations={
                    "summary": "Celery queue backlog detected",
                    "runbook": "Check worker health and scale workers if needed"
                }
            ),
            # Business Metrics Alerts
            AlertRule(
                name="email_delivery_failure_rate",
                description="Email delivery failure rate is too high",
                metric_name="email_failed_total",
                threshold=10.0,  # 10% failure rate
                comparison="gt",
                duration=600,  # 10 minutes
                severity=AlertSeverity.WARNING,
                labels={"component": "email", "type": "delivery"},
                annotations={
                    "summary": "Email delivery issues detected",
                    "runbook": "Check email service provider status and credentials"
                }
            ),
        ]
    
    async def evaluate_alerts(self) -> List[Alert]:
        """Evaluate all alert rules against current metrics."""
        new_alerts = []
        current_time = datetime.utcnow()
        
        # Get current metric values
        metric_values = await self._collect_metric_values()
        
        for rule in self.alert_rules:
            if not rule.enabled:
                continue
                
            alert_key = f"{rule.name}_{rule.metric_name}"
            current_value = metric_values.get(rule.metric_name, 0)
            
            # Evaluate condition
            condition_met = self._evaluate_condition(current_value, rule.threshold, rule.comparison)
            
            if condition_met:
                # Check if condition has persisted for required duration
                if alert_key not in self.last_evaluation:
                    self.last_evaluation[alert_key] = current_time
                    continue
                
                duration_met = (current_time - self.last_evaluation[alert_key]).total_seconds() >= rule.duration
                
                if duration_met and alert_key not in self.active_alerts:
                    # Create new alert
                    alert = Alert(
                        rule_name=rule.name,
                        severity=rule.severity,
                        status=AlertStatus.FIRING,
                        message=f"{rule.description}. Current value: {current_value}, Threshold: {rule.threshold}",
                        labels=rule.labels,
                        annotations=rule.annotations,
                        started_at=current_time
                    )
                    
                    self.active_alerts[alert_key] = alert
                    new_alerts.append(alert)
                    
                    logger.warning(f"Alert fired: {rule.name} - {alert.message}")
                    
                    # Send notifications
                    await self._send_alert_notification(alert)
            else:
                # Condition not met, reset evaluation time
                if alert_key in self.last_evaluation:
                    del self.last_evaluation[alert_key]
                
                # Resolve alert if it was active
                if alert_key in self.active_alerts:
                    alert = self.active_alerts[alert_key]
                    alert.status = AlertStatus.RESOLVED
                    alert.resolved_at = current_time
                    
                    logger.info(f"Alert resolved: {alert.rule_name}")
                    
                    # Send resolution notification
                    await self._send_resolution_notification(alert)
                    
                    # Remove from active alerts
                    del self.active_alerts[alert_key]
        
        return new_alerts
    
    async def _collect_metric_values(self) -> Dict[str, float]:
        """Collect current values for all monitored metrics."""
        values = {}
        
        try:
            # Collect Prometheus metrics
            for metric_family in REGISTRY.collect():
                for sample in metric_family.samples:
                    if sample.name in [rule.metric_name for rule in self.alert_rules]:
                        # For counters, calculate rate over last minute
                        if sample.name.endswith("_total"):
                            values[sample.name] = await self._calculate_rate(sample.name, sample.value)
                        else:
                            values[sample.name] = sample.value
        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")
        
        return values
    
    async def _calculate_rate(self, metric_name: str, current_value: float) -> float:
        """Calculate per-minute rate for counter metrics."""
        redis = await get_redis()
        if not redis:
            return 0.0
        
        try:
            # Store current value with timestamp
            current_time = int(time.time())
            key = f"metric_rate:{metric_name}"
            
            # Get previous value from 1 minute ago
            pipeline = redis.pipeline()
            pipeline.zremrangebyscore(key, 0, current_time - 120)  # Keep only last 2 minutes
            pipeline.zadd(key, {str(current_value): current_time})
            pipeline.expire(key, 180)  # Expire after 3 minutes
            pipeline.zrange(key, 0, -1, withscores=True)
            results = await pipeline.execute()
            
            values = results[3] if len(results) > 3 else []
            
            if len(values) < 2:
                return 0.0
            
            # Calculate rate over last minute
            oldest_value, oldest_time = float(values[0][0]), values[0][1]
            time_diff = (current_time - oldest_time) / 60.0  # Convert to minutes
            
            if time_diff > 0:
                return (current_value - oldest_value) / time_diff
            
        except Exception as e:
            logger.error(f"Error calculating rate for {metric_name}: {e}")
        
        return 0.0
    
    def _evaluate_condition(self, value: float, threshold: float, comparison: str) -> bool:
        """Evaluate alert condition."""
        if comparison == "gt":
            return value > threshold
        elif comparison == "lt":
            return value < threshold
        elif comparison == "gte":
            return value >= threshold
        elif comparison == "lte":
            return value <= threshold
        elif comparison == "eq":
            return value == threshold
        return False
    
    async def _send_alert_notification(self, alert: Alert):
        """Send alert notification through configured channels."""
        try:
            # Email notification
            await self._send_email_alert(alert)
            
            # Slack notification (if configured)
            if hasattr(self.settings, 'slack_webhook_url') and self.settings.slack_webhook_url:
                await self._send_slack_alert(alert)
                
            # PagerDuty notification (if configured and critical)
            if (alert.severity == AlertSeverity.CRITICAL and 
                hasattr(self.settings, 'pagerduty_routing_key') and 
                self.settings.pagerduty_routing_key):
                await self._send_pagerduty_alert(alert)
                
        except Exception as e:
            logger.error(f"Error sending alert notification: {e}")
    
    async def _send_email_alert(self, alert: Alert):
        """Send email alert to administrators."""
        try:
            subject = f"🚨 [{alert.severity.upper()}] {alert.rule_name}"
            
            context = {
                "alert": alert,
                "platform_name": "NeoForge",
                "dashboard_url": f"{self.settings.server_host}/monitoring",
                "severity_emoji": "🚨" if alert.severity == AlertSeverity.CRITICAL else "⚠️"
            }
            
            await self.email_service.send_admin_alert(
                subject=subject,
                context=context
            )
            
        except Exception as e:
            logger.error(f"Error sending email alert: {e}")
    
    async def _send_slack_alert(self, alert: Alert):
        """Send Slack alert notification."""
        try:
            color = "#ff0000" if alert.severity == AlertSeverity.CRITICAL else "#ffaa00"
            emoji = "🚨" if alert.severity == AlertSeverity.CRITICAL else "⚠️"
            
            payload = {
                "text": f"{emoji} Alert: {alert.rule_name}",
                "attachments": [
                    {
                        "color": color,
                        "fields": [
                            {
                                "title": "Severity",
                                "value": alert.severity.upper(),
                                "short": True
                            },
                            {
                                "title": "Status", 
                                "value": alert.status.upper(),
                                "short": True
                            },
                            {
                                "title": "Message",
                                "value": alert.message,
                                "short": False
                            },
                            {
                                "title": "Started",
                                "value": alert.started_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
                                "short": True
                            }
                        ]
                    }
                ]
            }
            
            async with httpx.AsyncClient() as client:
                await client.post(self.settings.slack_webhook_url, json=payload)
                
        except Exception as e:
            logger.error(f"Error sending Slack alert: {e}")
    
    async def _send_pagerduty_alert(self, alert: Alert):
        """Send PagerDuty alert for critical issues."""
        try:
            payload = {
                "routing_key": self.settings.pagerduty_routing_key,
                "event_action": "trigger",
                "dedup_key": f"neoforge_{alert.rule_name}",
                "payload": {
                    "summary": f"{alert.rule_name}: {alert.message}",
                    "source": "NeoForge Monitoring",
                    "severity": "critical",
                    "component": alert.labels.get("component", "unknown"),
                    "group": "production",
                    "class": alert.labels.get("type", "unknown"),
                    "custom_details": {
                        "rule_name": alert.rule_name,
                        "severity": alert.severity,
                        "started_at": alert.started_at.isoformat(),
                        "annotations": alert.annotations
                    }
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://events.pagerduty.com/v2/enqueue",
                    json=payload
                )
                response.raise_for_status()
                
        except Exception as e:
            logger.error(f"Error sending PagerDuty alert: {e}")
    
    async def _send_resolution_notification(self, alert: Alert):
        """Send notification when alert is resolved."""
        try:
            # Email resolution
            subject = f"✅ [RESOLVED] {alert.rule_name}"
            
            context = {
                "alert": alert,
                "platform_name": "NeoForge",
                "resolved": True
            }
            
            await self.email_service.send_admin_alert(
                subject=subject,
                context=context
            )
            
            # Slack resolution (if configured)
            if hasattr(self.settings, 'slack_webhook_url') and self.settings.slack_webhook_url:
                payload = {
                    "text": f"✅ Resolved: {alert.rule_name}",
                    "attachments": [
                        {
                            "color": "#00ff00",
                            "text": f"Alert resolved after {alert.resolved_at - alert.started_at}"
                        }
                    ]
                }
                
                async with httpx.AsyncClient() as client:
                    await client.post(self.settings.slack_webhook_url, json=payload)
            
            # PagerDuty resolution (if was critical)
            if (alert.severity == AlertSeverity.CRITICAL and 
                hasattr(self.settings, 'pagerduty_routing_key') and 
                self.settings.pagerduty_routing_key):
                
                payload = {
                    "routing_key": self.settings.pagerduty_routing_key,
                    "event_action": "resolve",
                    "dedup_key": f"neoforge_{alert.rule_name}"
                }
                
                async with httpx.AsyncClient() as client:
                    await client.post("https://events.pagerduty.com/v2/enqueue", json=payload)
                    
        except Exception as e:
            logger.error(f"Error sending resolution notification: {e}")
    
    async def acknowledge_alert(self, alert_key: str, acknowledged_by: str) -> bool:
        """Acknowledge an active alert."""
        if alert_key in self.active_alerts:
            alert = self.active_alerts[alert_key]
            alert.status = AlertStatus.ACKNOWLEDGED
            alert.acknowledged_at = datetime.utcnow()
            alert.acknowledged_by = acknowledged_by
            
            logger.info(f"Alert acknowledged by {acknowledged_by}: {alert.rule_name}")
            return True
        
        return False
    
    def get_active_alerts(self) -> List[Alert]:
        """Get all currently active alerts."""
        return list(self.active_alerts.values())
    
    def get_alert_stats(self) -> Dict[str, Any]:
        """Get alerting statistics."""
        active_count = len(self.active_alerts)
        critical_count = sum(1 for alert in self.active_alerts.values() 
                           if alert.severity == AlertSeverity.CRITICAL)
        warning_count = sum(1 for alert in self.active_alerts.values() 
                          if alert.severity == AlertSeverity.WARNING)
        
        return {
            "total_active": active_count,
            "critical": critical_count,
            "warning": warning_count,
            "info": active_count - critical_count - warning_count,
            "rules_configured": len(self.alert_rules),
            "rules_enabled": sum(1 for rule in self.alert_rules if rule.enabled)
        }


# Singleton instance
alerting_service = AlertingService()


async def start_alerting_monitor():
    """Start the background alerting monitor."""
    logger.info("Starting alerting monitor...")
    
    while True:
        try:
            await alerting_service.evaluate_alerts()
            await asyncio.sleep(30)  # Evaluate every 30 seconds
        except Exception as e:
            logger.error(f"Error in alerting monitor: {e}")
            await asyncio.sleep(60)  # Wait longer on error