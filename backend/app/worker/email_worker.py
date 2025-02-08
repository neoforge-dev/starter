"""Email worker for processing email queue."""
import asyncio
import logging
from datetime import datetime, UTC
from typing import Optional, Dict

from app.core.email import send_email, EmailContent
from app.core.queue import email_queue
from app.crud.email_tracking import email_tracking
from app.models.email_tracking import EmailStatus
from app.schemas.email_tracking import EmailEventCreate, EmailTrackingCreate
from app.db.session import AsyncSessionLocal
from celery import Celery

from app.core.celery import celery_app
from app.core.config import settings


logger = logging.getLogger(__name__)


async def _get_db() -> AsyncSessionLocal:
    """Get database session."""
    async with AsyncSessionLocal() as session:
        yield session


def run_async(coro):
    """Run async coroutine in sync context."""
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(coro)


class EmailWorker:
    """Worker for processing email queue."""
    
    def __init__(self, app: Optional[Celery] = None, queue=None):
        """Initialize worker."""
        self.running = False
        self.current_task: Optional[asyncio.Task] = None
        self.app = app or celery_app
        self.queue = queue or email_queue
        self.register_tasks()
    
    def register_tasks(self):
        """Register Celery tasks."""

        @self.app.task(name="send_email")
        def send_email_task(
            recipients: str,
            template_name: str,
            subject: str,
            body_params: Optional[Dict] = None,
        ) -> None:
            """Send email task."""
            async def _send():
                try:
                    # Create email content
                    content = EmailContent(
                        recipients=recipients,
                        template_name=template_name,
                        subject=subject,
                        body_params=body_params or {},
                    )

                    # Send email
                    email_id = await send_email(content)

                    # Update tracking record
                    if email_id:
                        async for db in _get_db():
                            tracking = await email_tracking.get_by_email_id(
                                db, email_id=email_id
                            )
                            if tracking:
                                await email_tracking.update_status(
                                    db,
                                    db_obj=tracking,
                                    status=EmailStatus.SENT,
                                )

                except Exception as e:
                    error_msg = f"Failed to send email: {str(e)}"
                    if email_id:
                        async for db in _get_db():
                            tracking = await email_tracking.get_by_email_id(
                                db, email_id=email_id
                            )
                            if tracking:
                                await email_tracking.update_status(
                                    db,
                                    db_obj=tracking,
                                    status=EmailStatus.FAILED,
                                    error_message=error_msg,
                                    tracking_metadata={"error": error_msg},
                                )
                    raise

            # Run async code in sync context
            run_async(_send())
    
    async def process_one(self) -> bool:
        """Process one email from the queue."""
        try:
            result = await self.queue.dequeue()
            if result is None:
                return False
            
            email_id, email = result
            
            # Create email content
            email_content = EmailContent(
                to=email.email_to,
                subject=email.subject,
                template_name=email.template_name,
                template_data=email.template_data,
            )

            async with AsyncSessionLocal() as db:
                # Get or create tracking record
                tracking = await email_tracking.get_by_email_id(db, email_id=email_id)
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

                try:
                    # Send email
                    await send_email(
                        db=db,
                        email_id=email_id,
                        email_content=email_content,
                    )
                    
                    # Update tracking status
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
                    error_msg = str(e)
                    # Update tracking status
                    await email_tracking.update_status(
                        db=db,
                        db_obj=tracking,
                        status=EmailStatus.FAILED,
                        error_message=error_msg,
                        tracking_metadata={"error": error_msg},
                    )
                    # Mark as failed in queue
                    await self.queue.mark_failed(email_id, error_msg)
                    return False

        except Exception as e:
            logger.error(f"Error processing email queue: {e}")
            return False
    
    async def run(self, interval: float = 1.0):
        """Run the worker continuously."""
        self.running = True
        
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
        
        self.current_task = asyncio.create_task(self.run(interval))
    
    def stop(self):
        """Stop the worker."""
        self.running = False
        if self.current_task:
            self.current_task.cancel()
            self.current_task = None


# Create global worker instance
email_worker = EmailWorker() 