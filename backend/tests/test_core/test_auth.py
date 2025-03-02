"""
Test authentication module functionality.

This test verifies that the authentication module works correctly, including:
- Password hashing
- Password verification
"""

import pytest
from app.core.auth import (
    verify_password,
    get_password_hash,
    pwd_context,
)


def test_get_password_hash():
    """Test that get_password_hash returns a hashed password."""
    # Hash a password
    password = "test_password"
    hashed_password = get_password_hash(password)
    
    # Verify the hash is not the original password
    assert hashed_password != password
    
    # Verify the hash is a bcrypt hash
    assert hashed_password.startswith("$2b$")
    
    # Verify the hash is different each time
    hashed_password2 = get_password_hash(password)
    assert hashed_password != hashed_password2


def test_verify_password_success():
    """Test that verify_password returns True for correct password."""
    # Hash a password
    password = "test_password"
    hashed_password = get_password_hash(password)
    
    # Verify the password
    assert verify_password(password, hashed_password) is True


def test_verify_password_failure():
    """Test that verify_password returns False for incorrect password."""
    # Hash a password
    password = "test_password"
    hashed_password = get_password_hash(password)
    
    # Verify with incorrect password
    assert verify_password("wrong_password", hashed_password) is False


def test_verify_password_with_known_hash():
    """Test that verify_password works with a known hash."""
    # Create a known hash with the same context
    password = "test_password"
    known_hash = pwd_context.hash(password)
    
    # Verify the password
    assert verify_password(password, known_hash) is True
    
    # Verify with incorrect password
    assert verify_password("wrong_password", known_hash) is False


def test_password_complexity():
    """Test that password hashing works with complex passwords."""
    # Test with a complex password
    complex_password = "P@ssw0rd!123_-+=[]{}|;:,.<>?/~`"
    hashed_password = get_password_hash(complex_password)
    
    # Verify the password
    assert verify_password(complex_password, hashed_password) is True 