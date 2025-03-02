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
from fastapi_mail import MessageSchema

from app.core.email import (
    EmailService,
    EmailContent,
    send_email,
    send_test_email,
    send_reset_password_email,
    send_new_account_email,
    send_admin_alert_email,
)
from app.core.config import settings


@pytest.fixture
def mock_redis():
    """Create a mock Redis client."""
    mock = AsyncMock()
    mock.rpush = AsyncMock(return_value=1)
    return mock


@pytest.fixture
def mock_email_service(mock_redis):
    """Create a mock EmailService with Redis."""
    with patch('app.core.email.Redis.from_url', return_value=mock_redis):
        with patch('app.core.email.FastMail') as mock_fastmail:
            service = EmailService()
            service.redis = mock_redis
            yield service


@pytest.mark.asyncio
async def test_email_service_init():
    """Test that EmailService initializes correctly."""
    with patch('app.core.email.Redis.from_url') as mock_redis_from_url:
        with patch('app.core.email.FastMail') as mock_fastmail:
            # Create the service
            service = EmailService()
            
            # Verify Redis was initialized
            mock_redis_from_url.assert_called_once_with(settings.redis_url)
            
            # Verify FastMail was initialized with correct config
            mock_fastmail.assert_called_once()
            conf = mock_fastmail.call_args[0][0]
            assert conf.MAIL_USERNAME == settings.smtp_user
            assert conf.MAIL_FROM == settings.smtp_user
            assert conf.MAIL_PORT == 587
            assert conf.MAIL_SERVER == "smtp.gmail.com"
            assert conf.MAIL_TLS is True
            assert conf.MAIL_SSL is False
            assert conf.MAIL_FROM_NAME == settings.app_name


@pytest.mark.asyncio
async def test_send_queued_email(mock_email_service, mock_redis):
    """Test that send_queued_email adds message to Redis queue."""
    # Create a message
    message = MessageSchema(
        subject="Test Subject",
        recipients=["test@example.com"],
        template_body={"key": "value"},
        template_name="test.html"
    )
    
    # Send the message
    await mock_email_service.send_queued_email(message)
    
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
        template_name="test.html"
    )
    
    # Expect ValueError when sending
    with pytest.raises(ValueError, match="Email template required"):
        await mock_email_service.send_queued_email(message)


@pytest.mark.asyncio
async def test_send_email():
    """Test that send_email creates correct message and queues it."""
    # Create mock EmailService
    mock_service = AsyncMock()
    mock_send_queued = AsyncMock()
    mock_service.send_queued_email = mock_send_queued
    
    # Patch EmailService to return our mock
    with patch('app.core.email.EmailService', return_value=mock_service):
        # Create email content
        email_content = EmailContent(
            to="test@example.com",
            subject="Test Subject",
            template_name="test.html",
            template_data={"key": "value"}
        )
        
        # Send the email
        await send_email(db=None, email_id="123", email_content=email_content)
        
        # Verify correct message was created and queued
        mock_send_queued.assert_called_once()
        message = mock_send_queued.call_args[0][0]
        assert message.subject == "Test Subject"
        assert message.recipients == ["test@example.com"]
        assert message.template_body == {"key": "value"}
        assert message.template_name == "test.html"


@pytest.mark.asyncio
async def test_send_test_email():
    """Test that send_test_email creates correct message and queues it."""
    # Create mock EmailService
    mock_service = AsyncMock()
    mock_send_queued = AsyncMock()
    mock_service.send_queued_email = mock_send_queued
    
    # Patch EmailService to return our mock
    with patch('app.core.email.EmailService', return_value=mock_service):
        # Send a test email
        await send_test_email(
            email_to="test@example.com",
            subject="Custom Test Subject",
            template_name="custom_test.html",
            template_data={"custom": "data"}
        )
        
        # Verify correct message was created and queued
        mock_send_queued.assert_called_once()
        message = mock_send_queued.call_args[0][0]
        assert message.subject == "Custom Test Subject"
        assert message.recipients == ["test@example.com"]
        assert message.template_body == {"custom": "data"}
        assert message.template_name == "custom_test.html"


@pytest.mark.asyncio
async def test_send_reset_password_email():
    """Test that send_reset_password_email creates correct message and queues it."""
    # Create mock EmailService
    mock_service = AsyncMock()
    mock_send_queued = AsyncMock()
    mock_service.send_queued_email = mock_send_queued
    
    # Patch EmailService to return our mock
    with patch('app.core.email.EmailService', return_value=mock_service):
        # Send a reset password email
        await send_reset_password_email(
            email_to="test@example.com",
            token="reset_token_123",
            username="testuser"
        )
        
        # Verify correct message was created and queued
        mock_send_queued.assert_called_once()
        message = mock_send_queued.call_args[0][0]
        assert message.subject == "Password Reset Request"
        assert message.recipients == ["test@example.com"]
        assert message.template_body["username"] == "testuser"
        assert message.template_body["reset_link"] == f"{settings.frontend_url}/reset-password?token=reset_token_123"
        assert message.template_body["valid_hours"] == 24
        assert message.template_name == "reset_password.html"


@pytest.mark.asyncio
async def test_send_new_account_email():
    """Test that send_new_account_email creates correct message and queues it."""
    # Create mock EmailService
    mock_service = AsyncMock()
    mock_send_queued = AsyncMock()
    mock_service.send_queued_email = mock_send_queued
    
    # Patch EmailService to return our mock
    with patch('app.core.email.EmailService', return_value=mock_service):
        # Send a new account email
        await send_new_account_email(
            email_to="test@example.com",
            username="testuser",
            verification_token="verify_token_123"
        )
        
        # Verify correct message was created and queued
        mock_send_queued.assert_called_once()
        message = mock_send_queued.call_args[0][0]
        assert message.subject == "Welcome to NeoForge!"
        assert message.recipients == ["test@example.com"]
        assert message.template_body["username"] == "testuser"
        assert message.template_body["verify_link"] == f"{settings.frontend_url}/verify-email?token=verify_token_123"
        assert message.template_body["valid_hours"] == 24
        assert message.template_name == "welcome.html"


@pytest.mark.asyncio
async def test_send_admin_alert_email():
    """Test that send_admin_alert_email creates correct message and queues it."""
    # Create mock EmailService
    mock_service = AsyncMock()
    mock_send_queued = AsyncMock()
    mock_service.send_queued_email = mock_send_queued
    
    # Patch EmailService to return our mock
    with patch('app.core.email.EmailService', return_value=mock_service):
        # Send an admin alert email
        await send_admin_alert_email(
            admin_emails=["admin1@example.com", "admin2@example.com"],
            subject="Critical Issue",
            alert_type="security",
            details={"ip": "192.168.1.1", "attempts": 5}
        )
        
        # Verify correct message was created and queued
        mock_send_queued.assert_called_once()
        message = mock_send_queued.call_args[0][0]
        assert message.subject == "[ALERT] Critical Issue"
        assert message.recipients == ["admin1@example.com", "admin2@example.com"]
        assert message.template_body["alert_type"] == "security"
        assert message.template_body["details"] == {"ip": "192.168.1.1", "attempts": 5}
        assert message.template_body["environment"] == settings.environment
        assert message.template_name == "admin_alert.html" 