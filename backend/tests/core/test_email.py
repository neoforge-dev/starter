"""Test email functionality."""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi_mail import FastMail
from pydantic import EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.email import (
    send_email,
    send_test_email,
    send_reset_password_email,
    send_new_account_email,
    send_admin_alert_email,
    EmailContent,
)


@pytest.fixture
def mock_fastmail():
    """Mock FastMail for testing."""
    with patch("app.core.email.fastmail") as mock:
        mock.send_message = AsyncMock()
        yield mock


@pytest.fixture
def mock_db():
    """Mock database session for testing."""
    mock = AsyncMock(spec=AsyncSession)
    return mock


@pytest.fixture
def mock_email_queue():
    """Mock email queue for testing."""
    with patch("app.core.email.email_queue") as mock:
        mock.enqueue = AsyncMock(return_value="test-email-id")
        yield mock


@pytest.mark.asyncio
async def test_send_email_immediate(mock_fastmail, mock_db):
    """Test immediate email sending."""
    # Test data
    email_to = "test@example.com"
    content = EmailContent(
        subject="Test Subject",
        template_name="test_email",
        template_data={"project_name": "Test Project", "email": email_to},
    )

    # Call function with immediate=True
    await send_email(db=mock_db, email_to=email_to, email_content=content, immediate=True)

    # Verify
    mock_fastmail.send_message.assert_called_once()
    call_args = mock_fastmail.send_message.call_args[0][0]
    assert call_args.subject == "Test Subject"
    assert email_to in call_args.recipients


@pytest.mark.asyncio
async def test_send_email_queued(mock_fastmail, mock_db, mock_email_queue):
    """Test queued email sending."""
    # Test data
    email_to = "test@example.com"
    content = EmailContent(
        subject="Test Subject",
        template_name="test_email",
        template_data={"project_name": "Test Project", "email": email_to},
    )

    # Call function with immediate=False (default)
    email_id = await send_email(db=mock_db, email_to=email_to, email_content=content)

    # Verify
    mock_fastmail.send_message.assert_not_called()
    mock_email_queue.enqueue.assert_called_once()
    assert email_id == "test-email-id"


@pytest.mark.asyncio
async def test_send_test_email(mock_fastmail, mock_db):
    """Test send_test_email function."""
    email_to = "test@example.com"
    await send_test_email(db=mock_db, email_to=email_to)

    mock_fastmail.send_message.assert_called_once()
    call_args = mock_fastmail.send_message.call_args[0][0]
    assert "Test email from" in call_args.subject
    assert email_to in call_args.recipients


@pytest.mark.asyncio
async def test_send_reset_password_email(mock_fastmail, mock_db):
    """Test send_reset_password_email function."""
    email_to = "test@example.com"
    token = "test-token"
    await send_reset_password_email(db=mock_db, email_to=email_to, token=token)

    mock_fastmail.send_message.assert_called_once()
    call_args = mock_fastmail.send_message.call_args[0][0]
    assert "Password recovery" in call_args.subject
    assert email_to in call_args.recipients
    assert token in str(call_args.body)


@pytest.mark.asyncio
async def test_send_new_account_email(mock_fastmail, mock_db):
    """Test send_new_account_email function."""
    email_to = "test@example.com"
    username = "testuser"
    password = "testpass"
    await send_new_account_email(db=mock_db, email_to=email_to, username=username, password=password)

    mock_fastmail.send_message.assert_called_once()
    call_args = mock_fastmail.send_message.call_args[0][0]
    assert "New account" in call_args.subject
    assert email_to in call_args.recipients
    assert username in str(call_args.body)
    assert password in str(call_args.body)


@pytest.mark.asyncio
async def test_send_admin_alert_email(mock_fastmail, mock_db):
    """Test send_admin_alert_email function."""
    email_to = "admin@example.com"
    subject = "Test Alert"
    action = "test_action"
    details = {"key": "value"}
    await send_admin_alert_email(db=mock_db, email_to=email_to, subject=subject, action=action, details=details)

    mock_fastmail.send_message.assert_called_once()
    call_args = mock_fastmail.send_message.call_args[0][0]
    assert "[ADMIN ALERT]" in call_args.subject
    assert email_to in call_args.recipients
    assert action in str(call_args.body)
    assert "value" in str(call_args.body)


@pytest.mark.asyncio
async def test_send_email_with_cc_bcc(mock_fastmail, mock_db):
    """Test send_email with CC and BCC recipients."""
    email_to = "test@example.com"
    cc = ["cc@example.com"]
    bcc = ["bcc@example.com"]
    content = EmailContent(
        subject="Test Subject",
        template_name="test_email",
        template_data={"project_name": "Test Project", "email": email_to},
    )

    await send_email(
        db=mock_db,
        email_to=email_to,
        email_content=content,
        cc=cc,
        bcc=bcc,
        immediate=True,
    )

    mock_fastmail.send_message.assert_called_once()
    call_args = mock_fastmail.send_message.call_args[0][0]
    assert email_to in call_args.recipients
    assert cc == call_args.cc
    assert bcc == call_args.bcc


@pytest.mark.asyncio
async def test_send_email_with_multiple_recipients(mock_fastmail, mock_db):
    """Test send_email with multiple recipients."""
    email_to = ["test1@example.com", "test2@example.com"]
    content = EmailContent(
        subject="Test Subject",
        template_name="test_email",
        template_data={"project_name": "Test Project", "email": ",".join(email_to)},
    )

    await send_email(db=mock_db, email_to=email_to, email_content=content, immediate=True)

    mock_fastmail.send_message.assert_called_once()
    call_args = mock_fastmail.send_message.call_args[0][0]
    assert all(email in call_args.recipients for email in email_to) 