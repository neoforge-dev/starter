"""Test SECRET_KEY validation for security compliance."""
import secrets

import pytest
from pydantic import SecretStr, ValidationError

from app.config.settings import Settings


def test_secret_key_minimum_length_enforced():
    """Test that SECRET_KEY must be at least 32 characters."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(secret_key="short")

    errors = exc_info.value.errors()
    assert len(errors) > 0
    assert any("at least 32 characters" in str(error) for error in errors)


def test_secret_key_exactly_32_characters_accepted():
    """Test that a 32-character SECRET_KEY is accepted."""
    # Create a valid 32-character key
    valid_key = "a" * 32

    settings = Settings(secret_key=valid_key)
    assert settings.secret_key.get_secret_value() == valid_key


def test_secret_key_longer_than_32_characters_accepted():
    """Test that SECRET_KEY longer than 32 characters is accepted."""
    valid_key = "a" * 64  # 64 characters

    settings = Settings(secret_key=valid_key)
    assert settings.secret_key.get_secret_value() == valid_key


def test_secret_key_weak_value_rejected_secret():
    """Test that common weak values containing 'secret' are rejected."""
    weak_keys = [
        "this-is-a-secret-key-that-is-long-enough-32chars",
        "my-secret-key-for-production-use-123456789",
        "SECRET_KEY_FOR_PRODUCTION_USE_12345678",
    ]

    for weak_key in weak_keys:
        with pytest.raises(ValidationError) as exc_info:
            Settings(secret_key=weak_key)

        errors = exc_info.value.errors()
        assert any("common/weak value" in str(error) for error in errors), \
            f"Key '{weak_key}' should be rejected as weak"


def test_secret_key_weak_value_rejected_changeme():
    """Test that common weak values containing 'changeme' are rejected."""
    weak_key = "changeme-but-still-has-32-characters-here"

    with pytest.raises(ValidationError) as exc_info:
        Settings(secret_key=weak_key)

    errors = exc_info.value.errors()
    assert any("common/weak value" in str(error) for error in errors)


def test_secret_key_weak_value_rejected_test():
    """Test that common weak values containing 'test123' are rejected."""
    weak_key = "test123-key-with-enough-characters-32"

    with pytest.raises(ValidationError) as exc_info:
        Settings(secret_key=weak_key)

    errors = exc_info.value.errors()
    assert any("common/weak value" in str(error) for error in errors)


def test_secret_key_weak_value_rejected_password():
    """Test that common weak values containing 'password' are rejected."""
    weak_key = "password-based-key-with-32-characters"

    with pytest.raises(ValidationError) as exc_info:
        Settings(secret_key=weak_key)

    errors = exc_info.value.errors()
    assert any("common/weak value" in str(error) for error in errors)


def test_secret_key_weak_value_rejected_admin():
    """Test that common weak values containing 'admin' are rejected."""
    weak_key = "admin-secret-key-with-32-characters"

    with pytest.raises(ValidationError) as exc_info:
        Settings(secret_key=weak_key)

    errors = exc_info.value.errors()
    assert any("common/weak value" in str(error) for error in errors)


def test_secret_key_weak_value_rejected_default():
    """Test that common weak values containing 'default' are rejected."""
    weak_key = "default-key-with-enough-characters-32"

    with pytest.raises(ValidationError) as exc_info:
        Settings(secret_key=weak_key)

    errors = exc_info.value.errors()
    assert any("common/weak value" in str(error) for error in errors)


def test_secret_key_weak_value_rejected_placeholder():
    """Test that placeholder values are rejected."""
    weak_keys = [
        "your-secret-key-here-with-32-characters",
        "change-in-production-key-32-characters",
        "replace-in-production-key-32-characters",
    ]

    for weak_key in weak_keys:
        with pytest.raises(ValidationError) as exc_info:
            Settings(secret_key=weak_key)

        errors = exc_info.value.errors()
        assert any("common/weak value" in str(error) for error in errors), \
            f"Placeholder key '{weak_key}' should be rejected"


def test_secret_key_cryptographically_random_accepted():
    """Test that cryptographically random keys are accepted."""
    # Simulate a properly generated key (like from secrets.token_urlsafe(32))
    import secrets

    random_key = secrets.token_urlsafe(32)

    settings = Settings(secret_key=random_key)
    assert settings.secret_key.get_secret_value() == random_key
    assert len(settings.secret_key.get_secret_value()) >= 32


def test_secret_key_case_insensitive_weak_check():
    """Test that weak value detection is case-insensitive."""
    weak_key = "THIS-IS-A-SECRET-KEY-WITH-32-CHARS"

    with pytest.raises(ValidationError) as exc_info:
        Settings(secret_key=weak_key)

    errors = exc_info.value.errors()
    assert any("common/weak value" in str(error) for error in errors)


def test_secret_key_accepts_secret_str_type():
    """Test that SECRET_KEY accepts SecretStr type."""
    valid_key = secrets.token_urlsafe(32)
    secret_str_key = SecretStr(valid_key)

    settings = Settings(secret_key=secret_str_key)
    assert settings.secret_key.get_secret_value() == valid_key


def test_secret_key_error_message_provides_guidance():
    """Test that error messages provide helpful guidance for generating secure keys."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(secret_key="short")

    errors = exc_info.value.errors()
    error_messages = str(errors)

    # Should mention how to generate a secure key
    assert "python -c" in error_messages or "secrets.token_urlsafe" in error_messages


def test_secret_key_default_value_is_valid_for_testing():
    """Test that the default SECRET_KEY used in testing is valid (long enough but marked as test)."""
    # The default test key should be at least 32 characters
    settings = Settings()
    assert len(settings.secret_key.get_secret_value()) >= 32


def test_secret_key_numeric_only_allowed_if_long_enough():
    """Test that numeric-only keys are allowed if they meet length requirement."""
    # Pure numeric key that's long enough and doesn't contain weak patterns
    numeric_key = "1" * 32

    settings = Settings(secret_key=numeric_key)
    assert settings.secret_key.get_secret_value() == numeric_key


def test_secret_key_special_characters_accepted():
    """Test that keys with special characters are accepted."""
    special_key = "!@#$%^&*()-_=+[]{}|;:,.<>?/" + "a" * 8  # 32+ chars

    settings = Settings(secret_key=special_key)
    assert settings.secret_key.get_secret_value() == special_key


def test_secret_key_mixed_case_alphanumeric_accepted():
    """Test that mixed case alphanumeric keys are accepted."""
    mixed_key = "AbCdEfGhIjKlMnOpQrStUvWxYz012345"  # 32 chars, mixed case

    settings = Settings(secret_key=mixed_key)
    assert settings.secret_key.get_secret_value() == mixed_key
