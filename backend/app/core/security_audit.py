"""Security audit logging system for comprehensive security event tracking."""
import asyncio
from datetime import UTC, datetime
from enum import Enum
from typing import Any, Dict, List, Optional

import structlog
from app.models.audit_log import AuditLog
from redis.asyncio import Redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.redis import get_redis

logger = structlog.get_logger()


class SecurityEventType(Enum):
    """Security event types for classification."""

    # Authentication events
    LOGIN_SUCCESS = "auth.login.success"
    LOGIN_FAILED = "auth.login.failed"
    LOGIN_BRUTE_FORCE = "auth.login.brute_force"
    LOGOUT = "auth.logout"
    TOKEN_REFRESH = "auth.token.refresh"
    TOKEN_REVOKED = "auth.token.revoked"
    PASSWORD_RESET_REQUEST = "auth.password.reset_request"
    PASSWORD_RESET_SUCCESS = "auth.password.reset_success"
    PASSWORD_CHANGED = "auth.password.changed"

    # Session events
    SESSION_CREATED = "session.created"
    SESSION_EXPIRED = "session.expired"
    SESSION_HIJACK_ATTEMPT = "session.hijack_attempt"

    # Account events
    ACCOUNT_CREATED = "account.created"
    ACCOUNT_VERIFIED = "account.verified"
    ACCOUNT_SUSPENDED = "account.suspended"
    ACCOUNT_DEACTIVATED = "account.deactivated"
    ACCOUNT_DELETED = "account.deleted"
    ACCOUNT_LOCKOUT = "account.lockout"

    # Authorization events
    PERMISSION_DENIED = "authz.permission_denied"
    PRIVILEGE_ESCALATION_ATTEMPT = "authz.privilege_escalation"
    ADMIN_ACTION = "authz.admin_action"

    # Security threats
    SUSPICIOUS_REQUEST = "threat.suspicious_request"
    RATE_LIMIT_EXCEEDED = "threat.rate_limit_exceeded"
    IP_BLOCKED = "threat.ip_blocked"
    SQL_INJECTION_ATTEMPT = "threat.sql_injection"
    XSS_ATTEMPT = "threat.xss_attempt"
    CSRF_ATTEMPT = "threat.csrf_attempt"

    # Data access
    SENSITIVE_DATA_ACCESS = "data.sensitive_access"
    BULK_DATA_EXPORT = "data.bulk_export"
    UNAUTHORIZED_DATA_ACCESS = "data.unauthorized_access"


class SecuritySeverity(Enum):
    """Security event severity levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SecurityAuditor:
    """Enhanced security audit logging with threat detection."""

    def __init__(self):
        self.settings = get_settings()

    async def log_security_event(
        self,
        db: AsyncSession,
        event_type: SecurityEventType,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        resource: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        severity: SecuritySeverity = SecuritySeverity.MEDIUM,
        success: bool = True,
    ) -> None:
        """
        Log a security event with comprehensive details.

        Args:
            db: Database session
            event_type: Type of security event
            user_id: Optional user ID associated with event
            ip_address: Client IP address
            user_agent: Client user agent string
            resource: Resource being accessed
            details: Additional event details
            severity: Event severity level
            success: Whether the event was successful
        """
        # Create audit log entry
        audit_entry = AuditLog(
            user_id=user_id,
            action=event_type.value,
            resource=resource or "unknown",
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or {},
            severity=severity.value,
            success=success,
            timestamp=datetime.now(UTC),
        )

        db.add(audit_entry)
        await db.commit()

        # Enhanced structured logging
        log_data = {
            "event_type": event_type.value,
            "severity": severity.value,
            "success": success,
            "user_id": user_id,
            "ip_address": ip_address,
            "resource": resource,
            "details": details,
        }

        # Log to structured logger based on severity
        if severity == SecuritySeverity.CRITICAL:
            logger.critical("security_audit", **log_data)
        elif severity == SecuritySeverity.HIGH:
            logger.error("security_audit", **log_data)
        elif severity == SecuritySeverity.MEDIUM:
            logger.warning("security_audit", **log_data)
        else:
            logger.info("security_audit", **log_data)

        # Store in Redis for real-time monitoring
        await self._store_redis_event(
            event_type, severity, user_id, ip_address, details
        )

        # Check for security patterns that require immediate attention
        await self._check_security_patterns(
            db, event_type, user_id, ip_address, severity
        )

    async def _store_redis_event(
        self,
        event_type: SecurityEventType,
        severity: SecuritySeverity,
        user_id: Optional[int],
        ip_address: Optional[str],
        details: Optional[Dict[str, Any]],
    ) -> None:
        """Store security event in Redis for real-time monitoring."""
        async for redis in get_redis():
            event_data = {
                "event_type": event_type.value,
                "severity": severity.value,
                "user_id": str(user_id) if user_id else "anonymous",
                "ip_address": ip_address or "unknown",
                "timestamp": datetime.now(UTC).isoformat(),
                "details": str(details) if details else "{}",
            }

            # Store recent events (last 1000, expire after 24 hours)
            await redis.lpush("security_events:recent", str(event_data))
            await redis.ltrim("security_events:recent", 0, 999)
            await redis.expire("security_events:recent", 86400)

            # Track IP-based events
            if ip_address:
                ip_key = f"security_events:ip:{ip_address}"
                await redis.incr(ip_key)
                await redis.expire(ip_key, 3600)  # 1 hour

            # Track user-based events
            if user_id:
                user_key = f"security_events:user:{user_id}"
                await redis.incr(user_key)
                await redis.expire(user_key, 3600)  # 1 hour

    async def _check_security_patterns(
        self,
        db: AsyncSession,
        event_type: SecurityEventType,
        user_id: Optional[int],
        ip_address: Optional[str],
        severity: SecuritySeverity,
    ) -> None:
        """Check for security patterns requiring immediate attention."""
        try:
            # Check for brute force patterns
            if event_type in [
                SecurityEventType.LOGIN_FAILED,
                SecurityEventType.LOGIN_SUCCESS,
            ]:
                await self._check_brute_force_pattern(db, ip_address, user_id)

            # Check for session hijack attempts
            if event_type == SecurityEventType.SESSION_CREATED and user_id:
                await self._check_session_anomalies(db, user_id, ip_address)

            # Alert on critical events
            if severity == SecuritySeverity.CRITICAL:
                await self._trigger_security_alert(event_type, user_id, ip_address)

        except Exception as e:
            logger.error(
                "security_pattern_check_failed",
                error=str(e),
                event_type=event_type.value,
            )

    async def _check_brute_force_pattern(
        self, db: AsyncSession, ip_address: Optional[str], user_id: Optional[int]
    ) -> None:
        """Check for brute force attack patterns."""
        if not ip_address:
            return

        # Check recent failed login attempts from this IP
        recent_failures = await db.execute(
            select(func.count(AuditLog.id)).where(
                AuditLog.action == SecurityEventType.LOGIN_FAILED.value,
                AuditLog.ip_address == ip_address,
                AuditLog.timestamp > func.now() - func.interval("15 minutes"),
                AuditLog.success == False,
            )
        )

        failure_count = recent_failures.scalar()

        if failure_count >= 5:  # 5 failures in 15 minutes
            await self.log_security_event(
                db=db,
                event_type=SecurityEventType.LOGIN_BRUTE_FORCE,
                ip_address=ip_address,
                user_id=user_id,
                severity=SecuritySeverity.HIGH,
                details={
                    "failure_count": failure_count,
                    "time_window": "15_minutes",
                    "action_taken": "ip_monitoring_increased",
                },
                success=False,
            )

    async def _check_session_anomalies(
        self, db: AsyncSession, user_id: int, ip_address: Optional[str]
    ) -> None:
        """Check for session-based anomalies."""
        if not ip_address:
            return

        # Check for rapid location changes (different IPs in short time)
        recent_sessions = await db.execute(
            select(AuditLog.ip_address)
            .where(
                AuditLog.user_id == user_id,
                AuditLog.action == SecurityEventType.SESSION_CREATED.value,
                AuditLog.timestamp > func.now() - func.interval("5 minutes"),
            )
            .distinct()
        )

        unique_ips = [ip for (ip,) in recent_sessions.fetchall() if ip]

        if len(unique_ips) > 2:  # More than 2 different IPs in 5 minutes
            await self.log_security_event(
                db=db,
                event_type=SecurityEventType.SESSION_HIJACK_ATTEMPT,
                user_id=user_id,
                ip_address=ip_address,
                severity=SecuritySeverity.HIGH,
                details={
                    "unique_ips": unique_ips,
                    "ip_count": len(unique_ips),
                    "time_window": "5_minutes",
                },
                success=False,
            )

    async def _trigger_security_alert(
        self,
        event_type: SecurityEventType,
        user_id: Optional[int],
        ip_address: Optional[str],
    ) -> None:
        """Trigger immediate security alert for critical events."""
        alert_data = {
            "event_type": event_type.value,
            "user_id": user_id,
            "ip_address": ip_address,
            "timestamp": datetime.now(UTC).isoformat(),
            "alert_level": "CRITICAL",
        }

        # Store alert in Redis for immediate processing
        async for redis in get_redis():
            await redis.lpush("security_alerts:critical", str(alert_data))
            await redis.expire("security_alerts:critical", 3600)  # 1 hour

        logger.critical("security_alert_triggered", **alert_data)

    async def get_security_dashboard_data(
        self, db: AsyncSession, hours: int = 24
    ) -> Dict[str, Any]:
        """
        Get security dashboard data for monitoring.

        Args:
            db: Database session
            hours: Hours of history to include

        Returns:
            Dashboard data with security metrics
        """
        # Get event counts by type
        event_counts = await db.execute(
            select(AuditLog.action, func.count(AuditLog.id))
            .where(AuditLog.timestamp > func.now() - func.interval(f"{hours} hours"))
            .group_by(AuditLog.action)
        )

        events_by_type = dict(event_counts.fetchall())

        # Get failed events
        failed_events = await db.execute(
            select(func.count(AuditLog.id)).where(
                AuditLog.success == False,
                AuditLog.timestamp > func.now() - func.interval(f"{hours} hours"),
            )
        )

        # Get top IP addresses by event count
        top_ips = await db.execute(
            select(AuditLog.ip_address, func.count(AuditLog.id))
            .where(AuditLog.timestamp > func.now() - func.interval(f"{hours} hours"))
            .group_by(AuditLog.ip_address)
            .order_by(func.count(AuditLog.id).desc())
            .limit(10)
        )

        # Get severity distribution
        severity_counts = await db.execute(
            select(AuditLog.severity, func.count(AuditLog.id))
            .where(AuditLog.timestamp > func.now() - func.interval(f"{hours} hours"))
            .group_by(AuditLog.severity)
        )

        return {
            "time_window": f"{hours} hours",
            "total_events": sum(events_by_type.values()),
            "failed_events": failed_events.scalar(),
            "events_by_type": events_by_type,
            "top_source_ips": dict(top_ips.fetchall()),
            "severity_distribution": dict(severity_counts.fetchall()),
            "generated_at": datetime.now(UTC).isoformat(),
        }

    async def get_user_security_history(
        self, db: AsyncSession, user_id: int, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get security event history for a specific user.

        Args:
            db: Database session
            user_id: User ID
            limit: Maximum number of events to return

        Returns:
            List of security events for the user
        """
        events = await db.execute(
            select(AuditLog)
            .where(AuditLog.user_id == user_id)
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
        )

        return [
            {
                "id": event.id,
                "action": event.action,
                "resource": event.resource,
                "ip_address": event.ip_address,
                "user_agent": event.user_agent,
                "severity": event.severity,
                "success": event.success,
                "details": event.details,
                "timestamp": event.timestamp.isoformat(),
            }
            for event in events.scalars().all()
        ]


# Global security auditor instance
security_auditor = SecurityAuditor()


# Convenience functions for common security events
async def log_login_attempt(
    db: AsyncSession,
    user_id: Optional[int],
    ip_address: Optional[str],
    user_agent: Optional[str],
    success: bool,
    details: Optional[Dict[str, Any]] = None,
) -> None:
    """Log a login attempt."""
    event_type = (
        SecurityEventType.LOGIN_SUCCESS if success else SecurityEventType.LOGIN_FAILED
    )
    severity = SecuritySeverity.LOW if success else SecuritySeverity.MEDIUM

    await security_auditor.log_security_event(
        db=db,
        event_type=event_type,
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        severity=severity,
        success=success,
        details=details,
    )


async def log_token_event(
    db: AsyncSession,
    event_type: SecurityEventType,
    user_id: int,
    ip_address: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> None:
    """Log a token-related security event."""
    await security_auditor.log_security_event(
        db=db,
        event_type=event_type,
        user_id=user_id,
        ip_address=ip_address,
        severity=SecuritySeverity.MEDIUM,
        details=details,
    )


async def log_suspicious_activity(
    db: AsyncSession,
    event_type: SecurityEventType,
    ip_address: Optional[str],
    user_agent: Optional[str] = None,
    user_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
) -> None:
    """Log suspicious security activity."""
    await security_auditor.log_security_event(
        db=db,
        event_type=event_type,
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        severity=SecuritySeverity.HIGH,
        success=False,
        details=details,
    )
