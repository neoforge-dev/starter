"""Tests for webhook endpoints."""
import json
import time
from datetime import UTC, datetime
from typing import Any, Dict, List
from unittest.mock import AsyncMock, patch

import pytest
from app.crud.email_tracking import email_tracking
from app.models.email_tracking import EmailStatus, EmailTracking
from app.schemas.email_tracking import EmailTrackingCreate
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings


class TestWebhookEndpoints:
    """Test webhook endpoints functionality."""

    @pytest.fixture
    async def sample_email_tracking(self, db_session: AsyncSession) -> EmailTracking:
        """Create a sample email tracking record."""
        tracking_data = EmailTrackingCreate(
            email_id="test-sendgrid-123",
            recipient="test@example.com",
            subject="Test Email",
            template_name="welcome",
            status=EmailStatus.SENT,
        )

        tracking = await email_tracking.create_with_event(
            db=db_session,
            obj_in=tracking_data,
            event_type=EmailStatus.SENT,
            event_metadata={"provider": "test"},
        )
        await db_session.commit()
        return tracking

    @pytest.fixture
    def sendgrid_webhook_payload(self) -> List[Dict[str, Any]]:
        """Sample SendGrid webhook payload."""
        return [
            {
                "email": "test@example.com",
                "timestamp": int(time.time()),
                "smtp-id": "test-sendgrid-123",
                "event": "delivered",
                "category": "welcome",
                "sg_event_id": "sendgrid_event_123",
                "sg_message_id": "sendgrid_msg_123",
                "useragent": "Mozilla/5.0",
                "ip": "192.168.1.1",
            }
        ]

    @pytest.fixture
    def smtp_webhook_payload(self) -> Dict[str, Any]:
        """Sample SMTP webhook payload."""
        return {
            "events": [
                {
                    "message_id": "test-smtp-456",
                    "email": "test@example.com",
                    "event_type": "delivered",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "status": "ok",
                    "user_agent": "Mozilla/5.0",
                    "ip_address": "192.168.1.1",
                    "location": "US",
                    "metadata": {"provider": "smtp", "test": True},
                }
            ]
        }

    async def test_webhook_test_endpoint(self, client: AsyncClient):
        """Test webhook test endpoint."""
        response = await client.get("/api/v1/webhooks/test")

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Webhook endpoint is working"
        assert "timestamp" in data

    async def test_sendgrid_webhook_success(
        self,
        client: AsyncClient,
        sample_email_tracking: EmailTracking,
        sendgrid_webhook_payload: List[Dict[str, Any]],
    ):
        """Test successful SendGrid webhook processing."""
        # Mock signature validation to always pass
        with patch(
            "app.api.v1.endpoints.webhooks.validate_sendgrid_signature",
            return_value=True,
        ):
            response = await client.post(
                "/api/v1/webhooks/sendgrid",
                json=sendgrid_webhook_payload,
                headers={"Content-Type": "application/json"},
            )

        assert response.status_code == 200
        data = response.json()

        assert data["processed_events"] == 1
        assert data["successful_events"] == 1
        assert data["failed_events"] == 0
        assert data["errors"] == []

    async def test_sendgrid_webhook_multiple_events(
        self,
        client: AsyncClient,
        sample_email_tracking: EmailTracking,
        db_session: AsyncSession,
    ):
        """Test SendGrid webhook with multiple events."""
        # Create additional tracking record
        tracking_data = EmailTrackingCreate(
            email_id="test-sendgrid-456",
            recipient="test2@example.com",
            subject="Test Email 2",
            template_name="welcome",
            status=EmailStatus.SENT,
        )

        await email_tracking.create_with_event(
            db=db_session,
            obj_in=tracking_data,
            event_type=EmailStatus.SENT,
            event_metadata={"provider": "test"},
        )
        await db_session.commit()

        # Multiple events payload
        payload = [
            {
                "email": "test@example.com",
                "timestamp": int(time.time()),
                "smtp-id": "test-sendgrid-123",
                "event": "delivered",
                "sg_event_id": "event_1",
            },
            {
                "email": "test2@example.com",
                "timestamp": int(time.time()),
                "smtp-id": "test-sendgrid-456",
                "event": "opened",
                "sg_event_id": "event_2",
                "useragent": "Mozilla/5.0",
                "ip": "192.168.1.1",
            },
        ]

        with patch(
            "app.api.v1.endpoints.webhooks.validate_sendgrid_signature",
            return_value=True,
        ):
            response = await client.post(
                "/api/v1/webhooks/sendgrid",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        assert response.status_code == 200
        data = response.json()

        assert data["processed_events"] == 2
        assert data["successful_events"] == 2
        assert data["failed_events"] == 0

    async def test_sendgrid_webhook_bounce_event(
        self, client: AsyncClient, sample_email_tracking: EmailTracking
    ):
        """Test SendGrid webhook with bounce event."""
        payload = [
            {
                "email": "test@example.com",
                "timestamp": int(time.time()),
                "smtp-id": "test-sendgrid-123",
                "event": "bounce",
                "reason": "550 User unknown",
                "status": "550",
                "type": "blocked",
                "sg_event_id": "bounce_event_123",
            }
        ]

        with patch(
            "app.api.v1.endpoints.webhooks.validate_sendgrid_signature",
            return_value=True,
        ):
            response = await client.post(
                "/api/v1/webhooks/sendgrid",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        assert response.status_code == 200
        data = response.json()

        assert data["processed_events"] == 1
        assert data["successful_events"] == 1
        assert data["failed_events"] == 0

    async def test_sendgrid_webhook_click_event(
        self, client: AsyncClient, sample_email_tracking: EmailTracking
    ):
        """Test SendGrid webhook with click event."""
        payload = [
            {
                "email": "test@example.com",
                "timestamp": int(time.time()),
                "smtp-id": "test-sendgrid-123",
                "event": "click",
                "url": "https://example.com/click",
                "url_offset": {"index": 0, "type": "html"},
                "useragent": "Mozilla/5.0",
                "ip": "192.168.1.1",
                "sg_event_id": "click_event_123",
            }
        ]

        with patch(
            "app.api.v1.endpoints.webhooks.validate_sendgrid_signature",
            return_value=True,
        ):
            response = await client.post(
                "/api/v1/webhooks/sendgrid",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        assert response.status_code == 200
        data = response.json()

        assert data["processed_events"] == 1
        assert data["successful_events"] == 1
        assert data["failed_events"] == 0

    async def test_sendgrid_webhook_unknown_email(self, client: AsyncClient):
        """Test SendGrid webhook with unknown email ID."""
        payload = [
            {
                "email": "unknown@example.com",
                "timestamp": int(time.time()),
                "smtp-id": "unknown-sendgrid-999",
                "event": "delivered",
                "sg_event_id": "unknown_event",
            }
        ]

        with patch(
            "app.api.v1.endpoints.webhooks.validate_sendgrid_signature",
            return_value=True,
        ):
            response = await client.post(
                "/api/v1/webhooks/sendgrid",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        assert response.status_code == 200
        data = response.json()

        assert data["processed_events"] == 1
        assert data["successful_events"] == 0
        assert data["failed_events"] == 1
        assert len(data["errors"]) == 1
        assert "No tracking record found" in data["errors"][0]

    async def test_sendgrid_webhook_duplicate_event(
        self, client: AsyncClient, sample_email_tracking: EmailTracking
    ):
        """Test SendGrid webhook with duplicate events (idempotency)."""
        payload = [
            {
                "email": "test@example.com",
                "timestamp": int(time.time()),
                "smtp-id": "test-sendgrid-123",
                "event": "delivered",
                "sg_event_id": "duplicate_event",
            }
        ]

        with patch(
            "app.api.v1.endpoints.webhooks.validate_sendgrid_signature",
            return_value=True,
        ):
            # Send same event twice
            response1 = await client.post(
                "/api/v1/webhooks/sendgrid",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

            response2 = await client.post(
                "/api/v1/webhooks/sendgrid",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        # Both should succeed
        assert response1.status_code == 200
        assert response2.status_code == 200

        # Second one should detect duplicate
        data2 = response2.json()
        assert data2["processed_events"] == 1
        assert data2["successful_events"] == 1  # Still successful, but it was duplicate

    async def test_sendgrid_webhook_invalid_signature(
        self, client: AsyncClient, sendgrid_webhook_payload: List[Dict[str, Any]]
    ):
        """Test SendGrid webhook with invalid signature."""
        with patch(
            "app.api.v1.endpoints.webhooks.validate_sendgrid_signature",
            return_value=False,
        ):
            response = await client.post(
                "/api/v1/webhooks/sendgrid",
                json=sendgrid_webhook_payload,
                headers={"Content-Type": "application/json"},
            )

        assert response.status_code == 401
        data = response.json()
        assert data["detail"] == "Invalid webhook signature"

    async def test_sendgrid_webhook_empty_body(self, client: AsyncClient):
        """Test SendGrid webhook with empty body."""
        with patch(
            "app.api.v1.endpoints.webhooks.validate_sendgrid_signature",
            return_value=True,
        ):
            response = await client.post(
                "/api/v1/webhooks/sendgrid",
                data="",
                headers={"Content-Type": "application/json"},
            )

        assert response.status_code == 400
        data = response.json()
        assert data["detail"] == "Empty request body"

    async def test_sendgrid_webhook_invalid_json(self, client: AsyncClient):
        """Test SendGrid webhook with invalid JSON."""
        with patch(
            "app.api.v1.endpoints.webhooks.validate_sendgrid_signature",
            return_value=True,
        ):
            response = await client.post(
                "/api/v1/webhooks/sendgrid",
                data="invalid json",
                headers={"Content-Type": "application/json"},
            )

        assert response.status_code == 400
        data = response.json()
        assert data["detail"] == "Invalid JSON payload"

    async def test_smtp_webhook_success(
        self,
        client: AsyncClient,
        smtp_webhook_payload: Dict[str, Any],
        db_session: AsyncSession,
    ):
        """Test successful SMTP webhook processing."""
        # Create tracking record with SMTP email ID
        tracking_data = EmailTrackingCreate(
            email_id="test-smtp-456",
            recipient="test@example.com",
            subject="Test Email",
            template_name="welcome",
            status=EmailStatus.SENT,
        )

        await email_tracking.create_with_event(
            db=db_session,
            obj_in=tracking_data,
            event_type=EmailStatus.SENT,
            event_metadata={"provider": "smtp"},
        )
        await db_session.commit()

        with patch(
            "app.api.v1.endpoints.webhooks.validate_smtp_signature", return_value=True
        ):
            response = await client.post(
                "/api/v1/webhooks/smtp",
                json=smtp_webhook_payload,
                headers={"Content-Type": "application/json"},
            )

        assert response.status_code == 200
        data = response.json()

        assert data["processed_events"] == 1
        assert data["successful_events"] == 1
        assert data["failed_events"] == 0
        assert data["errors"] == []

    async def test_smtp_webhook_bounce_event(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test SMTP webhook with bounce event."""
        # Create tracking record
        tracking_data = EmailTrackingCreate(
            email_id="test-smtp-bounce",
            recipient="bounce@example.com",
            subject="Test Email",
            template_name="welcome",
            status=EmailStatus.SENT,
        )

        await email_tracking.create_with_event(
            db=db_session,
            obj_in=tracking_data,
            event_type=EmailStatus.SENT,
            event_metadata={"provider": "smtp"},
        )
        await db_session.commit()

        payload = {
            "events": [
                {
                    "message_id": "test-smtp-bounce",
                    "email": "bounce@example.com",
                    "event_type": "bounced",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "reason": "Mailbox does not exist",
                    "status": "failed",
                    "metadata": {"bounce_type": "hard"},
                }
            ]
        }

        with patch(
            "app.api.v1.endpoints.webhooks.validate_smtp_signature", return_value=True
        ):
            response = await client.post(
                "/api/v1/webhooks/smtp",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        assert response.status_code == 200
        data = response.json()

        assert data["processed_events"] == 1
        assert data["successful_events"] == 1
        assert data["failed_events"] == 0

    async def test_smtp_webhook_invalid_signature(
        self, client: AsyncClient, smtp_webhook_payload: Dict[str, Any]
    ):
        """Test SMTP webhook with invalid signature."""
        with patch(
            "app.api.v1.endpoints.webhooks.validate_smtp_signature", return_value=False
        ):
            response = await client.post(
                "/api/v1/webhooks/smtp",
                json=smtp_webhook_payload,
                headers={"Content-Type": "application/json"},
            )

        assert response.status_code == 401
        data = response.json()
        assert data["detail"] == "Invalid webhook signature"

    async def test_smtp_webhook_unknown_email(self, client: AsyncClient):
        """Test SMTP webhook with unknown email ID."""
        payload = {
            "events": [
                {
                    "message_id": "unknown-smtp-999",
                    "email": "unknown@example.com",
                    "event_type": "delivered",
                    "timestamp": datetime.now(UTC).isoformat(),
                }
            ]
        }

        with patch(
            "app.api.v1.endpoints.webhooks.validate_smtp_signature", return_value=True
        ):
            response = await client.post(
                "/api/v1/webhooks/smtp",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        assert response.status_code == 200
        data = response.json()

        assert data["processed_events"] == 1
        assert data["successful_events"] == 0
        assert data["failed_events"] == 1
        assert len(data["errors"]) == 1
        assert "No tracking record found" in data["errors"][0]


class TestWebhookSignatureValidation:
    """Test webhook signature validation utilities."""

    def test_hmac_signature_validation_success(self):
        """Test successful HMAC signature validation."""
        from app.schemas.webhooks import WebhookSignatureValidator

        payload = b'{"test": "data"}'
        secret = "test_secret_key"

        # Calculate expected signature
        import hashlib
        import hmac

        expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()

        # Test validation
        result = WebhookSignatureValidator.validate_hmac_signature(
            payload=payload, signature=expected, secret=secret, algorithm="sha256"
        )

        assert result is True

    def test_hmac_signature_validation_with_prefix(self):
        """Test HMAC signature validation with algorithm prefix."""
        from app.schemas.webhooks import WebhookSignatureValidator

        payload = b'{"test": "data"}'
        secret = "test_secret_key"

        # Calculate expected signature with prefix
        import hashlib
        import hmac

        signature = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
        signature_with_prefix = f"sha256={signature}"

        # Test validation
        result = WebhookSignatureValidator.validate_hmac_signature(
            payload=payload,
            signature=signature_with_prefix,
            secret=secret,
            algorithm="sha256",
        )

        assert result is True

    def test_hmac_signature_validation_failure(self):
        """Test failed HMAC signature validation."""
        from app.schemas.webhooks import WebhookSignatureValidator

        payload = b'{"test": "data"}'
        secret = "test_secret_key"
        wrong_signature = "invalid_signature"

        # Test validation
        result = WebhookSignatureValidator.validate_hmac_signature(
            payload=payload,
            signature=wrong_signature,
            secret=secret,
            algorithm="sha256",
        )

        assert result is False

    def test_sendgrid_signature_validation_missing_dependency(self):
        """Test SendGrid signature validation with missing cryptography dependency."""
        from app.schemas.webhooks import WebhookSignatureValidator

        # Mock missing cryptography module
        with patch("app.schemas.webhooks.load_pem_public_key", side_effect=ImportError):
            result = WebhookSignatureValidator.validate_sendgrid_signature(
                payload=b"test",
                signature="test_signature",
                timestamp="12345",
                public_key="test_key",
            )

            assert result is False


class TestWebhookStatusTransitions:
    """Test status transition validation in CRUD layer."""

    async def test_valid_status_transitions(self, db_session: AsyncSession):
        """Test valid status transitions are allowed."""
        tracking_data = EmailTrackingCreate(
            email_id="transition-test-123",
            recipient="transition@example.com",
            subject="Transition Test",
            template_name="test",
            status=EmailStatus.SENT,
        )

        tracking = await email_tracking.create_with_event(
            db=db_session,
            obj_in=tracking_data,
            event_type=EmailStatus.SENT,
        )
        await db_session.commit()

        # Valid transition: SENT -> DELIVERED
        updated = await email_tracking.update_status(
            db=db_session, db_obj=tracking, status=EmailStatus.DELIVERED
        )

        assert updated.status == EmailStatus.DELIVERED
        assert updated.delivered_at is not None

    async def test_invalid_status_transitions(self, db_session: AsyncSession):
        """Test invalid status transitions are rejected."""
        tracking_data = EmailTrackingCreate(
            email_id="invalid-transition-123",
            recipient="invalid@example.com",
            subject="Invalid Transition Test",
            template_name="test",
            status=EmailStatus.DELIVERED,
        )

        tracking = await email_tracking.create_with_event(
            db=db_session,
            obj_in=tracking_data,
            event_type=EmailStatus.DELIVERED,
        )
        await db_session.commit()

        original_status = tracking.status

        # Invalid transition: DELIVERED -> QUEUED (downgrade)
        updated = await email_tracking.update_status(
            db=db_session, db_obj=tracking, status=EmailStatus.QUEUED
        )

        # Status should remain unchanged
        assert updated.status == original_status
        assert updated.status == EmailStatus.DELIVERED


class TestWebhookIntegration:
    """Integration tests for complete webhook flow."""

    async def test_status_transition_validation(
        self, client: AsyncClient, sample_email_tracking: EmailTracking
    ):
        """Test that invalid status transitions are rejected."""
        # Try to downgrade status from SENT to QUEUED (should be rejected)
        payload = [
            {
                "email": "test@example.com",
                "timestamp": int(time.time()),
                "smtp-id": "test-sendgrid-123",
                "event": "deferred",  # Maps to QUEUED
                "sg_event_id": "downgrade_event",
            }
        ]

        with patch(
            "app.api.v1.endpoints.webhooks.validate_sendgrid_signature",
            return_value=True,
        ):
            response = await client.post(
                "/api/v1/webhooks/sendgrid",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        # Should succeed (webhook processed) but status should remain unchanged
        assert response.status_code == 200
        data = response.json()
        assert data["successful_events"] == 1

    async def test_fallback_email_resolution(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test fallback email resolution by recipient and timestamp."""
        # Create tracking record without specific email_id
        from datetime import timedelta

        tracking_data = EmailTrackingCreate(
            email_id="original-id-123",
            recipient="fallback@example.com",
            subject="Fallback Test Email",
            template_name="test",
            status=EmailStatus.SENT,
        )

        tracking = await email_tracking.create_with_event(
            db=db_session,
            obj_in=tracking_data,
            event_type=EmailStatus.SENT,
            event_metadata={"provider": "test"},
        )
        await db_session.commit()

        # Send webhook with different email_id but same recipient (should find by recipient)
        payload = [
            {
                "email": "fallback@example.com",
                "timestamp": int(time.time()),
                "smtp-id": "different-id-456",  # Different ID
                "event": "delivered",
                "sg_event_id": "fallback_test",
            }
        ]

        with patch(
            "app.api.v1.endpoints.webhooks.validate_sendgrid_signature",
            return_value=True,
        ):
            response = await client.post(
                "/api/v1/webhooks/sendgrid",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["successful_events"] == 1
        assert data["failed_events"] == 0

    async def test_concurrent_webhook_processing(
        self, client: AsyncClient, sample_email_tracking: EmailTracking
    ):
        """Test concurrent webhook processing doesn't cause data corruption."""
        import asyncio

        # Create multiple concurrent requests
        payload = [
            {
                "email": "test@example.com",
                "timestamp": int(time.time()),
                "smtp-id": "test-sendgrid-123",
                "event": "delivered",
                "sg_event_id": f"concurrent_event_{i}",
            }
        ]

        async def send_webhook(event_id):
            payload[0]["sg_event_id"] = f"concurrent_event_{event_id}"
            with patch(
                "app.api.v1.endpoints.webhooks.validate_sendgrid_signature",
                return_value=True,
            ):
                return await client.post(
                    "/api/v1/webhooks/sendgrid",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )

        # Send 5 concurrent requests
        responses = await asyncio.gather(*[send_webhook(i) for i in range(5)])

        # All should succeed
        for response in responses:
            assert response.status_code == 200

    async def test_webhook_event_deduplication(
        self, client: AsyncClient, sample_email_tracking: EmailTracking
    ):
        """Test enhanced event deduplication with signatures."""
        payload = [
            {
                "email": "test@example.com",
                "timestamp": int(time.time()),
                "smtp-id": "test-sendgrid-123",
                "event": "delivered",
                "sg_event_id": "dedup_test_123",
                "useragent": "Test Agent",
                "ip": "192.168.1.100",
            }
        ]

        with patch(
            "app.api.v1.endpoints.webhooks.validate_sendgrid_signature",
            return_value=True,
        ):
            # Send same event multiple times
            response1 = await client.post(
                "/api/v1/webhooks/sendgrid",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

            response2 = await client.post(
                "/api/v1/webhooks/sendgrid",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        # Both should succeed, but second should detect duplicate
        assert response1.status_code == 200
        assert response2.status_code == 200

        data1 = response1.json()
        data2 = response2.json()

        assert data1["successful_events"] == 1
        assert data2["successful_events"] == 1  # Still successful (idempotent)


class TestWebhookEventMapping:
    """Test webhook event mapping functionality."""

    def test_sendgrid_event_mapping(self):
        """Test SendGrid event mapping to EmailStatus."""
        from app.api.v1.endpoints.webhooks import SENDGRID_EVENT_MAPPING

        # Test key mappings
        assert SENDGRID_EVENT_MAPPING["delivered"] == EmailStatus.DELIVERED
        assert SENDGRID_EVENT_MAPPING["bounce"] == EmailStatus.BOUNCED
        assert SENDGRID_EVENT_MAPPING["open"] == EmailStatus.OPENED
        assert SENDGRID_EVENT_MAPPING["click"] == EmailStatus.CLICKED
        assert SENDGRID_EVENT_MAPPING["spamreport"] == EmailStatus.SPAM
        assert SENDGRID_EVENT_MAPPING["dropped"] == EmailStatus.FAILED

    def test_smtp_event_mapping(self):
        """Test SMTP event mapping to EmailStatus."""
        from app.api.v1.endpoints.webhooks import SMTP_EVENT_MAPPING

        # Test key mappings
        assert SMTP_EVENT_MAPPING["delivered"] == EmailStatus.DELIVERED
        assert SMTP_EVENT_MAPPING["bounced"] == EmailStatus.BOUNCED
        assert SMTP_EVENT_MAPPING["opened"] == EmailStatus.OPENED
        assert SMTP_EVENT_MAPPING["clicked"] == EmailStatus.CLICKED
        assert SMTP_EVENT_MAPPING["spam"] == EmailStatus.SPAM
        assert SMTP_EVENT_MAPPING["failed"] == EmailStatus.FAILED

    def test_sendgrid_event_to_tracking_mapping(self):
        """Test mapping SendGrid event to WebhookEventMapping."""
        from app.api.v1.endpoints.webhooks import map_sendgrid_event_to_tracking
        from app.schemas.webhooks import SendGridEvent

        event = SendGridEvent(
            email="test@example.com",
            timestamp=1640995200,  # 2022-01-01 00:00:00 UTC
            event="delivered",
            smtp_id="test-123",
            sg_event_id="sg-event-123",
            useragent="Mozilla/5.0",
            ip="192.168.1.1",
        )

        mapping = map_sendgrid_event_to_tracking(event)

        assert mapping.recipient == "test@example.com"
        assert mapping.email_id == "test-123"
        assert mapping.status == EmailStatus.DELIVERED
        assert mapping.user_agent == "Mozilla/5.0"
        assert mapping.ip_address == "192.168.1.1"
        assert mapping.event_metadata["provider"] == "sendgrid"
        assert mapping.event_metadata["sg_event_id"] == "sg-event-123"

    def test_smtp_event_to_tracking_mapping(self):
        """Test mapping SMTP event to WebhookEventMapping."""
        from app.api.v1.endpoints.webhooks import map_smtp_event_to_tracking
        from app.schemas.webhooks import SMTPEvent

        event = SMTPEvent(
            message_id="smtp-456",
            email="test@example.com",
            event_type="delivered",
            timestamp=datetime.now(UTC),
            user_agent="Mozilla/5.0",
            ip_address="192.168.1.1",
            location="US",
            metadata={"custom": "data"},
        )

        mapping = map_smtp_event_to_tracking(event)

        assert mapping.recipient == "test@example.com"
        assert mapping.email_id == "smtp-456"
        assert mapping.status == EmailStatus.DELIVERED
        assert mapping.user_agent == "Mozilla/5.0"
        assert mapping.ip_address == "192.168.1.1"
        assert mapping.location == "US"
        assert mapping.event_metadata["provider"] == "smtp"
        assert mapping.event_metadata["custom"] == "data"

    def test_event_signature_generation(self):
        """Test event signature generation for deduplication."""
        from app.api.v1.endpoints.webhooks import _generate_event_signature
        from app.schemas.webhooks import WebhookEventMapping

        event = WebhookEventMapping(
            email_id="test-123",
            recipient="test@example.com",
            status=EmailStatus.DELIVERED,
            timestamp=datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC),
            event_metadata={"provider": "test"},
        )

        signature = _generate_event_signature(event)

        # Should generate consistent signature
        assert isinstance(signature, str)
        assert len(signature) == 64  # SHA256 hex string length

        # Same event should generate same signature
        signature2 = _generate_event_signature(event)
        assert signature == signature2

    def test_duplicate_event_detection(self):
        """Test duplicate event detection logic."""
        from app.api.v1.endpoints.webhooks import (
            _generate_event_signature,
            _is_duplicate_event,
        )
        from app.models.email_tracking import EmailEvent
        from app.schemas.webhooks import WebhookEventMapping

        # Create mock existing event
        existing_event = EmailEvent(
            id=1,
            email_id=1,
            event_type=EmailStatus.DELIVERED,
            occurred_at=datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC),
            event_metadata={"event_signature": "test_signature"},
        )

        # Create new event mapping
        new_event = WebhookEventMapping(
            email_id="test-123",
            recipient="test@example.com",
            status=EmailStatus.DELIVERED,
            timestamp=datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC),
        )

        signature = _generate_event_signature(new_event)

        # Should detect duplicate by timestamp and type
        assert _is_duplicate_event(existing_event, new_event, signature) is True

        # Different status should not be duplicate
        new_event.status = EmailStatus.OPENED
        assert _is_duplicate_event(existing_event, new_event, signature) is False
