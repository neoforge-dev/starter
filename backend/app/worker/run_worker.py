#!/usr/bin/env python
"""
Standalone Email Worker Process

This script runs the email worker as a standalone process, separate from the main API.
It continuously processes emails from the queue until stopped.

Usage:
    python -m app.worker.run_worker
"""
import asyncio
import signal
import sys
import structlog
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.redis import redis_client
from app.core.queue import EmailQueue
from app.worker.email_worker import EmailWorker

# Set up structured logging
setup_logging(settings.model_dump())
logger = structlog.get_logger()

# Create email worker
email_queue = None
email_worker = None

async def init():
    """Initialize the email worker."""
    global email_queue, email_worker
    
    # Initialize Redis connection
    try:
        await redis_client.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.error("Failed to connect to Redis", error=str(e))
        sys.exit(1)
    
    # Initialize email queue
    email_queue = EmailQueue(redis=redis_client)
    await email_queue.connect()
    
    # Initialize and start email worker
    email_worker = EmailWorker(queue=email_queue)
    email_worker.start()
    
    logger.info(
        "email_worker_started",
        environment=settings.environment,
    )

async def shutdown():
    """Shutdown the email worker."""
    global email_queue, email_worker
    
    if email_worker:
        email_worker.stop()
        logger.info("Email worker stopped")
    
    if email_queue:
        await email_queue.disconnect()
        logger.info("Email queue disconnected")
    
    await redis_client.close()
    logger.info("Redis connection closed")
    
    logger.info("email_worker_shutdown")

async def main():
    """Main entry point for the email worker."""
    await init()
    
    # Set up signal handlers
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda: asyncio.create_task(shutdown()))
    
    # Keep the process running until shutdown
    try:
        # Run forever until interrupted
        while email_worker and email_worker.is_running:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        pass
    finally:
        await shutdown()

if __name__ == "__main__":
    asyncio.run(main()) 