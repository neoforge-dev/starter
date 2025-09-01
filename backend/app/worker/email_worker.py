import asyncio
import logging
from typing import TYPE_CHECKING, Any, Dict, Optional

from app.db.session import AsyncSessionLocal
from celery import Task

from app.core.celery import celery_app
from app.core.config import get_settings
from app.core.email import EmailContent, send_email

if TYPE_CHECKING:
    from app.core.queue import EmailQueue

logger = logging.getLogger(__name__)


def _setup_trace_context(traceparent: Optional[str] = None):
    """Set up tracing context in Celery worker if traceparent provided."""
    if not traceparent:
        return

    try:
        from opentelemetry import trace
        from opentelemetry.trace.propagation.tracecontext import (
            TraceContextTextMapPropagator,
        )

        # Parse traceparent header and set as current span context
        propagator = TraceContextTextMapPropagator()
        carrier = {"traceparent": traceparent}
        context = propagator.extract(carrier)

        # Set extracted context as current
        token = context.attach()
        return token
    except ImportError:
        # OpenTelemetry not available, skip tracing
        pass
    except Exception as e:
        logger.debug(f"Failed to setup trace context: {e}")

    return None


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


@celery_app.task(
    name="send_welcome_email_task", bind=True, max_retries=3, default_retry_delay=60
)
def send_welcome_email_task(
    self,
    user_email: str,
    user_name: str,
    verification_token: str,
    traceparent: Optional[str] = None,
) -> dict:
    """Celery task to send welcome email with verification link."""
    # Set up tracing context if provided
    trace_token = _setup_trace_context(traceparent)

    try:
        # Add trace span around email sending
        try:
            from opentelemetry import trace

            tracer = trace.get_tracer(__name__)
            with tracer.start_as_current_span("send_welcome_email_task") as span:
                span.set_attribute("user.email", user_email)
                span.set_attribute("task.type", "welcome_email")
                result = asyncio.run(
                    _send_welcome_email_async(user_email, user_name, verification_token)
                )
                span.set_attribute("email.sent", True)
                return result
        except ImportError:
            # No tracing available, proceed normally
            return asyncio.run(
                _send_welcome_email_async(user_email, user_name, verification_token)
            )
    except Exception as e:
        logger.error(f"Error sending welcome email to {user_email}: {e}")
        # Retry with exponential backoff
        countdown = 2**self.request.retries * 60  # 60s, 120s, 240s
        raise self.retry(exc=e, countdown=countdown)
    finally:
        # Clean up trace context
        if trace_token:
            trace_token.detach()


@celery_app.task(
    name="send_verification_email_task",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_verification_email_task(
    self,
    user_email: str,
    user_name: str,
    verification_token: str,
    traceparent: Optional[str] = None,
) -> dict:
    """Celery task to send email verification link."""
    # Set up tracing context if provided
    trace_token = _setup_trace_context(traceparent)

    try:
        # Add trace span around email sending
        try:
            from opentelemetry import trace

            tracer = trace.get_tracer(__name__)
            with tracer.start_as_current_span("send_verification_email_task") as span:
                span.set_attribute("user.email", user_email)
                span.set_attribute("task.type", "verification_email")
                result = asyncio.run(
                    _send_verification_email_async(
                        user_email, user_name, verification_token
                    )
                )
                span.set_attribute("email.sent", True)
                return result
        except ImportError:
            # No tracing available, proceed normally
            return asyncio.run(
                _send_verification_email_async(
                    user_email, user_name, verification_token
                )
            )
    except Exception as e:
        logger.error(f"Error sending verification email to {user_email}: {e}")
        countdown = 2**self.request.retries * 60
        raise self.retry(exc=e, countdown=countdown)
    finally:
        # Clean up trace context
        if trace_token:
            trace_token.detach()


@celery_app.task(
    name="send_password_reset_email_task",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_password_reset_email_task(
    self, user_email: str, user_name: str, reset_token: str
) -> dict:
    """Celery task to send password reset email."""
    try:
        return asyncio.run(
            _send_password_reset_email_async(user_email, user_name, reset_token)
        )
    except Exception as e:
        logger.error(f"Error sending password reset email to {user_email}: {e}")
        countdown = 2**self.request.retries * 60
        raise self.retry(exc=e, countdown=countdown)


# Async helper functions that the tasks call
async def _send_welcome_email_async(
    user_email: str, user_name: str, verification_token: str
) -> dict:
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
            "valid_hours": 24,
        },
    )

    # Send email using existing email service
    async with AsyncSessionLocal() as db:
        await send_email(
            db=db,
            email_id=f"welcome_{user_email}_{verification_token[:8]}",
            email_content=email_content,
            settings=settings,
        )

    logger.info(f"Welcome email sent successfully to {user_email}")
    return {"status": "success", "email": user_email, "type": "welcome"}


async def _send_verification_email_async(
    user_email: str, user_name: str, verification_token: str
) -> dict:
    """Send verification email asynchronously."""
    settings = get_settings()

    email_content = EmailContent(
        to=user_email,
        subject="Verify Your Email Address",
        template_name="welcome.html",  # Reuse welcome template
        template_data={
            "username": user_name,
            "verify_link": f"{settings.frontend_url}/verify-email?token={verification_token}",
            "valid_hours": 24,
        },
    )

    async with AsyncSessionLocal() as db:
        await send_email(
            db=db,
            email_id=f"verify_{user_email}_{verification_token[:8]}",
            email_content=email_content,
            settings=settings,
        )

    logger.info(f"Verification email sent successfully to {user_email}")
    return {"status": "success", "email": user_email, "type": "verification"}


async def _send_password_reset_email_async(
    user_email: str, user_name: str, reset_token: str
) -> dict:
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
            "project_name": settings.app_name,
        },
    )

    async with AsyncSessionLocal() as db:
        await send_email(
            db=db,
            email_id=f"reset_{user_email}_{reset_token[:8]}",
            email_content=email_content,
            settings=settings,
        )

    logger.info(f"Password reset email sent successfully to {user_email}")
    return {"status": "success", "email": user_email, "type": "password_reset"}


class EmailWorker:
    """Email worker that processes emails from a queue."""

    def __init__(self, queue: Optional["EmailQueue"] = None):
        """Initialize the email worker with a queue."""
        self.queue = queue
        self.is_running = False
        self.processing_task: Optional[asyncio.Task] = None
        self.processing_interval = 1.0  # seconds between processing attempts
        self.error_interval = 5.0  # seconds to wait after errors

    async def process_one(self) -> bool:
        """Process one email from the queue.

        Returns:
            bool: True if an email was processed, False if queue was empty
        """
        if not self.queue:
            logger.warning("No queue configured for EmailWorker")
            return False

        try:
            # Get next email from queue
            result = await self.queue.dequeue()
            if not result:
                return False  # Queue is empty

            email_id, email_item = result
            logger.info(f"Processing email {email_id} to {email_item.email_to}")

            # Convert queue item to EmailContent
            email_content = EmailContent(
                to=email_item.email_to,
                subject=email_item.subject,
                template_name=email_item.template_name,
                template_data=email_item.template_data or {},
            )

            # Send the email
            async with AsyncSessionLocal() as db:
                await send_email(
                    db=db,
                    email_id=email_id,
                    email_content=email_content,
                    settings=get_settings(),
                )

            # Mark as completed
            await self.queue.mark_completed(email_id)
            logger.info(f"Successfully processed email {email_id}")
            return True

        except Exception as e:
            logger.error(
                f"Error processing email {email_id if 'email_id' in locals() else 'unknown'}: {e}"
            )
            if "email_id" in locals():
                await self.queue.mark_failed(email_id, str(e))
            return False

    def start(self) -> None:
        """Start the email worker."""
        if not self.queue:
            logger.warning("Cannot start EmailWorker without a queue")
            return

        if self.is_running:
            logger.warning("EmailWorker is already running")
            return

        self.is_running = True
        self.processing_task = asyncio.create_task(self._process_loop())
        logger.info("EmailWorker started")

    def stop(self) -> None:
        """Stop the email worker."""
        if not self.is_running:
            return

        self.is_running = False
        if self.processing_task:
            self.processing_task.cancel()
        logger.info("EmailWorker stopped")

    async def _process_loop(self) -> None:
        """Main processing loop."""
        while self.is_running:
            try:
                try:
                    processed = await self.process_one()
                    if processed:
                        # If we processed an email, check for more soon
                        await asyncio.sleep(self.processing_interval * 0.1)
                    else:
                        # If queue was empty, wait longer before checking again
                        await asyncio.sleep(self.processing_interval)
                except Exception as e:
                    # Handle errors from process_one but continue loop
                    logger.error(f"Error in EmailWorker processing loop: {e}")
                    await asyncio.sleep(self.error_interval)
                    # Continue with the loop after error

            except asyncio.CancelledError:
                logger.info("EmailWorker processing loop cancelled")
                break

        self.is_running = False
