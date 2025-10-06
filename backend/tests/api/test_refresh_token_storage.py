"""Test refresh token storage and revocation in Redis."""
import logging
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.core.config import Settings
from app.core.auth import hash_refresh_token
from app.core.redis import get_redis
from tests.factories import UserFactory
from app.models.user import User

pytestmark = pytest.mark.asyncio

logger = logging.getLogger(__name__)


@pytest.fixture
async def test_user_for_refresh(db: AsyncSession) -> User:
    """Create a test user for refresh token tests."""
    user = await UserFactory.create(
        session=db,
        email="refresh-token-test@example.com",
        password="testpassword123",
        is_active=True,
        is_verified=True,
    )
    setattr(user, "plain_password", "testpassword123")
    yield user
    # Cleanup
    user_to_delete = await db.get(User, user.id)
    if user_to_delete:
        await db.delete(user_to_delete)


async def test_refresh_token_stored_in_redis_on_login(
    client: AsyncClient,
    db: AsyncSession,
    test_user_for_refresh: User,
    test_settings: Settings,
) -> None:
    """Test that refresh token is stored in Redis during login."""
    # Login to get refresh token
    login_data = {
        "username": test_user_for_refresh.email,
        "password": test_user_for_refresh.plain_password,
    }

    response = await client.post(
        f"{test_settings.api_v1_str}/auth/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == 200, f"Login failed: {response.text}"
    token_data = response.json()
    assert "refresh_token" in token_data
    refresh_token = token_data["refresh_token"]

    # Verify token is stored in Redis
    async for redis in get_redis():
        if redis:
            token_hash = hash_refresh_token(refresh_token)
            redis_key = f"refresh_token:{token_hash}"

            # Check that the token exists in Redis
            exists = await redis.exists(redis_key)
            assert exists, f"Refresh token not found in Redis at key: {redis_key}"

            # Verify token data
            token_data_redis = await redis.hgetall(redis_key)
            assert token_data_redis, "Token data is empty in Redis"
            assert "user_id" in token_data_redis
            assert token_data_redis["user_id"] == str(test_user_for_refresh.id)

            # Verify token is in user's token set
            user_key = f"user_refresh_tokens:{test_user_for_refresh.id}"
            is_member = await redis.sismember(user_key, token_hash)
            assert is_member, f"Token hash not found in user token set: {user_key}"

            logger.info(
                f"✅ Refresh token stored successfully in Redis for user {test_user_for_refresh.id}"
            )
            break


async def test_refresh_token_stored_on_registration(
    client: AsyncClient,
    db: AsyncSession,
    test_settings: Settings,
) -> None:
    """Test that refresh token is stored in Redis during registration."""
    registration_data = {
        "email": "refresh-register@example.com",
        "password": "testpassword123",
        "password_confirm": "testpassword123",
        "full_name": "Refresh Test User",
    }

    response = await client.post(
        f"{test_settings.api_v1_str}/auth/register",
        json=registration_data,
    )

    assert response.status_code == 200, f"Registration failed: {response.text}"
    data = response.json()
    assert "refresh_token" in data
    refresh_token = data["refresh_token"]
    user_id = data["user"]["id"]

    # Verify token is stored in Redis
    async for redis in get_redis():
        if redis:
            token_hash = hash_refresh_token(refresh_token)
            redis_key = f"refresh_token:{token_hash}"

            exists = await redis.exists(redis_key)
            assert exists, "Refresh token not found in Redis after registration"

            token_data = await redis.hgetall(redis_key)
            assert token_data["user_id"] == str(user_id)

            logger.info(f"✅ Refresh token stored successfully in Redis for new user {user_id}")
            break

    # Cleanup
    from app.crud.user import user as user_crud
    created_user = await user_crud.get_by_email(db, email=registration_data["email"])
    if created_user:
        await db.delete(created_user)
        await db.commit()


async def test_refresh_token_can_be_retrieved_and_validated(
    client: AsyncClient,
    db: AsyncSession,
    test_user_for_refresh: User,
    test_settings: Settings,
) -> None:
    """Test that stored refresh token can be retrieved and validated."""
    # Login to get refresh token
    login_data = {
        "username": test_user_for_refresh.email,
        "password": test_user_for_refresh.plain_password,
    }

    response = await client.post(
        f"{test_settings.api_v1_str}/auth/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == 200
    refresh_token = response.json()["refresh_token"]

    # Use refresh token to get new access token
    refresh_request = {"refresh_token": refresh_token}

    response = await client.post(
        f"{test_settings.api_v1_str}/auth/refresh",
        json=refresh_request,
    )

    assert response.status_code == 200, f"Token refresh failed: {response.text}"
    new_tokens = response.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens

    logger.info("✅ Refresh token successfully validated and rotated")


async def test_refresh_token_revocation_on_logout(
    client: AsyncClient,
    db: AsyncSession,
    test_user_for_refresh: User,
    test_settings: Settings,
) -> None:
    """Test that refresh token is revoked from Redis on logout."""
    # Login to get tokens
    login_data = {
        "username": test_user_for_refresh.email,
        "password": test_user_for_refresh.plain_password,
    }

    response = await client.post(
        f"{test_settings.api_v1_str}/auth/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == 200
    tokens = response.json()
    refresh_token = tokens["refresh_token"]
    access_token = tokens["access_token"]

    # Verify token exists in Redis before logout
    async for redis in get_redis():
        if redis:
            token_hash = hash_refresh_token(refresh_token)
            redis_key = f"refresh_token:{token_hash}"
            exists_before = await redis.exists(redis_key)
            assert exists_before, "Token should exist before logout"

            # Logout
            headers = {"Authorization": f"Bearer {access_token}"}
            logout_response = await client.post(
                f"{test_settings.api_v1_str}/auth/logout",
                json={"refresh_token": refresh_token},
                headers=headers,
            )

            assert logout_response.status_code == 200, f"Logout failed: {logout_response.text}"

            # Verify token is removed from Redis after logout
            exists_after = await redis.exists(redis_key)
            assert not exists_after, "Token should be removed from Redis after logout"

            # Verify token is removed from user's token set
            user_key = f"user_refresh_tokens:{test_user_for_refresh.id}"
            is_member = await redis.sismember(user_key, token_hash)
            assert not is_member, "Token should be removed from user token set after logout"

            logger.info("✅ Refresh token successfully revoked from Redis on logout")
            break


async def test_revoked_refresh_token_cannot_be_used(
    client: AsyncClient,
    db: AsyncSession,
    test_user_for_refresh: User,
    test_settings: Settings,
) -> None:
    """Test that a revoked refresh token cannot be used to get new tokens."""
    # Login to get tokens
    login_data = {
        "username": test_user_for_refresh.email,
        "password": test_user_for_refresh.plain_password,
    }

    response = await client.post(
        f"{test_settings.api_v1_str}/auth/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    tokens = response.json()
    refresh_token = tokens["refresh_token"]
    access_token = tokens["access_token"]

    # Logout to revoke the token
    headers = {"Authorization": f"Bearer {access_token}"}
    await client.post(
        f"{test_settings.api_v1_str}/auth/logout",
        json={"refresh_token": refresh_token},
        headers=headers,
    )

    # Try to use the revoked refresh token
    refresh_request = {"refresh_token": refresh_token}

    response = await client.post(
        f"{test_settings.api_v1_str}/auth/refresh",
        json=refresh_request,
    )

    assert response.status_code == 401, "Revoked token should not be accepted"
    error_data = response.json()
    assert "detail" in error_data
    assert "Invalid or expired refresh token" in error_data["detail"]

    logger.info("✅ Revoked refresh token correctly rejected")


async def test_refresh_token_expiration_in_redis(
    client: AsyncClient,
    db: AsyncSession,
    test_user_for_refresh: User,
    test_settings: Settings,
) -> None:
    """Test that refresh token has correct TTL in Redis."""
    # Login to get refresh token
    login_data = {
        "username": test_user_for_refresh.email,
        "password": test_user_for_refresh.plain_password,
    }

    response = await client.post(
        f"{test_settings.api_v1_str}/auth/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == 200
    refresh_token = response.json()["refresh_token"]

    # Verify token has TTL set in Redis
    async for redis in get_redis():
        if redis:
            token_hash = hash_refresh_token(refresh_token)
            redis_key = f"refresh_token:{token_hash}"

            ttl = await redis.ttl(redis_key)
            assert ttl > 0, "Token should have a TTL set"

            # TTL should be approximately refresh_token_expire_days in seconds
            expected_ttl = test_settings.refresh_token_expire_days * 86400  # Convert days to seconds
            # Allow 10 second tolerance for test execution time
            assert ttl <= expected_ttl and ttl >= (expected_ttl - 10), \
                f"Token TTL ({ttl}s) should be approximately {expected_ttl}s"

            logger.info(f"✅ Refresh token has correct TTL: {ttl}s (expected ~{expected_ttl}s)")
            break
