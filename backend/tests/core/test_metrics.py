import pytest
from unittest.mock import patch, MagicMock
from prometheus_client import Counter, Histogram, Gauge

# Import the module with patching to avoid the actual psutil import
with patch("psutil.Process"), patch("psutil.cpu_percent"), patch("psutil.virtual_memory"):
    from app.core.metrics import (
        initialize_metrics,
        get_metrics,
        reset_metrics,
        MetricsManager,
        get_process_time,
        get_process_memory,
        get_system_cpu,
        get_system_memory,
        format_bytes,
    )


class TestMetrics:
    def test_initialize_metrics(self):
        """Test that metrics are initialized correctly."""
        # Reset metrics to ensure a clean state
        reset_metrics()
        
        # Initialize metrics
        metrics = initialize_metrics()
        
        # Check that all expected metrics are created
        assert "http_requests" in metrics
        assert "http_request_duration_seconds" in metrics
        assert "db_connections_active" in metrics
        assert "db_query_duration_seconds" in metrics
        assert "redis_operations_total" in metrics
        assert "redis_errors_total" in metrics
        
        # Check types
        assert isinstance(metrics["http_requests"], Counter)
        assert isinstance(metrics["http_request_duration_seconds"], Histogram)
        assert isinstance(metrics["db_connections_active"], Gauge)
        assert isinstance(metrics["db_query_duration_seconds"], Histogram)
        assert isinstance(metrics["redis_operations_total"], Counter)
        assert isinstance(metrics["redis_errors_total"], Counter)

    def test_get_metrics(self):
        """Test that get_metrics returns the initialized metrics."""
        # Reset metrics to ensure a clean state
        reset_metrics()
        
        # Get metrics
        metrics = get_metrics()
        
        # Check that metrics are initialized
        assert len(metrics) > 0
        assert "http_requests" in metrics

    def test_reset_metrics(self):
        """Test that reset_metrics clears all metrics."""
        # Initialize metrics
        initialize_metrics()
        
        # Reset metrics
        reset_metrics()
        
        # Check that metrics are reset
        metrics = get_metrics()
        assert len(metrics) > 0  # Should be re-initialized by get_metrics

    def test_metrics_manager(self):
        """Test the MetricsManager context manager."""
        # Use the context manager
        with MetricsManager() as manager:
            # Check that metrics are initialized
            assert len(manager.metrics) > 0
            assert "http_requests" in manager.metrics
        
        # Check that metrics are reset after exiting the context
        assert len(get_metrics()) > 0  # Should be re-initialized by get_metrics

    @patch("time.process_time")
    def test_get_process_time(self, mock_process_time):
        """Test get_process_time function."""
        # Set up mock
        mock_process_time.return_value = 123.45
        
        # Call function
        result = get_process_time()
        
        # Check result
        assert result == 123.45
        mock_process_time.assert_called_once()

    @patch("psutil.Process")
    def test_get_process_memory(self, mock_process):
        """Test get_process_memory function."""
        # Set up mock
        mock_instance = MagicMock()
        mock_instance.memory_info.return_value.rss = 1024 * 1024  # 1 MB
        mock_process.return_value = mock_instance
        
        # Call function
        result = get_process_memory()
        
        # Check result
        assert result == 1024 * 1024
        mock_instance.memory_info.assert_called_once()

    @patch("psutil.cpu_percent")
    def test_get_system_cpu(self, mock_cpu_percent):
        """Test get_system_cpu function."""
        # Set up mock
        mock_cpu_percent.return_value = 75.5
        
        # Call function
        result = get_system_cpu()
        
        # Check result
        assert result == 75.5
        mock_cpu_percent.assert_called_once_with(interval=None)

    @patch("psutil.virtual_memory")
    def test_get_system_memory(self, mock_virtual_memory):
        """Test get_system_memory function."""
        # Set up mock
        mock_memory = MagicMock()
        mock_memory.total = 16 * 1024 * 1024 * 1024  # 16 GB
        mock_memory.available = 8 * 1024 * 1024 * 1024  # 8 GB
        mock_virtual_memory.return_value = mock_memory
        
        # Call function
        total, available, percent_used = get_system_memory()
        
        # Check result
        assert total == 16 * 1024 * 1024 * 1024
        assert available == 8 * 1024 * 1024 * 1024
        assert percent_used == 50.0  # 50% used
        mock_virtual_memory.assert_called_once()

    def test_format_bytes(self):
        """Test format_bytes function."""
        # Test different byte sizes
        assert format_bytes(500) == "500 B"
        assert format_bytes(1500) == "1.5 KB"
        assert format_bytes(1500 * 1024) == "1.5 MB"
        assert format_bytes(1500 * 1024 * 1024) == "1.5 GB"
        assert format_bytes(1500 * 1024 * 1024 * 1024) == "1.5 TB" 