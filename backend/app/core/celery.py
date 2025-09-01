"""Celery configuration module."""
from datetime import timedelta

from celery import Celery

from app.core.config import Settings, get_settings


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
        task_time_limit=30 * 60,  # 30 minutes
        task_soft_time_limit=25 * 60,  # 25 minutes soft limit
        worker_prefetch_multiplier=1,
        worker_max_tasks_per_child=1000,
        # Task retry configuration
        task_default_retry_delay=60,  # 1 minute
        task_max_retries=3,
        # Worker configuration
        worker_log_format="[%(asctime)s: %(levelname)s/%(processName)s] %(message)s",
        worker_task_log_format="[%(asctime)s: %(levelname)s/%(processName)s][%(task_name)s(%(task_id)s)] %(message)s",
        task_routes={
            "app.worker.email_worker.send_welcome_email_task": {"queue": "email"},
            "app.worker.email_worker.send_verification_email_task": {"queue": "email"},
            "app.worker.email_worker.send_password_reset_email_task": {
                "queue": "email"
            },
        },
        task_default_queue="default",
        task_default_exchange="default",
        task_default_routing_key="default",
    )
    return celery


# Create global Celery app instance
settings = get_settings()
celery_app = create_celery_app(settings)
