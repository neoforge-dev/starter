import logging
from app.db.session import AsyncSessionLocal
from app.core.email import send_email

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
    def __init__(self, queue):
        self.queue = queue

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
                )
                
            return True

        except Exception as e:
            logger.error(f"Error processing email queue: {e}")
            return False

# Create a singleton instance of EmailWorker. The actual queue should be set properly in production.
email_worker = EmailWorker(queue=None) 