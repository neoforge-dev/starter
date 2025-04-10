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
from datetime import timedelta

# Assuming settings are correctly loaded/mocked elsewhere for the test session
# If not, the test_settings fixture might need to be used more explicitly here.
from app.core.config import Settings, get_settings # Changed import
# Import celery_app AFTER potential patching or within tests where patching occurs
# from app.core.celery import celery_app 

@pytest.mark.usefixtures("test_settings") # Ensure test settings are applied if needed globally
def test_celery_app_initialization(test_settings: Settings): # Add test_settings
    """Test that the Celery app is initialized with correct settings."""
    # Import here to get the instance potentially affected by fixtures/settings overrides
    from app.core.celery import celery_app 
    assert celery_app.main == "neoforge"
    # Assert against the currently configured settings object for the test environment
    assert celery_app.conf.broker_url == str(test_settings.redis_url) # Use test_settings
    assert celery_app.conf.result_backend == str(test_settings.redis_url) # Use test_settings


def test_celery_app_configuration():
    """Test that the Celery app has the correct configuration."""
    from app.core.celery import celery_app # Import locally
    # Serialization settings
    assert celery_app.conf.task_serializer == "json"
    assert celery_app.conf.result_serializer == "json"
    assert celery_app.conf.accept_content == ["json"]
    # Timezone settings
    assert celery_app.conf.timezone == "UTC"
    assert celery_app.conf.enable_utc is True
    # Broker settings
    assert celery_app.conf.broker_connection_retry_on_startup is True
    # Result backend settings
    assert celery_app.conf.result_expires == timedelta(days=1)
    assert celery_app.conf.result_extended is True
    
    # Task execution settings
    assert celery_app.conf.task_track_started is True
    assert celery_app.conf.task_time_limit == 30 * 60  # 30 minutes
    
    # Worker settings
    assert celery_app.conf.worker_prefetch_multiplier == 1
    assert celery_app.conf.worker_max_tasks_per_child == 1000


def test_celery_task_routing():
    """Test that task routing is configured correctly."""
    from app.core.celery import celery_app # Import locally
    assert "send_email" in celery_app.conf.task_routes
    assert celery_app.conf.task_routes["send_email"] == {"queue": "email"}


def test_celery_default_queue_settings():
    """Test that default queue settings are configured correctly."""
    from app.core.celery import celery_app # Import locally
    assert celery_app.conf.task_default_queue == "default"
    assert celery_app.conf.task_default_exchange == "default"
    assert celery_app.conf.task_default_routing_key == "default"


@patch('app.core.celery.Celery') # Patch Celery class itself
def test_celery_app_creation(mock_Celery): # Removed mock_settings arg
    """Test that the Celery app is created with the correct parameters using patching."""
    # Create a mock Settings object manually
    mock_settings_obj = MagicMock(spec=Settings)
    mock_redis_url = "redis://mocked-redis:6379/1"
    mock_settings_obj.redis_url = mock_redis_url
    
    # Mock the return value of Celery() call
    mock_celery_instance = MagicMock()
    mock_Celery.return_value = mock_celery_instance

    # Import the factory function AFTER patching
    from app.core.celery import create_celery_app

    # Call the factory function - pass the mock settings object
    created_app = create_celery_app(mock_settings_obj)

    # Verify Celery was called with correct parameters from mocked settings
    mock_Celery.assert_called_once_with(
        "neoforge",
        broker=mock_redis_url,
        backend=mock_redis_url,
        include=["app.worker.email_worker"],
    )

    # Verify the returned app is the mocked instance
    assert created_app is mock_celery_instance

    # Verify configuration was applied (optional, depends on factory logic)
    # Check if conf.update was called on the instance
    mock_celery_instance.conf.update.assert_called_once()
    # Can add more detailed checks on the update args if needed