"""
Comprehensive authentication integration tests.

This module tests complete authentication flows including:
- Registration with email verification
- Login with token generation  
- Token refresh and rotation
- Password reset flows
- JWT lifecycle management
- Protected route access
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import create_access_token
from app.crud import user as user_crud
from app.models.user import User
from app.schemas.user import UserCreate
from tests.utils.user import create_random_user


class TestAuthIntegration:
    """Integration tests for authentication flows."""

    @pytest.mark.asyncio
    async def test_complete_registration_flow(
        self,
        client: AsyncClient,
        db: AsyncSession,
    ):
        """Test complete user registration flow."""
        settings = get_settings()
        
        # 1. Register new user
        user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "password_confirmation": "TestPassword123!",
            "full_name": "Test User"
        }
        
        response = await client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "User registered successfully"
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == user_data["email"]
        assert data["user"]["is_active"] is True
        assert data["user"]["is_verified"] is False  # Email not verified yet
        
        user_id = data["user"]["id"]
        access_token = data["access_token"]
        
        # 2. Verify we can access protected routes with the token
        headers = {"Authorization": f"Bearer {access_token}"}
        me_response = await client.get("/api/v1/auth/me", headers=headers)
        assert me_response.status_code == 200
        
        me_data = me_response.json()
        assert me_data["email"] == user_data["email"]
        assert me_data["id"] == user_id

    @pytest.mark.asyncio
    async def test_login_flow_with_token_generation(
        self,
        client: AsyncClient,
        db: AsyncSession,
    ):
        """Test login flow with proper token generation."""
        # Create a verified user
        user = await create_random_user(db, is_verified=True)
        password = "TestPassword123!"
        
        # Hash password manually for test user
        from app.core.auth import get_password_hash
        user.hashed_password = get_password_hash(password)
        await db.commit()
        
        # 1. Login with correct credentials
        login_data = {"email": user.email, "password": password}
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        
        access_token = data["access_token"]
        refresh_token = data["refresh_token"]
        
        # 2. Validate token works for protected routes
        headers = {"Authorization": f"Bearer {access_token}"}
        me_response = await client.get("/api/v1/auth/me", headers=headers)
        
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["email"] == user.email
        
        # 3. Test token validation endpoint
        validate_response = await client.post("/api/v1/auth/validate", headers=headers)
        assert validate_response.status_code == 200
        
        validate_data = validate_response.json()
        assert validate_data["valid"] is True
        assert validate_data["user_id"] == user.id

    @pytest.mark.asyncio
    async def test_token_refresh_rotation(
        self,
        client: AsyncClient,
        db: AsyncSession,
    ):
        """Test token refresh with rotation security."""
        # Create and login user
        user = await create_random_user(db, is_verified=True)
        password = "TestPassword123!"
        
        from app.core.auth import get_password_hash
        user.hashed_password = get_password_hash(password)
        await db.commit()
        
        # Login to get tokens
        login_response = await client.post("/api/v1/auth/login", json={
            "email": user.email,
            "password": password
        })
        login_data = login_response.json()
        
        old_access_token = login_data["access_token"]
        old_refresh_token = login_data["refresh_token"]
        
        # 1. Refresh tokens
        refresh_response = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": old_refresh_token
        })
        
        assert refresh_response.status_code == 200
        refresh_data = refresh_response.json()
        
        new_access_token = refresh_data["access_token"]
        new_refresh_token = refresh_data["refresh_token"]
        
        # Ensure tokens are different (rotation)
        assert new_access_token != old_access_token
        assert new_refresh_token != old_refresh_token
        
        # 2. Old refresh token should now be invalid
        old_refresh_response = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": old_refresh_token
        })
        assert old_refresh_response.status_code == 401
        
        # 3. New tokens should work
        headers = {"Authorization": f"Bearer {new_access_token}"}
        me_response = await client.get("/api/v1/auth/me", headers=headers)
        assert me_response.status_code == 200

    @pytest.mark.asyncio
    async def test_password_reset_flow(
        self,
        client: AsyncClient,
        db: AsyncSession,
    ):
        """Test complete password reset flow."""
        # Create user
        user = await create_random_user(db, is_verified=True)
        old_password = "OldPassword123!"
        new_password = "NewPassword123!"
        
        from app.core.auth import get_password_hash
        user.hashed_password = get_password_hash(old_password)
        await db.commit()
        
        # 1. Request password reset
        reset_request = await client.post("/api/v1/auth/reset-password-request", json={
            "email": user.email
        })
        
        assert reset_request.status_code == 200
        assert "will receive a password reset link" in reset_request.json()["message"]
        
        # 2. Get the reset token from database (simulating email link)
        from app.crud import password_reset_token as reset_crud
        token_record = await reset_crud.get_latest_for_user(db, user.id)
        assert token_record is not None
        
        # Get the plain token (normally from email)
        plain_token = token_record.token  # This is the hashed version in DB
        # In real scenario, we'd get the plain token from the email
        # For test, we need to create a valid token
        settings = get_settings()
        from datetime import timedelta
        from app.core.security import create_access_token
        reset_token = create_access_token(
            subject=f"reset:{user.id}",
            settings=settings,
            expires_delta=timedelta(hours=24)
        )
        
        # Store this token in DB for validation
        await reset_crud.cleanup_tokens_for_user(db, user.id)
        await reset_crud.create_with_token(db, user.id, reset_token, expires_hours=24)
        await db.commit()
        
        # 3. Confirm password reset
        confirm_response = await client.post("/api/v1/auth/reset-password-confirm", json={
            "token": reset_token,
            "new_password": new_password
        })
        
        assert confirm_response.status_code == 200
        assert "successfully reset" in confirm_response.json()["message"]
        
        # 4. Verify old password doesn't work
        old_login = await client.post("/api/v1/auth/login", json={
            "email": user.email,
            "password": old_password
        })
        assert old_login.status_code == 401
        
        # 5. Verify new password works
        new_login = await client.post("/api/v1/auth/login", json={
            "email": user.email,
            "password": new_password
        })
        assert new_login.status_code == 200

    @pytest.mark.asyncio
    async def test_email_verification_flow(
        self,
        client: AsyncClient,
        db: AsyncSession,
    ):
        """Test email verification flow."""
        # Register user (should be unverified)
        user_data = {
            "email": "verify@example.com",
            "password": "TestPassword123!",
            "password_confirmation": "TestPassword123!",
        }
        
        register_response = await client.post("/api/v1/auth/register", json=user_data)
        register_data = register_response.json()
        user_id = register_data["user"]["id"]
        
        # User should not be verified initially
        assert register_data["user"]["is_verified"] is False
        
        # Create verification token
        settings = get_settings()
        from datetime import timedelta
        verification_token = create_access_token(
            subject=user_id,
            settings=settings,
            expires_delta=timedelta(hours=24)
        )
        
        # Verify email
        verify_response = await client.post("/api/v1/auth/verify-email", json={
            "token": verification_token
        })
        
        assert verify_response.status_code == 200
        assert "successfully verified" in verify_response.json()["message"]
        
        # Check user is now verified
        user = await user_crud.get(db, id=user_id)
        assert user.is_verified is True

    @pytest.mark.asyncio
    async def test_logout_flow(
        self,
        client: AsyncClient,
        db: AsyncSession,
    ):
        """Test logout flow with token revocation."""
        # Create and login user
        user = await create_random_user(db, is_verified=True)
        password = "TestPassword123!"
        
        from app.core.auth import get_password_hash
        user.hashed_password = get_password_hash(password)
        await db.commit()
        
        # Login
        login_response = await client.post("/api/v1/auth/login", json={
            "email": user.email,
            "password": password
        })
        login_data = login_response.json()
        
        access_token = login_data["access_token"]
        refresh_token = login_data["refresh_token"]
        
        # Verify tokens work
        headers = {"Authorization": f"Bearer {access_token}"}
        me_response = await client.get("/api/v1/auth/me", headers=headers)
        assert me_response.status_code == 200
        
        # Logout
        logout_response = await client.post("/api/v1/auth/logout", json={
            "refresh_token": refresh_token
        }, headers=headers)
        
        assert logout_response.status_code == 200
        assert logout_response.json()["message"] == "Successfully logged out"
        
        # Refresh token should no longer work
        refresh_response = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token
        })
        assert refresh_response.status_code == 401

    @pytest.mark.asyncio
    async def test_protected_routes_require_authentication(
        self,
        client: AsyncClient,
    ):
        """Test that protected routes require valid authentication."""
        # Test routes without token
        protected_routes = [
            ("/api/v1/auth/me", "GET"),
            ("/api/v1/auth/validate", "POST"),
            ("/api/v1/auth/logout", "POST"),
        ]
        
        for route, method in protected_routes:
            if method == "GET":
                response = await client.get(route)
            else:
                response = await client.post(route, json={})
            
            assert response.status_code == 401
        
        # Test with invalid token
        invalid_headers = {"Authorization": "Bearer invalid_token"}
        
        for route, method in protected_routes:
            if method == "GET":
                response = await client.get(route, headers=invalid_headers)
            else:
                response = await client.post(route, json={}, headers=invalid_headers)
            
            assert response.status_code in [401, 422]  # 422 for invalid JWT format

    @pytest.mark.asyncio
    async def test_invalid_credentials_handling(
        self,
        client: AsyncClient,
        db: AsyncSession,
    ):
        """Test handling of invalid credentials."""
        # Create user
        user = await create_random_user(db, is_verified=True)
        
        # Test invalid email
        response = await client.post("/api/v1/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "SomePassword123!"
        })
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]
        
        # Test invalid password
        response = await client.post("/api/v1/auth/login", json={
            "email": user.email,
            "password": "WrongPassword123!"
        })
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_duplicate_registration_prevention(
        self,
        client: AsyncClient,
        db: AsyncSession,
    ):
        """Test prevention of duplicate user registration."""
        user = await create_random_user(db)
        
        # Try to register with same email
        response = await client.post("/api/v1/auth/register", json={
            "email": user.email,
            "password": "TestPassword123!",
            "password_confirmation": "TestPassword123!",
        })
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_session_management(
        self,
        client: AsyncClient,
        db: AsyncSession,
    ):
        """Test session management functionality."""
        # Create and login user
        user = await create_random_user(db, is_verified=True)
        password = "TestPassword123!"
        
        from app.core.auth import get_password_hash
        user.hashed_password = get_password_hash(password)
        await db.commit()
        
        # Login to create session
        login_response = await client.post("/api/v1/auth/login", json={
            "email": user.email,
            "password": password
        })
        login_data = login_response.json()
        
        headers = {"Authorization": f"Bearer {login_data['access_token']}"}
        
        # List sessions
        sessions_response = await client.get("/api/v1/auth/sessions", headers=headers)
        assert sessions_response.status_code == 200
        
        sessions_data = sessions_response.json()
        assert sessions_data["total"] >= 1
        assert len(sessions_data["items"]) >= 1
        
        session = sessions_data["items"][0]
        session_id = session["id"]
        
        # Revoke session
        revoke_response = await client.post(
            f"/api/v1/auth/sessions/{session_id}/revoke",
            headers=headers
        )
        assert revoke_response.status_code == 200