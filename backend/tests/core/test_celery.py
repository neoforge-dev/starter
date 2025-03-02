"""
Test Celery configuration module.

This test verifies that the Celery app is configured correctly, including:
- Initialization with correct settings
- Configuration parameters
- Task routing
- Default queue settings

All tests use mocking to avoid actual Celery connections.
"""

import pytest
from unittest.mock import patch, MagicMock

from app.core.celery import celery_app
from app.core.config import settings


def test_celery_app_initialization():
    """Test that the Celery app is initialized with correct settings."""
    assert celery_app.main == "neoforge"
    assert celery_app.conf.broker_url == settings.redis_url
    assert celery_app.conf.result_backend == settings.redis_url
    assert "app.worker.email_worker" in celery_app.conf.imports


def test_celery_app_configuration():
    """Test that the Celery app has the correct configuration."""
    # Serialization settings
    assert celery_app.conf.task_serializer == "json"
    assert "json" in celery_app.conf.accept_content
    assert celery_app.conf.result_serializer == "json"
    
    # Time settings
    assert celery_app.conf.timezone == "UTC"
    assert celery_app.conf.enable_utc is True
    
    # Task execution settings
    assert celery_app.conf.task_track_started is True
    assert celery_app.conf.task_time_limit == 30 * 60  # 30 minutes
    
    # Worker settings
    assert celery_app.conf.worker_prefetch_multiplier == 1
    assert celery_app.conf.worker_max_tasks_per_child == 1000


def test_celery_task_routing():
    """Test that task routing is configured correctly."""
    assert "send_email" in celery_app.conf.task_routes
    assert celery_app.conf.task_routes["send_email"] == {"queue": "emails"}


def test_celery_default_queue_settings():
    """Test that default queue settings are configured correctly."""
    assert celery_app.conf.task_default_queue == "default"
    assert celery_app.conf.task_default_exchange == "default"
    assert celery_app.conf.task_default_routing_key == "default"


@patch('app.core.celery.Celery')
def test_celery_app_creation(mock_celery):
    """Test that the Celery app is created with the correct parameters."""
    # This test requires re-importing the module to trigger the mocked Celery
    mock_celery_instance = MagicMock()
    mock_celery.return_value = mock_celery_instance
    
    # Force reload of the module to trigger the mocked Celery
    import importlib
    import app.core.celery
    importlib.reload(app.core.celery)
    
    # Verify Celery was called with correct parameters
    mock_celery.assert_called_once_with(
        "neoforge",
        broker=settings.redis_url,
        backend=settings.redis_url,
        include=["app.worker.email_worker"],
    )
    
    # Verify configuration was updated
    mock_celery_instance.conf.update.assert_called_once()
    
    # Clean up by reloading the original module
    importlib.reload(app.core.celery) 