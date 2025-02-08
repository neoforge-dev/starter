"""Celery configuration module."""
from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "neoforge",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.worker.email_worker"],
)

# Optional configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    worker_prefetch_multiplier=1,  # One task per worker
    worker_max_tasks_per_child=1000,  # Restart worker after 1000 tasks
)

# Optional task routing
celery_app.conf.task_routes = {
    "send_email": {"queue": "emails"},
}

# Optional task default configuration
celery_app.conf.task_default_queue = "default"
celery_app.conf.task_default_exchange = "default"
celery_app.conf.task_default_routing_key = "default" 