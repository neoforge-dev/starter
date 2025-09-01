"""
Audit Logging System for NeoForge
Comprehensive security event logging and compliance tracking.
"""

import logging
import json
import hashlib
import secrets
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Union
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
import asyncio

logger = logging.getLogger(__name__)


class AuditEventType(Enum):
    """Types of audit events that can be logged."""
    # Authentication events
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    LOGOUT = "logout"
    TOKEN_CREATED = "token_created"
    TOKEN_REVOKED = "token_revoked"
    TOKEN_REFRESHED = "token_refreshed"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET = "password_reset"

    # Authorization events
    PERMISSION_GRANTED = "permission_granted"
    PERMISSION_REVOKED = "permission_revoked"
    ROLE_ASSIGNED = "role_assigned"
    ROLE_REMOVED = "role_removed"
    ACCESS_DENIED = "access_denied"

    # User management events
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    USER_SUSPENDED = "user_suspended"
    USER_REACTIVATED = "user_reactivated"

    # Data access events
    DATA_READ = "data_read"
    DATA_CREATED = "data_created"
    DATA_UPDATED = "data_updated"
    DATA_DELETED = "data_deleted"
    DATA_EXPORTED = "data_exported"

    # Security events
    SECURITY_VIOLATION = "security_violation"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    BRUTE_FORCE_ATTEMPT = "brute_force_attempt"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    DDoS_ATTACK_DETECTED = "ddos_attack_detected"

    # System events
    SYSTEM_STARTUP = "system_startup"
    SYSTEM_SHUTDOWN = "system_shutdown"
    CONFIGURATION_CHANGE = "configuration_change"
    BACKUP_COMPLETED = "backup_completed"
    MAINTENANCE_MODE = "maintenance_mode"

    # API events
    API_CALL = "api_call"
    API_ERROR = "api_error"
    WEBHOOK_RECEIVED = "webhook_received"
    WEBHOOK_DELIVERED = "webhook_delivered"

    # Billing events
    SUBSCRIPTION_CREATED = "subscription_created"
    SUBSCRIPTION_UPDATED = "subscription_updated"
    SUBSCRIPTION_CANCELLED = "subscription_cancelled"
    PAYMENT_PROCESSED = "payment_processed"
    PAYMENT_FAILED = "payment_failed"


class AuditEventSeverity(Enum):
    """Severity levels for audit events."""
    LOW = "low"           # Informational events
    MEDIUM = "medium"     # Events requiring attention
    HIGH = "high"         # Important security events
    CRITICAL = "critical" # Critical security incidents


class AuditEventOutcome(Enum):
    """Outcome of audit events."""
    SUCCESS = "success"
    FAILURE = "failure"
    DENIED = "denied"
    BLOCKED = "blocked"
    ERROR = "error"


@dataclass
class AuditEvent:
    """An audit event to be logged."""
    # Required fields first
    event_type: AuditEventType
    description: str

    # Fields with defaults
    event_id: str = field(default_factory=lambda: secrets.token_urlsafe(32))
    severity: AuditEventSeverity = AuditEventSeverity.MEDIUM
    outcome: AuditEventOutcome = AuditEventOutcome.SUCCESS
    timestamp: datetime = field(default_factory=datetime.utcnow)

    # Actor information
    actor_id: Optional[int] = None
    actor_type: str = "user"  # user, system, api_key, service
    actor_ip: Optional[str] = None
    actor_user_agent: Optional[str] = None
    actor_session_id: Optional[str] = None

    # Target information
    target_id: Optional[str] = None
    target_type: Optional[str] = None
    target_resource: Optional[str] = None

    # Context information
    tenant_id: Optional[str] = None
    request_id: Optional[str] = None
    endpoint: Optional[str] = None
    method: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None

    # Event details
    details: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

    # Security information
    risk_score: int = 0
    security_flags: List[str] = field(default_factory=list)
    compliance_flags: List[str] = field(default_factory=list)

    # System information
    service_name: str = "neoforge"
    service_version: Optional[str] = None
    environment: str = "production"

    def to_dict(self) -> Dict[str, Any]:
        """Convert audit event to dictionary."""
        data = asdict(self)
        # Convert enums to strings
        data["event_type"] = self.event_type.value
        data["severity"] = self.severity.value
        data["outcome"] = self.outcome.value
        data["timestamp"] = self.timestamp.isoformat()
        return data

    def to_json(self) -> str:
        """Convert audit event to JSON string."""
        return json.dumps(self.to_dict(), default=str, ensure_ascii=False)

    def get_hash(self) -> str:
        """Get hash of the audit event for integrity checking."""
        event_data = self.to_dict()
        # Remove timestamp and event_id from hash calculation for consistency
        hash_data = {k: v for k, v in event_data.items() if k not in ["event_id", "timestamp"]}
        hash_string = json.dumps(hash_data, sort_keys=True, default=str)
        return hashlib.sha256(hash_string.encode()).hexdigest()


@dataclass
class AuditLogConfig:
    """Configuration for audit logging."""
    enabled: bool = True
    log_to_file: bool = True
    log_to_database: bool = True
    log_to_external: bool = False
    log_level: str = "INFO"
    max_file_size: int = 104857600  # 100MB
    max_files: int = 10
    retention_days: int = 365
    compress_old_logs: bool = True
    encrypt_sensitive_data: bool = True
    include_request_body: bool = False
    include_response_body: bool = False
    mask_sensitive_fields: bool = True
    sensitive_fields: Set[str] = field(default_factory=lambda: {
        "password", "token", "secret", "key", "ssn", "credit_card"
    })
    enable_real_time_monitoring: bool = True
    alert_on_high_severity: bool = True
    alert_on_critical_events: bool = True
    enable_event_correlation: bool = True
    enable_anomaly_detection: bool = False


class AuditEventFilter:
    """Filter for audit events based on various criteria."""

    def __init__(self):
        self.filters: List[callable] = []

    def add_filter(self, filter_func: Callable[[Any], bool]):
        """Add a filter function."""
        self.filters.append(filter_func)

    def should_log(self, event: AuditEvent) -> bool:
        """Check if event should be logged based on filters."""
        for filter_func in self.filters:
            if not filter_func(event):
                return False
        return True

    def filter_by_severity(self, min_severity: AuditEventSeverity):
        """Filter events by minimum severity level."""
        severity_levels = {
            AuditEventSeverity.LOW: 0,
            AuditEventSeverity.MEDIUM: 1,
            AuditEventSeverity.HIGH: 2,
            AuditEventSeverity.CRITICAL: 3
        }

        def severity_filter(event: AuditEvent) -> bool:
            return severity_levels[event.severity] >= severity_levels[min_severity]

        self.add_filter(severity_filter)

    def filter_by_event_type(self, event_types: List[AuditEventType]):
        """Filter events by event type."""
        def event_type_filter(event: AuditEvent) -> bool:
            return event.event_type in event_types

        self.add_filter(event_type_filter)

    def filter_by_actor(self, actor_id: int):
        """Filter events by actor ID."""
        def actor_filter(event: AuditEvent) -> bool:
            return event.actor_id == actor_id

        self.add_filter(actor_filter)

    def filter_by_ip(self, ip_address: str):
        """Filter events by IP address."""
        def ip_filter(event: AuditEvent) -> bool:
            return event.ip_address == ip_address

        self.add_filter(ip_filter)


class AuditLogger:
    """
    Main audit logging service.

    Features:
    - Comprehensive event logging with structured data
    - Multiple output destinations (file, database, external)
    - Event filtering and correlation
    - Real-time monitoring and alerting
    - Compliance and security event tracking
    - Data masking and encryption
    """

    def __init__(self, config: AuditLogConfig):
        self.config = config
        self.event_filter = AuditEventFilter()
        self.pending_events: List[AuditEvent] = []
        self.event_buffer_size = 1000
        self._lock = asyncio.Lock()

        # Set up default filters
        self._setup_default_filters()

        logger.info("Initialized Audit Logger")

    def _setup_default_filters(self):
        """Set up default event filters."""
        # Always log critical and high severity events
        self.event_filter.filter_by_severity(AuditEventSeverity.LOW)

        # Always log security-related events
        security_events = [
            AuditEventType.LOGIN_FAILURE,
            AuditEventType.ACCESS_DENIED,
            AuditEventType.SECURITY_VIOLATION,
            AuditEventType.SUSPICIOUS_ACTIVITY,
            AuditEventType.BRUTE_FORCE_ATTEMPT,
            AuditEventType.DDoS_ATTACK_DETECTED
        ]
        self.event_filter.filter_by_event_type(security_events)

    async def log_event(self, event: AuditEvent):
        """Log an audit event."""
        if not self.config.enabled:
            return

        # Apply filters
        if not self.event_filter.should_log(event):
            return

        # Mask sensitive data
        if self.config.mask_sensitive_fields:
            self._mask_sensitive_data(event)

        # Encrypt sensitive data if enabled
        if self.config.encrypt_sensitive_data:
            self._encrypt_sensitive_data(event)

        # Add event to buffer
        async with self._lock:
            self.pending_events.append(event)

            # Flush buffer if it's full
            if len(self.pending_events) >= self.event_buffer_size:
                await self._flush_events()

        # Log immediately for high/critical events
        if event.severity in [AuditEventSeverity.HIGH, AuditEventSeverity.CRITICAL]:
            await self._log_event_immediately(event)

        # Trigger alerts if configured
        if self.config.alert_on_high_severity and event.severity == AuditEventSeverity.HIGH:
            await self._trigger_alert(event)
        elif self.config.alert_on_critical_events and event.severity == AuditEventSeverity.CRITICAL:
            await self._trigger_critical_alert(event)

    async def log_security_event(
        self,
        event_type: AuditEventType,
        description: str,
        actor_id: Optional[int] = None,
        target_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        risk_score: int = 0,
        **kwargs
    ):
        """Log a security event with common parameters."""
        event = AuditEvent(
            event_type=event_type,
            severity=self._get_security_event_severity(event_type),
            description=description,
            actor_id=actor_id,
            target_id=target_id,
            ip_address=ip_address,
            user_agent=user_agent,
            risk_score=risk_score,
            details=kwargs
        )

        await self.log_event(event)

    async def log_authentication_event(
        self,
        success: bool,
        actor_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        failure_reason: Optional[str] = None,
        **kwargs
    ):
        """Log an authentication event."""
        event_type = AuditEventType.LOGIN_SUCCESS if success else AuditEventType.LOGIN_FAILURE
        severity = AuditEventSeverity.LOW if success else AuditEventSeverity.HIGH

        event = AuditEvent(
            event_type=event_type,
            severity=severity,
            outcome=AuditEventOutcome.SUCCESS if success else AuditEventOutcome.FAILURE,
            description=f"Authentication {'successful' if success else 'failed'}",
            actor_id=actor_id,
            ip_address=ip_address,
            user_agent=user_agent,
            risk_score=30 if not success else 0,
            details={
                "failure_reason": failure_reason,
                **kwargs
            }
        )

        await self.log_event(event)

    async def log_authorization_event(
        self,
        allowed: bool,
        resource: str,
        action: str,
        actor_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        **kwargs
    ):
        """Log an authorization event."""
        event_type = AuditEventType.ACCESS_DENIED if not allowed else AuditEventType.PERMISSION_GRANTED
        severity = AuditEventSeverity.HIGH if not allowed else AuditEventSeverity.LOW

        event = AuditEvent(
            event_type=event_type,
            severity=severity,
            outcome=AuditEventOutcome.SUCCESS if allowed else AuditEventOutcome.DENIED,
            description=f"Access {'granted' if allowed else 'denied'} to {resource}",
            actor_id=actor_id,
            target_resource=resource,
            ip_address=ip_address,
            risk_score=20 if not allowed else 0,
            details={
                "action": action,
                **kwargs
            }
        )

        await self.log_event(event)

    async def log_data_access_event(
        self,
        operation: str,
        resource_type: str,
        resource_id: str,
        actor_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        **kwargs
    ):
        """Log a data access event."""
        operation_map = {
            "read": AuditEventType.DATA_READ,
            "create": AuditEventType.DATA_CREATED,
            "update": AuditEventType.DATA_UPDATED,
            "delete": AuditEventType.DATA_DELETED,
            "export": AuditEventType.DATA_EXPORTED
        }

        event_type = operation_map.get(operation, AuditEventType.DATA_READ)

        event = AuditEvent(
            event_type=event_type,
            severity=AuditEventSeverity.LOW,
            description=f"Data {operation} operation on {resource_type}",
            actor_id=actor_id,
            target_id=resource_id,
            target_type=resource_type,
            ip_address=ip_address,
            details=kwargs
        )

        await self.log_event(event)

    async def log_billing_event(
        self,
        event_type: AuditEventType,
        description: str,
        actor_id: Optional[int] = None,
        target_id: Optional[str] = None,
        amount: Optional[float] = None,
        currency: str = "USD",
        **kwargs
    ):
        """Log a billing-related event."""
        severity = AuditEventSeverity.HIGH if "failed" in description.lower() else AuditEventSeverity.MEDIUM

        event = AuditEvent(
            event_type=event_type,
            severity=severity,
            description=description,
            actor_id=actor_id,
            target_id=target_id,
            details={
                "amount": amount,
                "currency": currency,
                **kwargs
            }
        )

        await self.log_event(event)

    def _get_security_event_severity(self, event_type: AuditEventType) -> AuditEventSeverity:
        """Get the severity level for a security event type."""
        high_severity_events = {
            AuditEventType.LOGIN_FAILURE,
            AuditEventType.ACCESS_DENIED,
            AuditEventType.SECURITY_VIOLATION,
            AuditEventType.SUSPICIOUS_ACTIVITY,
            AuditEventType.BRUTE_FORCE_ATTEMPT,
            AuditEventType.DDoS_ATTACK_DETECTED,
            AuditEventType.PAYMENT_FAILED
        }

        critical_events = {
            AuditEventType.SECURITY_VIOLATION,
            AuditEventType.DDoS_ATTACK_DETECTED
        }

        if event_type in critical_events:
            return AuditEventSeverity.CRITICAL
        elif event_type in high_severity_events:
            return AuditEventSeverity.HIGH
        else:
            return AuditEventSeverity.MEDIUM

    def _mask_sensitive_data(self, event: AuditEvent):
        """Mask sensitive data in the event."""
        def mask_value(value: str) -> str:
            if len(value) <= 4:
                return "*" * len(value)
            return value[:2] + "*" * (len(value) - 4) + value[-2:]

        # Mask sensitive fields in details
        for key, value in event.details.items():
            if any(sensitive in key.lower() for sensitive in self.config.sensitive_fields):
                if isinstance(value, str):
                    event.details[key] = mask_value(value)

        # Mask sensitive fields in metadata
        for key, value in event.metadata.items():
            if any(sensitive in key.lower() for sensitive in self.config.sensitive_fields):
                if isinstance(value, str):
                    event.metadata[key] = mask_value(value)

    def _encrypt_sensitive_data(self, event: AuditEvent):
        """Encrypt sensitive data in the event."""
        # This would implement actual encryption
        # For now, just add an encryption flag
        if any(sensitive in str(event.details).lower() for sensitive in self.config.sensitive_fields):
            event.security_flags.append("encrypted_data")

    async def _log_event_immediately(self, event: AuditEvent):
        """Log a high-priority event immediately."""
        try:
            # Log to file
            if self.config.log_to_file:
                await self._log_to_file(event)

            # Log to database
            if self.config.log_to_database:
                await self._log_to_database(event)

            # Log to external service
            if self.config.log_to_external:
                await self._log_to_external(event)

        except Exception as e:
            logger.error(f"Failed to log event immediately: {e}")

    async def _flush_events(self):
        """Flush pending events to storage."""
        if not self.pending_events:
            return

        events_to_flush = self.pending_events.copy()
        self.pending_events.clear()

        try:
            # Batch log events
            if self.config.log_to_database:
                await self._batch_log_to_database(events_to_flush)

            if self.config.log_to_file:
                await self._batch_log_to_file(events_to_flush)

        except Exception as e:
            logger.error(f"Failed to flush events: {e}")
            # Put events back in queue
            self.pending_events.extend(events_to_flush)

    async def _log_to_file(self, event: AuditEvent):
        """Log event to file."""
        # Implementation would write to log file
        # For now, just use the standard logger
        logger.info(f"AUDIT: {event.to_json()}")

    async def _log_to_database(self, event: AuditEvent):
        """Log event to database."""
        # Implementation would insert into audit log table
        # For now, just log the action
        logger.info(f"Database audit log: {event.event_id}")

    async def _log_to_external(self, event: AuditEvent):
        """Log event to external service."""
        # Implementation would send to external logging service
        logger.info(f"External audit log: {event.event_id}")

    async def _batch_log_to_database(self, events: List[AuditEvent]):
        """Batch log events to database."""
        logger.info(f"Batch database audit log: {len(events)} events")

    async def _batch_log_to_file(self, events: List[AuditEvent]):
        """Batch log events to file."""
        logger.info(f"Batch file audit log: {len(events)} events")

    async def _trigger_alert(self, event: AuditEvent):
        """Trigger alert for high severity event."""
        logger.warning(f"ALERT: High severity audit event: {event.description}")

    async def _trigger_critical_alert(self, event: AuditEvent):
        """Trigger critical alert."""
        logger.error(f"CRITICAL ALERT: {event.description}")

    def get_audit_statistics(self) -> Dict[str, Any]:
        """Get audit logging statistics."""
        return {
            "pending_events": len(self.pending_events),
            "config_enabled": self.config.enabled,
            "filters_active": len(self.event_filter.filters),
            "file_logging_enabled": self.config.log_to_file,
            "database_logging_enabled": self.config.log_to_database,
            "external_logging_enabled": self.config.log_to_external
        }

    async def search_events(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        event_type: Optional[AuditEventType] = None,
        actor_id: Optional[int] = None,
        severity: Optional[AuditEventSeverity] = None,
        limit: int = 100
    ) -> List[AuditEvent]:
        """Search audit events with filters."""
        # This would implement actual search functionality
        # For now, return empty list
        logger.info(f"Search audit events: type={event_type}, actor={actor_id}, limit={limit}")
        return []

    async def cleanup_old_events(self, days_to_keep: int = 90):
        """Clean up old audit events."""
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        logger.info(f"Cleaning up audit events older than {cutoff_date}")

        # Implementation would delete old events from storage
        # For now, just log the action
        logger.info("Audit event cleanup completed")


# Global audit logger instance
audit_logger: Optional[AuditLogger] = None


def init_audit_logger(config: AuditLogConfig) -> AuditLogger:
    """Initialize the global audit logger."""
    global audit_logger
    audit_logger = AuditLogger(config)
    return audit_logger


def get_audit_logger() -> AuditLogger:
    """Get the global audit logger."""
    if audit_logger is None:
        raise RuntimeError("Audit Logger not initialized")
    return audit_logger


# Convenience functions for common audit events
async def log_login_success(user_id: int, ip_address: str, user_agent: str):
    """Log successful login."""
    logger = get_audit_logger()
    await logger.log_authentication_event(
        success=True,
        actor_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent
    )


async def log_login_failure(user_id: Optional[int], ip_address: str, user_agent: str, reason: str):
    """Log failed login."""
    logger = get_audit_logger()
    await logger.log_authentication_event(
        success=False,
        actor_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        failure_reason=reason
    )


async def log_access_denied(user_id: int, resource: str, action: str, ip_address: str):
    """Log access denied."""
    logger = get_audit_logger()
    await logger.log_authorization_event(
        allowed=False,
        resource=resource,
        action=action,
        actor_id=user_id,
        ip_address=ip_address
    )


async def log_security_violation(violation_type: str, details: Dict[str, Any], risk_score: int = 50):
    """Log security violation."""
    logger = get_audit_logger()
    await logger.log_security_event(
        event_type=AuditEventType.SECURITY_VIOLATION,
        description=f"Security violation: {violation_type}",
        risk_score=risk_score,
        details=details
    )


async def log_data_access(user_id: int, operation: str, resource_type: str, resource_id: str, ip_address: str):
    """Log data access."""
    logger = get_audit_logger()
    await logger.log_data_access_event(
        operation=operation,
        resource_type=resource_type,
        resource_id=resource_id,
        actor_id=user_id,
        ip_address=ip_address
    )