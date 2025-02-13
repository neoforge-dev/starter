from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from redis import Redis
import os

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