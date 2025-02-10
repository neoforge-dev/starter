"""Redis connection module with advanced pooling and monitoring."""
from typing import AsyncGenerator, Optional, Tuple
import time

from redis.asyncio import Redis, ConnectionPool, BlockingConnectionPool
from redis.asyncio.retry import Retry
from redis.backoff import ExponentialBackoff
from redis.exceptions import ConnectionError, TimeoutError
import structlog
from prometheus_client import Counter, Histogram

from app.core.config import settings
from app.core.metrics import get_metrics

logger = structlog.get_logger()

# Initialize metrics
metrics = get_metrics()

# Metrics
REDIS_OPERATIONS = Counter(
    "redis_operations_total",
    "Total number of Redis operations",
    labelnames=["operation"],
)

REDIS_ERRORS = Counter(
    "redis_errors_total",
    "Total number of Redis errors",
    labelnames=["error_type"],
)

REDIS_OPERATION_DURATION = Histogram(
    "redis_operation_duration_seconds",
    "Duration of Redis operations",
    labelnames=["operation"],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0),
)

# Configure retry strategy with exponential backoff
retry_strategy = Retry(
    ExponentialBackoff(cap=10, base=1),  # Start at 1s, increase exponentially, cap at 10s
    3,  # Maximum 3 retries
)

# Create an optimized connection pool
pool = BlockingConnectionPool.from_url(
    settings.redis_url,
    decode_responses=True,
    max_connections=20,  # Maximum number of connections
    timeout=20,  # Timeout for getting connection from pool
    retry_on_timeout=True,  # Retry on timeout
    retry_on_error=[ConnectionError, TimeoutError],  # Retry on these errors
    retry=retry_strategy,  # Use our retry strategy
    health_check_interval=30,  # Check connection health every 30 seconds
)

# Create a global Redis client with monitoring
class MonitoredRedis(Redis):
    """Redis client with operation monitoring."""

    async def execute_command(self, *args, **options):
        """Execute Redis command with monitoring."""
        command = args[0] if args else "unknown"
        start_time = time.time()
        
        try:
            result = await super().execute_command(*args, **options)
            REDIS_OPERATIONS.labels(operation=command).inc()
            return result
        except Exception as e:
            REDIS_ERRORS.labels(error_type=type(e).__name__).inc()
            logger.error(
                "redis_operation_error",
                command=command,
                error=str(e),
                error_type=type(e).__name__,
            )
            raise
        finally:
            duration = time.time() - start_time
            REDIS_OPERATION_DURATION.labels(operation=command).observe(duration)


# Create monitored Redis client
redis_client = MonitoredRedis.from_pool(pool)


async def get_redis() -> AsyncGenerator[Redis, None]:
    """
    Get Redis connection from pool with monitoring.
    
    This function provides a Redis connection with:
    - Connection pooling
    - Automatic retries
    - Monitoring and metrics
    - Error handling
    
    Yields:
        Redis connection with monitoring
    """
    try:
        yield redis_client
    except Exception as e:
        logger.error("redis_connection_error", error=str(e))
        raise


async def check_redis_health(redis: Redis) -> Tuple[bool, Optional[str]]:
    """
    Check Redis connection health.
    
    Args:
        redis: Redis connection to check
        
    Returns:
        Tuple of (is_healthy, error_message)
    """
    try:
        # Try to ping Redis
        await redis.ping()
        return True, None
    except Exception as e:
        logger.error("redis_health_check_error", error=str(e))
        return False, str(e) 