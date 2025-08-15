"""AI Workflow Metrics Interface.

Simple metrics interface for AI workflow components that integrates
with the existing Prometheus metrics system.
"""

from typing import Dict, Any, Optional
from app.core.metrics import get_metrics
import structlog

logger = structlog.get_logger(__name__)


class AIWorkflowMetrics:
    """Metrics interface for AI workflow components."""
    
    def __init__(self):
        """Initialize AI workflow metrics."""
        self._prometheus_metrics = get_metrics()
        self._counters: Dict[str, int] = {}
        
    def increment_counter(self, metric_name: str, value: int = 1, labels: Optional[Dict[str, str]] = None) -> None:
        """Increment a counter metric.
        
        Args:
            metric_name: Name of the metric
            value: Value to increment by
            labels: Optional labels for the metric
        """
        # Update internal counter
        self._counters[metric_name] = self._counters.get(metric_name, 0) + value
        
        # Log the metric
        logger.debug(
            "AI workflow metric incremented",
            metric=metric_name,
            value=value,
            total=self._counters[metric_name],
            labels=labels
        )
        
        # In a production system, this would integrate with Prometheus
        # For now, we'll just track internally
    
    def set_gauge(self, metric_name: str, value: float, labels: Optional[Dict[str, str]] = None) -> None:
        """Set a gauge metric value.
        
        Args:
            metric_name: Name of the metric
            value: Value to set
            labels: Optional labels for the metric
        """
        logger.debug(
            "AI workflow gauge metric set",
            metric=metric_name,
            value=value,
            labels=labels
        )
    
    def record_histogram(self, metric_name: str, value: float, labels: Optional[Dict[str, str]] = None) -> None:
        """Record a histogram metric value.
        
        Args:
            metric_name: Name of the metric
            value: Value to record
            labels: Optional labels for the metric
        """
        logger.debug(
            "AI workflow histogram metric recorded",
            metric=metric_name,
            value=value,
            labels=labels
        )
    
    def get_counter(self, metric_name: str) -> int:
        """Get current counter value.
        
        Args:
            metric_name: Name of the metric
            
        Returns:
            Current counter value
        """
        return self._counters.get(metric_name, 0)
    
    def get_all_counters(self) -> Dict[str, int]:
        """Get all counter values.
        
        Returns:
            Dictionary of all counter values
        """
        return self._counters.copy()


# Global metrics instance
_ai_workflow_metrics = AIWorkflowMetrics()


def get_ai_workflow_metrics() -> AIWorkflowMetrics:
    """Get the global AI workflow metrics instance."""
    return _ai_workflow_metrics


# Convenience functions
def increment_counter(metric_name: str, value: int = 1, labels: Optional[Dict[str, str]] = None) -> None:
    """Increment a counter metric."""
    _ai_workflow_metrics.increment_counter(metric_name, value, labels)


def set_gauge(metric_name: str, value: float, labels: Optional[Dict[str, str]] = None) -> None:
    """Set a gauge metric value."""
    _ai_workflow_metrics.set_gauge(metric_name, value, labels)


def record_histogram(metric_name: str, value: float, labels: Optional[Dict[str, str]] = None) -> None:
    """Record a histogram metric value."""
    _ai_workflow_metrics.record_histogram(metric_name, value, labels)