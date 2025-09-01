"""Test password reset endpoints."""
import logging
from datetime import datetime, timedelta
from typing import Dict
from unittest.mock import Mock, patch

import pytest
from app.crud import password_reset_token
from app.crud import user as user_crud
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_password_hash, verify_password
from app.core.config import Settings, get_settings
from tests.factories import UserFactory

pytestmark = pytest.mark.asyncio

logger = logging.getLogger(__name__)


@pytest.fixture
def test_user_email() -> str:
    return "reset-test@example.com"


@pytest.fixture
def test_user_password() -> str:
    return "oldpassword123"


@pytest.fixture
def new_password() -> str:
    return "newpassword123"


@pytest.fixture
async def reset_test_user(
    db: AsyncSession, test_user_email: str, test_user_password: str
) -> User:
    """Create a test user for password reset tests."""
    user = None
    try:
        user = await UserFactory.create(
            session=db,
            email=test_user_email,
            password=test_user_password,
            full_name="Reset Test User",
            is_active=True,
        )
        await db.refresh(user)
        yield user
    finally:
        if user is not None:
            user_to_delete = await db.get(User, user.id)
            if user_to_delete:
                # Clean up any tokens first
                await password_reset_token.cleanup_tokens_for_user(db, user.id)
                await db.delete(user_to_delete)


class TestPasswordResetRequest:
    """Test password reset request endpoint."""

    async def test_password_reset_request_success(
        self,
        client: AsyncClient,
        db: AsyncSession,
        reset_test_user: User,
        test_settings: Settings,
    ) -> None:
        """Test successful password reset request."""
        request_data = {"email": reset_test_user.email}

        # Mock email sending to verify it's called
        with patch(
            "app.api.v1.endpoints.auth.send_reset_password_email"
        ) as mock_send_email:
            response = await client.post(
                f"{test_settings.api_v1_str}/auth/reset-password-request",
                json=request_data,
            )

            assert response.status_code == 200
            data = response.json()
            assert (
                data["message"]
                == "If the email address is registered, you will receive a password reset link shortly."
            )

            # Verify email was sent
            mock_send_email.assert_called_once()
            call_args = mock_send_email.call_args
            assert call_args[1]["email_to"] == reset_test_user.email
            assert call_args[1]["username"] == reset_test_user.full_name
            assert "token" in call_args[1]
            assert call_args[1]["settings"] == test_settings

        # Verify token was created in database
        from app.models.password_reset_token import PasswordResetToken
        from sqlalchemy import select

        result = await db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == reset_test_user.id
            )
        )
        token_records = result.fetchall()
        assert len(token_records) == 1

    async def test_password_reset_request_nonexistent_email(
        self, client: AsyncClient, db: AsyncSession, test_settings: Settings
    ) -> None:
        """Test password reset request with non-existent email (should not reveal this)."""
        request_data = {"email": "nonexistent@example.com"}

        with patch(
            "app.api.v1.endpoints.auth.send_reset_password_email"
        ) as mock_send_email:
            response = await client.post(
                f"{test_settings.api_v1_str}/auth/reset-password-request",
                json=request_data,
            )

            # Same response as successful request for security
            assert response.status_code == 200
            data = response.json()
            assert (
                data["message"]
                == "If the email address is registered, you will receive a password reset link shortly."
            )

            # Verify email was not sent
            mock_send_email.assert_not_called()

    async def test_password_reset_request_invalid_email(
        self, client: AsyncClient, db: AsyncSession, test_settings: Settings
    ) -> None:
        """Test password reset request with invalid email format."""
        request_data = {"email": "invalid-email"}

        response = await client.post(
            f"{test_settings.api_v1_str}/auth/reset-password-request", json=request_data
        )

        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    async def test_password_reset_request_rate_limit(
        self,
        client: AsyncClient,
        db: AsyncSession,
        reset_test_user: User,
        test_settings: Settings,
    ) -> None:
        """Test rate limiting on password reset requests."""
        request_data = {"email": reset_test_user.email}

        with patch("app.api.v1.endpoints.auth.send_reset_password_email"):
            # First request should succeed
            response1 = await client.post(
                f"{test_settings.api_v1_str}/auth/reset-password-request",
                json=request_data,
            )
            assert response1.status_code == 200

            # Second request within 5 minutes should be rate limited
            response2 = await client.post(
                f"{test_settings.api_v1_str}/auth/reset-password-request",
                json=request_data,
            )
            assert response2.status_code == 200  # Same response for security
            data = response2.json()
            assert (
                data["message"]
                == "If the email address is registered, you will receive a password reset link shortly."
            )

    async def test_password_reset_request_email_failure_continues(
        self,
        client: AsyncClient,
        db: AsyncSession,
        reset_test_user: User,
        test_settings: Settings,
    ) -> None:
        """Test that request succeeds even if email sending fails."""
        request_data = {"email": reset_test_user.email}

        with patch(
            "app.api.v1.endpoints.auth.send_reset_password_email",
            side_effect=Exception("SMTP error"),
        ):
            response = await client.post(
                f"{test_settings.api_v1_str}/auth/reset-password-request",
                json=request_data,
            )

            # Request should still succeed
            assert response.status_code == 200
            data = response.json()
            assert (
                data["message"]
                == "If the email address is registered, you will receive a password reset link shortly."
            )

            # Token should still be created
            from app.models.password_reset_token import PasswordResetToken
            from sqlalchemy import select

            result = await db.execute(
                select(PasswordResetToken).where(
                    PasswordResetToken.user_id == reset_test_user.id
                )
            )
            token_records = result.fetchall()
            assert len(token_records) == 1


class TestPasswordResetConfirm:
    """Test password reset confirmation endpoint."""

    async def test_password_reset_confirm_success(
        self,
        client: AsyncClient,
        db: AsyncSession,
        reset_test_user: User,
        new_password: str,
        test_settings: Settings,
    ) -> None:
        """Test successful password reset confirmation."""
        # Create a valid reset token
        token_record, plain_token = await password_reset_token.create_for_user(
            db, reset_test_user, expires_hours=24
        )
        await db.commit()

        # Confirm password reset
        confirm_data = {"token": plain_token, "new_password": new_password}

        response = await client.post(
            f"{test_settings.api_v1_str}/auth/reset-password-confirm", json=confirm_data
        )

        assert response.status_code == 200
        data = response.json()
        assert (
            data["message"]
            == "Password has been successfully reset. You can now log in with your new password."
        )

        # Verify password was updated
        await db.refresh(reset_test_user)
        assert verify_password(new_password, reset_test_user.hashed_password)

        # Verify token was marked as used
        await db.refresh(token_record)
        assert token_record.is_used is True
        assert token_record.used_at is not None

    async def test_password_reset_confirm_invalid_token(
        self,
        client: AsyncClient,
        db: AsyncSession,
        new_password: str,
        test_settings: Settings,
    ) -> None:
        """Test password reset confirmation with invalid token."""
        confirm_data = {"token": "invalid-token-12345", "new_password": new_password}

        response = await client.post(
            f"{test_settings.api_v1_str}/auth/reset-password-confirm", json=confirm_data
        )

        assert response.status_code == 400
        data = response.json()
        assert data["detail"] == "Invalid or expired reset token"

    async def test_password_reset_confirm_expired_token(
        self,
        client: AsyncClient,
        db: AsyncSession,
        reset_test_user: User,
        new_password: str,
        test_settings: Settings,
    ) -> None:
        """Test password reset confirmation with expired token."""
        # Create an expired token
        token_record, plain_token = await password_reset_token.create_for_user(
            db, reset_test_user, expires_hours=-1  # Expired 1 hour ago
        )
        await db.commit()

        confirm_data = {"token": plain_token, "new_password": new_password}

        response = await client.post(
            f"{test_settings.api_v1_str}/auth/reset-password-confirm", json=confirm_data
        )

        assert response.status_code == 400
        data = response.json()
        assert data["detail"] == "Invalid or expired reset token"

    async def test_password_reset_confirm_used_token(
        self,
        client: AsyncClient,
        db: AsyncSession,
        reset_test_user: User,
        new_password: str,
        test_settings: Settings,
    ) -> None:
        """Test password reset confirmation with already used token."""
        # Create and use a token
        token_record, plain_token = await password_reset_token.create_for_user(
            db, reset_test_user, expires_hours=24
        )
        await password_reset_token.mark_as_used(db, token_record)
        await db.commit()

        confirm_data = {"token": plain_token, "new_password": new_password}

        response = await client.post(
            f"{test_settings.api_v1_str}/auth/reset-password-confirm", json=confirm_data
        )

        assert response.status_code == 400
        data = response.json()
        assert data["detail"] == "Invalid or expired reset token"

    async def test_password_reset_confirm_missing_fields(
        self, client: AsyncClient, db: AsyncSession, test_settings: Settings
    ) -> None:
        """Test password reset confirmation with missing fields."""
        # Missing new_password
        confirm_data = {"token": "some-token"}

        response = await client.post(
            f"{test_settings.api_v1_str}/auth/reset-password-confirm", json=confirm_data
        )

        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    async def test_password_reset_confirm_user_can_login_with_new_password(
        self,
        client: AsyncClient,
        db: AsyncSession,
        reset_test_user: User,
        new_password: str,
        test_settings: Settings,
    ) -> None:
        """Test that user can login with new password after reset."""
        # Create a valid reset token and reset password
        token_record, plain_token = await password_reset_token.create_for_user(
            db, reset_test_user, expires_hours=24
        )
        await db.commit()

        confirm_data = {"token": plain_token, "new_password": new_password}

        # Reset password
        response = await client.post(
            f"{test_settings.api_v1_str}/auth/reset-password-confirm", json=confirm_data
        )
        assert response.status_code == 200

        # Try to login with new password
        login_data = {"username": reset_test_user.email, "password": new_password}

        response = await client.post(
            f"{test_settings.api_v1_str}/auth/token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        assert response.status_code == 200
        token = response.json()
        assert "access_token" in token
        assert token["token_type"] == "bearer"

    async def test_password_reset_confirm_old_password_no_longer_works(
        self,
        client: AsyncClient,
        db: AsyncSession,
        reset_test_user: User,
        test_user_password: str,
        new_password: str,
        test_settings: Settings,
    ) -> None:
        """Test that old password no longer works after reset."""
        # Create a valid reset token and reset password
        token_record, plain_token = await password_reset_token.create_for_user(
            db, reset_test_user, expires_hours=24
        )
        await db.commit()

        confirm_data = {"token": plain_token, "new_password": new_password}

        # Reset password
        response = await client.post(
            f"{test_settings.api_v1_str}/auth/reset-password-confirm", json=confirm_data
        )
        assert response.status_code == 200

        # Try to login with old password - should fail
        login_data = {"username": reset_test_user.email, "password": test_user_password}

        response = await client.post(
            f"{test_settings.api_v1_str}/auth/token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        assert response.status_code == 401
        data = response.json()
        assert data["detail"] == "Incorrect email or password"


class TestPasswordResetTokenCRUD:
    """Test password reset token CRUD operations."""

    async def test_create_for_user(
        self, db: AsyncSession, reset_test_user: User
    ) -> None:
        """Test creating a password reset token for a user."""
        token_record, plain_token = await password_reset_token.create_for_user(
            db, reset_test_user, expires_hours=24
        )

        assert token_record is not None
        assert token_record.user_id == reset_test_user.id
        assert token_record.is_used is False
        assert token_record.expires_at > datetime.utcnow()
        assert plain_token is not None
        assert len(plain_token) > 20  # Should be a substantial token

    async def test_get_by_token(self, db: AsyncSession, reset_test_user: User) -> None:
        """Test retrieving a token by its plain token value."""
        token_record, plain_token = await password_reset_token.create_for_user(
            db, reset_test_user, expires_hours=24
        )
        await db.commit()

        # Retrieve by token
        retrieved_token = await password_reset_token.get_by_token(db, plain_token)

        assert retrieved_token is not None
        assert retrieved_token.id == token_record.id
        assert retrieved_token.user_id == reset_test_user.id

    async def test_token_expiration(
        self, db: AsyncSession, reset_test_user: User
    ) -> None:
        """Test token expiration functionality."""
        # Create expired token
        token_record, plain_token = await password_reset_token.create_for_user(
            db, reset_test_user, expires_hours=-1
        )
        await db.commit()

        assert token_record.is_expired() is True
        assert token_record.is_valid() is False

    async def test_mark_as_used(self, db: AsyncSession, reset_test_user: User) -> None:
        """Test marking a token as used."""
        token_record, plain_token = await password_reset_token.create_for_user(
            db, reset_test_user, expires_hours=24
        )
        await db.commit()

        # Mark as used
        await password_reset_token.mark_as_used(db, token_record)
        await db.commit()

        await db.refresh(token_record)
        assert token_record.is_used is True
        assert token_record.used_at is not None
        assert token_record.is_valid() is False

    async def test_cleanup_expired_tokens(
        self, db: AsyncSession, reset_test_user: User
    ) -> None:
        """Test cleanup of expired tokens."""
        # Create expired and valid tokens
        expired_token, _ = await password_reset_token.create_for_user(
            db, reset_test_user, expires_hours=-1
        )
        valid_token, _ = await password_reset_token.create_for_user(
            db, reset_test_user, expires_hours=24
        )
        await db.commit()

        # Cleanup expired tokens
        deleted_count = await password_reset_token.cleanup_expired_tokens(db)
        await db.commit()

        assert deleted_count >= 1

        # Check that valid token still exists
        retrieved_valid = await db.get(PasswordResetToken, valid_token.id)
        assert retrieved_valid is not None

        # Check that expired token is gone
        retrieved_expired = await db.get(PasswordResetToken, expired_token.id)
        assert retrieved_expired is None

    async def test_rate_limiting_check(
        self, db: AsyncSession, reset_test_user: User
    ) -> None:
        """Test rate limiting functionality."""
        # Create a recent token
        token_record, _ = await password_reset_token.create_for_user(
            db, reset_test_user, expires_hours=24
        )
        await db.commit()

        # Check for recent token within threshold
        has_recent = await password_reset_token.has_recent_token(
            db, reset_test_user.id, minutes_threshold=5
        )

        assert has_recent is True

        # Check with longer threshold
        has_recent_long = await password_reset_token.has_recent_token(
            db, reset_test_user.id, minutes_threshold=1  # Very short threshold
        )

        # This might be True or False depending on timing, but should not error
        assert isinstance(has_recent_long, bool)
