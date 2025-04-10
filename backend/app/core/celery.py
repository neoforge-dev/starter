"""Celery configuration module."""
from celery import Celery
from app.core.config import Settings, get_settings
from datetime import timedelta

def create_celery_app(settings: Settings) -> Celery:
    """Create and configure the Celery application instance."""
    celery = Celery(
        "neoforge",
        broker=str(settings.redis_url),
        backend=str(settings.redis_url),
        include=["app.worker.email_worker"],
    )

    # Load Celery configuration from settings
    celery.conf.update(
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],
        timezone="UTC",
        enable_utc=True,
        broker_connection_retry_on_startup=True,
        result_expires=timedelta(days=1),
        result_extended=True,
        task_track_started=True,
        task_time_limit=30 * 60,
        worker_prefetch_multiplier=1,
        worker_max_tasks_per_child=1000,
        task_routes = {
            'send_email': {'queue': 'email'},
        },
        task_default_queue='default',
        task_default_exchange='default',
        task_default_routing_key='default',
    )
    return celery