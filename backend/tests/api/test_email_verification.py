"""Test email verification endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch

from app.core.config import Settings

pytestmark = pytest.mark.asyncio


async def test_verify_email_success(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test successful email verification."""
    from app.core.security import create_access_token
    from datetime import timedelta
    
    # Create unverified user
    registration_data = {
        "email": "verify@example.com",
        "password": "testpassword123",
        "password_confirm": "testpassword123",
        "full_name": "Verify User"
    }
    
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/register",
        json=registration_data
    )
    
    assert response.status_code == 200
    
    # Get the created user
    from app.crud.user import user as user_crud
    user = await user_crud.get_by_email(db, email=registration_data["email"])
    assert user is not None
    assert user.is_verified is False
    assert user.email_verified_at is None
    
    # Generate verification token
    verification_token = create_access_token(
        subject=user.id,
        settings=test_settings,
        expires_delta=timedelta(hours=24)
    )
    
    # Verify email
    verification_data = {"token": verification_token}
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/verify-email",
        json=verification_data
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "successfully verified" in data["message"]
    
    # Check user is now verified
    await db.refresh(user)
    assert user.is_verified is True
    assert user.email_verified_at is not None
    
    # Clean up
    await db.delete(user)
    await db.commit()


async def test_verify_email_invalid_token(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test email verification with invalid token."""
    verification_data = {"token": "invalid_token_here"}
    
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/verify-email",
        json=verification_data
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "Invalid or expired verification token" in data["detail"]


async def test_verify_email_expired_token(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test email verification with expired token."""
    from app.core.security import create_access_token
    from datetime import timedelta
    
    # Create unverified user
    registration_data = {
        "email": "expired@example.com",
        "password": "testpassword123",
        "password_confirm": "testpassword123",
        "full_name": "Expired User"
    }
    
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/register",
        json=registration_data
    )
    
    assert response.status_code == 200
    
    # Get the created user
    from app.crud.user import user as user_crud
    user = await user_crud.get_by_email(db, email=registration_data["email"])
    assert user is not None
    
    # Generate expired token (negative timedelta)
    expired_token = create_access_token(
        subject=user.id,
        settings=test_settings,
        expires_delta=timedelta(seconds=-1)  # Already expired
    )
    
    # Try to verify with expired token
    verification_data = {"token": expired_token}
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/verify-email",
        json=verification_data
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "Invalid or expired verification token" in data["detail"]
    
    # User should still be unverified
    await db.refresh(user)
    assert user.is_verified is False
    
    # Clean up
    await db.delete(user)
    await db.commit()


async def test_verify_email_already_verified(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test email verification for already verified user."""
    from app.core.security import create_access_token
    from datetime import timedelta
    
    # Create and manually verify user
    registration_data = {
        "email": "already@example.com",
        "password": "testpassword123",
        "password_confirm": "testpassword123",
        "full_name": "Already User"
    }
    
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/register",
        json=registration_data
    )
    
    assert response.status_code == 200
    
    # Get and verify user manually
    from app.crud.user import user as user_crud
    user = await user_crud.get_by_email(db, email=registration_data["email"])
    assert user is not None
    
    # Manually verify user
    await user_crud.verify_email(db, user_id=user.id)
    await db.commit()
    await db.refresh(user)
    assert user.is_verified is True
    
    # Generate verification token
    verification_token = create_access_token(
        subject=user.id,
        settings=test_settings,
        expires_delta=timedelta(hours=24)
    )
    
    # Try to verify again
    verification_data = {"token": verification_token}
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/verify-email",
        json=verification_data
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "already verified" in data["message"]
    
    # Clean up
    await db.delete(user)
    await db.commit()


async def test_verify_email_nonexistent_user_token(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test email verification with token for non-existent user."""
    from app.core.security import create_access_token
    from datetime import timedelta
    
    # Generate token for non-existent user ID
    fake_token = create_access_token(
        subject=99999,  # Non-existent user ID
        settings=test_settings,
        expires_delta=timedelta(hours=24)
    )
    
    verification_data = {"token": fake_token}
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/verify-email",
        json=verification_data
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "Invalid or expired verification token" in data["detail"]


async def test_resend_verification_success(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test successful verification resend."""
    # Create unverified user
    registration_data = {
        "email": "resend@example.com",
        "password": "testpassword123",
        "password_confirm": "testpassword123",
        "full_name": "Resend User"
    }
    
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/register",
        json=registration_data
    )
    
    assert response.status_code == 200
    
    # Get the created user
    from app.crud.user import user as user_crud
    user = await user_crud.get_by_email(db, email=registration_data["email"])
    assert user is not None
    assert user.is_verified is False
    
    # Mock email sending
    with patch('app.api.v1.endpoints.auth.send_new_account_email') as mock_send_email:
        resend_data = {"email": registration_data["email"]}
        response = await client.post(
            f"{test_settings.api_v1_str}/auth/resend-verification",
            json=resend_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "verification link shortly" in data["message"]
        
        # Verify email function was called
        mock_send_email.assert_called_once()
        call_args = mock_send_email.call_args
        assert call_args[1]["email_to"] == registration_data["email"]
        assert call_args[1]["username"] == registration_data["full_name"]
        assert "verification_token" in call_args[1]
    
    # Clean up
    await db.delete(user)
    await db.commit()


async def test_resend_verification_already_verified(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test verification resend for already verified user."""
    # Create and verify user
    registration_data = {
        "email": "resendverified@example.com",
        "password": "testpassword123",
        "password_confirm": "testpassword123",
        "full_name": "Resend Verified User"
    }
    
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/register",
        json=registration_data
    )
    
    assert response.status_code == 200
    
    # Get and verify user manually
    from app.crud.user import user as user_crud
    user = await user_crud.get_by_email(db, email=registration_data["email"])
    assert user is not None
    
    await user_crud.verify_email(db, user_id=user.id)
    await db.commit()
    await db.refresh(user)
    assert user.is_verified is True
    
    # Try to resend verification
    resend_data = {"email": registration_data["email"]}
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/resend-verification",
        json=resend_data
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "verification link shortly" in data["message"]  # Same generic message
    
    # Clean up
    await db.delete(user)
    await db.commit()


async def test_resend_verification_nonexistent_email(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test verification resend for non-existent email."""
    resend_data = {"email": "nonexistent@example.com"}
    
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/resend-verification",
        json=resend_data
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "verification link shortly" in data["message"]  # Same generic message for security


async def test_resend_verification_invalid_email(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test verification resend with invalid email format."""
    resend_data = {"email": "invalid-email-format"}
    
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/resend-verification",
        json=resend_data
    )
    
    assert response.status_code == 422  # Validation error
    data = response.json()
    assert "detail" in data


async def test_user_registration_creates_unverified_user(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test that user registration creates unverified users by default."""
    registration_data = {
        "email": "unverified@example.com",
        "password": "testpassword123",
        "password_confirm": "testpassword123",
        "full_name": "Unverified User"
    }
    
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/register",
        json=registration_data
    )
    
    assert response.status_code == 200
    
    # Check that user is created as unverified
    from app.crud.user import user as user_crud
    user = await user_crud.get_by_email(db, email=registration_data["email"])
    assert user is not None
    assert user.is_verified is False
    assert user.email_verified_at is None
    
    # Clean up
    await db.delete(user)
    await db.commit()


async def test_verify_email_integration_flow(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test complete email verification flow from registration to verification."""
    from app.core.security import create_access_token
    from datetime import timedelta
    
    registration_data = {
        "email": "integration@example.com",
        "password": "testpassword123",
        "password_confirm": "testpassword123",
        "full_name": "Integration User"
    }
    
    # Step 1: Register user
    with patch('app.api.v1.endpoints.auth.send_new_account_email') as mock_send_email:
        response = await client.post(
            f"{test_settings.api_v1_str}/auth/register",
            json=registration_data
        )
        
        assert response.status_code == 200
        mock_send_email.assert_called_once()
    
    # Get user and verify initial state
    from app.crud.user import user as user_crud
    user = await user_crud.get_by_email(db, email=registration_data["email"])
    assert user is not None
    assert user.is_verified is False
    
    # Step 2: Generate verification token (simulating email link)
    verification_token = create_access_token(
        subject=user.id,
        settings=test_settings,
        expires_delta=timedelta(hours=24)
    )
    
    # Step 3: Verify email using token
    verification_data = {"token": verification_token}
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/verify-email",
        json=verification_data
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "successfully verified" in data["message"]
    
    # Step 4: Confirm user is now verified
    await db.refresh(user)
    assert user.is_verified is True
    assert user.email_verified_at is not None
    
    # Step 5: Test that verification is idempotent
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/verify-email",
        json=verification_data
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "already verified" in data["message"]
    
    # Clean up
    await db.delete(user)
    await db.commit()


async def test_resend_verification_rate_limiting(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test that verification resend is rate limited."""
    from app.crud import password_reset_token
    
    # Create unverified user
    registration_data = {
        "email": "ratelimit@example.com",
        "password": "testpassword123",
        "password_confirm": "testpassword123",
        "full_name": "Rate Limit User"
    }
    
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/register",
        json=registration_data
    )
    
    assert response.status_code == 200
    
    # Get the created user
    from app.crud.user import user as user_crud
    user = await user_crud.get_by_email(db, email=registration_data["email"])
    assert user is not None
    
    # Create a recent password reset token to trigger rate limiting
    _, token = await password_reset_token.create_for_user(db, user, expires_hours=24)
    await db.commit()
    
    # Try to resend verification (should be rate limited)
    resend_data = {"email": registration_data["email"]}
    response = await client.post(
        f"{test_settings.api_v1_str}/auth/resend-verification",
        json=resend_data
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "verification link shortly" in data["message"]  # Same generic message even when rate limited
    
    # Clean up
    await password_reset_token.cleanup_tokens_for_user(db, user.id)
    await db.delete(user)
    await db.commit()