"""
Exponential Backoff with Jitter Implementation for NeoForge
Provides intelligent retry logic to handle transient failures gracefully.
"""

import asyncio
import logging
import random
import time
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
from dataclasses import dataclass, field
from functools import wraps

logger = logging.getLogger(__name__)


class BackoffStrategy(Enum):
    """Backoff strategies for retry logic."""
    FIXED = "fixed"                    # Fixed delay between retries
    LINEAR = "linear"                  # Linear increase in delay
    EXPONENTIAL = "exponential"        # Exponential increase in delay
    EXPONENTIAL_WITH_JITTER = "exponential_with_jitter"  # Exponential with randomization


@dataclass
class RetryConfig:
    """Configuration for retry behavior."""
    max_attempts: int = 3                    # Maximum number of retry attempts
    base_delay: float = 1.0                  # Base delay in seconds
    max_delay: float = 60.0                  # Maximum delay between retries
    backoff_factor: float = 2.0              # Exponential backoff multiplier
    jitter_range: float = 0.1                # Jitter range as percentage (0.1 = ±10%)
    strategy: BackoffStrategy = BackoffStrategy.EXPONENTIAL_WITH_JITTER
    retryable_exceptions: tuple = (Exception,)  # Exceptions that should trigger retry
    should_retry_callback: Optional[Callable] = None  # Custom retry logic
    name: str = "default"                    # Name for logging/monitoring


@dataclass
class RetryMetrics:
    """Metrics for monitoring retry behavior."""
    total_attempts: int = 0
    successful_attempts: int = 0
    failed_attempts: int = 0
    retried_attempts: int = 0
    total_retry_delay: float = 0.0
    average_retry_delay: float = 0.0
    max_retry_delay: float = 0.0
    last_retry_time: Optional[float] = None


class RetryExhaustedException(Exception):
    """Exception raised when all retry attempts are exhausted."""
    pass


class RetryManager:
    """
    Retry manager with exponential backoff and jitter.

    Features:
    - Multiple backoff strategies (fixed, linear, exponential, exponential with jitter)
    - Configurable retry conditions
    - Comprehensive metrics and monitoring
    - Async support
    - Custom retry logic via callbacks

    Usage:
        retry_manager = RetryManager(RetryConfig(max_attempts=5))
        result = await retry_manager.execute(some_async_function, arg1, arg2)
    """

    def __init__(self, config: RetryConfig):
        self.config = config
        self.metrics = RetryMetrics()
        self._current_attempt = 0

        logger.info(f"Initialized retry manager '{config.name}' with {config.max_attempts} max attempts")

    async def execute(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute a function with retry logic.

        Args:
            func: The function to execute
            *args: Positional arguments for the function
            **kwargs: Keyword arguments for the function

        Returns:
            The result of the function call

        Raises:
            RetryExhaustedException: If all retry attempts are exhausted
            Exception: The last exception from the failed function call
        """
        self._current_attempt = 0
        last_exception = None

        while self._current_attempt < self.config.max_attempts:
            try:
                self._current_attempt += 1
                self.metrics.total_attempts += 1

                # Execute the function
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = await asyncio.get_event_loop().run_in_executor(
                        None,
                        lambda: func(*args, **kwargs)
                    )

                # Success!
                self.metrics.successful_attempts += 1
                if self._current_attempt > 1:
                    logger.info(f"Function succeeded on attempt {self._current_attempt} after {self._current_attempt - 1} retries")

                return result

            except self.config.retryable_exceptions as e:
                last_exception = e
                self.metrics.failed_attempts += 1

                # Check if we should retry
                if not self._should_retry(e):
                    logger.debug(f"Not retrying due to custom logic: {e}")
                    raise e

                # Check if we've exhausted all attempts
                if self._current_attempt >= self.config.max_attempts:
                    logger.warning(f"All {self.config.max_attempts} retry attempts exhausted for '{self.config.name}'")
                    break

                # Calculate delay and wait
                delay = self._calculate_delay()
                self.metrics.retried_attempts += 1
                self.metrics.total_retry_delay += delay
                self.metrics.average_retry_delay = self.metrics.total_retry_delay / self.metrics.retried_attempts
                self.metrics.max_retry_delay = max(self.metrics.max_retry_delay, delay)
                self.metrics.last_retry_time = time.time()

                logger.info(f"Retry attempt {self._current_attempt}/{self.config.max_attempts} for '{self.config.name}' in {delay:.2f}s (error: {e})")

                await asyncio.sleep(delay)

        # All attempts exhausted
        self.metrics.failed_attempts += 1
        raise RetryExhaustedException(
            f"All {self.config.max_attempts} retry attempts exhausted for '{self.config.name}'. "
            f"Last error: {last_exception}"
        ) from last_exception

    def _should_retry(self, exception: Exception) -> bool:
        """Determine if we should retry based on the exception."""
        if self.config.should_retry_callback:
            return self.config.should_retry_callback(exception)
        return True

    def _calculate_delay(self) -> float:
        """Calculate the delay for the current retry attempt."""
        if self.config.strategy == BackoffStrategy.FIXED:
            delay = self.config.base_delay
        elif self.config.strategy == BackoffStrategy.LINEAR:
            delay = self.config.base_delay * self._current_attempt
        elif self.config.strategy == BackoffStrategy.EXPONENTIAL:
            delay = self.config.base_delay * (self.config.backoff_factor ** (self._current_attempt - 1))
        elif self.config.strategy == BackoffStrategy.EXPONENTIAL_WITH_JITTER:
            base_delay = self.config.base_delay * (self.config.backoff_factor ** (self._current_attempt - 1))
            jitter_amount = base_delay * self.config.jitter_range
            jitter = random.uniform(-jitter_amount, jitter_amount)
            delay = base_delay + jitter
        else:
            delay = self.config.base_delay

        # Ensure delay is within bounds
        return max(0, min(delay, self.config.max_delay))

    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics for monitoring."""
        return {
            "name": self.config.name,
            "total_attempts": self.metrics.total_attempts,
            "successful_attempts": self.metrics.successful_attempts,
            "failed_attempts": self.metrics.failed_attempts,
            "retried_attempts": self.metrics.retried_attempts,
            "success_rate": (self.metrics.successful_attempts / max(self.metrics.total_attempts, 1)) * 100,
            "retry_rate": (self.metrics.retried_attempts / max(self.metrics.total_attempts, 1)) * 100,
            "average_retry_delay": self.metrics.average_retry_delay,
            "max_retry_delay": self.metrics.max_retry_delay,
            "total_retry_delay": self.metrics.total_retry_delay,
            "last_retry_time": self.metrics.last_retry_time,
            "current_attempt": self._current_attempt,
            "max_attempts": self.config.max_attempts,
            "strategy": self.config.strategy.value
        }

    def reset(self):
        """Reset the retry manager state."""
        self.metrics = RetryMetrics()
        self._current_attempt = 0
        logger.info(f"Retry manager '{self.config.name}' reset")


class RetryRegistry:
    """
    Registry for managing multiple retry managers.
    Provides centralized monitoring and management.
    """

    def __init__(self):
        self._managers: Dict[str, RetryManager] = {}

    def get_or_create(self, name: str, config: RetryConfig) -> RetryManager:
        """Get existing retry manager or create new one."""
        if name not in self._managers:
            self._managers[name] = RetryManager(config)
        return self._managers[name]

    def get(self, name: str) -> Optional[RetryManager]:
        """Get retry manager by name."""
        return self._managers.get(name)

    def get_all(self) -> Dict[str, RetryManager]:
        """Get all registered retry managers."""
        return self._managers.copy()

    def get_all_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Get metrics for all retry managers."""
        return {name: manager.get_metrics() for name, manager in self._managers.items()}

    def reset_all(self):
        """Reset all retry managers."""
        for manager in self._managers.values():
            manager.reset()
        logger.info(f"Reset all {len(self._managers)} retry managers")


# Global registry instance
retry_registry = RetryRegistry()


def retry(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    backoff_factor: float = 2.0,
    jitter_range: float = 0.1,
    strategy: BackoffStrategy = BackoffStrategy.EXPONENTIAL_WITH_JITTER,
    retryable_exceptions: tuple = (Exception,),
    should_retry_callback: Optional[Callable] = None,
    name: Optional[str] = None
):
    """
    Decorator to apply retry logic to async functions.

    Usage:
        @retry(max_attempts=5, base_delay=2.0)
        async def call_external_api():
            return await requests.get("https://api.example.com")
    """
    def decorator(func: Callable) -> Callable:
        retry_name = name or f"{func.__module__}.{func.__name__}"

        config = RetryConfig(
            max_attempts=max_attempts,
            base_delay=base_delay,
            max_delay=max_delay,
            backoff_factor=backoff_factor,
            jitter_range=jitter_range,
            strategy=strategy,
            retryable_exceptions=retryable_exceptions,
            should_retry_callback=should_retry_callback,
            name=retry_name
        )

        @wraps(func)
        async def wrapper(*args, **kwargs):
            manager = retry_registry.get_or_create(retry_name, config)
            return await manager.execute(func, *args, **kwargs)

        return wrapper
    return decorator


# Pre-configured retry managers for common scenarios
def get_http_retry_manager() -> RetryManager:
    """Get retry manager optimized for HTTP requests."""
    config = RetryConfig(
        name="http_client",
        max_attempts=5,
        base_delay=1.0,
        max_delay=30.0,
        backoff_factor=2.0,
        jitter_range=0.2,
        strategy=BackoffStrategy.EXPONENTIAL_WITH_JITTER
    )
    return retry_registry.get_or_create("http_client", config)


def get_database_retry_manager() -> RetryManager:
    """Get retry manager optimized for database operations."""
    config = RetryConfig(
        name="database",
        max_attempts=3,
        base_delay=0.5,
        max_delay=10.0,
        backoff_factor=2.0,
        jitter_range=0.1,
        strategy=BackoffStrategy.EXPONENTIAL_WITH_JITTER
    )
    return retry_registry.get_or_create("database", config)


def get_external_api_retry_manager() -> RetryManager:
    """Get retry manager optimized for external API calls."""
    config = RetryConfig(
        name="external_api",
        max_attempts=4,
        base_delay=2.0,
        max_delay=60.0,
        backoff_factor=2.0,
        jitter_range=0.3,
        strategy=BackoffStrategy.EXPONENTIAL_WITH_JITTER
    )
    return retry_registry.get_or_create("external_api", config)


def should_retry_http_error(exception: Exception) -> bool:
    """
    Custom retry logic for HTTP errors.
    Only retry on specific HTTP status codes that indicate transient failures.
    """
    # For now, retry on all HTTP errors - can be made more specific later
    # when we have access to the actual HTTP response object
    error_message = str(exception).lower()
    retryable_patterns = [
        'timeout',
        'connection error',
        'network error',
        'rate limit',
        'too many requests',
        'service unavailable',
        'server error',
        '502',
        '503',
        '504'
    ]
    return any(pattern in error_message for pattern in retryable_patterns)


def should_retry_database_error(exception: Exception) -> bool:
    """
    Custom retry logic for database errors.
    Only retry on connection-related errors, not constraint violations.
    """
    error_message = str(exception).lower()
    # Retry on connection errors, timeouts, deadlocks
    retryable_patterns = [
        'connection lost',
        'connection failed',
        'timeout',
        'deadlock',
        'lock timeout',
        'connection reset',
        'network error'
    ]
    return any(pattern in error_message for pattern in retryable_patterns)


def should_retry_stripe_error(exception: Exception) -> bool:
    """
    Custom retry logic for Stripe API errors.
    Only retry on transient network errors, not authentication or validation errors.
    """
    error_message = str(exception).lower()
    # Retry on network errors, timeouts, rate limits
    retryable_patterns = [
        'timeout',
        'connection error',
        'network error',
        'rate limit',
        'too many requests',
        'service unavailable',
        'server error'
    ]
    return any(pattern in error_message for pattern in retryable_patterns)