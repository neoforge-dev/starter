"""
Test logging module functionality.

This test verifies that the logging module works correctly, including:
- Logging setup
- Custom processors
- Log level configuration
"""

import pytest
import logging
import json
import time
from unittest.mock import patch, MagicMock, call
import structlog
from structlog.types import EventDict

from app.core.logging import (
    add_timestamp,
    add_environment,
    setup_logging,
)


def test_add_timestamp():
    """Test that add_timestamp adds a timestamp to the event dict."""
    # Create a sample event dict
    event_dict = {"event": "test_event", "level": "info"}
    
    # Apply the processor
    result = add_timestamp(None, None, event_dict)
    
    # Verify timestamp was added
    assert "timestamp" in result
    assert isinstance(result["timestamp"], float)
    assert result["timestamp"] > 0


def test_add_environment():
    """Test that add_environment adds environment info to the event dict."""
    # Create a sample config
    config = {
        "environment": "testing",
        "version": "1.0.0"
    }
    
    # Create the processor
    processor = add_environment(config)
    
    # Create a sample event dict
    event_dict = {"event": "test_event", "level": "info"}
    
    # Apply the processor
    result = processor(None, None, event_dict)
    
    # Verify environment info was added
    assert "environment" in result
    assert result["environment"] == "testing"
    assert "app_version" in result
    assert result["app_version"] == "1.0.0"


def test_add_environment_defaults():
    """Test that add_environment uses defaults when config is empty."""
    # Create an empty config
    config = {}
    
    # Create the processor
    processor = add_environment(config)
    
    # Create a sample event dict
    event_dict = {"event": "test_event", "level": "info"}
    
    # Apply the processor
    result = processor(None, None, event_dict)
    
    # Verify default values were used
    assert "environment" in result
    assert result["environment"] == "development"
    assert "app_version" in result
    assert result["app_version"] == "unknown"


@patch("structlog.configure")
@patch("logging.basicConfig")
@patch("logging.getLogger")
def test_setup_logging(mock_get_logger, mock_basic_config, mock_configure):
    """Test that setup_logging configures structlog and stdlib logging."""
    # Create mock loggers
    mock_logger = MagicMock()
    mock_uvicorn = MagicMock()
    mock_uvicorn_access = MagicMock()
    mock_uvicorn_error = MagicMock()
    
    # Configure mock_get_logger to return different loggers
    mock_get_logger.side_effect = lambda name=None: {
        None: mock_logger,
        "uvicorn": mock_uvicorn,
        "uvicorn.access": mock_uvicorn_access,
        "uvicorn.error": mock_uvicorn_error
    }.get(name, MagicMock())
    
    # Create a sample config
    config = {
        "environment": "testing",
        "version": "1.0.0",
        "debug": False
    }
    
    # Call setup_logging
    setup_logging(config)
    
    # Verify structlog was configured
    mock_configure.assert_called_once()
    
    # Verify logging was configured
    mock_basic_config.assert_called_once_with(
        format="%(message)s",
        stream=pytest.approx(logging.sys.stdout),
        level=logging.INFO,
    )
    
    # Verify uvicorn loggers were configured
    assert mock_uvicorn.handlers == []
    assert mock_uvicorn_access.handlers == []
    assert mock_uvicorn_error.handlers == []
    
    # Verify log level was set
    mock_logger.setLevel.assert_called_once_with(logging.INFO)


@patch("structlog.configure")
@patch("logging.basicConfig")
@patch("logging.getLogger")
def test_setup_logging_debug_mode(mock_get_logger, mock_basic_config, mock_configure):
    """Test that setup_logging sets debug level when debug is True."""
    # Create mock logger
    mock_logger = MagicMock()
    mock_get_logger.return_value = mock_logger
    
    # Create a sample config with debug=True
    config = {
        "environment": "testing",
        "version": "1.0.0",
        "debug": True
    }
    
    # Call setup_logging
    setup_logging(config)
    
    # Verify log level was set to DEBUG
    mock_logger.setLevel.assert_called_with(logging.DEBUG)


@patch("structlog.configure")
def test_setup_logging_processors(mock_configure):
    """Test that setup_logging configures the correct processors."""
    # Create a sample config
    config = {
        "environment": "testing",
        "version": "1.0.0"
    }
    
    # Call setup_logging
    setup_logging(config)
    
    # Get the processors argument
    call_args = mock_configure.call_args[1]
    processors = call_args["processors"]
    
    # Verify the number of processors
    assert len(processors) == 8
    
    # Verify our custom processors are included
    # We can't directly compare function objects, so we'll check types
    processor_types = [type(p) for p in processors]
    
    # Check that our timestamp processor is included
    assert add_timestamp in processors
    
    # The environment processor is a closure, so we can't directly check for it
    # Instead, we'll verify that the last processor is the JSONRenderer
    assert processors[-1] == structlog.processors.JSONRenderer()


def test_integration_with_structlog():
    """Test integration with structlog by creating a logger and logging a message."""
    # Create a sample config
    config = {
        "environment": "testing",
        "version": "1.0.0"
    }
    
    # Mock sys.stdout to capture log output
    with patch("sys.stdout") as mock_stdout:
        # Configure logging
        with patch("structlog.configure") as mock_configure:
            setup_logging(config)
            
            # Create a test processor that captures the event dict
            captured_event_dict = None
            
            def capture_event_dict(_, __, event_dict):
                nonlocal captured_event_dict
                captured_event_dict = event_dict.copy()
                return event_dict
            
            # Get the processors from the configure call
            call_args = mock_configure.call_args[1]
            processors = list(call_args["processors"])
            
            # Insert our capture processor before the JSONRenderer
            processors.insert(-1, capture_event_dict)
            
            # Update the processors
            call_args["processors"] = processors
            
            # Create a logger with our test processor
            logger = structlog.get_logger("test_logger")
            
            # Log a message
            with patch.object(structlog.stdlib.BoundLogger, "_process_event") as mock_process:
                logger.info("Test message", extra_field="test_value")
                
                # Verify the logger was called
                mock_process.assert_called()
                
                # Get the event dict from the call
                event_dict = mock_process.call_args[0][2]
                
                # Verify the event dict contains our message
                assert "event" in event_dict
                assert event_dict["event"] == "Test message"
                
                # Verify the extra field was included
                assert "extra_field" in event_dict
                assert event_dict["extra_field"] == "test_value" 