"""Tests for security audit logging system."""
from datetime import UTC, datetime

import pytest
import structlog
from app.models.audit_log import AuditLog
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import get_redis
from app.core.security_audit import (
    SecurityAuditor,
    SecurityEventType,
    SecuritySeverity,
    log_login_attempt,
    log_suspicious_activity,
    log_token_event,
    security_auditor,
)
from tests.factories import UserFactory

logger = structlog.get_logger()


class TestSecurityAuditor:
    """Test security audit logging functionality."""

    @pytest.mark.asyncio
    async def test_log_security_event(self, db_session: AsyncSession):
        """Test basic security event logging."""
        user_id = 123
        ip_address = "192.168.1.100"
        user_agent = "TestAgent/1.0"

        await security_auditor.log_security_event(
            db=db_session,
            event_type=SecurityEventType.LOGIN_SUCCESS,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            resource="test_resource",
            details={"test": "data"},
            severity=SecuritySeverity.LOW,
            success=True,
        )

        # Verify event was logged in database
        audit_entry = await db_session.execute(
            select(AuditLog).where(
                AuditLog.user_id == user_id,
                AuditLog.action == SecurityEventType.LOGIN_SUCCESS.value,
            )
        )
        entry = audit_entry.scalar_one_or_none()

        assert entry is not None
        assert entry.user_id == user_id
        assert entry.action == SecurityEventType.LOGIN_SUCCESS.value
        assert entry.ip_address == ip_address
        assert entry.user_agent == user_agent
        assert entry.resource == "test_resource"
        assert entry.details == {"test": "data"}
        assert entry.severity == SecuritySeverity.LOW.value
        assert entry.success is True

    @pytest.mark.asyncio
    async def test_log_security_event_with_redis(self, db_session: AsyncSession):
        """Test security event logging with Redis storage."""
        user_id = 456

        # Mock Redis to avoid dependency issues in tests
        async for redis in get_redis():
            await security_auditor.log_security_event(
                db=db_session,
                event_type=SecurityEventType.LOGIN_FAILED,
                user_id=user_id,
                ip_address="10.0.0.1",
                severity=SecuritySeverity.HIGH,
                success=False,
            )

            # Verify Redis events list was updated
            events = await redis.lrange("security_events:recent", 0, -1)
            assert len(events) > 0

            # Verify IP tracking
            ip_count = await redis.get("security_events:ip:10.0.0.1")
            assert int(ip_count) >= 1

            # Verify user tracking
            user_count = await redis.get(f"security_events:user:{user_id}")
            assert int(user_count) >= 1

    @pytest.mark.asyncio
    async def test_brute_force_detection(self, db_session: AsyncSession):
        """Test brute force attack detection."""
        ip_address = "192.168.1.200"
        user_id = 789

        # Simulate multiple failed login attempts
        for i in range(6):  # 6 attempts should trigger brute force detection
            await security_auditor.log_security_event(
                db=db_session,
                event_type=SecurityEventType.LOGIN_FAILED,
                user_id=user_id,
                ip_address=ip_address,
                severity=SecuritySeverity.MEDIUM,
                success=False,
            )

        # Check if brute force event was logged
        brute_force_entry = await db_session.execute(
            select(AuditLog).where(
                AuditLog.action == SecurityEventType.LOGIN_BRUTE_FORCE.value,
                AuditLog.ip_address == ip_address,
            )
        )
        entry = brute_force_entry.scalar_one_or_none()

        assert entry is not None
        assert entry.severity == SecuritySeverity.HIGH.value
        assert entry.success is False
        assert "failure_count" in entry.details

    @pytest.mark.asyncio
    async def test_session_hijack_detection(self, db_session: AsyncSession):
        """Test session hijack attempt detection."""
        user_id = 999
        different_ips = ["1.1.1.1", "2.2.2.2", "3.3.3.3"]

        # Simulate rapid session creation from different IPs
        for ip in different_ips:
            await security_auditor.log_security_event(
                db=db_session,
                event_type=SecurityEventType.SESSION_CREATED,
                user_id=user_id,
                ip_address=ip,
                severity=SecuritySeverity.MEDIUM,
                success=True,
            )

        # Check if hijack attempt was detected
        hijack_entry = await db_session.execute(
            select(AuditLog).where(
                AuditLog.action == SecurityEventType.SESSION_HIJACK_ATTEMPT.value,
                AuditLog.user_id == user_id,
            )
        )
        entry = hijack_entry.scalar_one_or_none()

        assert entry is not None
        assert entry.severity == SecuritySeverity.HIGH.value
        assert entry.success is False
        assert "unique_ips" in entry.details
        assert entry.details["ip_count"] >= 3

    @pytest.mark.asyncio
    async def test_security_dashboard_data(self, db_session: AsyncSession):
        """Test security dashboard data generation."""
        user_id = 111

        # Create various security events
        events_data = [
            (SecurityEventType.LOGIN_SUCCESS, SecuritySeverity.LOW, True),
            (SecurityEventType.LOGIN_FAILED, SecuritySeverity.MEDIUM, False),
            (SecurityEventType.PERMISSION_DENIED, SecuritySeverity.HIGH, False),
            (SecurityEventType.SUSPICIOUS_REQUEST, SecuritySeverity.HIGH, False),
        ]

        for event_type, severity, success in events_data:
            await security_auditor.log_security_event(
                db=db_session,
                event_type=event_type,
                user_id=user_id,
                ip_address="192.168.1.10",
                severity=severity,
                success=success,
            )

        # Get dashboard data
        dashboard_data = await security_auditor.get_security_dashboard_data(
            db_session, hours=24
        )

        assert "total_events" in dashboard_data
        assert "failed_events" in dashboard_data
        assert "events_by_type" in dashboard_data
        assert "top_source_ips" in dashboard_data
        assert "severity_distribution" in dashboard_data
        assert "generated_at" in dashboard_data

        assert dashboard_data["total_events"] >= 4
        assert dashboard_data["failed_events"] >= 3  # 3 failed events
        assert SecurityEventType.LOGIN_SUCCESS.value in dashboard_data["events_by_type"]

    @pytest.mark.asyncio
    async def test_user_security_history(self, db_session: AsyncSession):
        """Test user security history retrieval."""
        user_id = 222

        # Create events for specific user
        for i in range(3):
            await security_auditor.log_security_event(
                db=db_session,
                event_type=SecurityEventType.LOGIN_SUCCESS,
                user_id=user_id,
                ip_address=f"192.168.1.{100+i}",
                severity=SecuritySeverity.LOW,
                success=True,
                details={"login_attempt": i + 1},
            )

        # Get user security history
        history = await security_auditor.get_user_security_history(
            db_session, user_id, limit=5
        )

        assert len(history) >= 3
        assert all(event["user_id"] == user_id for event in history)
        assert all("timestamp" in event for event in history)
        assert all("action" in event for event in history)
        assert all("severity" in event for event in history)

        # Events should be ordered by timestamp (newest first)
        if len(history) > 1:
            timestamps = [
                datetime.fromisoformat(event["timestamp"].replace("Z", "+00:00"))
                for event in history
            ]
            assert timestamps[0] >= timestamps[1]


class TestSecurityAuditHelpers:
    """Test security audit helper functions."""

    @pytest.mark.asyncio
    async def test_log_login_attempt_success(self, db_session: AsyncSession):
        """Test login attempt logging helper - success."""
        user_id = 333
        ip_address = "10.0.1.50"
        user_agent = "Browser/1.0"

        await log_login_attempt(
            db=db_session,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            details={"method": "password"},
        )

        # Verify correct event type and severity
        entry = await db_session.execute(
            select(AuditLog).where(
                AuditLog.user_id == user_id,
                AuditLog.action == SecurityEventType.LOGIN_SUCCESS.value,
            )
        )
        audit_entry = entry.scalar_one_or_none()

        assert audit_entry is not None
        assert audit_entry.severity == SecuritySeverity.LOW.value
        assert audit_entry.success is True
        assert audit_entry.ip_address == ip_address
        assert audit_entry.details["method"] == "password"

    @pytest.mark.asyncio
    async def test_log_login_attempt_failure(self, db_session: AsyncSession):
        """Test login attempt logging helper - failure."""
        user_id = 444
        ip_address = "10.0.1.60"

        await log_login_attempt(
            db=db_session,
            user_id=user_id,
            ip_address=ip_address,
            user_agent="Attacker/1.0",
            success=False,
            details={"reason": "invalid_password"},
        )

        # Verify correct event type and severity
        entry = await db_session.execute(
            select(AuditLog).where(
                AuditLog.user_id == user_id,
                AuditLog.action == SecurityEventType.LOGIN_FAILED.value,
            )
        )
        audit_entry = entry.scalar_one_or_none()

        assert audit_entry is not None
        assert audit_entry.severity == SecuritySeverity.MEDIUM.value
        assert audit_entry.success is False
        assert audit_entry.details["reason"] == "invalid_password"

    @pytest.mark.asyncio
    async def test_log_token_event(self, db_session: AsyncSession):
        """Test token event logging helper."""
        user_id = 555

        await log_token_event(
            db=db_session,
            event_type=SecurityEventType.TOKEN_REFRESH,
            user_id=user_id,
            ip_address="10.0.1.70",
            details={"old_token_rotations": 5},
        )

        entry = await db_session.execute(
            select(AuditLog).where(
                AuditLog.user_id == user_id,
                AuditLog.action == SecurityEventType.TOKEN_REFRESH.value,
            )
        )
        audit_entry = entry.scalar_one_or_none()

        assert audit_entry is not None
        assert audit_entry.severity == SecuritySeverity.MEDIUM.value
        assert audit_entry.details["old_token_rotations"] == 5

    @pytest.mark.asyncio
    async def test_log_suspicious_activity(self, db_session: AsyncSession):
        """Test suspicious activity logging helper."""
        ip_address = "10.0.1.80"
        user_agent = "SQLMap/1.0"

        await log_suspicious_activity(
            db=db_session,
            event_type=SecurityEventType.SQL_INJECTION_ATTEMPT,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"attack_vector": "UNION SELECT"},
        )

        entry = await db_session.execute(
            select(AuditLog).where(
                AuditLog.action == SecurityEventType.SQL_INJECTION_ATTEMPT.value,
                AuditLog.ip_address == ip_address,
            )
        )
        audit_entry = entry.scalar_one_or_none()

        assert audit_entry is not None
        assert audit_entry.severity == SecuritySeverity.HIGH.value
        assert audit_entry.success is False
        assert audit_entry.user_agent == user_agent
        assert "attack_vector" in audit_entry.details


class TestSecurityAPI:
    """Test security monitoring API endpoints."""

    @pytest.mark.asyncio
    async def test_security_dashboard_endpoint(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Test security dashboard endpoint."""
        # Create superuser for admin access
        admin_user = UserFactory(is_superuser=True)
        db_session.add(admin_user)
        await db_session.commit()
        await db_session.refresh(admin_user)

        # Login as admin
        login_data = {"username": admin_user.email, "password": "testpassword123"}

        response = await async_client.post("/api/v1/auth/token", data=login_data)
        tokens = response.json()
        access_token = tokens["access_token"]

        # Access security dashboard
        headers = {"Authorization": f"Bearer {access_token}"}
        response = await async_client.get(
            "/api/v1/security/dashboard?hours=24", headers=headers
        )

        assert response.status_code == 200

        dashboard = response.json()
        assert "total_events" in dashboard
        assert "failed_events" in dashboard
        assert "events_by_type" in dashboard
        assert "generated_at" in dashboard

    @pytest.mark.asyncio
    async def test_security_dashboard_forbidden(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Test security dashboard access denied for regular users."""
        # Create regular user
        user = UserFactory(is_superuser=False)
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Login as regular user
        login_data = {"username": user.email, "password": "testpassword123"}

        response = await async_client.post("/api/v1/auth/token", data=login_data)
        tokens = response.json()
        access_token = tokens["access_token"]

        # Try to access security dashboard
        headers = {"Authorization": f"Bearer {access_token}"}
        response = await async_client.get("/api/v1/security/dashboard", headers=headers)

        assert response.status_code == 403
        assert "Access denied" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_user_security_events_endpoint(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Test user security events endpoint."""
        # Create test user
        user = UserFactory()
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Create security events for user
        await security_auditor.log_security_event(
            db=db_session,
            event_type=SecurityEventType.LOGIN_SUCCESS,
            user_id=user.id,
            ip_address="192.168.1.100",
            severity=SecuritySeverity.LOW,
            success=True,
        )

        # Login as user
        login_data = {"username": user.email, "password": "testpassword123"}

        response = await async_client.post("/api/v1/auth/token", data=login_data)
        tokens = response.json()
        access_token = tokens["access_token"]

        # Access own security events
        headers = {"Authorization": f"Bearer {access_token}"}
        response = await async_client.get("/api/v1/security/events/my", headers=headers)

        assert response.status_code == 200

        events = response.json()
        assert isinstance(events, list)
        # Should include the login success event we created plus the login from the API call
        assert len(events) >= 1

        # Verify event structure
        if events:
            event = events[0]
            assert "action" in event
            assert "timestamp" in event
            assert "severity" in event
            assert "success" in event

    @pytest.mark.asyncio
    async def test_manual_security_event_logging(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Test manual security event logging endpoint."""
        # Create admin user
        admin_user = UserFactory(is_superuser=True)
        db_session.add(admin_user)
        await db_session.commit()
        await db_session.refresh(admin_user)

        # Login as admin
        login_data = {"username": admin_user.email, "password": "testpassword123"}

        response = await async_client.post("/api/v1/auth/token", data=login_data)
        tokens = response.json()
        access_token = tokens["access_token"]

        # Log manual security event
        headers = {"Authorization": f"Bearer {access_token}"}
        event_data = {
            "event_type": "auth.login.failed",
            "user_id": 999,
            "ip_address": "192.168.1.999",
            "user_agent": "TestAgent/1.0",
            "severity": "high",
            "success": False,
            "details": {"reason": "manual_test"},
        }

        response = await async_client.post(
            "/api/v1/security/events/log", json=event_data, headers=headers
        )

        assert response.status_code == 200
        assert "logged successfully" in response.json()["message"]

        # Verify event was logged
        entry = await db_session.execute(
            select(AuditLog).where(
                AuditLog.action == "auth.login.failed",
                AuditLog.ip_address == "192.168.1.999",
            )
        )
        audit_entry = entry.scalar_one_or_none()

        assert audit_entry is not None
        assert audit_entry.details["reason"] == "manual_test"
        assert audit_entry.severity == "high"
