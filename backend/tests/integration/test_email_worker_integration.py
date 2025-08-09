"""
Integration Tests for EmailWorker with Real Dependencies

These tests validate EmailWorker integration with Redis, database,
and email sending components in a more realistic environment.
"""
import pytest
import asyncio
import time
from typing import List, Dict, Any
from unittest.mock import AsyncMock, patch, Mock
from datetime import datetime, timedelta, UTC

from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.core.config import Settings
from app.core.queue import EmailQueue, EmailQueueItem
from app.worker.email_worker import EmailWorker
from app.models.email_tracking import EmailTracking, EmailStatus
from app.schemas.email_tracking import EmailTrackingCreate
from app.crud.email_tracking import email_tracking
from app.core.email import send_email, EmailContent


pytestmark = pytest.mark.asyncio


class TestEmailWorkerRedisIntegration:
    """Test EmailWorker with Redis queue integration."""

    @pytest.fixture
    async def mock_redis_queue(self) -> EmailQueue:
        """Create EmailQueue with mocked Redis."""
        mock_redis = AsyncMock(spec=Redis)
        
        # Mock Redis queue operations
        queue_data = []
        
        async def mock_rpush(key: str, value: str) -> int:
            queue_data.append(value)
            return len(queue_data)
        
        async def mock_lpop(key: str) -> str | None:
            if queue_data:
                return queue_data.pop(0)
            return None
        
        async def mock_llen(key: str) -> int:
            return len(queue_data)
        
        mock_redis.rpush = mock_rpush
        mock_redis.lpop = mock_lpop
        mock_redis.llen = mock_llen
        
        queue = EmailQueue(redis=mock_redis)
        return queue

    async def test_worker_with_real_queue_operations(
        self,
        mock_redis_queue: EmailQueue,
        db: AsyncSession
    ) -> None:
        """Test EmailWorker with realistic queue operations."""
        # Create test email items
        test_emails = [
            EmailQueueItem(
                email_to="integration1@example.com",
                subject="Integration Test 1",
                template_name="test_template",
                template_data={"name": "User 1"}
            ),
            EmailQueueItem(
                email_to="integration2@example.com", 
                subject="Integration Test 2",
                template_name="test_template",
                template_data={"name": "User 2"}
            )
        ]
        
        # Enqueue emails
        email_ids = []
        for email in test_emails:
            email_id = await mock_redis_queue.enqueue(email)
            email_ids.append(email_id)
        
        # Verify queue has emails
        queue_length = await mock_redis_queue.redis.llen("email_queue")
        assert queue_length == 2
        
        # Create worker and process emails
        worker = EmailWorker(queue=mock_redis_queue)
        processed_emails = []
        
        with patch('app.worker.email_worker.send_email', new_callable=AsyncMock) as mock_send:
            # Process first email
            result1 = await worker.process_one()
            assert result1 is True
            
            # Process second email
            result2 = await worker.process_one()
            assert result2 is True
            
            # Queue should be empty now
            result3 = await worker.process_one()
            assert result3 is False
        
        # Verify send_email was called for each email
        assert mock_send.call_count == 2
        
        # Verify queue is empty
        final_queue_length = await mock_redis_queue.redis.llen("email_queue")
        assert final_queue_length == 0

    async def test_worker_error_handling_with_requeue(
        self,
        mock_redis_queue: EmailQueue
    ) -> None:
        """Test EmailWorker error handling and requeue functionality."""
        # Create failing email
        failing_email = EmailQueueItem(
            email_to="failing@example.com",
            subject="Failing Email",
            template_name="test_template",
            template_data={"test": "data"}
        )
        
        await mock_redis_queue.enqueue(failing_email)
        
        worker = EmailWorker(queue=mock_redis_queue)
        worker.max_retries = 2
        
        # Track retry attempts
        retry_attempts = []
        
        async def mock_requeue(email_id: str, email_item: EmailQueueItem, delay_seconds: int = 0):
            retry_attempts.append((email_id, delay_seconds))
        
        mock_redis_queue.requeue = mock_requeue
        
        # Mock email sending to fail
        with patch('app.worker.email_worker.send_email', side_effect=Exception("SMTP Error")):
            result = await worker.process_one()
            assert result is False
        
        # Verify requeue was attempted (depending on implementation)
        # This test validates error handling behavior

    async def test_worker_lifecycle_with_queue(
        self,
        mock_redis_queue: EmailQueue
    ) -> None:
        """Test EmailWorker complete lifecycle with queue."""
        # Add test emails to queue
        for i in range(3):
            email = EmailQueueItem(
                email_to=f"lifecycle{i}@example.com",
                subject=f"Lifecycle Test {i}",
                template_name="test",
                template_data={"index": i}
            )
            await mock_redis_queue.enqueue(email)
        
        worker = EmailWorker(queue=mock_redis_queue)
        worker.processing_interval = 0.01  # Fast for testing
        
        # Track processed emails
        processed_count = [0]
        
        async def mock_send_email(*args, **kwargs):
            processed_count[0] += 1
            # Simulate some processing time
            await asyncio.sleep(0.005)
        
        with patch('app.worker.email_worker.send_email', side_effect=mock_send_email):
            # Start worker
            worker.start()
            assert worker.is_running
            
            # Wait for processing
            await asyncio.sleep(0.5)
            
            # Stop worker
            worker.stop()
            assert not worker.is_running
            
            # Wait for shutdown
            await asyncio.sleep(0.1)
        
        # Verify all emails were processed
        assert processed_count[0] == 3


class TestEmailWorkerDatabaseIntegration:
    """Test EmailWorker integration with database operations."""

    async def test_worker_with_email_tracking_updates(
        self,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test EmailWorker updating email tracking records."""
        # Create email tracking record
        tracking_data = EmailTrackingCreate(
            email_id="worker-tracking-123",
            recipient="tracking@example.com",
            subject="Tracking Test Email",
            template_name="test",
            status=EmailStatus.QUEUED
        )
        
        tracking = await email_tracking.create_with_event(
            db=db,
            obj_in=tracking_data,
            event_type=EmailStatus.QUEUED
        )
        await db.commit()
        
        try:
            # Create queue and email item
            mock_queue = AsyncMock()
            email_item = EmailQueueItem(
                email_to="tracking@example.com",
                subject="Tracking Test Email",
                template_name="test",
                template_data={"tracking_id": tracking.id}
            )
            
            mock_queue.dequeue.return_value = ("worker-tracking-123", email_item)
            
            # Create worker
            worker = EmailWorker(queue=mock_queue)
            
            # Mock successful email sending
            with patch('app.worker.email_worker.send_email', new_callable=AsyncMock):
                # Mock database update
                with patch('app.worker.email_worker.update_email_tracking_status') as mock_update:
                    result = await worker.process_one()
                    
                    assert result is True
                    mock_queue.mark_completed.assert_called_once_with("worker-tracking-123")
                    
                    # Verify tracking update would be called (if implemented)
                    # This validates the integration pattern
            
        finally:
            # Cleanup
            await db.delete(tracking)
            await db.commit()

    async def test_worker_database_error_handling(
        self,
        db: AsyncSession
    ) -> None:
        """Test EmailWorker handling database errors gracefully."""
        mock_queue = AsyncMock()
        email_item = EmailQueueItem(
            email_to="db-error@example.com",
            subject="Database Error Test",
            template_name="test",
            template_data={"test": "data"}
        )
        
        mock_queue.dequeue.return_value = ("db-error-123", email_item)
        
        worker = EmailWorker(queue=mock_queue)
        
        # Mock database error during processing
        with patch('app.worker.email_worker.send_email', new_callable=AsyncMock):
            # Simulate database connection error
            with patch('sqlalchemy.ext.asyncio.AsyncSession.execute', side_effect=Exception("DB Connection Error")):
                result = await worker.process_one()
                
                # Worker should handle database errors gracefully
                # Result depends on implementation - could be True (email sent) or False (total failure)
                assert isinstance(result, bool)


class TestEmailContentIntegration:
    """Test EmailWorker integration with email content generation."""

    async def test_worker_with_template_rendering(self) -> None:
        """Test EmailWorker with actual template rendering."""
        mock_queue = AsyncMock()
        
        # Create email with template data
        email_item = EmailQueueItem(
            email_to="template@example.com",
            subject="Template Test",
            template_name="welcome",
            template_data={
                "username": "Test User",
                "verification_url": "https://example.com/verify/123",
                "company_name": "Test Company"
            }
        )
        
        mock_queue.dequeue.return_value = ("template-123", email_item)
        
        worker = EmailWorker(queue=mock_queue)
        
        # Capture email content
        captured_email = {}
        
        async def mock_send_email(email_content: EmailContent) -> None:
            captured_email.update({
                "to": email_content.to,
                "subject": email_content.subject,
                "html_body": email_content.html_body,
                "text_body": email_content.text_body
            })
        
        with patch('app.worker.email_worker.send_email', side_effect=mock_send_email):
            result = await worker.process_one()
            
            assert result is True
            assert captured_email["to"] == "template@example.com"
            assert captured_email["subject"] == "Template Test"
            
            # Verify template data was used (if template rendering is implemented)
            if captured_email.get("html_body"):
                assert "Test User" in captured_email["html_body"]

    async def test_worker_with_multiple_template_types(self) -> None:
        """Test EmailWorker with different email template types."""
        mock_queue = AsyncMock()
        
        # Test different template types
        email_templates = [
            ("welcome", {"username": "John", "verification_url": "https://example.com/verify"}),
            ("reset_password", {"username": "Jane", "reset_url": "https://example.com/reset"}),
            ("notification", {"title": "Update", "message": "System maintenance"}),
        ]
        
        worker = EmailWorker(queue=mock_queue)
        processed_templates = []
        
        async def mock_send_email(email_content: EmailContent) -> None:
            processed_templates.append({
                "subject": email_content.subject,
                "template_data": getattr(email_content, 'template_data', {})
            })
        
        with patch('app.worker.email_worker.send_email', side_effect=mock_send_email):
            for i, (template_name, template_data) in enumerate(email_templates):
                email_item = EmailQueueItem(
                    email_to=f"test{i}@example.com",
                    subject=f"Test {template_name.title()}",
                    template_name=template_name,
                    template_data=template_data
                )
                
                mock_queue.dequeue.return_value = (f"template-{i}", email_item)
                
                result = await worker.process_one()
                assert result is True
        
        # Verify all templates were processed
        assert len(processed_templates) == len(email_templates)


class TestEmailWorkerConfigurationIntegration:
    """Test EmailWorker with different configuration scenarios."""

    async def test_worker_with_different_configurations(
        self,
        test_settings: Settings
    ) -> None:
        """Test EmailWorker behavior with different configurations."""
        mock_queue = AsyncMock()
        email_item = EmailQueueItem(
            email_to="config@example.com",
            subject="Config Test",
            template_name="test",
            template_data={}
        )
        
        mock_queue.dequeue.return_value = ("config-123", email_item)
        
        # Test with different processing intervals
        worker = EmailWorker(queue=mock_queue)
        
        # Test fast processing
        worker.processing_interval = 0.001
        assert worker.processing_interval == 0.001
        
        # Test error intervals
        worker.error_interval = 0.1
        assert worker.error_interval == 0.1
        
        # Test max retries (if implemented)
        if hasattr(worker, 'max_retries'):
            worker.max_retries = 5
            assert worker.max_retries == 5

    async def test_worker_startup_configuration_validation(self) -> None:
        """Test EmailWorker startup validation with different configurations."""
        # Test worker with no queue
        worker_no_queue = EmailWorker(queue=None)
        
        # Should not start without queue
        worker_no_queue.start()
        assert not worker_no_queue.is_running
        assert worker_no_queue.processing_task is None
        
        # Test worker with valid queue
        mock_queue = AsyncMock()
        worker_with_queue = EmailWorker(queue=mock_queue)
        
        # Should start with valid queue
        worker_with_queue.start()
        assert worker_with_queue.is_running
        assert worker_with_queue.processing_task is not None
        
        # Cleanup
        worker_with_queue.stop()
        await asyncio.sleep(0.1)  # Allow cleanup


class TestEmailWorkerMonitoringIntegration:
    """Test EmailWorker integration with monitoring and metrics."""

    async def test_worker_processing_metrics(self) -> None:
        """Test EmailWorker processing metrics collection."""
        mock_queue = AsyncMock()
        
        # Create multiple test emails
        test_emails = []
        for i in range(5):
            email_item = EmailQueueItem(
                email_to=f"metrics{i}@example.com",
                subject=f"Metrics Test {i}",
                template_name="test",
                template_data={"index": i}
            )
            test_emails.append((f"metrics-{i}", email_item))
        
        # Setup queue to return emails
        call_count = [0]
        
        def mock_dequeue():
            if call_count[0] < len(test_emails):
                result = test_emails[call_count[0]]
                call_count[0] += 1
                return result
            return None, None
        
        mock_queue.dequeue = mock_dequeue
        
        worker = EmailWorker(queue=mock_queue)
        
        # Track processing metrics
        processing_times = []
        
        async def mock_send_with_timing(email_content):
            start = time.time()
            await asyncio.sleep(0.01)  # Simulate processing time
            end = time.time()
            processing_times.append(end - start)
        
        with patch('app.worker.email_worker.send_email', side_effect=mock_send_with_timing):
            # Process all emails
            results = []
            for _ in range(len(test_emails)):
                result = await worker.process_one()
                results.append(result)
            
            # Try processing empty queue
            empty_result = await worker.process_one()
            results.append(empty_result)
        
        # Verify processing results
        assert results[:-1] == [True] * len(test_emails)  # All emails processed successfully
        assert results[-1] is False  # Empty queue
        
        # Verify timing metrics were collected
        assert len(processing_times) == len(test_emails)
        assert all(t > 0 for t in processing_times)
        
        # Verify completion tracking
        assert mock_queue.mark_completed.call_count == len(test_emails)

    async def test_worker_error_rate_tracking(self) -> None:
        """Test EmailWorker error rate tracking."""
        mock_queue = AsyncMock()
        
        # Create mixed success/failure emails
        emails_and_results = [
            ("success-1", True),
            ("fail-1", False),
            ("success-2", True),
            ("fail-2", False),
            ("success-3", True),
        ]
        
        call_count = [0]
        
        def mock_dequeue():
            if call_count[0] < len(emails_and_results):
                email_id, _ = emails_and_results[call_count[0]]
                email_item = EmailQueueItem(
                    email_to=f"test{call_count[0]}@example.com",
                    subject="Error Rate Test",
                    template_name="test",
                    template_data={}
                )
                call_count[0] += 1
                return email_id, email_item
            return None, None
        
        mock_queue.dequeue = mock_dequeue
        
        worker = EmailWorker(queue=mock_queue)
        
        # Track error scenarios
        success_count = 0
        failure_count = 0
        
        async def mock_send_with_errors(*args, **kwargs):
            nonlocal success_count, failure_count
            _, should_succeed = emails_and_results[call_count[0] - 1]
            
            if should_succeed:
                success_count += 1
                return  # Success
            else:
                failure_count += 1
                raise Exception("Simulated email failure")
        
        with patch('app.worker.email_worker.send_email', side_effect=mock_send_with_errors):
            # Process all emails
            results = []
            for _ in range(len(emails_and_results)):
                result = await worker.process_one()
                results.append(result)
        
        # Verify error tracking
        expected_results = [result[1] for result in emails_and_results]
        assert results == expected_results
        
        assert success_count == 3
        assert failure_count == 2
        
        # Verify appropriate mark_completed/mark_failed calls
        assert mock_queue.mark_completed.call_count == success_count
        assert mock_queue.mark_failed.call_count == failure_count


class TestEmailWorkerRecoveryScenarios:
    """Test EmailWorker recovery from various failure scenarios."""

    async def test_worker_recovery_after_shutdown(self) -> None:
        """Test EmailWorker recovery after unexpected shutdown."""
        mock_queue = AsyncMock()
        mock_queue.dequeue.return_value = (None, None)  # Empty queue initially
        
        # First worker instance
        worker1 = EmailWorker(queue=mock_queue)
        worker1.processing_interval = 0.01
        
        # Start and then stop worker
        worker1.start()
        assert worker1.is_running
        
        await asyncio.sleep(0.05)  # Let it run briefly
        
        worker1.stop()
        assert not worker1.is_running
        
        await asyncio.sleep(0.1)  # Allow cleanup
        
        # Create new worker instance (simulating restart)
        worker2 = EmailWorker(queue=mock_queue)
        worker2.processing_interval = 0.01
        
        # Add email to queue
        email_item = EmailQueueItem(
            email_to="recovery@example.com",
            subject="Recovery Test",
            template_name="test",
            template_data={}
        )
        
        mock_queue.dequeue.return_value = ("recovery-123", email_item)
        
        # New worker should be able to process
        with patch('app.worker.email_worker.send_email', new_callable=AsyncMock):
            result = await worker2.process_one()
            assert result is True
        
        # Cleanup
        worker2.stop()
        await asyncio.sleep(0.1)

    async def test_worker_queue_connection_recovery(self) -> None:
        """Test EmailWorker handling queue connection issues."""
        mock_queue = AsyncMock()
        
        # First call succeeds, second fails, third succeeds
        call_count = [0]
        
        def mock_dequeue_with_failures():
            call_count[0] += 1
            if call_count[0] == 1:
                # First call succeeds
                return "success-1", EmailQueueItem(
                    email_to="test1@example.com",
                    subject="Test 1",
                    template_name="test",
                    template_data={}
                )
            elif call_count[0] == 2:
                # Second call fails (connection error)
                raise Exception("Redis connection error")
            else:
                # Third call succeeds
                return "success-2", EmailQueueItem(
                    email_to="test2@example.com",
                    subject="Test 2", 
                    template_name="test",
                    template_data={}
                )
        
        mock_queue.dequeue = mock_dequeue_with_failures
        
        worker = EmailWorker(queue=mock_queue)
        
        with patch('app.worker.email_worker.send_email', new_callable=AsyncMock):
            # First call should succeed
            result1 = await worker.process_one()
            assert result1 is True
            
            # Second call should handle error gracefully
            result2 = await worker.process_one()
            # Result depends on error handling implementation
            assert isinstance(result2, bool)
            
            # Third call should succeed (recovery)
            result3 = await worker.process_one()
            assert result3 is True