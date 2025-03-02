"""Simple test file for metrics module that doesn't depend on any fixtures."""
import time
from unittest.mock import patch, MagicMock

from app.core.metrics import (
    get_process_time,
    get_process_memory,
    get_system_cpu,
    get_system_memory,
    format_bytes,
)


def test_format_bytes():
    """Test formatting bytes to human-readable format."""
    assert format_bytes(0) == "0 B"
    assert format_bytes(1023) == "1023 B"
    assert format_bytes(1024) == "1.0 KB"
    assert format_bytes(1024 * 1024) == "1.0 MB"
    assert format_bytes(1024 * 1024 * 1024) == "1.0 GB"
    assert format_bytes(1024 * 1024 * 1024 * 1024) == "1.0 TB"
    assert format_bytes(1500) == "1.5 KB"
    assert format_bytes(1500000) == "1.4 MB"


def test_get_process_time():
    """Test getting process time."""
    # Process time should be a positive number
    process_time = get_process_time()
    assert isinstance(process_time, float)
    assert process_time >= 0
    
    # Process time should increase over time
    start_time = get_process_time()
    time.sleep(0.1)  # Sleep for a short time
    end_time = get_process_time()
    assert end_time > start_time


@patch("app.core.metrics.psutil.Process")
def test_get_process_memory(mock_process):
    """Test getting process memory usage."""
    # Mock the process memory info
    mock_process_instance = MagicMock()
    mock_process.return_value = mock_process_instance
    mock_process_instance.memory_info.return_value.rss = 1024 * 1024  # 1 MB
    
    # Get process memory
    memory = get_process_memory()
    assert memory == 1024 * 1024
    mock_process_instance.memory_info.assert_called_once()


@patch("app.core.metrics.psutil.cpu_percent")
def test_get_system_cpu(mock_cpu_percent):
    """Test getting system CPU usage."""
    # Mock the CPU percent
    mock_cpu_percent.return_value = 42.5
    
    # Get system CPU
    cpu = get_system_cpu()
    assert cpu == 42.5
    mock_cpu_percent.assert_called_once_with(interval=None)


@patch("app.core.metrics.psutil.virtual_memory")
def test_get_system_memory(mock_virtual_memory):
    """Test getting system memory usage."""
    # Mock the virtual memory
    mock_memory = MagicMock()
    mock_memory.total = 8 * 1024 * 1024 * 1024  # 8 GB
    mock_memory.available = 4 * 1024 * 1024 * 1024  # 4 GB
    mock_virtual_memory.return_value = mock_memory
    
    # Get system memory
    total, available, percent = get_system_memory()
    assert total == 8 * 1024 * 1024 * 1024
    assert available == 4 * 1024 * 1024 * 1024
    assert percent == 50.0  # 50% used
    mock_virtual_memory.assert_called_once() 