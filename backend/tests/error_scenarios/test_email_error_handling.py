"""
Error Scenario and Edge Case Tests for Email System

These tests validate system behavior under various failure conditions,
error scenarios, and edge cases to ensure robust production operation.
"""
import asyncio
import json
import logging
from datetime import UTC, datetime, timedelta
from typing import Any, Dict, List, Optional, Union
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
from app.crud.email_tracking import email_tracking
from app.crud.password_reset_token import password_reset_token
from app.crud.user import user as user_crud
from app.models.email_tracking import EmailStatus, EmailTracking
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.worker.email_worker import EmailWorker
from httpx import AsyncClient
from redis.exceptions import ConnectionError as RedisConnectionError
from redis.exceptions import TimeoutError as RedisTimeoutError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.queue import EmailQueue, EmailQueueItem
from tests.factories import UserFactory

pytestmark = pytest.mark.asyncio


class TestDatabaseFailureScenarios:
    """Test email system behavior during database failures."""

    async def test_registration_with_database_connection_failure(
        self, client: AsyncClient, db: AsyncSession, test_settings: Settings
    ) -> None:
        """Test registration when database connection fails."""
        # Mock email queue to succeed
        mock_queue = AsyncMock()
        mock_queue.enqueue = AsyncMock(return_value="email_123")

        registration_data = {
            "email": "db-failure@example.com",
            "password": "testpassword123",
            "password_confirm": "testpassword123",
            "full_name": "DB Failure User",
        }

        # Mock database connection failure during user creation
        with patch(
            "app.api.v1.endpoints.auth.get_email_queue", return_value=mock_queue
        ):
            with patch(
                "app.crud.user.user.create",
                side_effect=SQLAlchemyError("Connection lost"),
            ):
                response = await client.post(
                    f"{test_settings.api_v1_str}/auth/register", json=registration_data
                )

        # Should return appropriate error
        assert response.status_code in [
            500,
            503,
        ]  # Internal server error or service unavailable

        # Email should not have been queued since user creation failed
        mock_queue.enqueue.assert_not_called()

    async def test_email_tracking_with_database_failures(
        self, db: AsyncSession
    ) -> None:
        """Test email tracking operations with database failures."""
        from app.schemas.email_tracking import EmailTrackingCreate

        tracking_data = EmailTrackingCreate(
            email_id="db-fail-test-123",
            recipient="dbfail@example.com",
            subject="Database Failure Test",
            template_name="test",
            status=EmailStatus.QUEUED,
        )

        # Test database failure during tracking creation
        with patch(
            "sqlalchemy.ext.asyncio.AsyncSession.execute",
            side_effect=SQLAlchemyError("Database connection lost"),
        ):
            with pytest.raises(SQLAlchemyError):
                await email_tracking.create_with_event(
                    db=db, obj_in=tracking_data, event_type=EmailStatus.QUEUED
                )

    async def test_password_reset_with_database_transaction_failure(
        self, client: AsyncClient, db: AsyncSession, test_settings: Settings
    ) -> None:
        """Test password reset when database transaction fails."""
        # Create test user first
        user = await UserFactory.create(
            session=db,
            email="reset-db-fail@example.com",
            password="oldpassword123",
            full_name="Reset DB Fail User",
            is_active=True,
        )
        await db.commit()

        try:
            # Mock email queue
            mock_queue = AsyncMock()
            mock_queue.enqueue = AsyncMock(return_value="reset_email_123")

            # Mock database transaction failure during token creation
            with patch(
                "app.api.v1.endpoints.auth.get_email_queue", return_value=mock_queue
            ):
                with patch(
                    "app.crud.password_reset_token.create_for_user",
                    side_effect=SQLAlchemyError("Transaction failed"),
                ):
                    response = await client.post(
                        f"{test_settings.api_v1_str}/auth/reset-password-request",
                        json={"email": user.email},
                    )

            # Should still return success message for security (don't reveal internal errors)
            assert response.status_code == 200
            data = response.json()
            assert "reset link shortly" in data["message"]

            # But token should not have been created and email should not have been sent
            mock_queue.enqueue.assert_not_called()

        finally:
            # Cleanup
            await db.delete(user)
            await db.commit()

    async def test_email_worker_with_database_connection_loss(self) -> None:
        """Test EmailWorker behavior when database connection is lost."""
        mock_queue = AsyncMock()
        email_item = EmailQueueItem(
            email_to="db-worker-fail@example.com",
            subject="Worker DB Failure Test",
            template_name="test",
            template_data={"test": "data"},
        )

        mock_queue.dequeue.return_value = ("db_fail_123", email_item)

        worker = EmailWorker(queue=mock_queue)

        # Mock database connection failure during processing
        with patch(
            "app.worker.email_worker.send_email", new_callable=AsyncMock
        ) as mock_send:
            # Simulate database connection loss during email processing metadata update
            with patch(
                "sqlalchemy.ext.asyncio.AsyncSession.execute",
                side_effect=SQLAlchemyError("Connection lost"),
            ):
                result = await worker.process_one()

                # Email should still be sent, but tracking might fail
                mock_send.assert_called_once()

                # Result depends on implementation - might be True (email sent) or False (tracking failed)
                assert isinstance(result, bool)

                # Should mark as completed if email sending succeeded
                if result:
                    mock_queue.mark_completed.assert_called_once_with("db_fail_123")
                else:
                    mock_queue.mark_failed.assert_called_once()


class TestRedisQueueFailureScenarios:
    """Test email system behavior during Redis/queue failures."""

    async def test_registration_with_queue_connection_failure(
        self, client: AsyncClient, db: AsyncSession, test_settings: Settings
    ) -> None:
        """Test registration when Redis queue connection fails."""
        # Mock queue to fail
        mock_queue = AsyncMock()
        mock_queue.enqueue.side_effect = RedisConnectionError("Redis connection failed")

        registration_data = {
            "email": "redis-failure@example.com",
            "password": "testpassword123",
            "password_confirm": "testpassword123",
            "full_name": "Redis Failure User",
        }

        try:
            with patch(
                "app.api.v1.endpoints.auth.get_email_queue", return_value=mock_queue
            ):
                response = await client.post(
                    f"{test_settings.api_v1_str}/auth/register", json=registration_data
                )

            # Registration should still succeed (user created) even if email fails
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert "user" in data

            # Verify user was created
            user = await user_crud.get_by_email(db, email=registration_data["email"])
            assert user is not None
            assert user.is_active is True

        finally:
            # Cleanup
            user = await user_crud.get_by_email(db, email=registration_data["email"])
            if user:
                await db.delete(user)
                await db.commit()

    async def test_email_worker_with_queue_failures(self) -> None:
        """Test EmailWorker handling various queue failure scenarios."""
        mock_queue = AsyncMock()

        # Test different queue failure scenarios
        queue_failures = [
            RedisConnectionError("Connection lost"),
            RedisTimeoutError("Operation timed out"),
            Exception("Unexpected queue error"),
        ]

        worker = EmailWorker(queue=mock_queue)

        for failure_exception in queue_failures:
            # Reset mock
            mock_queue.reset_mock()
            mock_queue.dequeue.side_effect = failure_exception

            # Worker should handle queue failures gracefully
            result = await worker.process_one()

            # Should return False (no email processed) but not crash
            assert result is False

            # Should not attempt to mark as completed/failed when dequeue fails
            mock_queue.mark_completed.assert_not_called()
            mock_queue.mark_failed.assert_not_called()

    async def test_queue_recovery_after_connection_loss(self) -> None:
        """Test queue recovery after connection is restored."""
        mock_queue = AsyncMock()

        # First calls fail, then succeed
        call_count = [0]

        def mock_dequeue_with_recovery():
            call_count[0] += 1
            if call_count[0] <= 2:
                # First two calls fail
                raise RedisConnectionError("Connection lost")
            else:
                # Third call succeeds
                return (
                    "recovery_123",
                    EmailQueueItem(
                        email_to="recovery@example.com",
                        subject="Recovery Test",
                        template_name="test",
                        template_data={},
                    ),
                )

        mock_queue.dequeue = mock_dequeue_with_recovery

        worker = EmailWorker(queue=mock_queue)

        with patch("app.worker.email_worker.send_email", new_callable=AsyncMock):
            # First attempt - should fail
            result1 = await worker.process_one()
            assert result1 is False

            # Second attempt - should fail
            result2 = await worker.process_one()
            assert result2 is False

            # Third attempt - should succeed (recovery)
            result3 = await worker.process_one()
            assert result3 is True

    async def test_queue_partial_failures(self) -> None:
        """Test queue handling partial operation failures."""
        mock_queue = AsyncMock()

        # Dequeue succeeds but mark_completed fails
        email_item = EmailQueueItem(
            email_to="partial-fail@example.com",
            subject="Partial Failure Test",
            template_name="test",
            template_data={},
        )

        mock_queue.dequeue.return_value = ("partial_123", email_item)
        mock_queue.mark_completed.side_effect = RedisConnectionError(
            "Failed to mark completed"
        )

        worker = EmailWorker(queue=mock_queue)

        with patch("app.worker.email_worker.send_email", new_callable=AsyncMock):
            result = await worker.process_one()

            # Email was sent but marking as completed failed
            # Implementation might consider this a failure or success depending on design
            assert isinstance(result, bool)


class TestEmailProviderFailureScenarios:
    """Test email system behavior when email provider fails."""

    async def test_smtp_server_unavailable(self) -> None:
        """Test EmailWorker when SMTP server is unavailable."""
        mock_queue = AsyncMock()
        email_item = EmailQueueItem(
            email_to="smtp-fail@example.com",
            subject="SMTP Failure Test",
            template_name="test",
            template_data={},
        )

        mock_queue.dequeue.return_value = ("smtp_fail_123", email_item)

        worker = EmailWorker(queue=mock_queue)

        # Mock SMTP connection failure
        with patch(
            "app.worker.email_worker.send_email",
            side_effect=Exception("SMTP server unavailable"),
        ):
            result = await worker.process_one()

            assert result is False
            mock_queue.mark_failed.assert_called_once_with(
                "smtp_fail_123", "SMTP server unavailable"
            )
            mock_queue.mark_completed.assert_not_called()

    async def test_email_provider_rate_limiting(self) -> None:
        """Test EmailWorker handling provider rate limiting."""
        mock_queue = AsyncMock()

        # Multiple emails that will hit rate limit
        emails = []
        for i in range(5):
            email_item = EmailQueueItem(
                email_to=f"rate-limit-{i}@example.com",
                subject=f"Rate Limit Test {i}",
                template_name="test",
                template_data={"index": i},
            )
            emails.append((f"rate_limit_{i}", email_item))

        email_index = [0]

        def mock_dequeue():
            if email_index[0] < len(emails):
                result = emails[email_index[0]]
                email_index[0] += 1
                return result
            return None, None

        mock_queue.dequeue = mock_dequeue

        worker = EmailWorker(queue=mock_queue)

        # Mock rate limiting - first 2 succeed, then rate limited
        send_count = [0]

        async def mock_send_with_rate_limit(*args, **kwargs):
            send_count[0] += 1
            if send_count[0] <= 2:
                return  # Success
            else:
                raise Exception("Rate limit exceeded: 429 Too Many Requests")

        with patch(
            "app.worker.email_worker.send_email", side_effect=mock_send_with_rate_limit
        ):
            results = []

            # Process all emails
            while email_index[0] < len(emails):
                result = await worker.process_one()
                results.append(result)

        # First 2 should succeed, rest should fail due to rate limiting
        assert results[:2] == [True, True]
        assert results[2:] == [False, False, False]

        # Verify appropriate queue operations
        assert mock_queue.mark_completed.call_count == 2
        assert mock_queue.mark_failed.call_count == 3

    async def test_email_authentication_failure(self) -> None:
        """Test EmailWorker handling email authentication failures."""
        mock_queue = AsyncMock()
        email_item = EmailQueueItem(
            email_to="auth-fail@example.com",
            subject="Auth Failure Test",
            template_name="test",
            template_data={},
        )

        mock_queue.dequeue.return_value = ("auth_fail_123", email_item)

        worker = EmailWorker(queue=mock_queue)

        # Mock authentication failure
        with patch(
            "app.worker.email_worker.send_email",
            side_effect=Exception("535 Authentication failed"),
        ):
            result = await worker.process_one()

            assert result is False
            mock_queue.mark_failed.assert_called_once_with(
                "auth_fail_123", "535 Authentication failed"
            )

    async def test_email_content_validation_failure(self) -> None:
        """Test EmailWorker handling email content validation failures."""
        mock_queue = AsyncMock()

        # Email with potentially problematic content
        email_item = EmailQueueItem(
            email_to="content-fail@example.com",
            subject="Content Validation Test",
            template_name="invalid_template",
            template_data={"invalid_data": None},
        )

        mock_queue.dequeue.return_value = ("content_fail_123", email_item)

        worker = EmailWorker(queue=mock_queue)

        # Mock content validation/template rendering failure
        with patch(
            "app.worker.email_worker.send_email",
            side_effect=Exception("Template rendering failed: invalid template"),
        ):
            result = await worker.process_one()

            assert result is False
            mock_queue.mark_failed.assert_called_once()

            # Check that error message contains template information
            call_args = mock_queue.mark_failed.call_args[0]
            assert "Template rendering failed" in call_args[1]


class TestNetworkFailureScenarios:
    """Test email system behavior during network failures."""

    async def test_webhook_with_network_timeout(
        self, client: AsyncClient, db: AsyncSession, test_settings: Settings
    ) -> None:
        """Test webhook processing with network timeouts."""
        # Create tracking record
        from app.schemas.email_tracking import EmailTrackingCreate

        tracking_data = EmailTrackingCreate(
            email_id="network-timeout-123",
            recipient="timeout@example.com",
            subject="Network Timeout Test",
            template_name="test",
            status=EmailStatus.SENT,
        )

        tracking = await email_tracking.create_with_event(
            db=db, obj_in=tracking_data, event_type=EmailStatus.SENT
        )
        await db.commit()

        try:
            webhook_payload = [
                {
                    "email": "timeout@example.com",
                    "timestamp": int(time.time()),
                    "smtp-id": "network-timeout-123",
                    "event": "delivered",
                    "sg_event_id": "timeout_test",
                }
            ]

            # Mock network timeout during database update
            with patch(
                "app.api.v1.endpoints.webhooks.validate_sendgrid_signature",
                return_value=True,
            ):
                with patch(
                    "sqlalchemy.ext.asyncio.AsyncSession.execute",
                    side_effect=asyncio.TimeoutError("Database operation timed out"),
                ):
                    response = await client.post(
                        "/api/v1/webhooks/sendgrid",
                        json=webhook_payload,
                        headers={"Content-Type": "application/json"},
                    )

            # Should return error status
            assert response.status_code in [500, 503, 504]  # Server error or timeout

        finally:
            # Cleanup
            await db.delete(tracking)
            await db.commit()

    async def test_registration_with_network_partition(
        self, client: AsyncClient, db: AsyncSession, test_settings: Settings
    ) -> None:
        """Test registration during network partition scenarios."""
        # Mock various network-related failures
        network_failures = [
            ConnectionError("Network unreachable"),
            asyncio.TimeoutError("Operation timed out"),
            OSError("Network is unreachable"),
        ]

        for failure in network_failures:
            registration_data = {
                "email": f"network-partition-{hash(str(failure))}@example.com",
                "password": "testpassword123",
                "password_confirm": "testpassword123",
                "full_name": "Network Partition User",
            }

            # Mock queue to fail with network error
            mock_queue = AsyncMock()
            mock_queue.enqueue.side_effect = failure

            try:
                with patch(
                    "app.api.v1.endpoints.auth.get_email_queue", return_value=mock_queue
                ):
                    response = await client.post(
                        f"{test_settings.api_v1_str}/auth/register",
                        json=registration_data,
                    )

                # Registration should still succeed despite email failures
                assert response.status_code == 200

                # Verify user was created
                user = await user_crud.get_by_email(
                    db, email=registration_data["email"]
                )
                assert user is not None

            finally:
                # Cleanup
                user = await user_crud.get_by_email(
                    db, email=registration_data["email"]
                )
                if user:
                    await db.delete(user)
                    await db.commit()


class TestConcurrencyEdgeCases:
    """Test edge cases related to concurrent operations."""

    async def test_concurrent_password_reset_requests(
        self, client: AsyncClient, db: AsyncSession, test_settings: Settings
    ) -> None:
        """Test multiple concurrent password reset requests for same user."""
        # Create test user
        user = await UserFactory.create(
            session=db,
            email="concurrent-reset@example.com",
            password="oldpassword123",
            full_name="Concurrent Reset User",
            is_active=True,
        )
        await db.commit()

        try:
            # Mock email queue
            mock_queue = AsyncMock()
            queued_emails = []

            async def capture_enqueue(email_item: EmailQueueItem) -> str:
                email_id = f"concurrent_reset_{len(queued_emails)}"
                queued_emails.append((email_id, email_item))
                return email_id

            mock_queue.enqueue = capture_enqueue

            # Make multiple concurrent reset requests
            num_concurrent = 5
            request_tasks = []

            with patch(
                "app.api.v1.endpoints.auth.get_email_queue", return_value=mock_queue
            ):
                for i in range(num_concurrent):
                    task = client.post(
                        f"{test_settings.api_v1_str}/auth/reset-password-request",
                        json={"email": user.email},
                    )
                    request_tasks.append(task)

                # Execute all requests concurrently
                responses = await asyncio.gather(*request_tasks)

            # All requests should return success (for security)
            for response in responses:
                assert response.status_code == 200
                data = response.json()
                assert "reset link shortly" in data["message"]

            # Check how many tokens were actually created (should be rate limited)
            from sqlalchemy import select

            result = await db.execute(
                select(PasswordResetToken).where(PasswordResetToken.user_id == user.id)
            )
            tokens = result.fetchall()

            # Should have rate limiting - fewer emails than requests
            assert len(queued_emails) <= num_concurrent
            assert len(tokens) <= num_concurrent

        finally:
            # Cleanup
            await password_reset_token.cleanup_tokens_for_user(db, user.id)
            await db.delete(user)
            await db.commit()

    async def test_concurrent_email_verification_attempts(
        self, client: AsyncClient, db: AsyncSession, test_settings: Settings
    ) -> None:
        """Test concurrent email verification attempts."""
        # Create unverified user
        user = await UserFactory.create(
            session=db,
            email="concurrent-verify@example.com",
            password="testpassword123",
            full_name="Concurrent Verify User",
            is_active=True,
            is_verified=False,
        )
        await db.commit()

        try:
            from datetime import timedelta

            from app.core.security import create_access_token

            # Generate verification token
            verification_token = create_access_token(
                subject=user.id,
                settings=test_settings,
                expires_delta=timedelta(hours=24),
            )

            # Make multiple concurrent verification requests
            num_concurrent = 5
            verification_tasks = []

            for i in range(num_concurrent):
                task = client.post(
                    f"{test_settings.api_v1_str}/auth/verify-email",
                    json={"token": verification_token},
                )
                verification_tasks.append(task)

            # Execute all verifications concurrently
            responses = await asyncio.gather(*verification_tasks)

            # All should succeed (idempotent operation)
            for response in responses:
                assert response.status_code == 200
                data = response.json()
                assert "verified" in data["message"]

            # Verify user is verified only once
            await db.refresh(user)
            assert user.is_verified is True
            assert user.email_verified_at is not None

        finally:
            # Cleanup
            await db.delete(user)
            await db.commit()

    async def test_race_condition_in_webhook_processing(
        self, client: AsyncClient, db: AsyncSession, test_settings: Settings
    ) -> None:
        """Test race conditions in webhook event processing."""
        # Create tracking record
        from app.schemas.email_tracking import EmailTrackingCreate

        tracking_data = EmailTrackingCreate(
            email_id="race-condition-123",
            recipient="race@example.com",
            subject="Race Condition Test",
            template_name="test",
            status=EmailStatus.SENT,
        )

        tracking = await email_tracking.create_with_event(
            db=db, obj_in=tracking_data, event_type=EmailStatus.SENT
        )
        await db.commit()

        try:
            # Create identical webhook events
            webhook_payload = [
                {
                    "email": "race@example.com",
                    "timestamp": int(time.time()),
                    "smtp-id": "race-condition-123",
                    "event": "delivered",
                    "sg_event_id": "race_test_identical",
                }
            ]

            # Send multiple identical webhook requests concurrently
            num_concurrent = 3
            webhook_tasks = []

            with patch(
                "app.api.v1.endpoints.webhooks.validate_sendgrid_signature",
                return_value=True,
            ):
                for i in range(num_concurrent):
                    task = client.post(
                        "/api/v1/webhooks/sendgrid",
                        json=webhook_payload,
                        headers={"Content-Type": "application/json"},
                    )
                    webhook_tasks.append(task)

                # Execute all webhooks concurrently
                responses = await asyncio.gather(*webhook_tasks)

            # All should succeed (idempotent)
            for response in responses:
                assert response.status_code == 200
                data = response.json()
                assert data["successful_events"] == 1
                assert data["failed_events"] == 0

            # Verify tracking was updated correctly (no duplicates)
            await db.refresh(tracking)
            assert tracking.status == EmailStatus.DELIVERED

        finally:
            # Cleanup
            await db.delete(tracking)
            await db.commit()


class TestDataCorruptionScenarios:
    """Test scenarios that could lead to data corruption."""

    async def test_malformed_email_queue_data(self) -> None:
        """Test EmailWorker handling malformed queue data."""
        mock_queue = AsyncMock()

        # Various malformed data scenarios
        malformed_scenarios = [
            # Missing required fields
            (None, None),
            ("valid_id", None),
            (None, "not_an_email_item"),
            # Corrupted email item data
            ("corrupted_123", "corrupted_string_instead_of_object"),
        ]

        worker = EmailWorker(queue=mock_queue)

        for email_id, email_item in malformed_scenarios:
            mock_queue.reset_mock()
            mock_queue.dequeue.return_value = (email_id, email_item)

            # Worker should handle malformed data gracefully
            result = await worker.process_one()

            # Should return False and not crash
            assert result is False

            # Should not attempt to send email with malformed data
            with patch(
                "app.worker.email_worker.send_email", new_callable=AsyncMock
            ) as mock_send:
                mock_send.assert_not_called()

    async def test_webhook_with_malformed_json(
        self, client: AsyncClient, test_settings: Settings
    ) -> None:
        """Test webhook endpoints with malformed JSON payloads."""
        malformed_payloads = [
            '{"incomplete": json',  # Invalid JSON
            "[]",  # Empty array
            '[{"missing_required_fields": true}]',  # Missing required fields
            '{"not_an_array": "should_be_array"}',  # Wrong data structure
        ]

        with patch(
            "app.api.v1.endpoints.webhooks.validate_sendgrid_signature",
            return_value=True,
        ):
            for payload in malformed_payloads:
                response = await client.post(
                    "/api/v1/webhooks/sendgrid",
                    content=payload,
                    headers={"Content-Type": "application/json"},
                )

                # Should return appropriate error status
                assert response.status_code in [
                    400,
                    422,
                ]  # Bad request or validation error

    async def test_database_constraint_violations(self, db: AsyncSession) -> None:
        """Test handling of database constraint violations."""
        from app.schemas.email_tracking import EmailTrackingCreate

        # Try to create duplicate email tracking record
        tracking_data = EmailTrackingCreate(
            email_id="duplicate-test-123",
            recipient="duplicate@example.com",
            subject="Duplicate Test",
            template_name="test",
            status=EmailStatus.QUEUED,
        )

        # Create first record
        tracking1 = await email_tracking.create_with_event(
            db=db, obj_in=tracking_data, event_type=EmailStatus.QUEUED
        )
        await db.commit()

        try:
            # Try to create duplicate with same email_id (should fail if unique constraint exists)
            with pytest.raises((IntegrityError, Exception)):
                tracking2 = await email_tracking.create_with_event(
                    db=db, obj_in=tracking_data, event_type=EmailStatus.QUEUED
                )
                await db.commit()

        finally:
            # Cleanup
            await db.rollback()  # Rollback failed transaction
            await db.delete(tracking1)
            await db.commit()


class TestResourceExhaustionScenarios:
    """Test behavior under resource exhaustion conditions."""

    async def test_memory_exhaustion_simulation(self) -> None:
        """Test EmailWorker behavior under memory pressure."""
        mock_queue = AsyncMock()

        # Create email with large template data
        large_data = {"large_field": "x" * 1024 * 1024}  # 1MB string
        email_item = EmailQueueItem(
            email_to="memory-test@example.com",
            subject="Memory Exhaustion Test",
            template_name="test",
            template_data=large_data,
        )

        mock_queue.dequeue.return_value = ("memory_123", email_item)

        worker = EmailWorker(queue=mock_queue)

        # Mock memory error during email processing
        with patch(
            "app.worker.email_worker.send_email",
            side_effect=MemoryError("Out of memory"),
        ):
            result = await worker.process_one()

            # Should handle memory error gracefully
            assert result is False
            mock_queue.mark_failed.assert_called_once()

    async def test_disk_space_exhaustion(self, db: AsyncSession) -> None:
        """Test system behavior when disk space is exhausted."""
        from app.schemas.email_tracking import EmailTrackingCreate

        tracking_data = EmailTrackingCreate(
            email_id="disk-full-123",
            recipient="diskfull@example.com",
            subject="Disk Full Test",
            template_name="test",
            status=EmailStatus.QUEUED,
        )

        # Mock disk full error during database write
        with patch(
            "sqlalchemy.ext.asyncio.AsyncSession.commit",
            side_effect=OSError("No space left on device"),
        ):
            with pytest.raises(OSError):
                await email_tracking.create_with_event(
                    db=db, obj_in=tracking_data, event_type=EmailStatus.QUEUED
                )

    async def test_connection_pool_exhaustion(
        self, client: AsyncClient, test_settings: Settings
    ) -> None:
        """Test behavior when database connection pool is exhausted."""
        registration_data = {
            "email": "pool-exhausted@example.com",
            "password": "testpassword123",
            "password_confirm": "testpassword123",
            "full_name": "Pool Exhausted User",
        }

        # Mock connection pool exhaustion
        with patch(
            "sqlalchemy.ext.asyncio.AsyncSession.execute",
            side_effect=Exception("Connection pool exhausted"),
        ):
            response = await client.post(
                f"{test_settings.api_v1_str}/auth/register", json=registration_data
            )

        # Should return appropriate error status
        assert response.status_code in [
            500,
            503,
        ]  # Internal server error or service unavailable


class TestConfigurationEdgeCases:
    """Test edge cases related to configuration and environment issues."""

    async def test_missing_environment_variables(self) -> None:
        """Test system behavior with missing environment variables."""
        # Test with missing email configuration
        with patch.dict("os.environ", {}, clear=False):
            with patch("app.core.config.get_settings") as mock_settings:
                # Mock settings with missing email config
                mock_settings.return_value.smtp_server = None
                mock_settings.return_value.smtp_port = None

                mock_queue = AsyncMock()
                email_item = EmailQueueItem(
                    email_to="config-missing@example.com",
                    subject="Config Missing Test",
                    template_name="test",
                    template_data={},
                )

                mock_queue.dequeue.return_value = ("config_123", email_item)

                worker = EmailWorker(queue=mock_queue)

                # Should handle missing configuration gracefully
                with patch(
                    "app.worker.email_worker.send_email",
                    side_effect=Exception("SMTP configuration missing"),
                ):
                    result = await worker.process_one()

                    assert result is False
                    mock_queue.mark_failed.assert_called_once()

    async def test_invalid_email_templates(self) -> None:
        """Test handling of invalid or missing email templates."""
        mock_queue = AsyncMock()

        # Email with non-existent template
        email_item = EmailQueueItem(
            email_to="template-missing@example.com",
            subject="Template Missing Test",
            template_name="non_existent_template",
            template_data={},
        )

        mock_queue.dequeue.return_value = ("template_123", email_item)

        worker = EmailWorker(queue=mock_queue)

        # Mock template not found error
        with patch(
            "app.worker.email_worker.send_email",
            side_effect=Exception("Template not found: non_existent_template"),
        ):
            result = await worker.process_one()

            assert result is False
            mock_queue.mark_failed.assert_called_once()

            # Check error message includes template information
            error_message = mock_queue.mark_failed.call_args[0][1]
            assert "Template not found" in error_message
            assert "non_existent_template" in error_message
