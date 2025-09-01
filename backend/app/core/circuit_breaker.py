"""
Circuit Breaker Pattern Implementation for NeoForge
Provides fault tolerance and prevents cascade failures in distributed systems.
"""

import asyncio
import logging
import time
from enum import Enum
from typing import Any, Callable, Dict, Optional, Union
from dataclasses import dataclass, field
from functools import wraps

logger = logging.getLogger(__name__)


class CircuitBreakerState(Enum):
    """States of the circuit breaker."""
    CLOSED = "closed"       # Normal operation, requests pass through
    OPEN = "open"          # Circuit is open, requests are blocked
    HALF_OPEN = "half_open" # Testing if service has recovered


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker behavior."""
    failure_threshold: int = 5                    # Number of failures before opening
    recovery_timeout: float = 60.0               # Seconds to wait before trying to close
    success_threshold: int = 3                   # Successes needed to fully close in half-open
    timeout: float = 30.0                        # Request timeout in seconds
    expected_exception: tuple = (Exception,)      # Exceptions that count as failures
    name: str = "default"                        # Name for logging/monitoring


@dataclass
class CircuitBreakerMetrics:
    """Metrics for monitoring circuit breaker performance."""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    rejected_requests: int = 0
    state_changes: int = 0
    last_failure_time: Optional[float] = None
    last_success_time: Optional[float] = None
    consecutive_successes: int = 0
    consecutive_failures: int = 0


class CircuitBreaker:
    """
    Circuit Breaker implementation with async support.

    States:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Circuit is open, requests are immediately rejected
    - HALF_OPEN: Testing if the service has recovered

    Usage:
        cb = CircuitBreaker(name="stripe_api", failure_threshold=3)
        result = await cb.call(stripe_api_function, arg1, arg2)
    """

    def __init__(self, config: CircuitBreakerConfig):
        self.config = config
        self.state = CircuitBreakerState.CLOSED
        self.metrics = CircuitBreakerMetrics()
        self._lock = asyncio.Lock()
        self._last_state_change = time.time()

        logger.info(f"Initialized circuit breaker '{config.name}' with threshold {config.failure_threshold}")

    @property
    def is_closed(self) -> bool:
        """Check if circuit breaker is in closed state."""
        return self.state == CircuitBreakerState.CLOSED

    @property
    def is_open(self) -> bool:
        """Check if circuit breaker is in open state."""
        return self.state == CircuitBreakerState.OPEN

    @property
    def is_half_open(self) -> bool:
        """Check if circuit breaker is in half-open state."""
        return self.state == CircuitBreakerState.HALF_OPEN

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute a function through the circuit breaker.

        Args:
            func: The function to execute
            *args: Positional arguments for the function
            **kwargs: Keyword arguments for the function

        Returns:
            The result of the function call

        Raises:
            CircuitBreakerOpenException: If circuit is open
            Exception: Any exception from the wrapped function
        """
        if self.is_open:
            # Check if we should transition to half-open
            if self._should_attempt_reset():
                await self._set_state(CircuitBreakerState.HALF_OPEN)
            else:
                self.metrics.rejected_requests += 1
                raise CircuitBreakerOpenException(
                    f"Circuit breaker '{self.config.name}' is OPEN. "
                    f"Last failure: {self.metrics.last_failure_time}"
                )

        self.metrics.total_requests += 1

        try:
            # Execute the function with timeout
            if asyncio.iscoroutinefunction(func):
                result = await asyncio.wait_for(
                    func(*args, **kwargs),
                    timeout=self.config.timeout
                )
            else:
                result = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: func(*args, **kwargs)
                )

            await self._on_success()
            return result

        except self.config.expected_exception as e:
            await self._on_failure()
            raise e
        except asyncio.TimeoutError as e:
            await self._on_failure()
            raise TimeoutError(f"Request timed out after {self.config.timeout}s") from e
        except TimeoutError as e:
            await self._on_failure()
            raise e

    async def _on_success(self):
        """Handle successful request."""
        self.metrics.successful_requests += 1
        self.metrics.consecutive_successes += 1
        self.metrics.consecutive_failures = 0
        self.metrics.last_success_time = time.time()

        if self.is_half_open:
            if self.metrics.consecutive_successes >= self.config.success_threshold:
                await self._set_state(CircuitBreakerState.CLOSED)
                logger.info(f"Circuit breaker '{self.config.name}' fully recovered and CLOSED")

    async def _on_failure(self):
        """Handle failed request."""
        self.metrics.failed_requests += 1
        self.metrics.consecutive_failures += 1
        self.metrics.consecutive_successes = 0
        self.metrics.last_failure_time = time.time()

        if self.is_closed and self.metrics.consecutive_failures >= self.config.failure_threshold:
            await self._set_state(CircuitBreakerState.OPEN)
            logger.warning(f"Circuit breaker '{self.config.name}' opened due to {self.metrics.consecutive_failures} consecutive failures")

    async def _set_state(self, new_state: CircuitBreakerState):
        """Change circuit breaker state."""
        old_state = self.state
        self.state = new_state
        self._last_state_change = time.time()
        self.metrics.state_changes += 1

        logger.info(f"Circuit breaker '{self.config.name}' state changed: {old_state.value} -> {new_state.value}")

    def _should_attempt_reset(self) -> bool:
        """Check if we should attempt to reset from open to half-open."""
        if not self.is_open:
            return False

        time_since_failure = time.time() - (self.metrics.last_failure_time or 0)
        return time_since_failure >= self.config.recovery_timeout

    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics for monitoring."""
        return {
            "name": self.config.name,
            "state": self.state.value,
            "total_requests": self.metrics.total_requests,
            "successful_requests": self.metrics.successful_requests,
            "failed_requests": self.metrics.failed_requests,
            "rejected_requests": self.metrics.rejected_requests,
            "success_rate": (self.metrics.successful_requests / max(self.metrics.total_requests, 1)) * 100,
            "failure_rate": (self.metrics.failed_requests / max(self.metrics.total_requests, 1)) * 100,
            "rejection_rate": (self.metrics.rejected_requests / max(self.metrics.total_requests, 1)) * 100,
            "consecutive_successes": self.metrics.consecutive_successes,
            "consecutive_failures": self.metrics.consecutive_failures,
            "last_failure_time": self.metrics.last_failure_time,
            "last_success_time": self.metrics.last_success_time,
            "last_state_change": self._last_state_change,
            "time_since_last_state_change": time.time() - self._last_state_change
        }

    def reset(self):
        """Manually reset the circuit breaker to closed state."""
        self.state = CircuitBreakerState.CLOSED
        self.metrics = CircuitBreakerMetrics()
        self._last_state_change = time.time()
        logger.info(f"Circuit breaker '{self.config.name}' manually reset to CLOSED")


class CircuitBreakerOpenException(Exception):
    """Exception raised when circuit breaker is open."""
    pass


class CircuitBreakerRegistry:
    """
    Registry for managing multiple circuit breakers.
    Provides centralized monitoring and management.
    """

    def __init__(self):
        self._breakers: Dict[str, CircuitBreaker] = {}
        self._lock = asyncio.Lock()

    def get_or_create(self, name: str, config: CircuitBreakerConfig) -> CircuitBreaker:
        """Get existing circuit breaker or create new one."""
        if name not in self._breakers:
            self._breakers[name] = CircuitBreaker(config)
        return self._breakers[name]

    def get(self, name: str) -> Optional[CircuitBreaker]:
        """Get circuit breaker by name."""
        return self._breakers.get(name)

    def get_all(self) -> Dict[str, CircuitBreaker]:
        """Get all registered circuit breakers."""
        return self._breakers.copy()

    def get_all_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Get metrics for all circuit breakers."""
        return {name: cb.get_metrics() for name, cb in self._breakers.items()}

    def reset_all(self):
        """Reset all circuit breakers to closed state."""
        for cb in self._breakers.values():
            cb.reset()
        logger.info(f"Reset all {len(self._breakers)} circuit breakers")


# Global registry instance
circuit_breaker_registry = CircuitBreakerRegistry()


def circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    recovery_timeout: float = 60.0,
    success_threshold: int = 3,
    timeout: float = 30.0,
    expected_exception: tuple = (Exception,)
):
    """
    Decorator to apply circuit breaker pattern to async functions.

    Usage:
        @circuit_breaker(name="stripe_api", failure_threshold=3)
        async def call_stripe_api():
            return await stripe.Customer.create(...)
    """
    def decorator(func: Callable) -> Callable:
        config = CircuitBreakerConfig(
            name=name,
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout,
            success_threshold=success_threshold,
            timeout=timeout,
            expected_exception=expected_exception
        )

        @wraps(func)
        async def wrapper(*args, **kwargs):
            cb = circuit_breaker_registry.get_or_create(name, config)
            return await cb.call(func, *args, **kwargs)

        return wrapper
    return decorator


# Pre-configured circuit breakers for common services
def get_stripe_circuit_breaker() -> CircuitBreaker:
    """Get circuit breaker for Stripe API calls."""
    config = CircuitBreakerConfig(
        name="stripe_api",
        failure_threshold=3,
        recovery_timeout=120.0,  # 2 minutes
        success_threshold=2,
        timeout=30.0
    )
    return circuit_breaker_registry.get_or_create("stripe_api", config)


def get_database_circuit_breaker() -> CircuitBreaker:
    """Get circuit breaker for database operations."""
    config = CircuitBreakerConfig(
        name="database",
        failure_threshold=5,
        recovery_timeout=30.0,  # 30 seconds
        success_threshold=3,
        timeout=10.0
    )
    return circuit_breaker_registry.get_or_create("database", config)


def get_external_api_circuit_breaker() -> CircuitBreaker:
    """Get circuit breaker for external API calls."""
    config = CircuitBreakerConfig(
        name="external_api",
        failure_threshold=3,
        recovery_timeout=60.0,  # 1 minute
        success_threshold=2,
        timeout=15.0
    )
    return circuit_breaker_registry.get_or_create("external_api", config)