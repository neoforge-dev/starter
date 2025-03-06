from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from redis.asyncio import Redis
import os
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
from app.core.config import settings
from app.core.queue import EmailQueue, EmailQueueItem

class EmailContent(BaseModel):
    """Email content structure."""
    to: str
    subject: str
    template_name: str
    template_data: Dict[str, Any]

class EmailService:
    def __init__(self):
        self.queue = EmailQueue(Redis.from_url(settings.redis_url))
        self.conf = ConnectionConfig(
            MAIL_USERNAME=settings.smtp_user,
            MAIL_PASSWORD=settings.smtp_password.get_secret_value() if settings.smtp_password else None,
            MAIL_FROM=settings.smtp_user,
            MAIL_PORT=587,
            MAIL_SERVER="smtp.gmail.com",
            MAIL_TLS=True,
            MAIL_SSL=False,
            MAIL_FROM_NAME=settings.app_name
        )
        self.fastmail = FastMail(self.conf)

    async def send_queued_email(self, message: MessageSchema):
        """Add email to queue using EmailQueue"""
        if not message.template_body:
            raise ValueError("Email template required")
        
        # Connect to the queue if not already connected
        await self.queue.connect()
        
        # Create an EmailQueueItem from the MessageSchema
        email_item = EmailQueueItem(
            email_to=message.recipients,
            subject=message.subject,
            template_name=message.template_name,
            template_data=message.template_body,
            cc=message.cc,
            bcc=message.bcc,
            reply_to=message.reply_to
        )
        
        # Enqueue the email
        email_id = await self.queue.enqueue(email_item)
        
        return email_id

async def send_email(*, db, email_id: str, email_content: EmailContent) -> None:
    """Send an email using the queued email service."""
    service = EmailService()
    message = MessageSchema(
        subject=email_content.subject,
        recipients=[email_content.to],
        template_body=email_content.template_data,
        template_name=email_content.template_name
    )
    await service.send_queued_email(message)

async def send_test_email(
    email_to: str,
    subject: str = "Test email",
    template_name: str = "test_email.html",
    template_data: Optional[dict] = None
) -> None:
    """Send a test email."""
    service = EmailService()
    message = MessageSchema(
        subject=subject,
        recipients=[email_to],
        template_body=template_data or {"message": "This is a test email"},
        template_name=template_name
    )
    await service.send_queued_email(message)

async def send_reset_password_email(
    email_to: str,
    token: str,
    username: str
) -> None:
    """Send password reset email with token."""
    service = EmailService()
    reset_link = f"{settings.frontend_url}/reset-password?token={token}"
    message = MessageSchema(
        subject="Password Reset Request",
        recipients=[email_to],
        template_body={
            "username": username,
            "reset_link": reset_link,
            "valid_hours": 24
        },
        template_name="reset_password.html"
    )
    await service.send_queued_email(message)

async def send_new_account_email(
    email_to: str,
    username: str,
    verification_token: str
) -> None:
    """Send welcome email for new account with verification link."""
    service = EmailService()
    verify_link = f"{settings.frontend_url}/verify-email?token={verification_token}"
    message = MessageSchema(
        subject="Welcome to NeoForge!",
        recipients=[email_to],
        template_body={
            "username": username,
            "verify_link": verify_link,
            "valid_hours": 24
        },
        template_name="welcome.html"
    )
    await service.send_queued_email(message)

async def send_admin_alert_email(
    admin_emails: List[str],
    subject: str,
    alert_type: str,
    details: dict
) -> None:
    """Send alert email to admin users."""
    service = EmailService()
    message = MessageSchema(
        subject=f"[ALERT] {subject}",
        recipients=admin_emails,
        template_body={
            "alert_type": alert_type,
            "details": details,
            "environment": settings.environment
        },
        template_name="admin_alert.html"
    )
    await service.send_queued_email(message) 