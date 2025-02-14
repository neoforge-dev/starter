from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from redis import Redis
import os
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.core.config import settings

class EmailContent(BaseModel):
    """Email content structure."""
    to: str
    subject: str
    template_name: str
    template_data: Dict[str, Any]

class EmailService:
    def __init__(self):
        self.redis = Redis.from_url(os.getenv("REDIS_URL"))
        self.conf = ConnectionConfig(
            MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
            MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
            MAIL_FROM=os.getenv("MAIL_FROM"),
            MAIL_PORT=587,
            MAIL_SERVER="smtp.gmail.com",
            MAIL_TLS=True,
            MAIL_SSL=False
        )

    async def send_queued_email(self, message: MessageSchema):
        """Add email to Redis queue"""
        if not message.template_body:
            raise ValueError("Email template required")
            
        self.redis.rpush("email_queue", message.json())

async def send_email(*, db, email_id, email_content):
    """Send an email using the queued email service."""
    from fastapi_mail import MessageSchema
    service = EmailService()
    message = MessageSchema(
        subject=email_content.subject,
        recipients=[email_content.to],
        template_body=email_content.template_data
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
        template_body=template_data or {"message": "This is a test email"}
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
        }
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
        }
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
        }
    )
    await service.send_queued_email(message) 