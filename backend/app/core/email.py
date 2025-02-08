"""Email handling module."""
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, UTC

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr, BaseModel
from jinja2 import Environment, select_autoescape, FileSystemLoader
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.queue import email_queue, EmailQueueItem
from app.crud.email_tracking import email_tracking
from app.models.email_tracking import EmailStatus
from app.schemas.email_tracking import EmailTrackingCreate, EmailEventCreate
from app.core.email_templates import TemplateValidator


class EmailContent(BaseModel):
    """Email content model."""
    subject: str
    template_name: str
    template_data: Dict[str, Any]


# Configure email template validator
template_validator = TemplateValidator()

# Configure FastAPI-Mail
email_conf = ConnectionConfig(
    MAIL_USERNAME=settings.smtp_user,
    MAIL_PASSWORD=settings.smtp_password,
    MAIL_FROM=settings.emails_from_email,
    MAIL_PORT=settings.smtp_port,
    MAIL_SERVER=settings.smtp_host,
    MAIL_FROM_NAME=settings.emails_from_name,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER=Path(__file__).parent.parent / "email_templates",
)

fastmail = FastMail(email_conf)


async def send_email(
    db: AsyncSession,
    email_to: str | list[str],
    email_content: EmailContent,
    cc: Optional[list[str]] = None,
    bcc: Optional[list[str]] = None,
    reply_to: Optional[list[str]] = None,
    priority: int = 0,
    immediate: bool = False,
) -> Optional[str]:
    """Send an email."""
    try:
        # Validate and render template
        html = template_validator.render_template(
            email_content.template_name,
            email_content.template_data
        )
        
        if immediate:
            # Send immediately
            message = MessageSchema(
                subject=email_content.subject,
                recipients=[email_to] if isinstance(email_to, str) else email_to,
                body=html,
                cc=cc or [],
                bcc=bcc or [],
                reply_to=reply_to or [],
                subtype=MessageType.html,
            )
            
            try:
                await fastmail.send_message(message)
                # Create tracking record
                tracking = await email_tracking.create_with_event(
                    db=db,
                    obj_in=EmailTrackingCreate(
                        email_id="immediate",
                        recipient=email_to if isinstance(email_to, str) else ",".join(email_to),
                        subject=email_content.subject,
                        template_name=email_content.template_name,
                        status=EmailStatus.SENT,
                    ),
                    event_type=EmailStatus.SENT,
                )
                return None
            except Exception as e:
                # Create failed tracking record
                tracking = await email_tracking.create_with_event(
                    db=db,
                    obj_in=EmailTrackingCreate(
                        email_id="immediate",
                        recipient=email_to if isinstance(email_to, str) else ",".join(email_to),
                        subject=email_content.subject,
                        template_name=email_content.template_name,
                        status=EmailStatus.FAILED,
                        error_message=str(e),
                    ),
                    event_type=EmailStatus.FAILED,
                )
                raise
        else:
            # Queue email for later sending
            email_id = await email_queue.enqueue(
                EmailQueueItem(
                    email_to=email_to if isinstance(email_to, str) else ",".join(email_to),
                    subject=email_content.subject,
                    template_name=email_content.template_name,
                    template_data=email_content.template_data,
                    cc=cc,
                    bcc=bcc,
                    reply_to=reply_to,
                )
            )
            
            # Create tracking record
            tracking = await email_tracking.create_with_event(
                db=db,
                obj_in=EmailTrackingCreate(
                    email_id=email_id,
                    recipient=email_to if isinstance(email_to, str) else ",".join(email_to),
                    subject=email_content.subject,
                    template_name=email_content.template_name,
                    status=EmailStatus.QUEUED,
                ),
                event_type=EmailStatus.QUEUED,
            )
            
            return email_id
            
    except ValueError as e:
        # Template validation error
        tracking = await email_tracking.create_with_event(
            db=db,
            obj_in=EmailTrackingCreate(
                email_id="validation_error",
                recipient=email_to if isinstance(email_to, str) else ",".join(email_to),
                subject=email_content.subject,
                template_name=email_content.template_name,
                status=EmailStatus.FAILED,
                error_message=str(e),
            ),
            event_type=EmailStatus.FAILED,
        )
        raise


async def send_test_email(db: AsyncSession, email_to: EmailStr) -> Optional[str]:
    """Send test email."""
    content = EmailContent(
        subject="Test email from NeoForge",
        template_name="test_email",
        template_data={
            "project_name": settings.project_name,
            "email": email_to,
        },
    )
    return await send_email(db=db, email_to=email_to, email_content=content, immediate=True)


async def send_reset_password_email(
    db: AsyncSession,
    email_to: EmailStr,
    token: str,
    priority: int = 1,
) -> Optional[str]:
    """Send reset password email."""
    content = EmailContent(
        subject=f"Password recovery for {settings.project_name}",
        template_name="reset_password",
        template_data={
            "project_name": settings.project_name,
            "username": email_to,
            "valid_hours": settings.email_reset_token_expire_hours,
            "reset_url": f"{settings.server_host}/reset-password?token={token}",
        },
    )
    return await send_email(
        db=db,
        email_to=email_to,
        email_content=content,
        priority=priority,
        immediate=settings.testing,  # Send immediately in test mode
    )


async def send_new_account_email(
    db: AsyncSession,
    email_to: EmailStr,
    username: str,
    password: str,
    priority: int = 1,
) -> Optional[str]:
    """Send new account email."""
    content = EmailContent(
        subject=f"New account for {settings.project_name}",
        template_name="new_account",
        template_data={
            "project_name": settings.project_name,
            "username": username,
            "password": password,
            "email": email_to,
            "login_url": settings.server_host,
        },
    )
    return await send_email(
        db=db,
        email_to=email_to,
        email_content=content,
        priority=priority,
        immediate=settings.testing,  # Send immediately in test mode
    )


async def send_admin_alert_email(
    db: AsyncSession,
    email_to: str | list[str],
    subject: str,
    action: str,
    details: Dict[str, Any],
    priority: int = 2,
) -> Optional[str]:
    """Send admin alert email."""
    content = EmailContent(
        subject=f"[ADMIN ALERT] {subject}",
        template_name="admin_alert",
        template_data={
            "project_name": settings.project_name,
            "action": action,
            "details": details,
            "admin_url": f"{settings.server_host}/admin",
        },
    )
    return await send_email(
        db=db,
        email_to=email_to,
        email_content=content,
        priority=priority,
        immediate=settings.testing,  # Send immediately in test mode
    ) 