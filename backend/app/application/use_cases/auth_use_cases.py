"""Authentication use cases."""

from __future__ import annotations

from app.application.commands.auth_commands import LoginCommand, RegisterCommand
from app.core.auth import create_access_token, generate_refresh_token, get_password_hash, verify_password
from app.crud.user import user as crud_user
from app.domain.entities.user import User
from app.domain.value_objects.email import Email
from app.infrastructure.repositories.sql_user_repository import SQLUserRepository
from app.interfaces.dtos.auth import LoginResponse, RegisterResponse, TokenResponse


class LoginUseCase:
    """Use case for user login."""

    def __init__(self, user_repository: SQLUserRepository):
        """Initialize with dependencies."""
        self.user_repository = user_repository

    async def execute(self, command: LoginCommand) -> LoginResponse:
        """Execute login use case."""
        # Get user from repository
        user = await self.user_repository.get_by_email(Email(command.email))
        if not user:
            raise ValueError("Invalid credentials")

        # Verify password
        if not verify_password(command.password, user.hashed_password):
            raise ValueError("Invalid credentials")

        # Check if user is active
        if not user.is_active:
            raise ValueError("Account is not active")

        # Generate tokens (simplified for now)
        access_token = create_access_token(
            subject=str(user.id),
            settings=None,  # Will be injected later
            expires_delta=None
        )

        refresh_token = generate_refresh_token()

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user_id=user.id,
            message="Login successful"
        )


class RegisterUseCase:
    """Use case for user registration."""

    def __init__(self, user_repository: SQLUserRepository):
        """Initialize with dependencies."""
        self.user_repository = user_repository

    async def execute(self, command: RegisterCommand) -> RegisterResponse:
        """Execute registration use case."""
        # Check if email already exists
        existing_user = await self.user_repository.get_by_email(Email(command.email))
        if existing_user:
            raise ValueError("Email already registered")

        # Create new user
        hashed_password = get_password_hash(command.password)
        user = User.create(
            email=command.email,
            full_name=command.full_name,
            hashed_password=hashed_password,
        )

        # Save user
        saved_user = await self.user_repository.save(user)

        # Generate tokens (simplified for now)
        access_token = create_access_token(
            subject=str(saved_user.id),
            settings=None,  # Will be injected later
            expires_delta=None
        )

        refresh_token = generate_refresh_token()

        return RegisterResponse(
            message="User registered successfully",
            user={
                "id": saved_user.id,
                "email": saved_user.email.value,
                "full_name": saved_user.full_name,
                "is_active": saved_user.is_active,
                "is_verified": saved_user.is_verified,
                "created_at": saved_user.created_at.isoformat() if saved_user.created_at else None,
            },
            access_token=access_token,
            refresh_token=refresh_token,
        )