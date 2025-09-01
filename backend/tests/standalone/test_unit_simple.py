"""Pure unit tests that don't require any fixtures or database connections."""

from datetime import datetime, timezone

import pytest
from app.utils.datetime import utc_now

from app.core.auth import get_password_hash, verify_password


def test_simple():
    """Simple test that always passes."""
    assert True


def test_math():
    """Test basic math operations."""
    assert 1 + 1 == 2
    assert 2 * 3 == 6
    assert 10 / 2 == 5
    assert 10 % 3 == 1


def test_password_hashing():
    """Test password hashing and verification."""
    password = "test_password_123"
    hashed = get_password_hash(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False


def test_datetime_utils():
    """Test datetime utility functions."""
    now = utc_now()
    assert isinstance(now, datetime)
    assert now.tzinfo == timezone.utc


def test_string_operations():
    """Test basic string operations."""
    test_string = "Hello World"
    assert test_string.lower() == "hello world"
    assert test_string.upper() == "HELLO WORLD"
    assert test_string.replace("World", "Python") == "Hello Python"


def test_list_operations():
    """Test basic list operations."""
    test_list = [1, 2, 3, 4, 5]
    assert len(test_list) == 5
    assert sum(test_list) == 15
    assert max(test_list) == 5
    assert min(test_list) == 1


def test_dict_operations():
    """Test basic dictionary operations."""
    test_dict = {"a": 1, "b": 2, "c": 3}
    assert len(test_dict) == 3
    assert test_dict["a"] == 1
    assert list(test_dict.keys()) == ["a", "b", "c"]
    assert sum(test_dict.values()) == 6
