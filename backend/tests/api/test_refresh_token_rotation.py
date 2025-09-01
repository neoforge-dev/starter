"""Tests for JWT refresh token rotation functionality."""
import pytest
from app.schemas.auth import RefreshTokenRequest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import (
    generate_refresh_token,
    hash_refresh_token,
    revoke_all_user_tokens,
    revoke_refresh_token,
    rotate_refresh_token,
    store_refresh_token,
    validate_refresh_token,
)
from app.core.config import get_settings
from app.core.redis import get_redis
from tests.factories import UserFactory


class TestRefreshTokenRotation:
    """Test refresh token rotation functionality."""

    @pytest.mark.asyncio
    async def test_generate_refresh_token(self):
        """Test refresh token generation."""
        token1 = generate_refresh_token()
        token2 = generate_refresh_token()

        # Tokens should be different
        assert token1 != token2

        # Tokens should be proper length (URL-safe base64)
        assert len(token1) > 40  # 32 bytes base64 encoded
        assert len(token2) > 40

        # Tokens should be URL-safe
        assert all(
            c in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
            for c in token1
        )

    @pytest.mark.asyncio
    async def test_hash_refresh_token(self):
        """Test refresh token hashing."""
        token = "test_token_123"
        hash1 = hash_refresh_token(token)
        hash2 = hash_refresh_token(token)

        # Same token should produce same hash
        assert hash1 == hash2

        # Hash should be SHA256 hex (64 characters)
        assert len(hash1) == 64
        assert all(c in "0123456789abcdef" for c in hash1)

        # Different tokens should produce different hashes
        hash3 = hash_refresh_token("different_token")
        assert hash1 != hash3

    @pytest.mark.asyncio
    async def test_store_refresh_token(self):
        """Test storing refresh token in Redis."""
        settings = get_settings()
        user_id = 123
        token = generate_refresh_token()
        token_hash = hash_refresh_token(token)
        session_id = "test_session_123"

        async for redis in get_redis():
            await store_refresh_token(
                redis=redis,
                user_id=user_id,
                token_hash=token_hash,
                session_id=session_id,
                settings=settings,
                expires_in_days=7,
            )

            # Verify token is stored
            key = f"refresh_token:{token_hash}"
            stored_data = await redis.hgetall(key)

            assert stored_data["user_id"] == str(user_id)
            assert stored_data["session_id"] == session_id
            assert stored_data["rotations"] == "0"
            assert "created_at" in stored_data

            # Verify user token set
            user_key = f"user_refresh_tokens:{user_id}"
            token_set = await redis.smembers(user_key)
            assert token_hash in token_set

            # Verify expiration is set
            ttl = await redis.ttl(key)
            assert ttl > 0  # Should have expiration set

    @pytest.mark.asyncio
    async def test_validate_refresh_token(self):
        """Test refresh token validation."""
        settings = get_settings()
        user_id = 456
        token = generate_refresh_token()
        token_hash = hash_refresh_token(token)
        session_id = "test_session_456"

        async for redis in get_redis():
            # Store token first
            await store_refresh_token(
                redis=redis,
                user_id=user_id,
                token_hash=token_hash,
                session_id=session_id,
                settings=settings,
            )

            # Validate token
            token_data = await validate_refresh_token(redis, token)

            assert token_data is not None
            assert token_data["user_id"] == user_id
            assert token_data["session_id"] == session_id
            assert token_data["rotations"] == 0
            assert "created_at" in token_data

            # Test invalid token
            invalid_token = generate_refresh_token()
            invalid_data = await validate_refresh_token(redis, invalid_token)
            assert invalid_data is None


class TestRefreshTokenAPI:
    """Test refresh token API endpoints."""

    @pytest.mark.asyncio
    async def test_refresh_token_endpoint(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Test refresh token endpoint."""
        # Create test user
        user = UserFactory()
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Login to get tokens
        login_data = {"username": user.email, "password": "testpassword123"}

        response = await async_client.post("/api/v1/auth/token", data=login_data)
        assert response.status_code == 200

        tokens = response.json()
        assert "access_token" in tokens
        assert "refresh_token" in tokens

        refresh_token = tokens["refresh_token"]

        # Use refresh token to get new access token
        refresh_data = {"refresh_token": refresh_token}
        response = await async_client.post("/api/v1/auth/refresh", json=refresh_data)
        assert response.status_code == 200

        new_tokens = response.json()
        assert "access_token" in new_tokens
        assert "refresh_token" in new_tokens

        # New refresh token should be different
        new_refresh_token = new_tokens["refresh_token"]
        assert new_refresh_token != refresh_token

        # Old refresh token should no longer work
        response = await async_client.post("/api/v1/auth/refresh", json=refresh_data)
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_with_invalid_token(self, async_client: AsyncClient):
        """Test refresh with invalid token."""
        refresh_data = {"refresh_token": "invalid_token_123"}
        response = await async_client.post("/api/v1/auth/refresh", json=refresh_data)
        assert response.status_code == 401
        assert "Invalid or expired refresh token" in response.json()["detail"]
