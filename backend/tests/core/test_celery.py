"""
Test Celery configuration module.

This test verifies that the Celery app is configured correctly, including:
- Initialization with correct settings
- Configuration parameters
- Task routing
- Default queue settings

All tests use mocking to avoid actual Celery connections.
"""

from datetime import timedelta
from unittest.mock import MagicMock, patch

import pytest
from celery import Celery

# Import the factory function
from app.core.celery import create_celery_app
from app.core.config import Environment, Settings, get_settings

# Import the test_settings fixture implicitly via usefixtures or explicitly if needed
from tests.conftest import test_settings


@pytest.mark.usefixtures("test_settings")
def test_celery_app_initialization(test_settings: Settings):
    """Test that the Celery app is initialized with correct settings via factory."""
    # Create app using factory and test settings
    celery_app_instance = create_celery_app(test_settings)
    assert celery_app_instance.main == "neoforge"
    assert celery_app_instance.conf.broker_url == str(test_settings.redis_url)
    assert celery_app_instance.conf.result_backend == str(test_settings.redis_url)


@pytest.mark.usefixtures("test_settings")
def test_celery_app_configuration(test_settings: Settings):
    """Test that the Celery app has the correct configuration via factory."""
    # Create app using factory and test settings
    celery_app_instance = create_celery_app(test_settings)
    # Serialization settings
    assert celery_app_instance.conf.task_serializer == "json"
    assert celery_app_instance.conf.result_serializer == "json"
    assert celery_app_instance.conf.accept_content == ["json"]
    # Timezone settings
    assert celery_app_instance.conf.timezone == "UTC"
    assert celery_app_instance.conf.enable_utc is True
    # Broker settings
    assert celery_app_instance.conf.broker_connection_retry_on_startup is True
    # Result backend settings
    assert celery_app_instance.conf.result_expires == timedelta(days=1)
    assert celery_app_instance.conf.result_extended is True
    # Task execution settings
    assert celery_app_instance.conf.task_track_started is True
    assert celery_app_instance.conf.task_time_limit == 30 * 60  # 30 minutes
    # Worker settings
    assert celery_app_instance.conf.worker_prefetch_multiplier == 1
    assert celery_app_instance.conf.worker_max_tasks_per_child == 1000


@pytest.mark.usefixtures("test_settings")
def test_celery_task_routing(test_settings: Settings):
    """Test that task routing is configured correctly via factory."""
    # Create app using factory and test settings
    celery_app_instance = create_celery_app(test_settings)
    assert "send_email" in celery_app_instance.conf.task_routes
    assert celery_app_instance.conf.task_routes["send_email"] == {"queue": "email"}


@pytest.mark.usefixtures("test_settings")
def test_celery_default_queue_settings(test_settings: Settings):
    """Test that default queue settings are configured correctly via factory."""
    # Create app using factory and test settings
    celery_app_instance = create_celery_app(test_settings)
    assert celery_app_instance.conf.task_default_queue == "default"
    assert celery_app_instance.conf.task_default_exchange == "default"
    assert celery_app_instance.conf.task_default_routing_key == "default"


@patch("app.core.celery.Celery")
def test_celery_app_factory_mocking(mock_Celery):
    """Test the factory function with mocking the Celery class itself."""
    # Create mock Settings
    mock_settings_obj = MagicMock(spec=Settings)
    mock_redis_url = "redis://mocked-redis:6379/1"
    mock_settings_obj.redis_url = mock_redis_url

    # Mock return value of Celery()
    mock_celery_instance = MagicMock()
    # Configure the mock instance's conf attribute to be a MagicMock as well
    mock_celery_instance.conf = MagicMock()
    mock_Celery.return_value = mock_celery_instance

    # Call the factory
    created_app = create_celery_app(mock_settings_obj)

    # Verify Celery class was called
    mock_Celery.assert_called_once_with(
        "neoforge",
        broker=mock_redis_url,
        backend=mock_redis_url,
        include=["app.worker.email_worker"],
    )
    # Verify the returned app is the mocked instance
    assert created_app is mock_celery_instance
    # Verify conf.update was called on the mock instance
    mock_celery_instance.conf.update.assert_called_once()
