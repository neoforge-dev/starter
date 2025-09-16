"""Create user use case implementation."""

from __future__ import annotations

from dataclasses import dataclass

from app.application.commands.create_user_command import CreateUserCommand
from app.domain.entities.user import User
from app.domain.repositories.user_repository import UserRepository
from app.domain.value_objects.money import Money


@dataclass(frozen=True)
class CreateUserUseCase:
    """Use case for creating a new user."""

    user_repository: UserRepository

    async def execute(self, command: CreateUserCommand) -> User:
        """Execute the create user use case.

        Args:
            command: The create user command with user data

        Returns:
            The created user entity

        Raises:
            ValueError: If user with email already exists
        """
        # Check if user already exists
        existing_user = await self.user_repository.get_by_email(command.email)
        if existing_user:
            raise ValueError(f"User with email {command.email} already exists")

        # Create subscription amount if provided
        subscription_amount = None
        if command.subscription_amount is not None:
            subscription_amount = Money.create(command.subscription_amount)

        # Create user entity
        user = User.create(
            email=command.email,
            full_name=command.full_name,
            hashed_password=command.password,
            subscription_amount=subscription_amount,
            trial_days=command.trial_days,
        )

        # Save to repository
        await self.user_repository.save(user)

        return user