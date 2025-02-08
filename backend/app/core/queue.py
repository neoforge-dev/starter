"""Email queue module for asynchronous email processing."""
import json
from typing import Any, Dict, Optional
from redis.asyncio import Redis
from pydantic import BaseModel, EmailStr

from app.core.config import settings


class QueuedEmail(BaseModel):
    """Model for queued email."""
    email_to: str | list[str]
    subject: str
    template_name: str
    template_data: Dict[str, Any]
    cc: Optional[list[str]] = None
    bcc: Optional[list[str]] = None
    reply_to: Optional[list[str]] = None
    priority: int = 0  # Higher number = higher priority


class EmailQueue:
    """Redis-based email queue."""
    
    def __init__(self):
        """Initialize queue."""
        self.redis: Optional[Redis] = None
        self.queue_key = "email_queue"
        self.processing_key = "email_processing"
        self.failed_key = "email_failed"
    
    async def connect(self) -> None:
        """Connect to Redis."""
        if not self.redis:
            self.redis = Redis.from_url(settings.redis_url)
    
    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self.redis:
            await self.redis.close()
            self.redis = None
    
    async def enqueue(self, email: QueuedEmail) -> str:
        """Add email to queue."""
        await self.connect()
        # Generate unique ID for the email
        email_id = await self.redis.incr("email_id_counter")
        
        # Store email data
        email_data = email.model_dump_json()
        await self.redis.hset(self.queue_key, str(email_id), email_data)
        
        # Add to sorted set for priority queue
        await self.redis.zadd(
            f"{self.queue_key}:priority",
            {str(email_id): email.priority}
        )
        
        return str(email_id)
    
    async def dequeue(self) -> Optional[tuple[str, QueuedEmail]]:
        """Get next email from queue."""
        await self.connect()
        
        # Get highest priority email ID
        email_ids = await self.redis.zrevrange(
            f"{self.queue_key}:priority",
            0, 0
        )
        if not email_ids:
            return None
        
        email_id = email_ids[0].decode()
        
        # Get email data
        email_data = await self.redis.hget(self.queue_key, email_id)
        if not email_data:
            return None
        
        # Move to processing
        await self.redis.hdel(self.queue_key, email_id)
        await self.redis.zrem(f"{self.queue_key}:priority", email_id)
        await self.redis.hset(self.processing_key, email_id, email_data)
        
        return email_id, QueuedEmail.model_validate_json(email_data.decode())
    
    async def mark_completed(self, email_id: str) -> None:
        """Mark email as completed and remove from processing."""
        await self.connect()
        await self.redis.hdel(self.processing_key, email_id)
    
    async def mark_failed(self, email_id: str, error: str) -> None:
        """Mark email as failed and store error."""
        await self.connect()
        email_data = await self.redis.hget(self.processing_key, email_id)
        if email_data:
            # Add error info
            email_dict = json.loads(email_data.decode())
            email_dict["error"] = error
            email_dict["failed_at"] = "now()"  # You might want to use a proper timestamp
            
            # Move to failed queue
            await self.redis.hdel(self.processing_key, email_id)
            await self.redis.hset(self.failed_key, email_id, json.dumps(email_dict))
    
    async def retry_failed(self, email_id: str) -> bool:
        """Move failed email back to queue."""
        await self.connect()
        email_data = await self.redis.hget(self.failed_key, email_id)
        if not email_data:
            return False
        
        # Remove error info
        email_dict = json.loads(email_data.decode())
        email_dict.pop("error", None)
        email_dict.pop("failed_at", None)
        
        # Add back to queue
        await self.redis.hdel(self.failed_key, email_id)
        await self.redis.hset(self.queue_key, email_id, json.dumps(email_dict))
        
        # Add to priority queue
        await self.redis.zadd(
            f"{self.queue_key}:priority",
            {email_id: email_dict.get("priority", 0)}
        )
        
        return True
    
    async def get_queue_size(self) -> int:
        """Get number of emails in queue."""
        await self.connect()
        return await self.redis.hlen(self.queue_key)
    
    async def get_processing_size(self) -> int:
        """Get number of emails being processed."""
        await self.connect()
        return await self.redis.hlen(self.processing_key)
    
    async def get_failed_size(self) -> int:
        """Get number of failed emails."""
        await self.connect()
        return await self.redis.hlen(self.failed_key)


# Create global queue instance
email_queue = EmailQueue() 