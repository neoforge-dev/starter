import logging
import asyncio
from typing import Optional
from app.db.session import AsyncSessionLocal
from app.core.email import send_email
from app.core.queue import EmailQueue
from app.core.config import get_settings

try:
    from app.models.email_content import EmailContent
except ImportError:
    class EmailContent:
        def __init__(self, to, subject, template_name, template_data):
            self.to = to
            self.subject = subject
            self.template_name = template_name
            self.template_data = template_data

logger = logging.getLogger(__name__)

class EmailWorker:
    def __init__(self, queue: Optional[EmailQueue] = None):
        self.queue = queue
        self.is_running = False
        self.processing_task = None
        self.max_retries = 3
        self.retry_delay = 5  # seconds
        self.processing_interval = 1  # seconds

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

            # Send email
            async with AsyncSessionLocal() as db:
                await send_email(
                    db=db,
                    email_id=email_id,
                    email_content=email_content,
                    settings=get_settings()
                )
                
            # Mark as completed
            await self.queue.mark_completed(email_id)
            logger.info(f"Email {email_id} processed successfully")
            return True

        except Exception as e:
            logger.error(f"Error processing email queue: {e}")
            if result and email_id:
                try:
                    await self.queue.mark_failed(email_id, str(e))
                    logger.info(f"Email {email_id} marked as failed: {e}")
                except Exception as mark_error:
                    logger.error(f"Error marking email as failed: {mark_error}")
            return False
    
    async def _process_loop(self):
        """Continuously process emails from the queue."""
        logger.info("Email processing loop started")
        while self.is_running:
            try:
                processed = await self.process_one()
                if not processed:
                    # If no email was processed, wait a bit before trying again
                    await asyncio.sleep(self.processing_interval)
            except Exception as e:
                logger.error(f"Error in email processing loop: {e}")
                # Wait a bit before trying again
                await asyncio.sleep(self.retry_delay)
        logger.info("Email processing loop stopped")
            
    def start(self):
        """Start the email worker."""
        if self.is_running:
            logger.warning("Email worker is already running")
            return
            
        if not self.queue:
            logger.error("Cannot start email worker: queue is not set")
            return
            
        logger.info("Starting email worker")
        self.is_running = True
        
        # Start the processing loop as a background task
        self.processing_task = asyncio.create_task(self._process_loop())
        
    def stop(self):
        """Stop the email worker."""
        if not self.is_running:
            logger.warning("Email worker is not running")
            return
            
        logger.info("Stopping email worker")
        self.is_running = False
        
        # Cancel the processing task if it exists
        if self.processing_task:
            self.processing_task.cancel()

# Create a singleton instance of EmailWorker. The actual queue will be set in main.py
email_worker = EmailWorker() 