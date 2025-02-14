import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch
from app.worker.email_worker import EmailWorker

@pytest.mark.asyncio
async def test_process_one_template_validation_error(worker, mock_queue, mock_tracking):
    """Test handling of template validation errors."""
    # Setup
    email_id = "test_id"
    email = EmailQueueItem(
        email_to="test@example.com",
        subject="Test",
        template_name="invalid_template",
        template_data={}
    )
    mock_queue.dequeue.return_value = (email_id, email)
    
    # Create tracking record first
    tracking_record = await mock_tracking(email_id)
    tracking_record.status = EmailStatus.QUEUED
    tracking_record.tracking_metadata = {}
    
    # Mock email_tracking.get_by_email_id to return our tracking record
    async def mock_get_by_email_id(*args, **kwargs):
        return tracking_record
    
    # Patch the email_tracking.get_by_email_id function
    with patch('app.worker.email_worker.email_tracking.get_by_email_id', side_effect=mock_get_by_email_id):
        # Set up template validation error
        worker.template_validator.validate_template_data.side_effect = ValueError("Template validation failed: Invalid template")
        
        # Execute
        result = await worker.process_one()
        
        # Assert
        assert not result
        mock_queue.mark_failed.assert_called_once()
        mock_queue.mark_completed.assert_not_called()
        mock_queue.requeue.assert_not_called()
        
        # Verify tracking record was updated
        assert tracking_record.status == EmailStatus.FAILED
        assert "Template validation failed" in tracking_record.error_message 

@pytest.mark.asyncio
async def test_email_worker_process_one():
    """Test processing one email from the queue."""
    # Create a mock queue
    mock_queue = AsyncMock()
    mock_queue.dequeue.return_value = None  # Empty queue
    
    # Create worker with mock queue
    worker = EmailWorker(queue=mock_queue)
    
    # Test processing empty queue
    result = await worker.process_one()
    assert result is False
    mock_queue.dequeue.assert_called_once() 