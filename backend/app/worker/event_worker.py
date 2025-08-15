"""
Event Processing Worker for Real-time Analytics

This worker processes events from Redis queues for real-time aggregation,
analytics preprocessing, and performance optimization.

Features:
- Real-time event aggregation
- Performance metrics calculation
- User behavior analysis
- Batch processing for efficiency
- Error handling and retry logic
"""
import asyncio
import json
import logging
import signal
import sys
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import structlog

from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.core.redis import get_redis_client
from app.core.logging import setup_logging
from app import crud
from app.schemas.event import EventType

# Get settings and setup logging
settings = get_settings()
setup_logging(settings.model_dump())
logger = structlog.get_logger()


class EventProcessor:
    """Event processor for real-time analytics and aggregation."""
    
    def __init__(self):
        self.running = True
        self.redis = None
        self.batch_size = 50
        self.batch_timeout = 5.0  # seconds
        self.retry_attempts = 3
        
    async def initialize(self):
        """Initialize Redis connection."""
        try:
            self.redis = await get_redis_client()
            await self.redis.ping()
            logger.info("event_worker_redis_connected")
        except Exception as e:
            logger.error("event_worker_redis_connection_failed", error=str(e))
            raise

    async def process_event_queue(self):
        """Main event processing loop."""
        logger.info("event_worker_queue_processing_started")
        
        while self.running:
            try:
                # Process events in batches for efficiency
                events = await self._get_event_batch()
                
                if events:
                    await self._process_event_batch(events)
                    logger.debug(f"processed_event_batch", count=len(events))
                else:
                    # No events, sleep briefly
                    await asyncio.sleep(1.0)
                    
            except Exception as e:
                logger.error("event_worker_processing_error", error=str(e))
                await asyncio.sleep(5.0)  # Backoff on error

    async def _get_event_batch(self) -> List[Dict[str, Any]]:
        """Get a batch of events from Redis queue."""
        events = []
        
        try:
            # Use BRPOP with timeout to get events efficiently
            for _ in range(self.batch_size):
                result = await self.redis.brpop(
                    "event_processing_queue", 
                    timeout=int(self.batch_timeout) if not events else 0
                )
                
                if result:
                    _, event_data = result
                    try:
                        event = json.loads(event_data.decode('utf-8'))
                        events.append(event)
                    except json.JSONDecodeError as e:
                        logger.warning("event_worker_invalid_json", error=str(e), data=event_data)
                else:
                    # No more events available
                    break
                    
        except Exception as e:
            logger.error("event_worker_batch_retrieval_error", error=str(e))
            
        return events

    async def _process_event_batch(self, events: List[Dict[str, Any]]):
        """Process a batch of events for real-time analytics."""
        # Group events by type for efficient processing
        events_by_type = {}
        for event in events:
            event_type = event.get('event_type', 'unknown')
            if event_type not in events_by_type:
                events_by_type[event_type] = []
            events_by_type[event_type].append(event)

        # Process each event type
        for event_type, type_events in events_by_type.items():
            try:
                await self._process_events_by_type(event_type, type_events)
            except Exception as e:
                logger.error("event_worker_type_processing_error", 
                           event_type=event_type, error=str(e))

    async def _process_events_by_type(self, event_type: str, events: List[Dict[str, Any]]):
        """Process events grouped by type."""
        current_time = datetime.utcnow()
        hour_key = current_time.strftime('%Y-%m-%d:%H')
        day_key = current_time.strftime('%Y-%m-%d')
        
        # Real-time aggregations
        await self._update_realtime_counters(event_type, events, hour_key, day_key)
        
        # Type-specific processing
        if event_type == EventType.PERFORMANCE.value:
            await self._process_performance_events(events, hour_key)
        elif event_type == EventType.INTERACTION.value:
            await self._process_interaction_events(events, hour_key)
        elif event_type == EventType.BUSINESS.value:
            await self._process_business_events(events, hour_key)
        elif event_type == EventType.ERROR.value:
            await self._process_error_events(events, hour_key)

    async def _update_realtime_counters(
        self, 
        event_type: str, 
        events: List[Dict[str, Any]], 
        hour_key: str, 
        day_key: str
    ):
        """Update real-time counters in Redis."""
        pipe = self.redis.pipeline()
        
        # Hourly counters
        hourly_counter = f"event_count:{event_type}:{hour_key}"
        pipe.incrby(hourly_counter, len(events))
        pipe.expire(hourly_counter, 86400)  # 24 hour expiration
        
        # Daily counters
        daily_counter = f"event_count_daily:{event_type}:{day_key}"
        pipe.incrby(daily_counter, len(events))
        pipe.expire(daily_counter, 604800)  # 7 day expiration
        
        # User-specific counters
        user_events = {}
        for event in events:
            user_id = event.get('user_id')
            if user_id:
                user_events.setdefault(user_id, 0)
                user_events[user_id] += 1
                
        for user_id, count in user_events.items():
            user_counter = f"user_event_count:{user_id}:{day_key}"
            pipe.incrby(user_counter, count)
            pipe.expire(user_counter, 604800)  # 7 day expiration
        
        # Execute pipeline
        await pipe.execute()

    async def _process_performance_events(self, events: List[Dict[str, Any]], hour_key: str):
        """Process performance events for real-time monitoring."""
        # Calculate performance metrics
        response_times = []
        error_counts = 0
        
        for event in events:
            # Extract response time from event properties
            properties = event.get('properties', {})
            if 'response_time' in properties:
                response_times.append(float(properties['response_time']))
            if 'status_code' in properties and str(properties['status_code']).startswith('5'):
                error_counts += 1
        
        if response_times:
            # Calculate aggregated metrics
            avg_response_time = sum(response_times) / len(response_times)
            max_response_time = max(response_times)
            min_response_time = min(response_times)
            
            # Store performance metrics
            perf_key = f"performance_metrics:{hour_key}"
            metrics = {
                'avg_response_time': avg_response_time,
                'max_response_time': max_response_time,
                'min_response_time': min_response_time,
                'request_count': len(response_times),
                'error_count': error_counts,
                'error_rate': error_counts / len(events) if events else 0,
            }
            
            await self.redis.hset(perf_key, mapping=metrics)
            await self.redis.expire(perf_key, 86400)  # 24 hour expiration

    async def _process_interaction_events(self, events: List[Dict[str, Any]], hour_key: str):
        """Process user interaction events for UX analytics."""
        # Track page views, clicks, and user paths
        page_views = {}
        button_clicks = {}
        
        for event in events:
            properties = event.get('properties', {})
            
            if 'page_url' in properties:
                page = properties['page_url']
                page_views.setdefault(page, 0)
                page_views[page] += 1
                
            if 'element_id' in properties:
                element = properties['element_id']
                button_clicks.setdefault(element, 0)
                button_clicks[element] += 1
        
        # Store interaction metrics
        if page_views:
            page_key = f"page_views:{hour_key}"
            await self.redis.hset(page_key, mapping=page_views)
            await self.redis.expire(page_key, 86400)
            
        if button_clicks:
            click_key = f"button_clicks:{hour_key}"
            await self.redis.hset(click_key, mapping=button_clicks)
            await self.redis.expire(click_key, 86400)

    async def _process_business_events(self, events: List[Dict[str, Any]], hour_key: str):
        """Process business events for conversion tracking."""
        # Track conversions and revenue
        conversions = 0
        revenue = 0.0
        
        for event in events:
            properties = event.get('properties', {})
            
            if properties.get('conversion'):
                conversions += 1
                
            if 'revenue' in properties:
                revenue += float(properties['revenue'])
        
        if conversions > 0 or revenue > 0:
            business_key = f"business_metrics:{hour_key}"
            metrics = {
                'conversions': conversions,
                'revenue': revenue,
                'events': len(events),
            }
            await self.redis.hset(business_key, mapping=metrics)
            await self.redis.expire(business_key, 86400)

    async def _process_error_events(self, events: List[Dict[str, Any]], hour_key: str):
        """Process error events for monitoring and alerting."""
        error_types = {}
        critical_errors = 0
        
        for event in events:
            properties = event.get('properties', {})
            
            error_type = properties.get('error_type', 'unknown')
            error_types.setdefault(error_type, 0)
            error_types[error_type] += 1
            
            if properties.get('severity') == 'critical':
                critical_errors += 1
        
        # Store error metrics
        error_key = f"error_metrics:{hour_key}"
        metrics = {
            'total_errors': len(events),
            'critical_errors': critical_errors,
            **{f"error_type_{k}": v for k, v in error_types.items()}
        }
        await self.redis.hset(error_key, mapping=metrics)
        await self.redis.expire(error_key, 86400)
        
        # Alert on critical errors
        if critical_errors > 0:
            await self._trigger_error_alert(critical_errors, hour_key)

    async def _trigger_error_alert(self, critical_count: int, hour_key: str):
        """Trigger alert for critical errors."""
        alert_key = f"critical_error_alert:{hour_key}"
        alert_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'critical_errors': critical_count,
            'hour_key': hour_key,
        }
        
        # Store alert for monitoring systems
        await self.redis.setex(alert_key, 3600, json.dumps(alert_data))
        logger.warning("critical_error_alert", **alert_data)

    async def cleanup_old_metrics(self):
        """Cleanup old metrics to prevent Redis memory bloat."""
        try:
            # Clean up metrics older than 7 days
            cutoff_date = datetime.utcnow() - timedelta(days=7)
            cutoff_key = cutoff_date.strftime('%Y-%m-%d')
            
            # Pattern match old keys
            patterns = [
                f"event_count:*:{cutoff_key}*",
                f"performance_metrics:{cutoff_key}*",
                f"page_views:{cutoff_key}*",
                f"button_clicks:{cutoff_key}*",
                f"business_metrics:{cutoff_key}*",
                f"error_metrics:{cutoff_key}*",
            ]
            
            for pattern in patterns:
                keys = await self.redis.keys(pattern)
                if keys:
                    await self.redis.delete(*keys)
                    logger.info("cleaned_old_metrics", pattern=pattern, count=len(keys))
                    
        except Exception as e:
            logger.error("cleanup_old_metrics_error", error=str(e))

    def stop(self):
        """Stop the event processor."""
        self.running = False
        logger.info("event_worker_stop_requested")


# Global event processor instance
event_processor = EventProcessor()


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    logger.info(f"received_signal", signal=signum)
    event_processor.stop()
    sys.exit(0)


async def main():
    """Main entry point for the event worker."""
    logger.info("event_worker_starting", environment=settings.environment.value)
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Initialize processor
        await event_processor.initialize()
        
        # Create background task for cleanup
        cleanup_task = asyncio.create_task(periodic_cleanup())
        
        # Start processing
        await event_processor.process_event_queue()
        
    except KeyboardInterrupt:
        logger.info("event_worker_interrupted")
    except Exception as e:
        logger.error("event_worker_failed", error=str(e))
        sys.exit(1)
    finally:
        if event_processor.redis:
            await event_processor.redis.close()
        logger.info("event_worker_shutdown")


async def periodic_cleanup():
    """Periodic cleanup of old metrics."""
    while event_processor.running:
        try:
            # Run cleanup every hour
            await asyncio.sleep(3600)
            await event_processor.cleanup_old_metrics()
        except Exception as e:
            logger.error("periodic_cleanup_error", error=str(e))


if __name__ == "__main__":
    asyncio.run(main())