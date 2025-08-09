"""
Comprehensive End-to-End Tests for Email System Integration

This test suite validates complete user journeys from registration through email
verification and password reset, including EmailWorker processing and webhook
delivery tracking.
"""
import pytest
import asyncio
import time
from typing import Dict, Any, Optional
from unittest.mock import AsyncMock, patch, Mock
from datetime import datetime, timedelta, UTC

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.core.config import Settings
from app.core.queue import EmailQueue, EmailQueueItem
from app.worker.email_worker import EmailWorker
from app.models.user import User
from app.models.email_tracking import EmailTracking, EmailStatus
from app.crud.user import user as user_crud
from app.crud.email_tracking import email_tracking
from tests.factories import UserFactory


pytestmark = pytest.mark.asyncio


class TestUserRegistrationEmailFlow:
    """Test complete user registration with email verification flow."""

    async def test_complete_registration_flow(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test complete registration → email → verification flow."""
        registration_data = {
            "email": "e2e-register@example.com",
            "password": "testpassword123",
            "password_confirm": "testpassword123",
            "full_name": "E2E Test User"
        }

        # Step 1: Register user and capture email sending
        captured_email = {}
        
        def mock_send_email(*args, **kwargs):
            captured_email.update(kwargs)
            return asyncio.sleep(0)  # Simulate async email sending
        
        with patch('app.api.v1.endpoints.auth.send_new_account_email', side_effect=mock_send_email):
            response = await client.post(
                f"{test_settings.api_v1_str}/auth/register",
                json=registration_data
            )
        
        assert response.status_code == 200
        reg_data = response.json()
        
        # Validate registration response
        assert "access_token" in reg_data
        assert "user" in reg_data
        assert reg_data["user"]["email"] == registration_data["email"]
        assert reg_data["user"]["is_verified"] is False
        
        # Validate email was captured
        assert captured_email["email_to"] == registration_data["email"]
        assert captured_email["username"] == registration_data["full_name"]
        assert "verification_token" in captured_email
        
        # Step 2: Get user from database
        user = await user_crud.get_by_email(db, email=registration_data["email"])
        assert user is not None
        assert user.is_verified is False
        assert user.email_verified_at is None
        
        # Step 3: Verify email using captured token
        verification_data = {"token": captured_email["verification_token"]}
        response = await client.post(
            f"{test_settings.api_v1_str}/auth/verify-email",
            json=verification_data
        )
        
        assert response.status_code == 200
        verify_data = response.json()
        assert "successfully verified" in verify_data["message"]
        
        # Step 4: Verify user is now verified in database
        await db.refresh(user)
        assert user.is_verified is True
        assert user.email_verified_at is not None
        
        # Step 5: Test immediate login capability with registration token
        headers = {"Authorization": f"Bearer {reg_data['access_token']}"}
        response = await client.get(
            f"{test_settings.api_v1_str}/users/me",
            headers=headers
        )
        
        assert response.status_code == 200
        user_data = response.json()
        assert user_data["email"] == registration_data["email"]
        
        # Cleanup
        await db.delete(user)
        await db.commit()

    async def test_registration_with_email_worker_processing(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test registration with actual EmailWorker processing."""
        mock_redis = AsyncMock(spec=Redis)
        mock_queue = AsyncMock(spec=EmailQueue)
        
        # Track queued emails
        queued_emails = []
        
        async def mock_enqueue(email_item: EmailQueueItem) -> str:
            queued_emails.append(email_item)
            return f"email_id_{len(queued_emails)}"
        
        mock_queue.enqueue = mock_enqueue
        
        registration_data = {
            "email": "worker-test@example.com",
            "password": "testpassword123",
            "password_confirm": "testpassword123",
            "full_name": "Worker Test User"
        }
        
        # Mock the queue to capture emails
        with patch('app.api.v1.endpoints.auth.get_email_queue', return_value=mock_queue):
            response = await client.post(
                f"{test_settings.api_v1_str}/auth/register",
                json=registration_data
            )
        
        assert response.status_code == 200
        
        # Verify email was queued
        assert len(queued_emails) == 1
        email_item = queued_emails[0]
        assert email_item.email_to == registration_data["email"]
        assert email_item.template_name == "new_account"
        assert "verification_token" in email_item.template_data
        
        # Simulate EmailWorker processing
        worker = EmailWorker(queue=mock_queue)
        mock_queue.dequeue.return_value = ("email_1", email_item)
        
        with patch('app.worker.email_worker.send_email', new_callable=AsyncMock) as mock_send:
            result = await worker.process_one()
            
            assert result is True
            mock_send.assert_called_once()
            mock_queue.mark_completed.assert_called_once_with("email_1")
        
        # Cleanup
        user = await user_crud.get_by_email(db, email=registration_data["email"])
        if user:
            await db.delete(user)
            await db.commit()

    async def test_registration_email_failure_recovery(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test registration continues when email sending fails."""
        registration_data = {
            "email": "email-fail@example.com",
            "password": "testpassword123",
            "password_confirm": "testpassword123",
            "full_name": "Email Fail User"
        }
        
        # Mock email sending to fail
        with patch('app.api.v1.endpoints.auth.send_new_account_email', side_effect=Exception("SMTP Error")):
            response = await client.post(
                f"{test_settings.api_v1_str}/auth/register",
                json=registration_data
            )
        
        # Registration should still succeed
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        
        # User should exist in database
        user = await user_crud.get_by_email(db, email=registration_data["email"])
        assert user is not None
        assert user.is_active is True
        
        # User should be able to login immediately
        login_data = {
            "username": registration_data["email"],
            "password": registration_data["password"]
        }
        
        response = await client.post(
            f"{test_settings.api_v1_str}/auth/token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 200
        token_data = response.json()
        assert "access_token" in token_data
        
        # Cleanup
        await db.delete(user)
        await db.commit()


class TestPasswordResetEmailFlow:
    """Test complete password reset with email flow."""

    async def test_complete_password_reset_flow(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test complete password reset → email → confirmation flow."""
        # Setup: Create test user
        user = await UserFactory.create(
            session=db,
            email="reset-flow@example.com",
            password="oldpassword123",
            full_name="Reset Flow User",
            is_active=True
        )
        await db.commit()
        
        try:
            # Step 1: Request password reset
            captured_email = {}
            
            def mock_send_reset_email(*args, **kwargs):
                captured_email.update(kwargs)
                return asyncio.sleep(0)
            
            request_data = {"email": user.email}
            
            with patch('app.api.v1.endpoints.auth.send_reset_password_email', side_effect=mock_send_reset_email):
                response = await client.post(
                    f"{test_settings.api_v1_str}/auth/reset-password-request",
                    json=request_data
                )
            
            assert response.status_code == 200
            data = response.json()
            assert "reset link shortly" in data["message"]
            
            # Validate email was captured
            assert captured_email["email_to"] == user.email
            assert captured_email["username"] == user.full_name
            assert "token" in captured_email
            
            # Step 2: Confirm password reset
            new_password = "newpassword123"
            confirm_data = {
                "token": captured_email["token"],
                "new_password": new_password
            }
            
            response = await client.post(
                f"{test_settings.api_v1_str}/auth/reset-password-confirm",
                json=confirm_data
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "successfully reset" in data["message"]
            
            # Step 3: Verify old password no longer works
            login_data = {
                "username": user.email,
                "password": "oldpassword123"
            }
            
            response = await client.post(
                f"{test_settings.api_v1_str}/auth/token",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            assert response.status_code == 401
            
            # Step 4: Verify new password works
            login_data = {
                "username": user.email,
                "password": new_password
            }
            
            response = await client.post(
                f"{test_settings.api_v1_str}/auth/token",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            assert response.status_code == 200
            token_data = response.json()
            assert "access_token" in token_data
            
        finally:
            # Cleanup
            await db.delete(user)
            await db.commit()

    async def test_password_reset_with_email_tracking(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test password reset with email tracking integration."""
        # Setup: Create test user
        user = await UserFactory.create(
            session=db,
            email="tracking-reset@example.com",
            password="oldpassword123",
            full_name="Tracking User",
            is_active=True
        )
        await db.commit()
        
        try:
            # Mock email queue to track emails
            mock_queue = AsyncMock()
            queued_emails = []
            
            async def mock_enqueue(email_item: EmailQueueItem) -> str:
                queued_emails.append(email_item)
                
                # Create email tracking record
                from app.schemas.email_tracking import EmailTrackingCreate
                tracking_data = EmailTrackingCreate(
                    email_id=f"reset_email_{len(queued_emails)}",
                    recipient=email_item.email_to,
                    subject=email_item.subject,
                    template_name=email_item.template_name,
                    status=EmailStatus.QUEUED
                )
                
                tracking = await email_tracking.create_with_event(
                    db=db,
                    obj_in=tracking_data,
                    event_type=EmailStatus.QUEUED
                )
                await db.commit()
                
                return tracking.email_id
            
            mock_queue.enqueue = mock_enqueue
            
            # Request password reset
            with patch('app.api.v1.endpoints.auth.get_email_queue', return_value=mock_queue):
                response = await client.post(
                    f"{test_settings.api_v1_str}/auth/reset-password-request",
                    json={"email": user.email}
                )
            
            assert response.status_code == 200
            assert len(queued_emails) == 1
            
            # Verify email tracking was created
            email_item = queued_emails[0]
            tracking_records = await db.execute(
                db.select(EmailTracking).where(
                    EmailTracking.recipient == user.email
                )
            )
            tracking_list = tracking_records.fetchall()
            assert len(tracking_list) == 1
            
            tracking = tracking_list[0][0]
            assert tracking.status == EmailStatus.QUEUED
            assert tracking.template_name == "reset_password"
            
        finally:
            # Cleanup
            await db.delete(user)
            await db.commit()


class TestEmailWorkerIntegration:
    """Test EmailWorker integration with complete email processing."""

    async def test_email_worker_complete_processing_cycle(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test complete EmailWorker processing from queue to delivery."""
        # Setup mock Redis and queue
        mock_redis = AsyncMock(spec=Redis)
        mock_queue = AsyncMock(spec=EmailQueue)
        
        # Create test email item
        email_item = EmailQueueItem(
            email_to="worker-integration@example.com",
            subject="Test Email",
            template_name="test_template",
            template_data={"test": "data"}
        )
        
        # Setup queue behavior
        process_calls = []
        mock_queue.dequeue.side_effect = [
            ("email_1", email_item),  # First call returns email
            (None, None),             # Second call returns None (empty queue)
            (None, None)              # Third call returns None
        ]
        
        async def mock_mark_completed(email_id: str):
            process_calls.append(("completed", email_id))
        
        async def mock_mark_failed(email_id: str, reason: str):
            process_calls.append(("failed", email_id, reason))
        
        mock_queue.mark_completed = mock_mark_completed
        mock_queue.mark_failed = mock_mark_failed
        
        # Create EmailWorker
        worker = EmailWorker(queue=mock_queue)
        worker.processing_interval = 0.01  # Fast processing for tests
        
        # Mock email sending
        with patch('app.worker.email_worker.send_email', new_callable=AsyncMock) as mock_send:
            # Test successful processing
            result = await worker.process_one()
            
            assert result is True
            mock_send.assert_called_once()
            assert process_calls == [("completed", "email_1")]
        
        # Test empty queue
        process_calls.clear()
        result = await worker.process_one()
        assert result is False
        assert len(process_calls) == 0
        
        # Test email sending failure
        process_calls.clear()
        mock_queue.dequeue.return_value = ("email_2", email_item)
        
        with patch('app.worker.email_worker.send_email', side_effect=Exception("SMTP Error")):
            result = await worker.process_one()
            
            assert result is False
            assert process_calls == [("failed", "email_2", "SMTP Error")]

    async def test_email_worker_startup_and_shutdown(self) -> None:
        """Test EmailWorker startup and shutdown lifecycle."""
        mock_queue = AsyncMock(spec=EmailQueue)
        mock_queue.dequeue.return_value = (None, None)
        
        worker = EmailWorker(queue=mock_queue)
        worker.processing_interval = 0.01
        
        # Test startup
        assert not worker.is_running
        assert worker.processing_task is None
        
        worker.start()
        assert worker.is_running
        assert worker.processing_task is not None
        
        # Allow worker to process a few cycles
        await asyncio.sleep(0.05)
        
        # Test shutdown
        worker.stop()
        assert not worker.is_running
        
        # Wait for task to complete
        await asyncio.sleep(0.1)
        assert worker.processing_task.cancelled()


class TestWebhookEmailTrackingFlow:
    """Test complete webhook integration with email tracking."""

    async def test_complete_webhook_delivery_flow(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test complete email → webhook → status update flow."""
        # Step 1: Create email tracking record
        from app.schemas.email_tracking import EmailTrackingCreate
        
        tracking_data = EmailTrackingCreate(
            email_id="webhook-flow-123",
            recipient="webhook-test@example.com",
            subject="Webhook Test Email",
            template_name="test",
            status=EmailStatus.SENT
        )
        
        tracking = await email_tracking.create_with_event(
            db=db,
            obj_in=tracking_data,
            event_type=EmailStatus.SENT,
            event_metadata={"provider": "sendgrid"}
        )
        await db.commit()
        
        try:
            # Step 2: Simulate webhook delivery events
            webhook_events = [
                {
                    "email": "webhook-test@example.com",
                    "timestamp": int(time.time()),
                    "smtp-id": "webhook-flow-123",
                    "event": "delivered",
                    "sg_event_id": "delivery_event_1",
                    "useragent": "Test-Agent/1.0",
                    "ip": "192.168.1.1"
                },
                {
                    "email": "webhook-test@example.com",
                    "timestamp": int(time.time() + 60),
                    "smtp-id": "webhook-flow-123",
                    "event": "open",
                    "sg_event_id": "open_event_1",
                    "useragent": "Test-Agent/1.0",
                    "ip": "192.168.1.1"
                },
                {
                    "email": "webhook-test@example.com",
                    "timestamp": int(time.time() + 120),
                    "smtp-id": "webhook-flow-123",
                    "event": "click",
                    "url": "https://example.com/test-link",
                    "sg_event_id": "click_event_1",
                    "useragent": "Test-Agent/1.0",
                    "ip": "192.168.1.1"
                }
            ]
            
            # Process each webhook event
            with patch("app.api.v1.endpoints.webhooks.validate_sendgrid_signature", return_value=True):
                for event_batch in webhook_events:
                    response = await client.post(
                        "/api/v1/webhooks/sendgrid",
                        json=[event_batch],
                        headers={"Content-Type": "application/json"}
                    )
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert data["successful_events"] == 1
                    assert data["failed_events"] == 0
            
            # Step 3: Verify tracking record was updated with final status
            await db.refresh(tracking)
            assert tracking.status == EmailStatus.CLICKED  # Final status
            assert tracking.delivered_at is not None
            assert tracking.first_opened_at is not None
            assert tracking.last_clicked_at is not None
            
            # Step 4: Verify all events were recorded
            from sqlalchemy import select
            from app.models.email_tracking import EmailEvent
            
            events_result = await db.execute(
                select(EmailEvent).where(EmailEvent.email_id == tracking.id)
            )
            events = events_result.fetchall()
            
            # Should have 4 events: SENT (initial) + DELIVERED + OPENED + CLICKED
            assert len(events) >= 4
            
            event_types = [event[0].event_type for event in events]
            assert EmailStatus.SENT in event_types
            assert EmailStatus.DELIVERED in event_types
            assert EmailStatus.OPENED in event_types
            assert EmailStatus.CLICKED in event_types
            
        finally:
            # Cleanup
            await db.delete(tracking)
            await db.commit()

    async def test_webhook_bounce_handling(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test webhook handling of bounce events."""
        # Create email tracking record
        from app.schemas.email_tracking import EmailTrackingCreate
        
        tracking_data = EmailTrackingCreate(
            email_id="bounce-test-456",
            recipient="bounce@example.com",
            subject="Bounce Test Email",
            template_name="test",
            status=EmailStatus.SENT
        )
        
        tracking = await email_tracking.create_with_event(
            db=db,
            obj_in=tracking_data,
            event_type=EmailStatus.SENT
        )
        await db.commit()
        
        try:
            # Simulate bounce webhook
            bounce_event = [
                {
                    "email": "bounce@example.com",
                    "timestamp": int(time.time()),
                    "smtp-id": "bounce-test-456",
                    "event": "bounce",
                    "reason": "550 User unknown",
                    "status": "550",
                    "type": "blocked",
                    "sg_event_id": "bounce_event_123"
                }
            ]
            
            with patch("app.api.v1.endpoints.webhooks.validate_sendgrid_signature", return_value=True):
                response = await client.post(
                    "/api/v1/webhooks/sendgrid",
                    json=bounce_event,
                    headers={"Content-Type": "application/json"}
                )
            
            assert response.status_code == 200
            data = response.json()
            assert data["successful_events"] == 1
            
            # Verify tracking was updated
            await db.refresh(tracking)
            assert tracking.status == EmailStatus.BOUNCED
            assert tracking.bounced_at is not None
            
            # Verify bounce reason was captured
            from sqlalchemy import select
            from app.models.email_tracking import EmailEvent
            
            events_result = await db.execute(
                select(EmailEvent).where(
                    EmailEvent.email_id == tracking.id,
                    EmailEvent.event_type == EmailStatus.BOUNCED
                )
            )
            bounce_events = events_result.fetchall()
            
            assert len(bounce_events) == 1
            bounce_event = bounce_events[0][0]
            assert "reason" in bounce_event.event_metadata
            assert bounce_event.event_metadata["reason"] == "550 User unknown"
            
        finally:
            # Cleanup
            await db.delete(tracking)
            await db.commit()


class TestConcurrentEmailProcessing:
    """Test concurrent email processing scenarios."""

    async def test_concurrent_user_registrations(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test multiple concurrent user registrations."""
        num_users = 5
        registration_tasks = []
        
        # Mock email sending to avoid actual SMTP
        with patch('app.api.v1.endpoints.auth.send_new_account_email', new_callable=AsyncMock):
            # Create concurrent registration tasks
            for i in range(num_users):
                registration_data = {
                    "email": f"concurrent-{i}@example.com",
                    "password": "testpassword123",
                    "password_confirm": "testpassword123",
                    "full_name": f"Concurrent User {i}"
                }
                
                task = client.post(
                    f"{test_settings.api_v1_str}/auth/register",
                    json=registration_data
                )
                registration_tasks.append(task)
            
            # Execute all registrations concurrently
            responses = await asyncio.gather(*registration_tasks)
        
        # Verify all registrations succeeded
        created_users = []
        try:
            for i, response in enumerate(responses):
                assert response.status_code == 200
                data = response.json()
                assert "access_token" in data
                assert "user" in data
                
                # Verify user exists in database
                user = await user_crud.get_by_email(db, email=f"concurrent-{i}@example.com")
                assert user is not None
                created_users.append(user)
        
        finally:
            # Cleanup all created users
            for user in created_users:
                await db.delete(user)
            await db.commit()

    async def test_concurrent_webhook_processing(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test concurrent webhook processing."""
        # Create multiple tracking records
        tracking_records = []
        try:
            from app.schemas.email_tracking import EmailTrackingCreate
            
            for i in range(3):
                tracking_data = EmailTrackingCreate(
                    email_id=f"concurrent-webhook-{i}",
                    recipient=f"concurrent{i}@example.com",
                    subject=f"Concurrent Test Email {i}",
                    template_name="test",
                    status=EmailStatus.SENT
                )
                
                tracking = await email_tracking.create_with_event(
                    db=db,
                    obj_in=tracking_data,
                    event_type=EmailStatus.SENT
                )
                tracking_records.append(tracking)
            
            await db.commit()
            
            # Create concurrent webhook requests
            webhook_tasks = []
            
            with patch("app.api.v1.endpoints.webhooks.validate_sendgrid_signature", return_value=True):
                for i, tracking in enumerate(tracking_records):
                    webhook_payload = [
                        {
                            "email": f"concurrent{i}@example.com",
                            "timestamp": int(time.time()),
                            "smtp-id": f"concurrent-webhook-{i}",
                            "event": "delivered",
                            "sg_event_id": f"concurrent_delivery_{i}",
                            "useragent": "Test-Agent/1.0",
                            "ip": "192.168.1.1"
                        }
                    ]
                    
                    task = client.post(
                        "/api/v1/webhooks/sendgrid",
                        json=webhook_payload,
                        headers={"Content-Type": "application/json"}
                    )
                    webhook_tasks.append(task)
                
                # Execute all webhooks concurrently
                responses = await asyncio.gather(*webhook_tasks)
            
            # Verify all webhooks processed successfully
            for response in responses:
                assert response.status_code == 200
                data = response.json()
                assert data["successful_events"] == 1
                assert data["failed_events"] == 0
            
            # Verify all tracking records were updated
            for tracking in tracking_records:
                await db.refresh(tracking)
                assert tracking.status == EmailStatus.DELIVERED
                assert tracking.delivered_at is not None
        
        finally:
            # Cleanup
            for tracking in tracking_records:
                await db.delete(tracking)
            await db.commit()


class TestEmailSystemPerformance:
    """Test email system performance under load."""

    async def test_email_queue_performance(
        self,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test email queue performance with multiple emails."""
        mock_redis = AsyncMock(spec=Redis)
        mock_queue = AsyncMock(spec=EmailQueue)
        
        # Simulate processing 100 emails
        num_emails = 100
        processed_emails = []
        
        async def mock_dequeue():
            if len(processed_emails) < num_emails:
                email_id = f"perf_test_{len(processed_emails) + 1}"
                email_item = EmailQueueItem(
                    email_to=f"perf-test-{len(processed_emails)}@example.com",
                    subject="Performance Test Email",
                    template_name="test",
                    template_data={"test": "data"}
                )
                return email_id, email_item
            return None, None
        
        async def mock_mark_completed(email_id: str):
            processed_emails.append(email_id)
        
        mock_queue.dequeue = mock_dequeue
        mock_queue.mark_completed = mock_mark_completed
        mock_queue.mark_failed = AsyncMock()
        
        worker = EmailWorker(queue=mock_queue)
        worker.processing_interval = 0.001  # Very fast for performance test
        
        # Measure processing time
        start_time = time.time()
        
        with patch('app.worker.email_worker.send_email', new_callable=AsyncMock):
            # Process all emails
            while len(processed_emails) < num_emails:
                await worker.process_one()
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Verify performance metrics
        assert len(processed_emails) == num_emails
        assert processing_time < 10.0  # Should process 100 emails in under 10 seconds
        
        # Calculate emails per second
        emails_per_second = num_emails / processing_time
        assert emails_per_second > 10  # Should process at least 10 emails per second

    async def test_webhook_processing_performance(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test webhook processing performance with batch events."""
        # Create tracking records for batch processing
        tracking_records = []
        try:
            from app.schemas.email_tracking import EmailTrackingCreate
            
            batch_size = 50
            for i in range(batch_size):
                tracking_data = EmailTrackingCreate(
                    email_id=f"perf-webhook-{i}",
                    recipient=f"perf{i}@example.com",
                    subject=f"Performance Test Email {i}",
                    template_name="test",
                    status=EmailStatus.SENT
                )
                
                tracking = await email_tracking.create_with_event(
                    db=db,
                    obj_in=tracking_data,
                    event_type=EmailStatus.SENT
                )
                tracking_records.append(tracking)
            
            await db.commit()
            
            # Create batch webhook payload
            webhook_payload = []
            for i in range(batch_size):
                webhook_payload.append({
                    "email": f"perf{i}@example.com",
                    "timestamp": int(time.time()),
                    "smtp-id": f"perf-webhook-{i}",
                    "event": "delivered",
                    "sg_event_id": f"perf_delivery_{i}",
                    "useragent": "Test-Agent/1.0",
                    "ip": "192.168.1.1"
                })
            
            # Measure webhook processing time
            start_time = time.time()
            
            with patch("app.api.v1.endpoints.webhooks.validate_sendgrid_signature", return_value=True):
                response = await client.post(
                    "/api/v1/webhooks/sendgrid",
                    json=webhook_payload,
                    headers={"Content-Type": "application/json"}
                )
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            # Verify performance
            assert response.status_code == 200
            data = response.json()
            assert data["processed_events"] == batch_size
            assert data["successful_events"] == batch_size
            assert data["failed_events"] == 0
            
            # Performance assertions
            assert processing_time < 5.0  # Should process 50 events in under 5 seconds
            events_per_second = batch_size / processing_time
            assert events_per_second > 10  # Should process at least 10 events per second
        
        finally:
            # Cleanup
            for tracking in tracking_records:
                await db.delete(tracking)
            await db.commit()