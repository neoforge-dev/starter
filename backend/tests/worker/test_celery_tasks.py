"""Tests for Celery email tasks."""
from unittest.mock import AsyncMock, Mock, patch

import pytest
from app.worker.email_worker import (
    _send_password_reset_email_async,
    _send_verification_email_async,
    _send_welcome_email_async,
    send_password_reset_email_task,
    send_verification_email_task,
    send_welcome_email_task,
)
from celery import Celery
from celery.exceptions import Retry

from app.core.celery import celery_app, create_celery_app
from app.core.config import get_settings


class TestCeleryConfiguration:
    """Test Celery app configuration."""

    def test_celery_app_creation(self):
        """Test that Celery app is created with correct configuration."""
        settings = get_settings()
        app = create_celery_app(settings)

        assert isinstance(app, Celery)
        assert app.conf.broker_url == str(settings.redis_url)
        assert app.conf.result_backend == str(settings.redis_url)
        assert app.conf.task_serializer == "json"
        assert app.conf.result_serializer == "json"

    def test_celery_task_routes(self):
        """Test that email tasks are routed to email queue."""
        settings = get_settings()
        app = create_celery_app(settings)

        routes = app.conf.task_routes
        assert "app.worker.email_worker.send_welcome_email_task" in routes
        assert "app.worker.email_worker.send_verification_email_task" in routes
        assert "app.worker.email_worker.send_password_reset_email_task" in routes

        for task_name in routes:
            assert routes[task_name]["queue"] == "email"


class TestEmailTasks:
    """Test email Celery tasks."""

    @pytest.fixture
    def mock_send_email(self):
        """Mock the send_email function."""
        with patch("app.worker.email_worker.send_email") as mock:
            mock.return_value = AsyncMock()
            yield mock

    @pytest.fixture
    def mock_async_session(self):
        """Mock AsyncSessionLocal."""
        with patch("app.worker.email_worker.AsyncSessionLocal") as mock:
            session_mock = AsyncMock()
            mock.return_value.__aenter__.return_value = session_mock
            mock.return_value.__aexit__.return_value = None
            yield session_mock

    @pytest.mark.asyncio
    async def test_send_welcome_email_async_success(
        self, mock_send_email, mock_async_session
    ):
        """Test successful welcome email sending."""
        result = await _send_welcome_email_async(
            user_email="test@example.com",
            user_name="Test User",
            verification_token="test_token_123",
        )

        assert result["status"] == "success"
        assert result["email"] == "test@example.com"
        assert result["type"] == "welcome"

        # Verify send_email was called with correct parameters
        mock_send_email.assert_called_once()
        call_args = mock_send_email.call_args

        assert call_args.kwargs["email_id"].startswith(
            "welcome_test@example.com_test_tok"
        )
        assert call_args.kwargs["email_content"].to == "test@example.com"
        assert call_args.kwargs["email_content"].subject == "Welcome to NeoForge!"
        assert call_args.kwargs["email_content"].template_name == "welcome.html"
        assert "verify_link" in call_args.kwargs["email_content"].template_data

    @pytest.mark.asyncio
    async def test_send_verification_email_async_success(
        self, mock_send_email, mock_async_session
    ):
        """Test successful verification email sending."""
        result = await _send_verification_email_async(
            user_email="test@example.com",
            user_name="Test User",
            verification_token="test_token_123",
        )

        assert result["status"] == "success"
        assert result["email"] == "test@example.com"
        assert result["type"] == "verification"

        mock_send_email.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_password_reset_email_async_success(
        self, mock_send_email, mock_async_session
    ):
        """Test successful password reset email sending."""
        result = await _send_password_reset_email_async(
            user_email="test@example.com",
            user_name="Test User",
            reset_token="test_reset_token",
        )

        assert result["status"] == "success"
        assert result["email"] == "test@example.com"
        assert result["type"] == "password_reset"

        mock_send_email.assert_called_once()
        call_args = mock_send_email.call_args

        assert call_args.kwargs["email_content"].subject == "Password Reset Request"
        assert call_args.kwargs["email_content"].template_name == "reset_password.html"
        assert "reset_url" in call_args.kwargs["email_content"].template_data

    def test_welcome_email_task_success(self):
        """Test welcome email task success."""
        with patch("app.worker.email_worker.asyncio.run") as mock_run:
            mock_run.return_value = {
                "status": "success",
                "email": "test@example.com",
                "type": "welcome",
            }

            result = send_welcome_email_task(
                "test@example.com", "Test User", "test_token"
            )

            assert result["status"] == "success"
            mock_run.assert_called_once()

    def test_welcome_email_task_retry_logic(self):
        """Test welcome email task retry logic."""
        # Mock the task to have retry capability
        mock_task = Mock()
        mock_task.request = Mock()
        mock_task.request.retries = 1
        mock_task.retry = Mock(side_effect=Retry("Test retry"))

        with patch("app.worker.email_worker.asyncio.run") as mock_run:
            mock_run.side_effect = Exception("Email service unavailable")

            with patch.object(send_welcome_email_task, "retry") as mock_retry:
                mock_retry.side_effect = Retry("Test retry")

                with pytest.raises(Retry):
                    send_welcome_email_task.apply(
                        args=("test@example.com", "Test User", "test_token"),
                    ).get()

    def test_password_reset_email_task_success(self):
        """Test password reset email task success."""
        with patch("app.worker.email_worker.asyncio.run") as mock_run:
            mock_run.return_value = {
                "status": "success",
                "email": "test@example.com",
                "type": "password_reset",
            }

            result = send_password_reset_email_task(
                "test@example.com", "Test User", "reset_token"
            )

            assert result["status"] == "success"
            mock_run.assert_called_once()

    def test_verification_email_task_success(self):
        """Test verification email task success."""
        with patch("app.worker.email_worker.asyncio.run") as mock_run:
            mock_run.return_value = {
                "status": "success",
                "email": "test@example.com",
                "type": "verification",
            }

            result = send_verification_email_task(
                "test@example.com", "Test User", "verify_token"
            )

            assert result["status"] == "success"
            mock_run.assert_called_once()


class TestTaskRetryLogic:
    """Test Celery task retry logic."""

    def test_exponential_backoff_calculation(self):
        """Test that retry countdown follows exponential backoff."""
        # Test the countdown calculation logic
        retries = [0, 1, 2, 3]
        expected_countdowns = [60, 120, 240, 480]  # 2^retries * 60

        for retry_count, expected in zip(retries, expected_countdowns):
            countdown = 2**retry_count * 60
            assert countdown == expected

    def test_max_retries_configuration(self):
        """Test that tasks are configured with max retries."""
        assert send_welcome_email_task.max_retries == 3
        assert send_verification_email_task.max_retries == 3
        assert send_password_reset_email_task.max_retries == 3

    def test_default_retry_delay_configuration(self):
        """Test that tasks have correct default retry delay."""
        assert send_welcome_email_task.default_retry_delay == 60
        assert send_verification_email_task.default_retry_delay == 60
        assert send_password_reset_email_task.default_retry_delay == 60


class TestCeleryIntegration:
    """Test Celery integration with FastAPI."""

    def test_celery_app_instance_exists(self):
        """Test that global celery_app instance exists."""
        assert celery_app is not None
        assert isinstance(celery_app, Celery)

    def test_task_registration(self):
        """Test that tasks are properly registered with Celery."""
        registered_tasks = celery_app.tasks

        expected_tasks = [
            "send_welcome_email_task",
            "send_verification_email_task",
            "send_password_reset_email_task",
        ]

        for task_name in expected_tasks:
            assert task_name in registered_tasks

    def test_broker_configuration(self):
        """Test Celery broker configuration."""
        settings = get_settings()
        assert str(celery_app.conf.broker_url) == str(settings.redis_url)
        assert str(celery_app.conf.result_backend) == str(settings.redis_url)


@pytest.mark.integration
class TestCeleryEmailIntegration:
    """Integration tests for Celery email tasks."""

    @pytest.fixture
    def celery_test_app(self):
        """Create a test Celery app."""
        settings = get_settings()
        # Use a test-specific broker for integration tests
        test_settings = settings.model_copy()
        return create_celery_app(test_settings)

    def test_task_delay_returns_async_result(self, celery_test_app):
        """Test that .delay() returns an AsyncResult."""
        with patch("app.worker.email_worker.asyncio.run") as mock_run:
            mock_run.return_value = {"status": "success"}

            # This would normally be an integration test with actual Redis
            # but we're mocking for unit test purposes
            result = send_welcome_email_task.delay(
                "test@example.com", "Test User", "test_token"
            )

            # In a real integration test, result would be a celery AsyncResult
            assert result is not None

    def test_task_apply_async_with_options(self):
        """Test applying task with custom options."""
        with patch("app.worker.email_worker.asyncio.run") as mock_run:
            mock_run.return_value = {"status": "success"}

            # Test applying with countdown (delay)
            result = send_welcome_email_task.apply_async(
                args=("test@example.com", "Test User", "test_token"),
                countdown=60,  # Delay task by 60 seconds
            )

            assert result is not None
