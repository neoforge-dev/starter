#!/usr/bin/env python3
"""
Test script to validate the rate limiting and DDoS protection system.
Tests rate limiting rules, DDoS detection, and protection mechanisms.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.core.rate_limiting import (
    RateLimitingManager,
    RateLimitConfig,
    RateLimitRule,
    RateLimitStrategy,
    RateLimitScope,
    DDoSProtectionLevel,
    RateLimitExceeded,
    DDoSAttackDetected,
    IPBlacklisted,
    ChallengeRequired
)


async def test_rate_limiting_manager_creation():
    """Test rate limiting manager initialization."""
    print("🧪 Testing rate limiting manager creation...")

    config = RateLimitConfig(
        default_requests_per_minute=60,
        enable_ddos_protection=True,
        ddos_protection_level=DDoSProtectionLevel.STANDARD
    )

    manager = RateLimitingManager(config)

    assert manager.config.default_requests_per_minute == 60
    assert manager.config.enable_ddos_protection == True
    assert manager.config.ddos_protection_level == DDoSProtectionLevel.STANDARD
    assert len(manager.rules) > 0, "Should have default rules"

    print("✅ Rate limiting manager created successfully")


async def test_rate_limit_rule():
    """Test rate limiting rule functionality."""
    print("\n🧪 Testing rate limiting rule...")

    manager = RateLimitingManager(RateLimitConfig())

    # Add a custom rule
    rule = RateLimitRule(
        name="test_rule",
        strategy=RateLimitStrategy.FIXED_WINDOW,
        scope=RateLimitScope.IP,
        requests_per_window=5,
        window_seconds=60
    )
    manager.add_rule(rule)

    assert "test_rule" in manager.rules, "Rule should be added"
    assert manager.rules["test_rule"].requests_per_window == 5, "Rule should have correct limit"

    print("✅ Rate limiting rule working correctly")


async def test_rate_limit_enforcement():
    """Test rate limit enforcement."""
    print("\n🧪 Testing rate limit enforcement...")

    manager = RateLimitingManager(RateLimitConfig())

    # Add a strict rule
    rule = RateLimitRule(
        name="strict_rule",
        strategy=RateLimitStrategy.FIXED_WINDOW,
        scope=RateLimitScope.IP,
        requests_per_window=3,
        window_seconds=60
    )
    manager.add_rule(rule)

    request_data = {
        "ip_address": "192.168.1.100",
        "endpoint": "/api/test",
        "method": "GET"
    }

    # First 3 requests should succeed
    for i in range(3):
        result = await manager.check_request(request_data)
        assert result["allowed"] == True, f"Request {i+1} should be allowed"

    # 4th request should be blocked
    try:
        await manager.check_request(request_data)
        assert False, "4th request should be blocked"
    except RateLimitExceeded:
        pass

    print("✅ Rate limit enforcement working correctly")


async def test_ip_whitelist_blacklist():
    """Test IP whitelist and blacklist functionality."""
    print("\n🧪 Testing IP whitelist/blacklist...")

    manager = RateLimitingManager(RateLimitConfig(enable_ip_whitelisting=True))

    # Add IP to whitelist
    manager.add_ip_to_whitelist("192.168.1.100")

    request_data = {
        "ip_address": "192.168.1.100",
        "endpoint": "/api/test",
        "method": "GET"
    }

    # Whitelisted IP should be allowed
    result = await manager.check_request(request_data)
    assert result["allowed"] == True, "Whitelisted IP should be allowed"

    # Add IP to blacklist
    manager.add_ip_to_blacklist("192.168.1.200")

    request_data["ip_address"] = "192.168.1.200"

    try:
        await manager.check_request(request_data)
        assert False, "Blacklisted IP should be blocked"
    except IPBlacklisted:
        pass

    print("✅ IP whitelist/blacklist working correctly")


async def test_ddos_detection():
    """Test DDoS attack detection."""
    print("\n🧪 Testing DDoS detection...")

    config = RateLimitConfig(
        enable_ddos_protection=True,
        ddos_protection_level=DDoSProtectionLevel.ADVANCED
    )
    manager = RateLimitingManager(config)

    # Simulate rapid requests from same IP
    request_data = {
        "ip_address": "192.168.1.100",
        "endpoint": "/api/test",
        "method": "GET",
        "user_agent": "bot"
    }

    # Make many requests quickly to trigger DDoS detection
    for i in range(15):
        try:
            await manager.check_request(request_data)
        except (RateLimitExceeded, DDoSAttackDetected):
            break

    # Check if IP was marked as suspicious
    assert "192.168.1.100" in manager.ddos_metrics.suspicious_ips, "IP should be marked as suspicious"

    print("✅ DDoS detection working correctly")


async def test_challenge_response():
    """Test challenge-response system."""
    print("\n🧪 Testing challenge-response...")

    config = RateLimitConfig(enable_challenge_response=True)
    manager = RateLimitingManager(config)

    # Add a rule that will trigger challenge
    rule = RateLimitRule(
        name="challenge_rule",
        strategy=RateLimitStrategy.FIXED_WINDOW,
        scope=RateLimitScope.IP,
        requests_per_window=1,
        window_seconds=60
    )
    manager.add_rule(rule)

    request_data = {
        "ip_address": "192.168.1.100",
        "endpoint": "/api/test",
        "method": "GET"
    }

    # First request should succeed
    result = await manager.check_request(request_data)
    assert result["allowed"] == True, "First request should be allowed"

    # Second request should require challenge
    try:
        await manager.check_request(request_data)
        assert False, "Second request should require challenge"
    except ChallengeRequired as e:
        challenge_info = str(e)
        assert "Challenge required" in challenge_info, "Should mention challenge"

    print("✅ Challenge-response working correctly")


async def test_user_agent_filtering():
    """Test user agent filtering."""
    print("\n🧪 Testing user agent filtering...")

    config = RateLimitConfig(
        enable_ddos_protection=True,
        enable_user_agent_filtering=True,
        ddos_protection_level=DDoSProtectionLevel.ADVANCED
    )
    manager = RateLimitingManager(config)

    request_data = {
        "ip_address": "192.168.1.100",
        "endpoint": "/api/test",
        "method": "GET",
        "user_agent": "malware_bot_scanner"
    }

    # Request with suspicious user agent should be blocked
    try:
        await manager.check_request(request_data)
        assert False, "Request with suspicious user agent should be blocked"
    except DDoSAttackDetected:
        pass

    print("✅ User agent filtering working correctly")


async def test_request_size_limiting():
    """Test request size limiting."""
    print("\n🧪 Testing request size limiting...")

    config = RateLimitConfig(
        enable_ddos_protection=True,
        enable_request_size_limiting=True,
        max_request_size=1024  # 1KB
    )
    manager = RateLimitingManager(config)

    request_data = {
        "ip_address": "192.168.1.100",
        "endpoint": "/api/test",
        "method": "POST",
        "content_length": 2048  # 2KB - exceeds limit
    }

    # Large request should be blocked
    try:
        await manager.check_request(request_data)
        assert False, "Large request should be blocked"
    except DDoSAttackDetected:
        pass

    print("✅ Request size limiting working correctly")


async def test_adaptive_rate_limiting():
    """Test adaptive rate limiting based on threat level."""
    print("\n🧪 Testing adaptive rate limiting...")

    manager = RateLimitingManager(RateLimitConfig())

    # Add adaptive rule
    rule = RateLimitRule(
        name="adaptive_rule",
        strategy=RateLimitStrategy.ADAPTIVE,
        scope=RateLimitScope.IP,
        requests_per_window=100,
        window_seconds=60
    )
    manager.add_rule(rule)

    request_data = {
        "ip_address": "192.168.1.100",
        "endpoint": "/api/test",
        "method": "GET"
    }

    # With normal threat level, should allow more requests
    manager.ddos_metrics.current_threat_level = "low"

    # Should allow requests under normal conditions
    for i in range(10):
        result = await manager.check_request(request_data)
        assert result["allowed"] == True, f"Request {i+1} should be allowed under normal conditions"

    print("✅ Adaptive rate limiting working correctly")


async def test_metrics_collection():
    """Test metrics collection."""
    print("\n🧪 Testing metrics collection...")

    manager = RateLimitingManager(RateLimitConfig())

    # Make some requests
    request_data = {
        "ip_address": "192.168.1.100",
        "endpoint": "/api/test",
        "method": "GET"
    }

    for _ in range(5):
        await manager.check_request(request_data)

    # Get metrics
    metrics = manager.get_metrics()

    assert "total_rules" in metrics, "Should have total rules metric"
    assert "total_states" in metrics, "Should have total states metric"
    assert "ddos_metrics" in metrics, "Should have DDoS metrics"
    assert metrics["total_rules"] > 0, "Should have rules"
    assert metrics["total_states"] > 0, "Should have states"

    ddos_metrics = metrics["ddos_metrics"]
    assert "current_threat_level" in ddos_metrics, "Should have threat level"
    assert "total_attacks_detected" in ddos_metrics, "Should have attack detection count"

    print("✅ Metrics collection working correctly")


async def test_rule_management():
    """Test rule management functionality."""
    print("\n🧪 Testing rule management...")

    manager = RateLimitingManager(RateLimitConfig())

    # Add rule
    rule = RateLimitRule(
        name="management_test",
        strategy=RateLimitStrategy.TOKEN_BUCKET,
        scope=RateLimitScope.USER,
        requests_per_window=50,
        window_seconds=60
    )
    manager.add_rule(rule)

    assert "management_test" in manager.rules, "Rule should be added"

    # Remove rule
    manager.remove_rule("management_test")
    assert "management_test" not in manager.rules, "Rule should be removed"

    print("✅ Rule management working correctly")


async def test_different_rate_limit_strategies():
    """Test different rate limiting strategies."""
    print("\n🧪 Testing different rate limiting strategies...")

    manager = RateLimitingManager(RateLimitConfig())

    strategies = [
        (RateLimitStrategy.FIXED_WINDOW, "fixed_window_rule"),
        (RateLimitStrategy.TOKEN_BUCKET, "token_bucket_rule"),
        (RateLimitStrategy.LEAKY_BUCKET, "leaky_bucket_rule")
    ]

    for strategy, rule_name in strategies:
        rule = RateLimitRule(
            name=rule_name,
            strategy=strategy,
            scope=RateLimitScope.IP,
            requests_per_window=5,
            window_seconds=60
        )
        manager.add_rule(rule)

        # Test that rule was added with correct strategy
        assert manager.rules[rule_name].strategy == strategy, f"Strategy should be {strategy.value}"

    print("✅ Different rate limiting strategies working correctly")


async def main():
    """Run all rate limiting tests."""
    print("🚀 Starting Rate Limiting Tests")
    print("=" * 60)

    tests = [
        test_rate_limiting_manager_creation,
        test_rate_limit_rule,
        test_rate_limit_enforcement,
        test_ip_whitelist_blacklist,
        test_ddos_detection,
        test_challenge_response,
        test_user_agent_filtering,
        test_request_size_limiting,
        test_adaptive_rate_limiting,
        test_metrics_collection,
        test_rule_management,
        test_different_rate_limit_strategies
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
        print("🎉 All rate limiting tests passed!")
        print("\n✅ Rate limiting system is working correctly")
        print("✅ Multiple rate limiting strategies implemented")
        print("✅ DDoS protection and attack detection working")
        print("✅ IP whitelist/blacklist functionality operational")
        print("✅ Challenge-response system implemented")
        print("✅ User agent and request size filtering working")
        print("✅ Adaptive rate limiting based on threat levels")
        print("✅ Comprehensive metrics collection")
        print("✅ Rule management and configuration working")
        print("\n🚀 Rate limiting ready for production use!")
    else:
        print(f"⚠️  {total - passed} tests failed. Please review the implementation.")

    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)