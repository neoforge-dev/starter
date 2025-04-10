"""
Test email module functionality.

This test verifies that the email module works correctly, including:
- Email service initialization
- Email queueing
- Various email types (test, reset password, new account, admin alert)

We use mocking to avoid actual email sending.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import json
import os
from fastapi_mail import MessageSchema
from app.core.queue import EmailQueueItem

from app.core.email import (
    EmailService,
    EmailContent,
    send_email,
    send_test_email,
    send_reset_password_email,
    send_new_account_email,
    send_admin_alert_email,
)
from app.core.config import get_settings


@pytest.fixture
def mock_redis():
    """Create a mock Redis client."""
    mock = AsyncMock()
    mock.rpush = AsyncMock(return_value=1)
    return mock


# Define dummy env vars for email tests
DUMMY_MAIL_ENV = {
    "MAIL_USERNAME": "testuser",
    "MAIL_PASSWORD": "testpass",
    "MAIL_FROM": "test@example.com",
    "MAIL_STARTTLS": "True",
    "MAIL_SSL_TLS": "False",
    "MAIL_SERVER": "smtp.test.com",
    "MAIL_PORT": "587"
}

def mock_email_service(mock_redis):
    """Create a mock EmailService with Redis."""
    with patch.dict(os.environ, DUMMY_MAIL_ENV, clear=True):
        # Patch the specific redis_client instance imported and used by EmailQueue
        with patch('app.core.queue.redis_client', mock_redis):
            # Patch FastMail used by EmailService
            with patch('app.core.email.FastMail') as mock_fastmail:
                # Pass the imported settings object during instantiation
                # EmailService creates EmailQueue, which will now use the patched redis_client
                service = EmailService(get_settings())
                yield service


@pytest.mark.asyncio
async def test_email_service_init():
    """Test that EmailService initializes correctly."""
    with patch.dict(os.environ, DUMMY_MAIL_ENV, clear=True):
        with patch('app.core.email.Redis.from_url') as mock_redis_from_url:
            with patch('app.core.email.FastMail') as mock_fastmail:
                # Create the service, passing the settings object
                service = EmailService(get_settings())
                
                # Verify Redis was initialized
                mock_redis_from_url.assert_called_once_with(get_settings().redis_url)
                
                # Verify FastMail was initialized with correct config
                mock_fastmail.assert_called_once()
                conf = mock_fastmail.call_args[0][0]
                # Compare against the dummy values from patched environment
                assert conf.MAIL_USERNAME == DUMMY_MAIL_ENV["MAIL_USERNAME"]
                assert conf.MAIL_FROM == DUMMY_MAIL_ENV["MAIL_FROM"]
                assert conf.MAIL_PORT == 587
                assert conf.MAIL_SERVER == "smtp.gmail.com"
                # Check the corrected keywords from ConnectionConfig
                assert conf.MAIL_STARTTLS is True 
                assert conf.MAIL_SSL_TLS is False
                # Compare against the value from the settings object (as it's passed explicitly)
                assert conf.MAIL_FROM_NAME == get_settings().app_name


@pytest.mark.asyncio
async def test_send_queued_email(mock_email_service, mock_redis):
    """Test that send_queued_email adds message to Redis queue."""
    # Create a message
    message = MessageSchema(
        subject="Test Subject",
        recipients=["test@example.com"],
        template_body={"key": "value"},
        template_name="test.html",
        subtype="html"
    )
    
    # Send the message
    await mock_email_service.send_queued_email(message, "test.html", {"key": "value"})
    
    # Verify message was added to Redis queue
    mock_redis.rpush.assert_called_once_with("email_queue", message.json())


@pytest.mark.asyncio
async def test_send_queued_email_no_template(mock_email_service):
    """Test that send_queued_email raises error when template is missing."""
    # Create a message without template_body
    message = MessageSchema(
        subject="Test Subject",
        recipients=["test@example.com"],
        template_body=None,
        template_name="test.html",
        subtype="html"
    )
    
    # Expect ValueError when sending
    with pytest.raises(ValueError, match="Email template body required"):
        # Pass dummy template info (body is None, which should trigger the error)
        await mock_email_service.send_queued_email(message, "test.html", None)


@pytest.mark.asyncio
async def test_send_email():
    """Test that send_email creates correct message and queues it."""
    # Create email content
    email_content = EmailContent(
        to="test@example.com",
        subject="Test Subject",
        template_name="test.html",
        template_data={"key": "value"}
    )

    # Patch the queue enqueue method to capture the item
    with patch('app.core.email.EmailQueue.enqueue', new_callable=AsyncMock) as mock_enqueue:
        # Patch Redis connection within EmailQueue init (used by EmailService)
        with patch('app.core.email.Redis.from_url', new_callable=MagicMock):
            # Patch FastMail init within EmailService init
            with patch('app.core.email.FastMail', new_callable=MagicMock):
                # Patch environment for ConnectionConfig
                with patch.dict(os.environ, DUMMY_MAIL_ENV, clear=True):
                    await send_email(db=None, email_id="123", email_content=email_content)
        
    # Verify correct item was created and enqueued
    mock_enqueue.assert_called_once()
    # Get the EmailQueueItem instance passed to enqueue
    queued_item = mock_enqueue.call_args[0][0] 
    assert isinstance(queued_item, EmailQueueItem)
    assert queued_item.subject == "Test Subject"
    assert queued_item.email_to == ["test@example.com"]
    assert queued_item.template_data == {"key": "value"}
    assert queued_item.template_name == "test.html"


@pytest.mark.asyncio
async def test_send_test_email():
    """Test that send_test_email creates correct message and queues it."""
    # Patch the queue enqueue method
    with patch('app.core.email.EmailQueue.enqueue', new_callable=AsyncMock) as mock_enqueue:
        with patch('app.core.email.Redis.from_url', new_callable=MagicMock):
            with patch('app.core.email.FastMail', new_callable=MagicMock):
                with patch.dict(os.environ, DUMMY_MAIL_ENV, clear=True):
                    # Send a test email
                    await send_test_email(
                        email_to="test@example.com",
                        subject="Custom Test Subject",
                        template_name="custom_test.html",
                        template_data={"custom": "data"}
                    )
        
    # Verify correct item was created and enqueued
    mock_enqueue.assert_called_once()
    queued_item = mock_enqueue.call_args[0][0]
    assert queued_item.subject == "Custom Test Subject"
    assert queued_item.email_to == ["test@example.com"]
    assert queued_item.template_data == {"custom": "data"}
    assert queued_item.template_name == "custom_test.html"


@pytest.mark.asyncio
async def test_send_reset_password_email():
    """Test that send_reset_password_email creates correct message and queues it."""
    # Patch the queue enqueue method
    with patch('app.core.email.EmailQueue.enqueue', new_callable=AsyncMock) as mock_enqueue:
        with patch('app.core.email.Redis.from_url', new_callable=MagicMock):
            with patch('app.core.email.FastMail', new_callable=MagicMock):
                 with patch.dict(os.environ, DUMMY_MAIL_ENV, clear=True):
                    # Send a reset password email
                    await send_reset_password_email(
                        email_to="test@example.com",
                        token="reset_token_123",
                        username="testuser"
                    )
        
    # Verify correct item was created and enqueued
    mock_enqueue.assert_called_once()
    queued_item = mock_enqueue.call_args[0][0]
    assert queued_item.subject == "Password Reset Request"
    assert queued_item.email_to == ["test@example.com"]
    assert queued_item.template_data["username"] == "testuser"
    assert queued_item.template_data["reset_link"] == f"{get_settings().frontend_url}/reset-password?token=reset_token_123"
    assert queued_item.template_data["valid_hours"] == 24
    assert queued_item.template_name == "reset_password.html"


@pytest.mark.asyncio
async def test_send_new_account_email():
    """Test that send_new_account_email creates correct message and queues it."""
    # Patch the queue enqueue method
    with patch('app.core.email.EmailQueue.enqueue', new_callable=AsyncMock) as mock_enqueue:
        with patch('app.core.email.Redis.from_url', new_callable=MagicMock):
            with patch('app.core.email.FastMail', new_callable=MagicMock):
                 with patch.dict(os.environ, DUMMY_MAIL_ENV, clear=True):
                    # Send a new account email
                    await send_new_account_email(
                        email_to="test@example.com",
                        username="testuser",
                        verification_token="verify_token_123"
                    )
        
    # Verify correct item was created and enqueued
    mock_enqueue.assert_called_once()
    queued_item = mock_enqueue.call_args[0][0]
    assert queued_item.subject == "Welcome to NeoForge!"
    assert queued_item.email_to == ["test@example.com"]
    assert queued_item.template_data["username"] == "testuser"
    assert queued_item.template_data["verify_link"] == f"{settings.frontend_url}/verify-email?token=verify_token_123"
    assert queued_item.template_data["valid_hours"] == 24
    assert queued_item.template_name == "welcome.html"


@pytest.mark.asyncio
async def test_send_admin_alert_email():
    """Test that send_admin_alert_email creates correct message and queues it."""
    # Patch the queue enqueue method
    with patch('app.core.email.EmailQueue.enqueue', new_callable=AsyncMock) as mock_enqueue:
        with patch('app.core.email.Redis.from_url', new_callable=MagicMock):
            with patch('app.core.email.FastMail', new_callable=MagicMock):
                 with patch.dict(os.environ, DUMMY_MAIL_ENV, clear=True):
                    # Send an admin alert email
                    await send_admin_alert_email(
                        admin_emails=["admin1@example.com", "admin2@example.com"],
                        subject="Critical Issue",
                        alert_type="security",
                        details={"ip": "192.168.1.1", "attempts": 5}
                    )
        
    # Verify correct item was created and enqueued
    mock_enqueue.assert_called_once()
    queued_item = mock_enqueue.call_args[0][0]
    assert queued_item.subject == "[ALERT] Critical Issue"
    assert queued_item.email_to == ["admin1@example.com", "admin2@example.com"]
    assert queued_item.template_data["alert_type"] == "security"
    assert queued_item.template_data["details"] == {"ip": "192.168.1.1", "attempts": 5}
    assert queued_item.template_data["environment"] == settings.environment
    assert queued_item.template_name == "admin_alert.html" 