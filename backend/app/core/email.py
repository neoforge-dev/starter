import logging
import os
from typing import Any, Dict, List, Optional

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from pydantic import BaseModel, EmailStr
from redis.asyncio import Redis

from app.core.config import Settings, get_settings
from app.core.queue import EmailQueue, EmailQueueItem

logger = logging.getLogger(__name__)


class EmailContent(BaseModel):
    """Email content structure."""

    to: str
    subject: str
    template_name: str
    template_data: Dict[str, Any]


class EmailService:
    def __init__(self, settings_obj: Settings):
        # Explicitly convert RedisDsn to string for Redis.from_url
        redis_url_str = str(settings_obj.redis_url)
        self.queue = EmailQueue(Redis.from_url(redis_url_str))
        self.conf = ConnectionConfig(
            # Let ConnectionConfig load these from environment (patched in tests)
            # MAIL_USERNAME=settings_obj.smtp_user,
            # MAIL_PASSWORD=settings_obj.smtp_password.get_secret_value() if settings_obj.smtp_password else None,
            # MAIL_FROM=settings_obj.smtp_user,
            MAIL_PORT=587,  # Explicit override/setting
            MAIL_SERVER="smtp.gmail.com",  # Explicit override/setting
            MAIL_STARTTLS=True,  # Correct keyword
            MAIL_SSL_TLS=False,  # Correct keyword
            MAIL_FROM_NAME=settings_obj.app_name,  # Explicit override/setting
        )
        self.fastmail = FastMail(self.conf)

    async def enqueue_email(
        self, message: MessageSchema, template_name: str, template_body: Dict[str, Any]
    ):
        """Add email to queue using EmailQueue"""
        if not template_body:
            raise ValueError("Email template body required")
        if not template_name:
            raise ValueError("Email template name required")

        # Create an EmailQueueItem from the MessageSchema
        email_item = EmailQueueItem(
            email_to=message.recipients,
            subject=message.subject,
            template_name=template_name,
            template_data=template_body,
            cc=message.cc,
            bcc=message.bcc,
            reply_to=message.reply_to,
        )

        # Enqueue the email
        email_id = await self.queue.enqueue(email_item)
        logger.info(f"Email enqueued with ID: {email_id}")
        return email_id

    async def _send_direct_email(self, message: MessageSchema, template_name: str):
        """Send email directly using FastMail."""
        try:
            await self.fastmail.send_message(message, template_name=template_name)
            logger.info(f"Email sent successfully to {message.recipients}")
        except Exception as e:
            logger.error(f"Error sending email directly: {e}")
            raise


async def send_email(
    *, db, email_id: str, email_content: EmailContent, settings: Settings
) -> None:
    """Send a dequeued email directly using the email service."""
    service = EmailService(settings)
    message = MessageSchema(
        subject=email_content.subject,
        recipients=[email_content.to],
        template_body=email_content.template_data,
        subtype="html",
    )
    await service._send_direct_email(message, template_name=email_content.template_name)
    logger.info(f"Dequeued email {email_id} sent via send_email function.")


async def send_test_email(
    email_to: str,
    settings: Settings,
    subject: str = "Test email",
    template_name: str = "test_email.html",
    template_data: Optional[dict] = None,
) -> None:
    """Send a test email."""
    service = EmailService(settings)
    message = MessageSchema(
        subject=subject,
        recipients=[email_to],
        template_body=template_data or {"message": "This is a test email"},
        template_name=template_name,
        subtype="html",
    )
    template_body_data = template_data or {"message": "This is a test email"}
    await service.enqueue_email(message, template_name, template_body_data)


async def send_reset_password_email(
    email_to: str, token: str, username: str, settings: Settings
) -> None:
    """Send password reset email with token."""
    service = EmailService(settings)
    reset_link = f"{settings.frontend_url}/reset-password?token={token}"
    message = MessageSchema(
        subject="Password Reset Request",
        recipients=[email_to],
        template_body={
            "username": username,
            "reset_url": reset_link,  # Template expects reset_url
            "reset_link": reset_link,  # Keep both for backwards compatibility
            "valid_hours": 24,
            "project_name": settings.app_name,
        },
        template_name="reset_password.html",
        subtype="html",
    )
    template_body_data = message.template_body
    await service.enqueue_email(message, "reset_password.html", template_body_data)


async def send_new_account_email(
    email_to: str, username: str, verification_token: str, settings: Settings
) -> None:
    """Send welcome email for new account with verification link."""
    service = EmailService(settings)
    verify_link = f"{settings.frontend_url}/verify-email?token={verification_token}"
    message = MessageSchema(
        subject="Welcome to NeoForge!",
        recipients=[email_to],
        template_body={
            "username": username,
            "verify_link": verify_link,
            "valid_hours": 24,
        },
        template_name="welcome.html",
        subtype="html",
    )
    template_body_data = message.template_body
    await service.enqueue_email(message, "welcome.html", template_body_data)


async def send_admin_alert_email(
    admin_emails: List[str],
    subject: str,
    alert_type: str,
    details: dict,
    settings: Settings,
) -> None:
    """Send alert email to admin users."""
    service = EmailService(settings)
    message = MessageSchema(
        subject=f"[ALERT] {subject}",
        recipients=admin_emails,
        template_body={
            "alert_type": alert_type,
            "details": details,
            "environment": settings.environment,
        },
        template_name="admin_alert.html",
        subtype="html",
    )
    template_body_data = message.template_body
    await service.enqueue_email(message, "admin_alert.html", template_body_data)
