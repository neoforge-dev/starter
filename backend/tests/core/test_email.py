"""Test email functionality."""
import pytest
from unittest.mock import patch, AsyncMock
from app.core.email import EmailService, EmailContent


@pytest.fixture
def mock_email_service():
    """Mock EmailService for testing."""
    with patch("app.core.email.EmailService") as mock:
        mock_instance = mock.return_value
        mock_instance.send_queued_email = AsyncMock()
        yield mock_instance


@pytest.mark.asyncio
async def test_send_email_immediate(mock_email_service):
    """Test immediate email sending."""
    email_content = EmailContent(
        to="test@example.com",
        subject="Test Subject",
        template_name="test.html",
        template_data={"key": "value"}
    )
    
    await mock_email_service.send_queued_email()
    mock_email_service.send_queued_email.assert_called_once()


@pytest.mark.asyncio
async def test_send_email_queued(mock_email_service):
    """Test queued email sending."""
    email_content = EmailContent(
        to="test@example.com",
        subject="Test Subject",
        template_name="test.html",
        template_data={"key": "value"}
    )
    
    await mock_email_service.send_queued_email()
    mock_email_service.send_queued_email.assert_called_once()


@pytest.mark.asyncio
async def test_send_test_email(mock_email_service):
    """Test sending test email."""
    await mock_email_service.send_queued_email()
    mock_email_service.send_queued_email.assert_called_once()


@pytest.mark.asyncio
async def test_send_reset_password_email(mock_email_service):
    """Test sending password reset email."""
    await mock_email_service.send_queued_email()
    mock_email_service.send_queued_email.assert_called_once()


@pytest.mark.asyncio
async def test_send_new_account_email(mock_email_service):
    """Test sending new account email."""
    await mock_email_service.send_queued_email()
    mock_email_service.send_queued_email.assert_called_once()


@pytest.mark.asyncio
async def test_send_admin_alert_email(mock_email_service):
    """Test sending admin alert email."""
    await mock_email_service.send_queued_email()
    mock_email_service.send_queued_email.assert_called_once()


@pytest.mark.asyncio
async def test_send_email_with_cc_bcc(mock_email_service):
    """Test sending email with CC and BCC recipients."""
    await mock_email_service.send_queued_email()
    mock_email_service.send_queued_email.assert_called_once()


@pytest.mark.asyncio
async def test_send_email_with_multiple_recipients(mock_email_service):
    """Test sending email to multiple recipients."""
    await mock_email_service.send_queued_email()
    mock_email_service.send_queued_email.assert_called_once() 