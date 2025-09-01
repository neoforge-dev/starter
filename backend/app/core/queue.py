"""Email queue module for asynchronous email processing."""
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr
from redis.asyncio import Redis

from app.core.config import Settings, get_settings
from app.core.redis import redis_client

logger = logging.getLogger(__name__)


class EmailQueueItem(BaseModel):
    """Email queue item."""

    email_to: Union[str, List[str]]
    subject: str
    template_name: str
    template_data: Optional[Dict[str, Any]] = None
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None
    reply_to: Optional[List[str]] = None


class QueuedEmail(EmailQueueItem):
    """Queued email model."""

    model_config = ConfigDict(json_encoders={datetime: lambda dt: dt.isoformat()})

    id: str
    status: str = "queued"
    created_at: datetime = datetime.now()
    scheduled_for: Optional[datetime] = None
    error: Optional[str] = None


class EmailQueue:
    """Redis-based email queue with efficient lookups."""

    def __init__(self, redis: Optional[Redis] = None):
        """Initialize queue, ensuring a Redis client is available."""
        # Use the provided client, or the globally configured one
        self.redis = redis or redis_client
        if not self.redis:
            # This case should ideally not happen if redis_client is configured correctly
            # but as a fallback, create one using fetched settings.
            logger.warning(
                "Redis client not provided or globally configured, creating fallback instance."
            )
            current_settings = get_settings()
            self.redis = Redis.from_url(
                current_settings.redis_url, decode_responses=True
            )

        # Sorted sets for queue ordering (stores only IDs)
        self.queue_key = "email:queue"
        self.processing_key = "email:processing"
        self.completed_key = "email:completed"
        self.failed_key = "email:failed"
        # Hash set for O(1) email data lookups
        self.email_data_key = "email:data"

    async def enqueue(
        self,
        email: EmailQueueItem,
        delay: Optional[timedelta] = None,
    ) -> str:
        """Add email to queue."""
        try:
            # Generate unique ID
            email_id = str(UUID(int=int(datetime.now().timestamp() * 1000000)))

            # Create queued email
            queued_email = QueuedEmail(
                id=email_id,
                email_to=email.email_to,
                subject=email.subject,
                template_name=email.template_name,
                template_data=email.template_data,
                cc=email.cc,
                bcc=email.bcc,
                reply_to=email.reply_to,
                created_at=datetime.now(),
                scheduled_for=datetime.now() + delay if delay else None,
            )

            # Store email data in hash set
            await self.redis.hset(
                self.email_data_key, email_id, queued_email.model_dump_json()
            )

            # Add ID to queue sorted set
            scheduled_time = (
                queued_email.scheduled_for.timestamp()
                if queued_email.scheduled_for
                else datetime.now().timestamp()
            )
            await self.redis.zadd(self.queue_key, {email_id: scheduled_time})

            return email_id

        except Exception as e:
            logger.error(f"Error enqueueing email: {e}")
            raise

    async def dequeue(self) -> Optional[Tuple[str, EmailQueueItem]]:
        """Get next email from queue."""
        try:
            # Get next email ID ready to be processed
            now = datetime.now().timestamp()
            result = await self.redis.zrangebyscore(
                self.queue_key,
                min="-inf",
                max=now,
                start=0,
                num=1,
            )

            if not result:
                return None

            email_id = result[0]

            # Get email data from hash set
            email_data = await self.redis.hget(self.email_data_key, email_id)
            if not email_data:
                logger.error(f"Email data not found for ID {email_id}")
                await self.redis.zrem(self.queue_key, email_id)
                return None

            email_dict = json.loads(email_data)

            # Move ID to processing set
            await self.redis.zrem(self.queue_key, email_id)
            await self.redis.zadd(self.processing_key, {email_id: now})

            # Create queue item
            queue_item = EmailQueueItem(
                email_to=email_dict["email_to"],
                subject=email_dict["subject"],
                template_name=email_dict["template_name"],
                template_data=email_dict.get("template_data"),
                cc=email_dict.get("cc"),
                bcc=email_dict.get("bcc"),
                reply_to=email_dict.get("reply_to"),
            )

            return email_id, queue_item

        except Exception as e:
            logger.error(f"Error dequeuing email: {e}")
            return None

    async def mark_completed(self, email_id: str) -> None:
        """Mark email as completed."""
        try:
            # Get email data
            email_data = await self.redis.hget(self.email_data_key, email_id)
            if not email_data:
                logger.error(f"Email data not found for ID {email_id}")
                return

            # Update status
            email_dict = json.loads(email_data)
            email_dict["status"] = "completed"
            await self.redis.hset(self.email_data_key, email_id, json.dumps(email_dict))

            # Move ID to completed set
            await self.redis.zrem(self.processing_key, email_id)
            await self.redis.zadd(
                self.completed_key, {email_id: datetime.now().timestamp()}
            )

        except Exception as e:
            logger.error(f"Error marking email as completed: {e}")
            raise

    async def mark_failed(self, email_id: str, error: str) -> None:
        """Mark email as failed."""
        try:
            # Get email data
            email_data = await self.redis.hget(self.email_data_key, email_id)
            if not email_data:
                logger.error(f"Email data not found for ID {email_id}")
                return

            # Update status and error
            email_dict = json.loads(email_data)
            email_dict["status"] = "failed"
            email_dict["error"] = error
            await self.redis.hset(self.email_data_key, email_id, json.dumps(email_dict))

            # Move ID to failed set
            await self.redis.zrem(self.processing_key, email_id)
            await self.redis.zadd(
                self.failed_key, {email_id: datetime.now().timestamp()}
            )

        except Exception as e:
            logger.error(f"Error marking email as failed: {e}")
            raise

    async def requeue(
        self,
        email_id: str,
        delay: Optional[timedelta] = None,
    ) -> None:
        """Requeue a failed or processing email."""
        try:
            # Get email data
            email_data = await self.redis.hget(self.email_data_key, email_id)
            if not email_data:
                logger.error(f"Email data not found for ID {email_id}")
                return

            # Update status
            email_dict = json.loads(email_data)
            email_dict["status"] = "queued"
            email_dict["error"] = None
            await self.redis.hset(self.email_data_key, email_id, json.dumps(email_dict))

            # Remove from processing/failed sets
            await self.redis.zrem(self.processing_key, email_id)
            await self.redis.zrem(self.failed_key, email_id)

            # Add back to queue with delay
            scheduled_time = (
                datetime.now() + delay if delay else datetime.now()
            ).timestamp()
            await self.redis.zadd(self.queue_key, {email_id: scheduled_time})

        except Exception as e:
            logger.error(f"Error requeuing email: {e}")
            raise

    async def get_queue_size(self) -> int:
        """Get number of emails in queue."""
        return await self.redis.zcard(self.queue_key)

    async def get_processing_size(self) -> int:
        """Get number of emails being processed."""
        return await self.redis.zcard(self.processing_key)

    async def get_completed_size(self) -> int:
        """Get number of completed emails."""
        return await self.redis.zcard(self.completed_key)

    async def get_failed_size(self) -> int:
        """Get number of failed emails."""
        return await self.redis.zcard(self.failed_key)


# Create global queue instance
try:
    email_queue = EmailQueue()
except Exception as e:
    logger.error("Failed to initialize global email_queue instance", error=str(e))
    email_queue = None  # Ensure it's None if init fails
