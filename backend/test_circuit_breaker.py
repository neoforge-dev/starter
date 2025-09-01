#!/usr/bin/env python3
"""
Test script to validate the circuit breaker implementation.
Tests all states and behaviors of the circuit breaker pattern.
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.core.circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerConfig,
    CircuitBreakerState,
    CircuitBreakerOpenException,
    circuit_breaker_registry,
    get_stripe_circuit_breaker,
    get_database_circuit_breaker,
    get_external_api_circuit_breaker
)


async def test_circuit_breaker_states():
    """Test circuit breaker state transitions."""
    print("🧪 Testing circuit breaker state transitions...")

    config = CircuitBreakerConfig(
        name="test_service",
        failure_threshold=3,
        recovery_timeout=2.0,  # 2 seconds for testing
        success_threshold=2,
        timeout=1.0
    )
    cb = CircuitBreaker(config)

    # Initial state should be CLOSED
    assert cb.is_closed, "Circuit breaker should start in CLOSED state"
    assert cb.state == CircuitBreakerState.CLOSED, "State should be CLOSED"

    print("✅ Initial state: CLOSED")

    # Test successful calls
    async def success_func():
        return "success"

    for i in range(3):
        result = await cb.call(success_func)
        assert result == "success", f"Call {i+1} should succeed"

    assert cb.is_closed, "Should remain CLOSED after successful calls"
    assert cb.metrics.successful_requests == 3, "Should have 3 successful requests"
    assert cb.metrics.consecutive_successes == 3, "Should have 3 consecutive successes"

    print("✅ Successful calls handled correctly")


async def test_circuit_breaker_failure_handling():
    """Test circuit breaker failure handling and state transitions."""
    print("\n🧪 Testing circuit breaker failure handling...")

    config = CircuitBreakerConfig(
        name="failing_service",
        failure_threshold=2,
        recovery_timeout=1.0,  # 1 second for testing
        success_threshold=1,
        timeout=1.0
    )
    cb = CircuitBreaker(config)

    # Test failure calls
    async def failing_func():
        raise ValueError("Test failure")

    # First failure
    try:
        await cb.call(failing_func)
        assert False, "Should have raised exception"
    except ValueError:
        pass

    assert cb.is_closed, "Should still be CLOSED after 1 failure"
    assert cb.metrics.failed_requests == 1, "Should have 1 failed request"
    assert cb.metrics.consecutive_failures == 1, "Should have 1 consecutive failure"

    # Second failure - should open circuit
    try:
        await cb.call(failing_func)
        assert False, "Should have raised exception"
    except ValueError:
        pass

    assert cb.is_open, "Should be OPEN after 2 failures"
    assert cb.metrics.failed_requests == 2, "Should have 2 failed requests"
    assert cb.metrics.consecutive_failures == 2, "Should have 2 consecutive failures"

    print("✅ Circuit opened after failure threshold reached")

    # Test that requests are rejected when open
    try:
        await cb.call(lambda: "should not execute")
        assert False, "Should have raised CircuitBreakerOpenException"
    except CircuitBreakerOpenException:
        pass

    assert cb.metrics.rejected_requests == 1, "Should have 1 rejected request"

    print("✅ Requests properly rejected when circuit is open")


async def test_circuit_breaker_recovery():
    """Test circuit breaker recovery from open to half-open to closed."""
    print("\n🧪 Testing circuit breaker recovery...")

    config = CircuitBreakerConfig(
        name="recovery_service",
        failure_threshold=2,
        recovery_timeout=1.0,  # 1 second for testing
        success_threshold=2,
        timeout=1.0
    )
    cb = CircuitBreaker(config)

    # Fail the circuit
    async def failing_func():
        raise ValueError("Test failure")

    for _ in range(2):
        try:
            await cb.call(failing_func)
        except ValueError:
            pass

    assert cb.is_open, "Circuit should be open"

    # Wait for recovery timeout
    await asyncio.sleep(1.1)

    # Next call should transition to half-open
    async def success_func():
        return "recovered"

    try:
        result = await cb.call(success_func)
        assert result == "recovered", "Should succeed in half-open state"
    except CircuitBreakerOpenException:
        assert False, "Should not be rejected in half-open state"

    assert cb.is_half_open, "Should be in HALF_OPEN state"
    print("✅ Circuit transitioned to HALF_OPEN state")

    # Another success should fully close the circuit
    result = await cb.call(success_func)
    assert result == "recovered", "Second call should also succeed"
    assert cb.is_closed, "Should be fully CLOSED after success threshold"

    print("✅ Circuit fully recovered and CLOSED")


async def test_circuit_breaker_timeout():
    """Test circuit breaker timeout handling."""
    print("\n🧪 Testing circuit breaker timeout handling...")

    config = CircuitBreakerConfig(
        name="timeout_service",
        failure_threshold=1,
        recovery_timeout=1.0,
        timeout=0.5  # 0.5 second timeout
    )
    cb = CircuitBreaker(config)

    async def slow_func():
        await asyncio.sleep(1.0)  # Takes longer than timeout
        return "slow result"

    try:
        await cb.call(slow_func)
        assert False, "Should have timed out"
    except TimeoutError as e:
        assert "timed out after 0.5s" in str(e), "Should mention timeout duration"

    assert cb.is_open, "Should be open after timeout"
    assert cb.metrics.failed_requests == 1, "Should count timeout as failure"

    print("✅ Timeout handling working correctly")


async def test_circuit_breaker_registry():
    """Test circuit breaker registry functionality."""
    print("\n🧪 Testing circuit breaker registry...")

    # Clear registry for clean test
    circuit_breaker_registry._breakers.clear()

    # Test getting or creating circuit breakers
    cb1 = circuit_breaker_registry.get_or_create("test1", CircuitBreakerConfig(name="test1"))
    cb2 = circuit_breaker_registry.get_or_create("test2", CircuitBreakerConfig(name="test2"))

    assert cb1.config.name == "test1", "First circuit breaker should have correct name"
    assert cb2.config.name == "test2", "Second circuit breaker should have correct name"

    # Test getting existing circuit breaker
    cb1_again = circuit_breaker_registry.get_or_create("test1", CircuitBreakerConfig(name="test1"))
    assert cb1 is cb1_again, "Should return same instance for same name"

    # Test getting all circuit breakers
    all_breakers = circuit_breaker_registry.get_all()
    assert len(all_breakers) == 2, "Should have 2 circuit breakers"
    assert "test1" in all_breakers, "Should contain test1"
    assert "test2" in all_breakers, "Should contain test2"

    print("✅ Circuit breaker registry working correctly")


async def test_preconfigured_circuit_breakers():
    """Test pre-configured circuit breakers for common services."""
    print("\n🧪 Testing pre-configured circuit breakers...")

    # Clear registry first
    circuit_breaker_registry._breakers.clear()

    # Test Stripe circuit breaker
    stripe_cb = get_stripe_circuit_breaker()
    assert stripe_cb.config.name == "stripe_api", "Should have correct name"
    assert stripe_cb.config.failure_threshold == 3, "Should have correct failure threshold"
    assert stripe_cb.config.recovery_timeout == 120.0, "Should have correct recovery timeout"

    # Test database circuit breaker
    db_cb = get_database_circuit_breaker()
    assert db_cb.config.name == "database", "Should have correct name"
    assert db_cb.config.timeout == 10.0, "Should have correct timeout"

    # Test external API circuit breaker
    api_cb = get_external_api_circuit_breaker()
    assert api_cb.config.name == "external_api", "Should have correct name"
    assert api_cb.config.timeout == 15.0, "Should have correct timeout"

    print("✅ Pre-configured circuit breakers working correctly")


async def test_circuit_breaker_metrics():
    """Test circuit breaker metrics collection."""
    print("\n🧪 Testing circuit breaker metrics...")

    config = CircuitBreakerConfig(name="metrics_test", failure_threshold=2)
    cb = CircuitBreaker(config)

    # Make some calls
    async def success_func():
        return "success"

    async def failure_func():
        raise ValueError("failure")

    # Successful calls
    for _ in range(3):
        await cb.call(success_func)

    # Failed calls
    for _ in range(2):
        try:
            await cb.call(failure_func)
        except ValueError:
            pass

    # Get metrics
    metrics = cb.get_metrics()

    assert metrics["total_requests"] == 5, "Should have 5 total requests"
    assert metrics["successful_requests"] == 3, "Should have 3 successful requests"
    assert metrics["failed_requests"] == 2, "Should have 2 failed requests"
    assert metrics["success_rate"] == 60.0, "Should have 60% success rate"
    assert metrics["failure_rate"] == 40.0, "Should have 40% failure rate"
    assert metrics["state"] == "open", "Should be in open state"
    assert "last_failure_time" in metrics, "Should have last failure time"
    assert "last_success_time" in metrics, "Should have last success time"

    print("✅ Circuit breaker metrics working correctly")


async def main():
    """Run all circuit breaker tests."""
    print("🚀 Starting Circuit Breaker Implementation Tests")
    print("=" * 60)

    tests = [
        test_circuit_breaker_states,
        test_circuit_breaker_failure_handling,
        test_circuit_breaker_recovery,
        test_circuit_breaker_timeout,
        test_circuit_breaker_registry,
        test_preconfigured_circuit_breakers,
        test_circuit_breaker_metrics
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        try:
            await test()
            passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All circuit breaker tests passed!")
        print("\n✅ Circuit breaker implementation is working correctly")
        print("✅ State transitions working as expected")
        print("✅ Failure handling and recovery working")
        print("✅ Timeout handling implemented")
        print("✅ Registry and pre-configured breakers working")
        print("✅ Metrics collection operational")
        print("\n🚀 Circuit breaker ready for production use!")
    else:
        print(f"⚠️  {total - passed} tests failed. Please review the implementation.")

    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)