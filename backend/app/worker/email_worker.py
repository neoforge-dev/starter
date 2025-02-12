"""Email worker for processing email queue with retry logic and bounce handling."""
import asyncio
import logging
from datetime import datetime, UTC, timedelta
from typing import Optional, Dict, Any
from enum import Enum
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.email_tracking import EmailTracking

from app.core.email import send_email, EmailContent
from app.core.queue import email_queue, EmailQueueItem
from app.crud.email_tracking import email_tracking
from app.models.email_tracking import EmailStatus
from app.schemas.email_tracking import EmailEventCreate, EmailTrackingCreate
from app.db.session import AsyncSessionLocal
from celery import Celery
from celery.exceptions import MaxRetriesExceededError
from app.core.email_templates import TemplateValidator

from app.core.celery import celery_app
from app.core.config import settings


logger = logging.getLogger(__name__)


class EmailError(Enum):
    """Email error types for better error handling."""
    TEMPLATE_ERROR = "template_error"
    VALIDATION_ERROR = "validation_error"
    SMTP_ERROR = "smtp_error"
    BOUNCE = "bounce"
    UNKNOWN = "unknown"


async def _get_db() -> AsyncSessionLocal:
    """Get database session."""
    async with AsyncSessionLocal() as session:
        yield session


def run_async(coro):
    """Run async coroutine in sync context."""
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(coro)


class EmailWorker:
    """Worker for processing email queue with retry logic."""
    
    def __init__(self, app: Optional[Celery] = None, queue=None):
        """Initialize worker."""
        self.running = False
        self.current_task: Optional[asyncio.Task] = None
        self.app = app or celery_app
        self.queue = queue or email_queue
        self.template_validator = TemplateValidator(settings.email_templates_dir)
        self.max_retries = 3

    def _get_retry_delay(self, retry_count: int) -> int:
        """Get exponential backoff delay in seconds."""
        # Start with 2 seconds delay and double it for each retry
        delay = 2 * (2 ** retry_count)  # Exponential backoff
        return min(300, delay)  # Max 5 minutes

    def _classify_error(self, error: Exception) -> tuple[EmailError, str]:
        """Classify error type and get message."""
        error_msg = str(error)
        error_type = EmailError.UNKNOWN

        if isinstance(error, ValueError) and "Template validation" in error_msg:
            error_type = EmailError.TEMPLATE_ERROR
        elif "SMTP" in error_msg:
            error_type = EmailError.SMTP_ERROR
        elif any(bounce_term in error_msg.lower() for bounce_term in ["bounce", "recipient address", "address rejected"]):
            error_type = EmailError.BOUNCE

        return error_type, error_msg

    async def _validate_template(self, template_name: str, template_data: Dict[str, Any]) -> None:
        """Validate email template."""
        try:
            if asyncio.iscoroutinefunction(self.template_validator.validate_template_data):
                await self.template_validator.validate_template_data(
                    template_name,
                    template_data,
                )
            else:
                self.template_validator.validate_template_data(
                    template_name,
                    template_data,
                )
        except Exception as e:
            # Don't add "Template validation failed" prefix if it's already there
            error_msg = str(e)
            if not error_msg.startswith("Template validation failed"):
                error_msg = f"Template validation failed: {error_msg}"
            raise ValueError(error_msg)

    async def _handle_error(
        self,
        db: AsyncSession,
        tracking: Optional[EmailTracking],
        email_id: str,
        error: Exception,
        retry_count: int = 0,
    ) -> bool:
        """Handle email processing error."""
        error_type, error_message = self._classify_error(error)
        
        if error_type == EmailError.SMTP_ERROR and retry_count < self.max_retries:
            # Update tracking status
            if tracking:
                await email_tracking.update_status(
                    db=db,
                    db_obj=tracking,
                    status=EmailStatus.QUEUED,
                    error_message=error_message,
                    tracking_metadata={"retry_count": retry_count + 1},
                )
            
            # Requeue with delay
            delay = self._get_retry_delay(retry_count)
            await self.queue.requeue(email_id, delay=delay)
            return False
        
        # Update tracking status for permanent failure
        if tracking:
            status = EmailStatus.BOUNCED if error_type == EmailError.BOUNCE else EmailStatus.FAILED
            await email_tracking.update_status(
                db=db,
                db_obj=tracking,
                status=status,
                error_message=error_message,
                tracking_metadata={"retry_count": retry_count, "error_type": error_type.value},
            )
        
        # Mark as failed in queue
        await self.queue.mark_failed(email_id, error_message)
        return False

    async def process_one(self) -> bool:
        """Process one email from the queue."""
        try:
            result = await self.queue.dequeue()
            if result is None:
                # No emails in queue, just return
                return True
            
            email_id, email = result
            if not email:
                return True
            
            # Get tracking record
            async with AsyncSessionLocal() as db:
                tracking = await email_tracking.get_by_email_id(db, email_id=email_id)
                
                # Create tracking record if it doesn't exist
                if not tracking:
                    tracking = await email_tracking.create_with_event(
                        db=db,
                        obj_in=EmailTrackingCreate(
                            email_id=email_id,
                            recipient=email.email_to,
                            subject=email.subject,
                            template_name=email.template_name,
                            status=EmailStatus.QUEUED,
                        ),
                        event_type=EmailStatus.QUEUED,
                    )
                    await db.commit()
                
                # Validate template data
                try:
                    if asyncio.iscoroutinefunction(self.template_validator.validate_template_data):
                        await self.template_validator.validate_template_data(
                            email.template_name, email.template_data
                        )
                    else:
                        self.template_validator.validate_template_data(
                            email.template_name, email.template_data
                        )
                except ValueError as e:
                    return await self._handle_error(db, tracking, email_id, e)
                
                # Get retry count from tracking metadata
                retry_count = 0
                if tracking is not None and tracking.tracking_metadata is not None:
                    retry_count = tracking.tracking_metadata.get("retry_count", 0)
                
                try:
                    # Send email
                    await send_email(
                        email_to=email.email_to,
                        subject=email.subject,
                        template_name=email.template_name,
                        template_data=email.template_data,
                    )
                    
                    # Update tracking status
                    if tracking:
                        await email_tracking.update_status(
                            db=db,
                            db_obj=tracking,
                            status=EmailStatus.SENT,
                        )
                        await email_tracking.update_status(
                            db=db,
                            db_obj=tracking,
                            status=EmailStatus.DELIVERED,
                        )
                    
                    # Mark as completed in queue
                    await self.queue.mark_completed(email_id)
                    return True
                
                except Exception as e:
                    return await self._handle_error(db, tracking, email_id, e, retry_count)
        
        except Exception as e:
            logger.error("Error processing email queue: %s", str(e), exc_info=True)
            # Add exponential backoff if needed
            await asyncio.sleep(1)
            return False
    
    async def run(self, interval: float = 1.0):
        """Run the worker continuously."""
        while self.running:
            try:
                # Process one email
                processed = await self.process_one()
                
                # If no email was processed, wait before checking again
                if not processed:
                    await asyncio.sleep(interval)
                    
            except Exception as e:
                logger.error(f"Error in email worker: {e}")
                await asyncio.sleep(interval)
    
    def start(self, interval: float = 1.0):
        """Start the worker in the background."""
        if self.current_task:
            return
        
        self.running = True
        self.current_task = asyncio.create_task(self.run(interval))
    
    def stop(self):
        """Stop the worker."""
        self.running = False
        if self.current_task:
            self.current_task.cancel()
            self.current_task = None


# Create global worker instance
email_worker = EmailWorker() 