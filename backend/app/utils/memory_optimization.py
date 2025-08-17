"""Memory management and optimization utilities.

This module provides comprehensive memory monitoring, optimization, and management
utilities for the NeoForge application to ensure efficient resource usage.

Features:
- Memory usage tracking and alerting
- Garbage collection optimization
- Memory leak detection
- Process memory monitoring
- Cache memory management
- Memory-aware request limiting
"""

import gc
import os
import psutil
import asyncio
import weakref
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from contextlib import asynccontextmanager

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = structlog.get_logger()


@dataclass
class MemoryMetrics:
    """Memory usage metrics data structure."""
    timestamp: datetime
    process_memory_mb: float
    process_memory_percent: float
    system_memory_total_gb: float
    system_memory_available_gb: float
    system_memory_percent: float
    gc_counts: Dict[int, int]
    gc_collections: int
    heap_objects: int
    cache_memory_mb: float = 0
    database_pool_memory_mb: float = 0


@dataclass
class MemoryAlert:
    """Memory alert configuration and state."""
    threshold_mb: float
    threshold_percent: float
    alert_cooldown_minutes: int = 15
    last_alert_time: Optional[datetime] = None
    alert_count: int = 0
    
    def should_alert(self, current_mb: float, current_percent: float) -> bool:
        """Check if alert should be triggered."""
        if current_mb < self.threshold_mb and current_percent < self.threshold_percent:
            return False
        
        if self.last_alert_time is None:
            return True
        
        cooldown_expired = (
            datetime.utcnow() - self.last_alert_time
        ).total_seconds() > (self.alert_cooldown_minutes * 60)
        
        return cooldown_expired
    
    def trigger_alert(self):
        """Record alert trigger."""
        self.last_alert_time = datetime.utcnow()
        self.alert_count += 1


class MemoryMonitor:
    """Comprehensive memory monitoring and optimization."""
    
    def __init__(
        self,
        collection_interval: int = 60,  # seconds
        gc_threshold_ratio: float = 1.5,  # trigger GC when memory usage increases by this ratio
        max_history: int = 1440  # 24 hours of minute-level data
    ):
        self.collection_interval = collection_interval
        self.gc_threshold_ratio = gc_threshold_ratio
        self.max_history = max_history
        
        self.metrics_history: List[MemoryMetrics] = []
        self.weak_refs: List[weakref.ref] = []
        self.last_gc_memory = 0
        self.monitoring_task: Optional[asyncio.Task] = None
        
        # Memory alerts
        self.alerts = {
            'high_memory': MemoryAlert(
                threshold_mb=1000,  # 1GB
                threshold_percent=80,
                alert_cooldown_minutes=15
            ),
            'critical_memory': MemoryAlert(
                threshold_mb=1500,  # 1.5GB  
                threshold_percent=90,
                alert_cooldown_minutes=5
            )
        }
        
        # Object tracking for leak detection
        self.tracked_objects = weakref.WeakSet()
        self.object_creation_counts = {}
    
    def get_current_metrics(self) -> MemoryMetrics:
        """Get current memory usage metrics."""
        process = psutil.Process()
        memory_info = process.memory_info()
        memory_percent = process.memory_percent()
        
        # System memory
        system_memory = psutil.virtual_memory()
        
        # Garbage collection stats
        gc_counts = {gen: count for gen, count in enumerate(gc.get_count())}
        gc_stats = gc.get_stats()
        total_collections = sum(stat['collections'] for stat in gc_stats)
        
        # Heap objects count
        heap_objects = len(gc.get_objects())
        
        return MemoryMetrics(
            timestamp=datetime.utcnow(),
            process_memory_mb=memory_info.rss / 1024 / 1024,
            process_memory_percent=memory_percent,
            system_memory_total_gb=system_memory.total / 1024 / 1024 / 1024,
            system_memory_available_gb=system_memory.available / 1024 / 1024 / 1024,
            system_memory_percent=system_memory.percent,
            gc_counts=gc_counts,
            gc_collections=total_collections,
            heap_objects=heap_objects
        )
    
    def collect_metrics(self):
        """Collect and store memory metrics."""
        metrics = self.get_current_metrics()
        
        # Add to history
        self.metrics_history.append(metrics)
        
        # Trim history
        if len(self.metrics_history) > self.max_history:
            self.metrics_history.pop(0)
        
        # Check for alerts
        self._check_memory_alerts(metrics)
        
        # Check if garbage collection should be triggered
        self._check_gc_trigger(metrics)
        
        # Log memory status
        logger.debug(
            "memory_metrics_collected",
            process_memory_mb=metrics.process_memory_mb,
            process_memory_percent=metrics.process_memory_percent,
            heap_objects=metrics.heap_objects,
            gc_collections=metrics.gc_collections
        )
        
        return metrics
    
    def _check_memory_alerts(self, metrics: MemoryMetrics):
        """Check if memory alerts should be triggered."""
        for alert_name, alert in self.alerts.items():
            if alert.should_alert(metrics.process_memory_mb, metrics.process_memory_percent):
                alert.trigger_alert()
                
                logger.warning(
                    f"memory_alert_{alert_name}",
                    process_memory_mb=metrics.process_memory_mb,
                    process_memory_percent=metrics.process_memory_percent,
                    alert_count=alert.alert_count,
                    heap_objects=metrics.heap_objects
                )
                
                # Trigger aggressive garbage collection for critical alerts
                if alert_name == 'critical_memory':
                    self.force_garbage_collection()
    
    def _check_gc_trigger(self, metrics: MemoryMetrics):
        """Check if garbage collection should be triggered."""
        if self.last_gc_memory == 0:
            self.last_gc_memory = metrics.process_memory_mb
            return
        
        memory_increase_ratio = metrics.process_memory_mb / self.last_gc_memory
        
        if memory_increase_ratio > self.gc_threshold_ratio:
            logger.info(
                "triggering_garbage_collection",
                current_memory=metrics.process_memory_mb,
                last_gc_memory=self.last_gc_memory,
                increase_ratio=memory_increase_ratio
            )
            
            collected = self.force_garbage_collection()
            self.last_gc_memory = metrics.process_memory_mb
            
            logger.info(
                "garbage_collection_completed",
                objects_collected=collected,
                memory_after_gc=self.get_current_metrics().process_memory_mb
            )
    
    def force_garbage_collection(self) -> int:
        """Force garbage collection and return number of objects collected."""
        # Collect weak references to dead objects
        dead_refs = [ref for ref in self.weak_refs if ref() is None]
        for ref in dead_refs:
            self.weak_refs.remove(ref)
        
        # Force garbage collection for all generations
        collected = 0
        for generation in range(gc.get_count().__len__()):
            collected += gc.collect(generation)
        
        return collected
    
    def track_object(self, obj: Any, object_type: str = None):
        """Track object for memory leak detection."""
        if object_type is None:
            object_type = type(obj).__name__
        
        self.tracked_objects.add(obj)
        self.object_creation_counts[object_type] = (
            self.object_creation_counts.get(object_type, 0) + 1
        )
    
    def get_memory_report(self) -> Dict[str, Any]:
        """Generate comprehensive memory usage report."""
        if not self.metrics_history:
            return {"error": "No metrics collected yet"}
        
        current = self.metrics_history[-1]
        
        # Calculate trends
        if len(self.metrics_history) >= 2:
            previous = self.metrics_history[-2]
            memory_trend = current.process_memory_mb - previous.process_memory_mb
            objects_trend = current.heap_objects - previous.heap_objects
        else:
            memory_trend = 0
            objects_trend = 0
        
        # Calculate averages over last hour
        hour_ago = datetime.utcnow() - timedelta(hours=1)
        recent_metrics = [
            m for m in self.metrics_history[-60:] 
            if m.timestamp > hour_ago
        ]
        
        if recent_metrics:
            avg_memory = sum(m.process_memory_mb for m in recent_metrics) / len(recent_metrics)
            avg_objects = sum(m.heap_objects for m in recent_metrics) / len(recent_metrics)
        else:
            avg_memory = current.process_memory_mb
            avg_objects = current.heap_objects
        
        return {
            'current': {
                'process_memory_mb': current.process_memory_mb,
                'process_memory_percent': current.process_memory_percent,
                'heap_objects': current.heap_objects,
                'gc_collections': current.gc_collections,
                'system_memory_percent': current.system_memory_percent
            },
            'trends': {
                'memory_change_mb': memory_trend,
                'objects_change': objects_trend,
                'hour_avg_memory_mb': avg_memory,
                'hour_avg_objects': avg_objects
            },
            'alerts': {
                name: {
                    'alert_count': alert.alert_count,
                    'last_alert': alert.last_alert_time.isoformat() if alert.last_alert_time else None
                }
                for name, alert in self.alerts.items()
            },
            'tracked_objects': {
                'total_tracked': len(self.tracked_objects),
                'creation_counts': self.object_creation_counts
            },
            'gc_stats': gc.get_stats(),
            'recommendations': self._generate_recommendations()
        }
    
    def _generate_recommendations(self) -> List[str]:
        """Generate memory optimization recommendations."""
        recommendations = []
        
        if not self.metrics_history:
            return recommendations
        
        current = self.metrics_history[-1]
        
        # High memory usage
        if current.process_memory_mb > 1000:
            recommendations.append("Process memory usage is high (>1GB). Consider implementing memory optimization strategies.")
        
        # High object count
        if current.heap_objects > 100000:
            recommendations.append("High number of heap objects detected. Check for object leaks or unnecessary object creation.")
        
        # Frequent alerts
        if self.alerts['high_memory'].alert_count > 5:
            recommendations.append("Frequent memory alerts detected. Consider increasing memory limits or optimizing memory usage.")
        
        # GC pressure
        recent_collections = current.gc_collections
        if len(self.metrics_history) > 1:
            gc_rate = recent_collections - self.metrics_history[-10].gc_collections if len(self.metrics_history) >= 10 else 0
            if gc_rate > 50:
                recommendations.append("High garbage collection frequency detected. Consider optimizing object creation patterns.")
        
        return recommendations
    
    async def start_monitoring(self):
        """Start background memory monitoring."""
        logger.info("starting_memory_monitoring", interval=self.collection_interval)
        
        async def monitor_loop():
            while True:
                try:
                    self.collect_metrics()
                    await asyncio.sleep(self.collection_interval)
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.error("memory_monitoring_error", error=str(e))
                    await asyncio.sleep(self.collection_interval)
        
        self.monitoring_task = asyncio.create_task(monitor_loop())
    
    def stop_monitoring(self):
        """Stop background memory monitoring."""
        if self.monitoring_task:
            self.monitoring_task.cancel()
            logger.info("memory_monitoring_stopped")


class MemoryOptimizationMiddleware(BaseHTTPMiddleware):
    """Middleware for memory optimization during request processing."""
    
    def __init__(self, app, memory_monitor: MemoryMonitor, max_memory_mb: float = 1500):
        super().__init__(app)
        self.memory_monitor = memory_monitor
        self.max_memory_mb = max_memory_mb
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with memory optimization."""
        # Check memory before processing
        current_metrics = self.memory_monitor.get_current_metrics()
        
        # If memory is critical, trigger garbage collection
        if current_metrics.process_memory_mb > self.max_memory_mb:
            logger.warning(
                "critical_memory_during_request",
                memory_mb=current_metrics.process_memory_mb,
                threshold_mb=self.max_memory_mb,
                path=request.url.path
            )
            
            # Force garbage collection
            collected = self.memory_monitor.force_garbage_collection()
            logger.info("emergency_gc_triggered", objects_collected=collected)
            
            # Check if memory is still too high
            after_gc_metrics = self.memory_monitor.get_current_metrics()
            if after_gc_metrics.process_memory_mb > self.max_memory_mb:
                logger.error(
                    "memory_still_critical_after_gc",
                    memory_mb=after_gc_metrics.process_memory_mb
                )
        
        # Process request
        response = await call_next(request)
        
        # Add memory usage headers for debugging
        response.headers["X-Memory-Usage"] = f"{current_metrics.process_memory_mb:.1f}MB"
        response.headers["X-Memory-Percent"] = f"{current_metrics.process_memory_percent:.1f}%"
        
        return response


# Global memory monitor instance
memory_monitor = MemoryMonitor()


@asynccontextmanager
async def track_memory_usage(operation_name: str = "operation"):
    """Context manager to track memory usage for specific operations."""
    start_metrics = memory_monitor.get_current_metrics()
    start_time = datetime.utcnow()
    
    logger.debug(
        f"memory_tracking_start_{operation_name}",
        memory_mb=start_metrics.process_memory_mb,
        heap_objects=start_metrics.heap_objects
    )
    
    try:
        yield start_metrics
    finally:
        end_metrics = memory_monitor.get_current_metrics()
        duration = (datetime.utcnow() - start_time).total_seconds()
        memory_delta = end_metrics.process_memory_mb - start_metrics.process_memory_mb
        objects_delta = end_metrics.heap_objects - start_metrics.heap_objects
        
        logger.debug(
            f"memory_tracking_end_{operation_name}",
            duration_seconds=duration,
            memory_delta_mb=memory_delta,
            objects_delta=objects_delta,
            final_memory_mb=end_metrics.process_memory_mb
        )
        
        # Alert if operation used excessive memory
        if memory_delta > 100:  # More than 100MB
            logger.warning(
                f"high_memory_usage_{operation_name}",
                memory_delta_mb=memory_delta,
                duration_seconds=duration
            )


def setup_memory_optimization(app):
    """Setup memory optimization for FastAPI application."""
    # Add memory optimization middleware
    app.add_middleware(
        MemoryOptimizationMiddleware,
        memory_monitor=memory_monitor,
        max_memory_mb=1500  # 1.5GB threshold
    )
    
    logger.info("memory_optimization_middleware_enabled")


async def initialize_memory_monitoring():
    """Initialize memory monitoring for application startup."""
    await memory_monitor.start_monitoring()
    logger.info("memory_monitoring_initialized")


def cleanup_memory_monitoring():
    """Cleanup memory monitoring on application shutdown."""
    memory_monitor.stop_monitoring()
    logger.info("memory_monitoring_cleanup_completed")


# Convenience functions for FastAPI integration
def get_memory_report() -> Dict[str, Any]:
    """Get current memory usage report."""
    return memory_monitor.get_memory_report()


def force_garbage_collection() -> int:
    """Force garbage collection and return objects collected."""
    return memory_monitor.force_garbage_collection()


def track_object(obj: Any, object_type: str = None):
    """Track object for memory leak detection."""
    memory_monitor.track_object(obj, object_type)