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

@pytest.fixture
async def mock_email_service(mock_redis):
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
                current_settings = get_settings() # Get settings once
                # Create the service, passing the settings object
                service = EmailService(current_settings)
                
                # Verify Redis was initialized with the STRING representation
                mock_redis_from_url.assert_called_once_with(str(current_settings.redis_url))
                
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
async def test_enqueue_email(mock_email_service):
    """Test that enqueue_email adds message to Redis queue."""
    # Create a message
    message = MessageSchema(
        subject="Test Subject",
        recipients=["test@example.com"],
        template_body={"key": "value"},
        template_name="test.html",
        subtype="html"
    )
    
    # Mock the underlying queue's enqueue method directly, as EmailService.enqueue_email calls it.
    mock_email_service.queue.enqueue = AsyncMock(return_value="mock_email_id")
    
    # Send the message using the renamed method
    await mock_email_service.enqueue_email(message, "test.html", {"key": "value"})
    
    # Verify the underlying queue method was called correctly
    mock_email_service.queue.enqueue.assert_called_once()
    call_args = mock_email_service.queue.enqueue.call_args[0][0]
    assert isinstance(call_args, EmailQueueItem)
    assert call_args.subject == "Test Subject"
    assert call_args.email_to == ["test@example.com"]
    assert call_args.template_name == "test.html"
    assert call_args.template_data == {"key": "value"}


@pytest.mark.asyncio
async def test_enqueue_email_no_template(mock_email_service):
    """Test that enqueue_email raises error when template body is missing."""
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
        # Call the renamed method
        await mock_email_service.enqueue_email(message, "test.html", None)


@pytest.mark.asyncio
async def test_send_email():
    """Test that send_email uses EmailService._send_direct_email."""
    # Create email content
    email_content = EmailContent(
        to="test@example.com",
        subject="Test Direct Subject",
        template_name="direct_test.html",
        template_data={"direct_key": "direct_value"}
    )
    
    settings = get_settings()

    # Patch FastMail's send_message method directly
    with patch('app.core.email.FastMail.send_message', new_callable=AsyncMock) as mock_send_message:
        # We still need EmailService to be instantiated, but we don't need to mock its internals fully
        with patch('app.core.email.Redis.from_url', new_callable=MagicMock): # Mock Redis for queue init
            with patch.dict(os.environ, DUMMY_MAIL_ENV, clear=True): # Mock env for ConnectionConfig
                 # Call the function under test (which creates EmailService and calls _send_direct_email)
                await send_email(db=None, email_id="test_id_456", email_content=email_content, settings=settings)
        
    # Verify FastMail.send_message was called correctly
    mock_send_message.assert_called_once()
    
    # Check the arguments passed to send_message
    # call_args_list[0].args = (self<FastMail>, message_schema)
    # call_args_list[0].kwargs = {template_name="..."}
    call = mock_send_message.call_args_list[0]
    call_args = call.args
    call_kwargs = call.kwargs

    assert len(call_args) == 1 # message is the only positional arg
    message_arg = call_args[0]
    assert isinstance(message_arg, MessageSchema)
    assert message_arg.subject == "Test Direct Subject"
    assert message_arg.recipients == ["test@example.com"]
    assert message_arg.template_body == {"direct_key": "direct_value"}
    
    assert 'template_name' in call_kwargs
    assert call_kwargs['template_name'] == "direct_test.html"


@pytest.mark.asyncio
async def test_send_test_email():
    """Test that send_test_email creates correct message and queues it."""
    settings = get_settings()
    
    # Patch the queue enqueue method
    with patch('app.core.email.EmailQueue.enqueue', new_callable=AsyncMock) as mock_enqueue:
        with patch('app.core.email.Redis.from_url', new_callable=MagicMock):
            with patch('app.core.email.FastMail', new_callable=MagicMock):
                with patch.dict(os.environ, DUMMY_MAIL_ENV, clear=True):
                    # Send a test email with corrected argument order
                    await send_test_email(
                        email_to="test@example.com", # Correct order
                        settings=settings,
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
    settings = get_settings()
    
    # Patch the queue enqueue method
    with patch('app.core.email.EmailQueue.enqueue', new_callable=AsyncMock) as mock_enqueue:
        with patch('app.core.email.Redis.from_url', new_callable=MagicMock):
            with patch('app.core.email.FastMail', new_callable=MagicMock):
                 with patch.dict(os.environ, DUMMY_MAIL_ENV, clear=True):
                    # Send a reset password email with corrected arg order
                    await send_reset_password_email(
                        email_to="test@example.com", # Correct order
                        token="reset_token_123",
                        username="testuser",
                        settings=settings
                    )
        
    # Verify correct item was created and enqueued
    mock_enqueue.assert_called_once()
    queued_item = mock_enqueue.call_args[0][0]
    assert queued_item.subject == "Password Reset Request"
    assert queued_item.email_to == ["test@example.com"]
    assert queued_item.template_data["username"] == "testuser"
    assert queued_item.template_data["reset_link"] == f"{settings.frontend_url}/reset-password?token=reset_token_123"
    assert queued_item.template_data["valid_hours"] == 24
    assert queued_item.template_name == "reset_password.html"


@pytest.mark.asyncio
async def test_send_new_account_email():
    """Test that send_new_account_email creates correct message and queues it."""
    settings = get_settings()
    
    # Patch the queue enqueue method
    with patch('app.core.email.EmailQueue.enqueue', new_callable=AsyncMock) as mock_enqueue:
        with patch('app.core.email.Redis.from_url', new_callable=MagicMock):
            with patch('app.core.email.FastMail', new_callable=MagicMock):
                 with patch.dict(os.environ, DUMMY_MAIL_ENV, clear=True):
                    # Send a new account email with corrected arg order
                    await send_new_account_email(
                        email_to="test@example.com", # Correct order
                        username="testuser",
                        verification_token="verify_token_123",
                        settings=settings
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
    settings = get_settings()
    
    # Patch the queue enqueue method
    with patch('app.core.email.EmailQueue.enqueue', new_callable=AsyncMock) as mock_enqueue:
        with patch('app.core.email.Redis.from_url', new_callable=MagicMock):
            with patch('app.core.email.FastMail', new_callable=MagicMock):
                 with patch.dict(os.environ, DUMMY_MAIL_ENV, clear=True):
                    # Send an admin alert email with corrected arg order
                    await send_admin_alert_email(
                        admin_emails=["admin1@example.com", "admin2@example.com"], # Correct order
                        subject="Critical Issue",
                        alert_type="security",
                        details={"ip": "192.168.1.1", "attempts": 5},
                        settings=settings
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