"""
Performance and Load Tests for Email System

These tests validate email system performance under various load conditions
and stress scenarios to ensure production readiness.
"""
import pytest
import asyncio
import time
import statistics
from typing import List, Dict, Any, Optional, Tuple
from unittest.mock import AsyncMock, patch, Mock
from datetime import datetime, timedelta, UTC
import psutil
import gc

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.queue import EmailQueue, EmailQueueItem
from app.worker.email_worker import EmailWorker
from app.models.email_tracking import EmailTracking, EmailStatus
from app.crud.email_tracking import email_tracking
from app.crud.user import user as user_crud


pytestmark = pytest.mark.asyncio


class PerformanceMetrics:
    """Helper class to collect and analyze performance metrics."""
    
    def __init__(self):
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None
        self.operation_times: List[float] = []
        self.memory_usage: List[float] = []
        self.error_count: int = 0
        self.success_count: int = 0
    
    def start_timing(self):
        """Start timing operations."""
        self.start_time = time.time()
        gc.collect()  # Clean up before measurement
    
    def end_timing(self):
        """End timing operations."""
        self.end_time = time.time()
        gc.collect()  # Clean up after measurement
    
    def record_operation(self, duration: float, success: bool = True):
        """Record individual operation metrics."""
        self.operation_times.append(duration)
        if success:
            self.success_count += 1
        else:
            self.error_count += 1
    
    def record_memory_usage(self):
        """Record current memory usage."""
        process = psutil.Process()
        memory_mb = process.memory_info().rss / 1024 / 1024
        self.memory_usage.append(memory_mb)
    
    @property
    def total_duration(self) -> float:
        """Total duration of test."""
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        return 0.0
    
    @property
    def operations_per_second(self) -> float:
        """Calculate operations per second."""
        if self.total_duration > 0:
            return len(self.operation_times) / self.total_duration
        return 0.0
    
    @property
    def average_operation_time(self) -> float:
        """Average time per operation."""
        if self.operation_times:
            return statistics.mean(self.operation_times)
        return 0.0
    
    @property
    def percentile_95(self) -> float:
        """95th percentile operation time."""
        if self.operation_times:
            return statistics.quantiles(self.operation_times, n=20)[18]  # 95th percentile
        return 0.0
    
    @property
    def max_memory_mb(self) -> float:
        """Maximum memory usage during test."""
        if self.memory_usage:
            return max(self.memory_usage)
        return 0.0
    
    @property
    def success_rate(self) -> float:
        """Success rate as percentage."""
        total = self.success_count + self.error_count
        if total > 0:
            return (self.success_count / total) * 100
        return 0.0


class TestEmailQueuePerformance:
    """Test email queue performance under various loads."""

    async def test_high_volume_email_queuing(self, db: AsyncSession) -> None:
        """Test queuing large number of emails efficiently."""
        metrics = PerformanceMetrics()
        mock_queue = AsyncMock(spec=EmailQueue)
        
        # Track queued emails
        queued_emails = []
        
        async def mock_enqueue(email_item: EmailQueueItem) -> str:
            start = time.time()
            email_id = f"perf_email_{len(queued_emails) + 1}"
            queued_emails.append(email_id)
            # Simulate Redis latency
            await asyncio.sleep(0.001)
            end = time.time()
            metrics.record_operation(end - start, True)
            return email_id
        
        mock_queue.enqueue = mock_enqueue
        
        # Test parameters
        num_emails = 1000
        batch_size = 50
        
        metrics.start_timing()
        
        # Queue emails in batches
        for batch_start in range(0, num_emails, batch_size):
            batch_end = min(batch_start + batch_size, num_emails)
            batch_tasks = []
            
            for i in range(batch_start, batch_end):
                email_item = EmailQueueItem(
                    email_to=f"perf-test-{i}@example.com",
                    subject=f"Performance Test Email {i}",
                    template_name="test",
                    template_data={"index": i, "batch": batch_start // batch_size}
                )
                
                batch_tasks.append(mock_queue.enqueue(email_item))
            
            # Process batch concurrently
            await asyncio.gather(*batch_tasks)
            
            # Record memory usage periodically
            if batch_start % (batch_size * 5) == 0:
                metrics.record_memory_usage()
        
        metrics.end_timing()
        
        # Performance assertions
        assert len(queued_emails) == num_emails
        assert metrics.operations_per_second > 100  # At least 100 emails/sec
        assert metrics.average_operation_time < 0.1  # Under 100ms per email
        assert metrics.success_rate == 100.0  # 100% success rate
        assert metrics.max_memory_mb < 500  # Under 500MB memory usage
        
        print(f"\nEmail Queuing Performance:")
        print(f"  Total emails: {num_emails}")
        print(f"  Total time: {metrics.total_duration:.2f}s")
        print(f"  Emails/sec: {metrics.operations_per_second:.1f}")
        print(f"  Avg time/email: {metrics.average_operation_time*1000:.1f}ms")
        print(f"  95th percentile: {metrics.percentile_95*1000:.1f}ms")
        print(f"  Max memory: {metrics.max_memory_mb:.1f}MB")

    async def test_concurrent_queue_access(self) -> None:
        """Test concurrent access to email queue."""
        metrics = PerformanceMetrics()
        mock_queue = AsyncMock(spec=EmailQueue)
        
        # Shared state
        queue_operations = []
        operation_lock = asyncio.Lock()
        
        async def thread_safe_enqueue(email_item: EmailQueueItem) -> str:
            start = time.time()
            
            async with operation_lock:
                email_id = f"concurrent_{len(queue_operations) + 1}"
                queue_operations.append(("enqueue", email_id, time.time()))
            
            # Simulate processing delay
            await asyncio.sleep(0.002)
            
            end = time.time()
            metrics.record_operation(end - start, True)
            return email_id
        
        async def thread_safe_dequeue():
            start = time.time()
            
            async with operation_lock:
                if queue_operations:
                    op_type, email_id, timestamp = queue_operations.pop(0)
                    queue_operations.append(("dequeue", email_id, time.time()))
                    result = (email_id, EmailQueueItem(
                        email_to="test@example.com",
                        subject="Test",
                        template_name="test",
                        template_data={}
                    ))
                else:
                    result = (None, None)
            
            await asyncio.sleep(0.001)
            
            end = time.time()
            metrics.record_operation(end - start, result[0] is not None)
            return result
        
        mock_queue.enqueue = thread_safe_enqueue
        mock_queue.dequeue = thread_safe_dequeue
        
        # Create concurrent workers
        num_producers = 10
        num_consumers = 5
        emails_per_producer = 20
        
        metrics.start_timing()
        
        async def producer_task(producer_id: int):
            for i in range(emails_per_producer):
                email_item = EmailQueueItem(
                    email_to=f"producer-{producer_id}-{i}@example.com",
                    subject=f"Concurrent Test {producer_id}-{i}",
                    template_name="test",
                    template_data={"producer": producer_id, "index": i}
                )
                await mock_queue.enqueue(email_item)
        
        async def consumer_task(consumer_id: int):
            processed = 0
            while processed < (num_producers * emails_per_producer) // num_consumers + 5:
                email_id, email_item = await mock_queue.dequeue()
                if email_id:
                    processed += 1
                else:
                    await asyncio.sleep(0.01)  # Wait for more items
        
        # Start all tasks concurrently
        producer_tasks = [producer_task(i) for i in range(num_producers)]
        consumer_tasks = [consumer_task(i) for i in range(num_consumers)]
        
        await asyncio.gather(*producer_tasks, *consumer_tasks)
        
        metrics.end_timing()
        
        # Performance assertions
        total_operations = num_producers * emails_per_producer * 2  # enqueue + dequeue
        assert metrics.operations_per_second > 200  # At least 200 ops/sec
        assert metrics.success_rate > 95.0  # At least 95% success
        
        print(f"\nConcurrent Queue Access Performance:")
        print(f"  Producers: {num_producers}, Consumers: {num_consumers}")
        print(f"  Total operations: {len(metrics.operation_times)}")
        print(f"  Operations/sec: {metrics.operations_per_second:.1f}")
        print(f"  Success rate: {metrics.success_rate:.1f}%")


class TestEmailWorkerPerformance:
    """Test EmailWorker performance under load."""

    async def test_high_throughput_email_processing(self) -> None:
        """Test EmailWorker processing high volumes efficiently."""
        metrics = PerformanceMetrics()
        mock_queue = AsyncMock(spec=EmailQueue)
        
        # Create test emails
        test_emails = []
        num_emails = 500
        
        for i in range(num_emails):
            email_item = EmailQueueItem(
                email_to=f"throughput-{i}@example.com",
                subject=f"Throughput Test {i}",
                template_name="test",
                template_data={"index": i}
            )
            test_emails.append((f"throughput_{i}", email_item))
        
        # Setup queue behavior
        email_index = [0]
        
        async def mock_dequeue():
            if email_index[0] < len(test_emails):
                result = test_emails[email_index[0]]
                email_index[0] += 1
                return result
            return None, None
        
        async def mock_mark_completed(email_id: str):
            pass  # No-op for performance test
        
        mock_queue.dequeue = mock_dequeue
        mock_queue.mark_completed = mock_mark_completed
        mock_queue.mark_failed = AsyncMock()
        
        # Create worker
        worker = EmailWorker(queue=mock_queue)
        worker.processing_interval = 0.001  # Very fast for performance test
        
        metrics.start_timing()
        
        # Mock fast email sending
        async def mock_send_email(*args, **kwargs):
            start = time.time()
            await asyncio.sleep(0.005)  # Simulate 5ms email send
            end = time.time()
            metrics.record_operation(end - start, True)
        
        with patch('app.worker.email_worker.send_email', side_effect=mock_send_email):
            # Process all emails
            while email_index[0] < num_emails:
                await worker.process_one()
                
                # Record memory usage periodically
                if email_index[0] % 100 == 0:
                    metrics.record_memory_usage()
        
        metrics.end_timing()
        
        # Performance assertions
        assert metrics.success_count == num_emails
        assert metrics.operations_per_second > 50  # At least 50 emails/sec
        assert metrics.average_operation_time < 0.2  # Under 200ms per email
        assert metrics.max_memory_mb < 300  # Under 300MB memory
        
        print(f"\nEmailWorker Throughput Performance:")
        print(f"  Emails processed: {num_emails}")
        print(f"  Processing time: {metrics.total_duration:.2f}s")
        print(f"  Emails/sec: {metrics.operations_per_second:.1f}")
        print(f"  Avg processing time: {metrics.average_operation_time*1000:.1f}ms")
        print(f"  Max memory usage: {metrics.max_memory_mb:.1f}MB")

    async def test_worker_under_error_conditions(self) -> None:
        """Test EmailWorker performance when handling errors."""
        metrics = PerformanceMetrics()
        mock_queue = AsyncMock(spec=EmailQueue)
        
        # Create mixed success/failure scenarios
        test_scenarios = []
        num_emails = 200
        failure_rate = 0.2  # 20% failure rate
        
        for i in range(num_emails):
            should_fail = (i % int(1/failure_rate)) == 0
            email_item = EmailQueueItem(
                email_to=f"error-test-{i}@example.com",
                subject=f"Error Test {i}",
                template_name="test",
                template_data={"index": i, "should_fail": should_fail}
            )
            test_scenarios.append((f"error_{i}", email_item, should_fail))
        
        # Setup queue
        scenario_index = [0]
        
        async def mock_dequeue():
            if scenario_index[0] < len(test_scenarios):
                email_id, email_item, _ = test_scenarios[scenario_index[0]]
                scenario_index[0] += 1
                return email_id, email_item
            return None, None
        
        mock_queue.dequeue = mock_dequeue
        mock_queue.mark_completed = AsyncMock()
        mock_queue.mark_failed = AsyncMock()
        
        worker = EmailWorker(queue=mock_queue)
        
        metrics.start_timing()
        
        # Mock email sending with controlled failures
        async def mock_send_with_errors(*args, **kwargs):
            start = time.time()
            
            current_scenario = test_scenarios[scenario_index[0] - 1]
            should_fail = current_scenario[2]
            
            if should_fail:
                await asyncio.sleep(0.01)  # Simulate error delay
                end = time.time()
                metrics.record_operation(end - start, False)
                raise Exception("Simulated email failure")
            else:
                await asyncio.sleep(0.005)  # Normal processing
                end = time.time()
                metrics.record_operation(end - start, True)
        
        with patch('app.worker.email_worker.send_email', side_effect=mock_send_with_errors):
            # Process all emails
            while scenario_index[0] < num_emails:
                await worker.process_one()
        
        metrics.end_timing()
        
        # Performance assertions
        expected_failures = int(num_emails * failure_rate)
        expected_successes = num_emails - expected_failures
        
        assert abs(metrics.error_count - expected_failures) <= 2  # Allow small variance
        assert abs(metrics.success_count - expected_successes) <= 2
        assert metrics.operations_per_second > 30  # At least 30 ops/sec even with errors
        
        print(f"\nEmailWorker Error Handling Performance:")
        print(f"  Total emails: {num_emails}")
        print(f"  Success rate: {metrics.success_rate:.1f}%")
        print(f"  Operations/sec: {metrics.operations_per_second:.1f}")
        print(f"  Avg operation time: {metrics.average_operation_time*1000:.1f}ms")

    async def test_worker_memory_efficiency(self) -> None:
        """Test EmailWorker memory efficiency during long runs."""
        metrics = PerformanceMetrics()
        mock_queue = AsyncMock(spec=EmailQueue)
        
        # Simulate long-running worker
        num_cycles = 100
        emails_per_cycle = 20
        
        cycle_index = [0]
        email_index = [0]
        
        async def mock_dequeue():
            if cycle_index[0] < num_cycles:
                if email_index[0] < emails_per_cycle:
                    email_item = EmailQueueItem(
                        email_to=f"memory-{cycle_index[0]}-{email_index[0]}@example.com",
                        subject=f"Memory Test {cycle_index[0]}-{email_index[0]}",
                        template_name="test",
                        template_data={"cycle": cycle_index[0], "email": email_index[0]}
                    )
                    email_id = f"memory_{cycle_index[0]}_{email_index[0]}"
                    email_index[0] += 1
                    return email_id, email_item
                else:
                    # End of cycle
                    cycle_index[0] += 1
                    email_index[0] = 0
                    return None, None
            return None, None
        
        mock_queue.dequeue = mock_dequeue
        mock_queue.mark_completed = AsyncMock()
        
        worker = EmailWorker(queue=mock_queue)
        
        metrics.start_timing()
        
        async def mock_send_email(*args, **kwargs):
            start = time.time()
            await asyncio.sleep(0.002)
            end = time.time()
            metrics.record_operation(end - start, True)
        
        with patch('app.worker.email_worker.send_email', side_effect=mock_send_email):
            processed_emails = 0
            
            while cycle_index[0] < num_cycles:
                result = await worker.process_one()
                if result:
                    processed_emails += 1
                
                # Record memory usage every 10 emails
                if processed_emails % 10 == 0:
                    metrics.record_memory_usage()
                    gc.collect()  # Force garbage collection
        
        metrics.end_timing()
        
        # Memory efficiency assertions
        total_emails = num_cycles * emails_per_cycle
        assert metrics.success_count == total_emails
        
        if len(metrics.memory_usage) > 1:
            # Memory should remain relatively stable (not grow significantly)
            memory_growth = metrics.memory_usage[-1] - metrics.memory_usage[0]
            assert memory_growth < 50  # Less than 50MB growth
            
            # Memory variance should be low (stable usage)
            memory_variance = statistics.variance(metrics.memory_usage)
            assert memory_variance < 100  # Low variance
        
        print(f"\nEmailWorker Memory Efficiency:")
        print(f"  Emails processed: {total_emails}")
        print(f"  Processing time: {metrics.total_duration:.2f}s")
        print(f"  Memory samples: {len(metrics.memory_usage)}")
        if metrics.memory_usage:
            print(f"  Initial memory: {metrics.memory_usage[0]:.1f}MB")
            print(f"  Final memory: {metrics.memory_usage[-1]:.1f}MB")
            print(f"  Max memory: {metrics.max_memory_mb:.1f}MB")


class TestWebhookPerformance:
    """Test webhook endpoint performance under load."""

    async def test_high_volume_webhook_processing(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test webhook processing with high event volumes."""
        metrics = PerformanceMetrics()
        
        # Create tracking records for webhook events
        num_tracking_records = 100
        tracking_records = []
        
        try:
            from app.schemas.email_tracking import EmailTrackingCreate
            
            for i in range(num_tracking_records):
                tracking_data = EmailTrackingCreate(
                    email_id=f"webhook-perf-{i}",
                    recipient=f"perf-{i}@example.com",
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
            
            # Create large webhook payload
            events_per_batch = 50
            webhook_batches = []
            
            for batch_start in range(0, num_tracking_records, events_per_batch):
                batch_events = []
                for i in range(batch_start, min(batch_start + events_per_batch, num_tracking_records)):
                    event = {
                        "email": f"perf-{i}@example.com",
                        "timestamp": int(time.time()),
                        "smtp-id": f"webhook-perf-{i}",
                        "event": "delivered",
                        "sg_event_id": f"perf_delivery_{i}",
                        "useragent": "Performance-Test/1.0",
                        "ip": "192.168.1.100"
                    }
                    batch_events.append(event)
                webhook_batches.append(batch_events)
            
            metrics.start_timing()
            
            # Process webhook batches
            with patch("app.api.v1.endpoints.webhooks.validate_sendgrid_signature", return_value=True):
                for batch in webhook_batches:
                    batch_start = time.time()
                    
                    response = await client.post(
                        "/api/v1/webhooks/sendgrid",
                        json=batch,
                        headers={"Content-Type": "application/json"}
                    )
                    
                    batch_end = time.time()
                    
                    success = response.status_code == 200
                    metrics.record_operation(batch_end - batch_start, success)
                    
                    if success:
                        data = response.json()
                        assert data["processed_events"] == len(batch)
                        assert data["failed_events"] == 0
                    
                    # Record memory usage
                    metrics.record_memory_usage()
            
            metrics.end_timing()
            
            # Performance assertions
            assert metrics.success_rate == 100.0
            assert metrics.operations_per_second > 10  # At least 10 batches/sec
            assert metrics.average_operation_time < 1.0  # Under 1 second per batch
            
            print(f"\nWebhook Processing Performance:")
            print(f"  Total events: {num_tracking_records}")
            print(f"  Batches processed: {len(webhook_batches)}")
            print(f"  Events/batch: {events_per_batch}")
            print(f"  Total time: {metrics.total_duration:.2f}s")
            print(f"  Batches/sec: {metrics.operations_per_second:.1f}")
            print(f"  Events/sec: {metrics.operations_per_second * events_per_batch:.1f}")
            print(f"  Avg batch time: {metrics.average_operation_time*1000:.1f}ms")
            
        finally:
            # Cleanup
            for tracking in tracking_records:
                await db.delete(tracking)
            await db.commit()

    async def test_concurrent_webhook_requests(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test concurrent webhook request handling."""
        metrics = PerformanceMetrics()
        
        # Create tracking records
        num_concurrent = 20
        tracking_records = []
        
        try:
            from app.schemas.email_tracking import EmailTrackingCreate
            
            for i in range(num_concurrent):
                tracking_data = EmailTrackingCreate(
                    email_id=f"concurrent-webhook-{i}",
                    recipient=f"concurrent-{i}@example.com",
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
            
            # Create concurrent webhook tasks
            async def webhook_task(task_id: int):
                task_start = time.time()
                
                webhook_payload = [
                    {
                        "email": f"concurrent-{task_id}@example.com",
                        "timestamp": int(time.time()),
                        "smtp-id": f"concurrent-webhook-{task_id}",
                        "event": "delivered",
                        "sg_event_id": f"concurrent_delivery_{task_id}",
                        "useragent": "Concurrent-Test/1.0",
                        "ip": "192.168.1.1"
                    }
                ]
                
                with patch("app.api.v1.endpoints.webhooks.validate_sendgrid_signature", return_value=True):
                    response = await client.post(
                        "/api/v1/webhooks/sendgrid",
                        json=webhook_payload,
                        headers={"Content-Type": "application/json"}
                    )
                
                task_end = time.time()
                success = response.status_code == 200
                metrics.record_operation(task_end - task_start, success)
                
                return response.status_code
            
            metrics.start_timing()
            
            # Execute all webhook requests concurrently
            tasks = [webhook_task(i) for i in range(num_concurrent)]
            results = await asyncio.gather(*tasks)
            
            metrics.end_timing()
            
            # Verify all requests succeeded
            assert all(status == 200 for status in results)
            assert metrics.success_rate == 100.0
            assert metrics.operations_per_second > 20  # At least 20 concurrent requests/sec
            
            print(f"\nConcurrent Webhook Performance:")
            print(f"  Concurrent requests: {num_concurrent}")
            print(f"  Total time: {metrics.total_duration:.2f}s")
            print(f"  Requests/sec: {metrics.operations_per_second:.1f}")
            print(f"  Avg response time: {metrics.average_operation_time*1000:.1f}ms")
            print(f"  95th percentile: {metrics.percentile_95*1000:.1f}ms")
            
        finally:
            # Cleanup
            for tracking in tracking_records:
                await db.delete(tracking)
            await db.commit()


class TestEndToEndPerformance:
    """Test complete system performance under realistic loads."""

    async def test_registration_email_system_under_load(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test complete registration + email system under load."""
        metrics = PerformanceMetrics()
        
        # Mock email system for performance testing
        mock_queue = AsyncMock()
        processed_emails = []
        
        async def fast_enqueue(email_item: EmailQueueItem) -> str:
            email_id = f"load_test_{len(processed_emails)}"
            processed_emails.append(email_id)
            await asyncio.sleep(0.001)  # Minimal delay
            return email_id
        
        mock_queue.enqueue = fast_enqueue
        
        # Test parameters
        num_users = 100
        concurrent_batches = 10
        users_per_batch = num_users // concurrent_batches
        created_users = []
        
        try:
            metrics.start_timing()
            
            async def registration_batch(batch_id: int):
                batch_users = []
                batch_start = time.time()
                
                with patch('app.api.v1.endpoints.auth.get_email_queue', return_value=mock_queue):
                    batch_tasks = []
                    
                    for i in range(users_per_batch):
                        user_id = batch_id * users_per_batch + i
                        registration_data = {
                            "email": f"load-test-{user_id}@example.com",
                            "password": "testpassword123",
                            "password_confirm": "testpassword123",
                            "full_name": f"Load Test User {user_id}"
                        }
                        
                        task = client.post(
                            f"{test_settings.api_v1_str}/auth/register",
                            json=registration_data
                        )
                        batch_tasks.append(task)
                    
                    responses = await asyncio.gather(*batch_tasks)
                    
                    # Verify responses and collect users
                    for i, response in enumerate(responses):
                        user_id = batch_id * users_per_batch + i
                        success = response.status_code == 200
                        
                        if success:
                            user = await user_crud.get_by_email(
                                db, 
                                email=f"load-test-{user_id}@example.com"
                            )
                            if user:
                                batch_users.append(user)
                
                batch_end = time.time()
                metrics.record_operation(batch_end - batch_start, len(batch_users) == users_per_batch)
                return batch_users
            
            # Execute batches concurrently
            batch_tasks = [registration_batch(i) for i in range(concurrent_batches)]
            batch_results = await asyncio.gather(*batch_tasks)
            
            # Collect all created users
            for batch_users in batch_results:
                created_users.extend(batch_users)
            
            metrics.end_timing()
            
            # Performance assertions
            assert len(created_users) == num_users
            assert len(processed_emails) == num_users
            assert metrics.operations_per_second > 5  # At least 5 batches/sec
            assert metrics.success_rate == 100.0
            
            # Calculate user registrations per second
            users_per_second = num_users / metrics.total_duration
            assert users_per_second > 20  # At least 20 users/sec
            
            print(f"\nEnd-to-End Registration Performance:")
            print(f"  Total users: {num_users}")
            print(f"  Concurrent batches: {concurrent_batches}")
            print(f"  Total time: {metrics.total_duration:.2f}s")
            print(f"  Users/sec: {users_per_second:.1f}")
            print(f"  Batches/sec: {metrics.operations_per_second:.1f}")
            print(f"  Avg batch time: {metrics.average_operation_time:.2f}s")
            
        finally:
            # Cleanup all created users
            for user in created_users:
                await db.delete(user)
            await db.commit()

    async def test_system_resource_usage_monitoring(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ) -> None:
        """Test system resource usage during sustained load."""
        metrics = PerformanceMetrics()
        
        # Mock efficient email system
        mock_queue = AsyncMock()
        mock_queue.enqueue = AsyncMock(return_value="test_id")
        
        # Test parameters
        duration_seconds = 10
        operations_per_second = 20
        
        metrics.start_timing()
        
        async def sustained_load():
            operation_count = 0
            end_time = time.time() + duration_seconds
            
            with patch('app.api.v1.endpoints.auth.get_email_queue', return_value=mock_queue):
                while time.time() < end_time:
                    cycle_start = time.time()
                    
                    # Perform registration
                    registration_data = {
                        "email": f"resource-test-{operation_count}@example.com",
                        "password": "testpassword123",
                        "password_confirm": "testpassword123",
                        "full_name": f"Resource Test User {operation_count}"
                    }
                    
                    response = await client.post(
                        f"{test_settings.api_v1_str}/auth/register",
                        json=registration_data
                    )
                    
                    cycle_end = time.time()
                    success = response.status_code == 200
                    metrics.record_operation(cycle_end - cycle_start, success)
                    
                    # Record resource usage
                    metrics.record_memory_usage()
                    
                    # Clean up user immediately to avoid memory buildup
                    if success:
                        user = await user_crud.get_by_email(
                            db, 
                            email=registration_data["email"]
                        )
                        if user:
                            await db.delete(user)
                            await db.commit()
                    
                    operation_count += 1
                    
                    # Maintain target rate
                    target_interval = 1.0 / operations_per_second
                    actual_duration = cycle_end - cycle_start
                    if actual_duration < target_interval:
                        await asyncio.sleep(target_interval - actual_duration)
        
        await sustained_load()
        
        metrics.end_timing()
        
        # Resource usage assertions
        if len(metrics.memory_usage) > 1:
            memory_stability = max(metrics.memory_usage) - min(metrics.memory_usage)
            assert memory_stability < 100  # Memory should remain stable (< 100MB variance)
        
        assert metrics.operations_per_second >= operations_per_second * 0.8  # Within 80% of target
        assert metrics.success_rate > 95.0  # At least 95% success rate
        
        print(f"\nSustained Load Performance:")
        print(f"  Duration: {duration_seconds}s")
        print(f"  Target ops/sec: {operations_per_second}")
        print(f"  Actual ops/sec: {metrics.operations_per_second:.1f}")
        print(f"  Success rate: {metrics.success_rate:.1f}%")
        print(f"  Operations completed: {len(metrics.operation_times)}")
        if metrics.memory_usage:
            print(f"  Memory stability: {max(metrics.memory_usage) - min(metrics.memory_usage):.1f}MB variance")