import logging
import asyncio
from typing import Optional, Dict, Any
from celery import Task
from app.db.session import AsyncSessionLocal
from app.core.email import send_email, EmailContent
from app.core.config import get_settings
from app.core.celery import celery_app

logger = logging.getLogger(__name__)

class AsyncTask(Task):
    """Custom Celery task that supports async operations."""
    
    def __call__(self, *args, **kwargs):
        """Override to handle async tasks."""
        return asyncio.run(self._async_call(*args, **kwargs))
    
    async def _async_call(self, *args, **kwargs):
        """Async wrapper for task execution."""
        return await self.run_async(*args, **kwargs)
    
    async def run_async(self, *args, **kwargs):
        """Override this method in subclasses for async task logic."""
        raise NotImplementedError("Async tasks must implement run_async method")

@celery_app.task(name="send_welcome_email_task", bind=True, max_retries=3, default_retry_delay=60)
def send_welcome_email_task(self, user_email: str, user_name: str, verification_token: str) -> dict:
    """Celery task to send welcome email with verification link."""
    try:
        return asyncio.run(_send_welcome_email_async(user_email, user_name, verification_token))
    except Exception as e:
        logger.error(f"Error sending welcome email to {user_email}: {e}")
        # Retry with exponential backoff
        countdown = 2 ** self.request.retries * 60  # 60s, 120s, 240s
        raise self.retry(exc=e, countdown=countdown)

@celery_app.task(name="send_verification_email_task", bind=True, max_retries=3, default_retry_delay=60)
def send_verification_email_task(self, user_email: str, user_name: str, verification_token: str) -> dict:
    """Celery task to send email verification link."""
    try:
        return asyncio.run(_send_verification_email_async(user_email, user_name, verification_token))
    except Exception as e:
        logger.error(f"Error sending verification email to {user_email}: {e}")
        countdown = 2 ** self.request.retries * 60
        raise self.retry(exc=e, countdown=countdown)

@celery_app.task(name="send_password_reset_email_task", bind=True, max_retries=3, default_retry_delay=60)
def send_password_reset_email_task(self, user_email: str, user_name: str, reset_token: str) -> dict:
    """Celery task to send password reset email."""
    try:
        return asyncio.run(_send_password_reset_email_async(user_email, user_name, reset_token))
    except Exception as e:
        logger.error(f"Error sending password reset email to {user_email}: {e}")
        countdown = 2 ** self.request.retries * 60
        raise self.retry(exc=e, countdown=countdown)

# Async helper functions that the tasks call
async def _send_welcome_email_async(user_email: str, user_name: str, verification_token: str) -> dict:
    """Send welcome email asynchronously."""
    settings = get_settings()
    
    # Create email content
    email_content = EmailContent(
        to=user_email,
        subject="Welcome to NeoForge!",
        template_name="welcome.html",
        template_data={
            "username": user_name,
            "verify_link": f"{settings.frontend_url}/verify-email?token={verification_token}",
            "valid_hours": 24
        }
    )
    
    # Send email using existing email service
    async with AsyncSessionLocal() as db:
        await send_email(
            db=db,
            email_id=f"welcome_{user_email}_{verification_token[:8]}",
            email_content=email_content,
            settings=settings
        )
    
    logger.info(f"Welcome email sent successfully to {user_email}")
    return {"status": "success", "email": user_email, "type": "welcome"}

async def _send_verification_email_async(user_email: str, user_name: str, verification_token: str) -> dict:
    """Send verification email asynchronously."""
    settings = get_settings()
    
    email_content = EmailContent(
        to=user_email,
        subject="Verify Your Email Address",
        template_name="welcome.html",  # Reuse welcome template
        template_data={
            "username": user_name,
            "verify_link": f"{settings.frontend_url}/verify-email?token={verification_token}",
            "valid_hours": 24
        }
    )
    
    async with AsyncSessionLocal() as db:
        await send_email(
            db=db,
            email_id=f"verify_{user_email}_{verification_token[:8]}",
            email_content=email_content,
            settings=settings
        )
    
    logger.info(f"Verification email sent successfully to {user_email}")
    return {"status": "success", "email": user_email, "type": "verification"}

async def _send_password_reset_email_async(user_email: str, user_name: str, reset_token: str) -> dict:
    """Send password reset email asynchronously."""
    settings = get_settings()
    
    email_content = EmailContent(
        to=user_email,
        subject="Password Reset Request",
        template_name="reset_password.html",
        template_data={
            "username": user_name,
            "reset_url": f"{settings.frontend_url}/reset-password?token={reset_token}",
            "reset_link": f"{settings.frontend_url}/reset-password?token={reset_token}",
            "valid_hours": 24,
            "project_name": settings.app_name
        }
    )
    
    async with AsyncSessionLocal() as db:
        await send_email(
            db=db,
            email_id=f"reset_{user_email}_{reset_token[:8]}",
            email_content=email_content,
            settings=settings
        )
    
    logger.info(f"Password reset email sent successfully to {user_email}")
    return {"status": "success", "email": user_email, "type": "password_reset"}