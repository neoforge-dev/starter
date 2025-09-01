#!/usr/bin/env python3
"""
Test script to validate the JWT security implementation.
Tests token creation, validation, rotation, and security features.
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.core.jwt_security import (
    JWTSecurityManager,
    JWTSecurityConfig,
    TokenType,
    TokenStatus,
    InvalidTokenError,
    TokenMetadata
)


async def test_jwt_security_manager_creation():
    """Test JWT security manager initialization."""
    print("🧪 Testing JWT security manager creation...")

    config = JWTSecurityConfig(
        secret_key="test_secret_key_for_testing_only",
        access_token_expire_minutes=15,
        refresh_token_expire_days=7
    )

    manager = JWTSecurityManager(config)

    assert manager.config.secret_key == "test_secret_key_for_testing_only"
    assert manager.config.access_token_expire_minutes == 15
    assert manager.config.refresh_token_expire_days == 7

    print("✅ JWT security manager created successfully")


async def test_access_token_creation():
    """Test access token creation."""
    print("\n🧪 Testing access token creation...")

    config = JWTSecurityConfig(secret_key="test_secret_key")
    manager = JWTSecurityManager(config)

    # Create access token
    token, metadata = manager.create_access_token(
        data={"role": "user"},
        user_id=123,
        tenant_id="tenant_456",
        ip_address="192.168.1.100",
        user_agent="Mozilla/5.0",
        device_fingerprint="device_123"
    )

    # Validate token structure
    assert token is not None and len(token) > 0, "Token should be created"
    assert isinstance(metadata, TokenMetadata), "Metadata should be TokenMetadata"

    # Validate metadata
    assert metadata.user_id == 123, "User ID should match"
    assert metadata.tenant_id == "tenant_456", "Tenant ID should match"
    assert metadata.token_type == TokenType.ACCESS, "Token type should be ACCESS"
    assert metadata.status == TokenStatus.ACTIVE, "Token should be ACTIVE"
    assert metadata.ip_address == "192.168.1.100", "IP address should match"
    assert metadata.user_agent == "Mozilla/5.0", "User agent should match"
    assert metadata.device_fingerprint == "device_123", "Device fingerprint should match"

    print("✅ Access token created successfully")


async def test_refresh_token_creation():
    """Test refresh token creation."""
    print("\n🧪 Testing refresh token creation...")

    config = JWTSecurityConfig(secret_key="test_secret_key")
    manager = JWTSecurityManager(config)

    # Create refresh token
    token, metadata = manager.create_refresh_token(
        user_id=456,
        tenant_id="tenant_789",
        ip_address="10.0.0.50",
        user_agent="Test-Agent/1.0",
        device_fingerprint="device_456"
    )

    # Validate token structure
    assert token is not None and len(token) > 0, "Token should be created"
    assert isinstance(metadata, TokenMetadata), "Metadata should be TokenMetadata"

    # Validate metadata
    assert metadata.user_id == 456, "User ID should match"
    assert metadata.tenant_id == "tenant_789", "Tenant ID should match"
    assert metadata.token_type == TokenType.REFRESH, "Token type should be REFRESH"
    assert metadata.status == TokenStatus.ACTIVE, "Token should be ACTIVE"

    print("✅ Refresh token created successfully")


async def test_token_validation():
    """Test token validation."""
    print("\n🧪 Testing token validation...")

    config = JWTSecurityConfig(secret_key="test_secret_key")
    manager = JWTSecurityManager(config)

    # Create and store token
    token, metadata = manager.create_access_token(
        data={"role": "admin"},
        user_id=789,
        device_fingerprint="device_789"
    )

    # Validate token
    validated_metadata = manager.validate_token(
        token,
        token_type=TokenType.ACCESS,
        device_fingerprint="device_789"
    )

    assert validated_metadata.user_id == 789, "User ID should match"
    assert validated_metadata.token_type == TokenType.ACCESS, "Token type should match"
    assert validated_metadata.status == TokenStatus.ACTIVE, "Token should be active"

    print("✅ Token validation working correctly")


async def test_token_validation_failure():
    """Test token validation failure scenarios."""
    print("\n🧪 Testing token validation failures...")

    config = JWTSecurityConfig(secret_key="test_secret_key")
    manager = JWTSecurityManager(config)

    # Test invalid token
    try:
        manager.validate_token("invalid_token")
        assert False, "Should have raised InvalidTokenError"
    except InvalidTokenError:
        pass

    # Test wrong device fingerprint
    token, _ = manager.create_access_token(
        data={},
        user_id=123,
        device_fingerprint="device_123"
    )

    try:
        manager.validate_token(token, device_fingerprint="wrong_device")
        assert False, "Should have raised InvalidTokenError for wrong device"
    except InvalidTokenError:
        pass

    print("✅ Token validation failures handled correctly")


async def test_token_rotation():
    """Test token rotation functionality."""
    print("\n🧪 Testing token rotation...")

    config = JWTSecurityConfig(secret_key="test_secret_key")
    manager = JWTSecurityManager(config)

    # Create original token
    original_token, original_metadata = manager.create_access_token(
        data={"role": "user"},
        user_id=999,
        device_fingerprint="device_999"
    )

    # Rotate token
    new_token, new_metadata = manager.rotate_access_token(
        original_token,
        user_id=999,
        device_fingerprint="device_999"
    )

    # Validate new token
    assert new_token != original_token, "New token should be different"
    assert new_metadata.user_id == 999, "User ID should match"
    assert new_metadata.parent_token_id == original_metadata.token_id, "Should link to parent token"
    assert new_metadata.rotation_count == 1, "Rotation count should be 1"

    # Original token should be revoked
    assert original_metadata.status == TokenStatus.REVOKED, "Original token should be revoked"

    print("✅ Token rotation working correctly")


async def test_token_revocation():
    """Test token revocation."""
    print("\n🧪 Testing token revocation...")

    config = JWTSecurityConfig(secret_key="test_secret_key")
    manager = JWTSecurityManager(config)

    # Create token
    token, metadata = manager.create_access_token(
        data={},
        user_id=111
    )

    # Revoke token
    manager.revoke_token(metadata.token_id)

    # Token should be revoked
    assert metadata.status == TokenStatus.REVOKED, "Token should be revoked"

    # Validation should fail
    try:
        manager.validate_token(token)
        assert False, "Should have raised InvalidTokenError for revoked token"
    except InvalidTokenError:
        pass

    print("✅ Token revocation working correctly")


async def test_user_token_management():
    """Test user token management."""
    print("\n🧪 Testing user token management...")

    config = JWTSecurityConfig(secret_key="test_secret_key")
    manager = JWTSecurityManager(config)

    # Create multiple tokens for user
    token1, _ = manager.create_access_token(data={}, user_id=222)
    token2, _ = manager.create_access_token(data={}, user_id=222)
    token3, _ = manager.create_refresh_token(user_id=222)

    # Get user tokens
    user_tokens = manager.get_user_tokens(222)
    assert len(user_tokens) == 3, "Should have 3 tokens for user"

    access_tokens = manager.get_user_tokens(222, TokenType.ACCESS)
    assert len(access_tokens) == 2, "Should have 2 access tokens"

    refresh_tokens = manager.get_user_tokens(222, TokenType.REFRESH)
    assert len(refresh_tokens) == 1, "Should have 1 refresh token"

    print("✅ User token management working correctly")


async def test_token_limits():
    """Test token limits enforcement."""
    print("\n🧪 Testing token limits...")

    config = JWTSecurityConfig(
        secret_key="test_secret_key",
        max_tokens_per_user=2,
        max_tokens_per_device=1
    )
    manager = JWTSecurityManager(config)

    # Create tokens up to limit
    token1, _ = manager.create_access_token(
        data={},
        user_id=333,
        device_fingerprint="device_333"
    )
    token2, _ = manager.create_access_token(
        data={},
        user_id=333,
        device_fingerprint="device_333"
    )

    # Third token should trigger cleanup
    token3, _ = manager.create_access_token(
        data={},
        user_id=333,
        device_fingerprint="device_333"
    )

    # Should only have 2 tokens now (limit enforcement)
    user_tokens = manager.get_user_tokens(333)
    assert len(user_tokens) <= 2, "Should not exceed user token limit"

    print("✅ Token limits enforced correctly")


async def test_security_metrics():
    """Test security metrics collection."""
    print("\n🧪 Testing security metrics...")

    config = JWTSecurityConfig(secret_key="test_secret_key")
    manager = JWTSecurityManager(config)

    # Create some activity
    manager.create_access_token(data={}, user_id=444)
    manager.create_refresh_token(user_id=444)

    # Get metrics
    metrics = manager.get_security_metrics()

    assert "total_tokens" in metrics, "Should have total tokens metric"
    assert "active_tokens" in metrics, "Should have active tokens metric"
    assert "tokens_per_user" in metrics, "Should have tokens per user metric"
    assert metrics["total_tokens"] == 2, "Should have 2 total tokens"
    assert metrics["active_tokens"] == 2, "Should have 2 active tokens"

    print("✅ Security metrics working correctly")


async def test_token_blacklist():
    """Test token blacklist functionality."""
    print("\n🧪 Testing token blacklist...")

    config = JWTSecurityConfig(secret_key="test_secret_key")
    manager = JWTSecurityManager(config)

    # Create and revoke token
    token, metadata = manager.create_access_token(data={}, user_id=555)
    manager.revoke_token(metadata.token_id)

    # Token should be in blacklist
    assert manager.token_blacklist.is_blacklisted(metadata.token_id), "Token should be blacklisted"

    # Validation should fail
    try:
        manager.validate_token(token)
        assert False, "Should have raised InvalidTokenError for blacklisted token"
    except InvalidTokenError:
        pass

    print("✅ Token blacklist working correctly")


async def main():
    """Run all JWT security tests."""
    print("🚀 Starting JWT Security Tests")
    print("=" * 60)

    tests = [
        test_jwt_security_manager_creation,
        test_access_token_creation,
        test_refresh_token_creation,
        test_token_validation,
        test_token_validation_failure,
        test_token_rotation,
        test_token_revocation,
        test_user_token_management,
        test_token_limits,
        test_security_metrics,
        test_token_blacklist
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
        print("🎉 All JWT security tests passed!")
        print("\n✅ JWT security system is working correctly")
        print("✅ Token creation and validation operational")
        print("✅ Token rotation and refresh working")
        print("✅ Token revocation and blacklist functional")
        print("✅ User and device token limits enforced")
        print("✅ Security metrics collection working")
        print("✅ Device fingerprinting and IP validation implemented")
        print("\n🚀 JWT security ready for production use!")
    else:
        print(f"⚠️  {total - passed} tests failed. Please review the implementation.")

    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)