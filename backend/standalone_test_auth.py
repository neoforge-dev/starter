"""
Standalone test for authentication module functionality.

This test verifies that the authentication module works correctly, including:
- Password hashing
- Password verification
"""

import unittest

from app.core.auth import get_password_hash, pwd_context, verify_password


class TestAuth(unittest.TestCase):
    def test_get_password_hash(self):
        """Test that get_password_hash returns a hashed password."""
        # Hash a password
        password = "test_password"
        hashed_password = get_password_hash(password)

        # Verify the hash is not the original password
        self.assertNotEqual(hashed_password, password)

        # Verify the hash is a bcrypt hash
        self.assertTrue(hashed_password.startswith("$2b$"))

        # Verify the hash is different each time
        hashed_password2 = get_password_hash(password)
        self.assertNotEqual(hashed_password, hashed_password2)

    def test_verify_password_success(self):
        """Test that verify_password returns True for correct password."""
        # Hash a password
        password = "test_password"
        hashed_password = get_password_hash(password)

        # Verify the password
        self.assertTrue(verify_password(password, hashed_password))

    def test_verify_password_failure(self):
        """Test that verify_password returns False for incorrect password."""
        # Hash a password
        password = "test_password"
        hashed_password = get_password_hash(password)

        # Verify with incorrect password
        self.assertFalse(verify_password("wrong_password", hashed_password))

    def test_verify_password_with_known_hash(self):
        """Test that verify_password works with a known hash."""
        # Create a known hash with the same context
        password = "test_password"
        known_hash = pwd_context.hash(password)

        # Verify the password
        self.assertTrue(verify_password(password, known_hash))

        # Verify with incorrect password
        self.assertFalse(verify_password("wrong_password", known_hash))

    def test_password_complexity(self):
        """Test that password hashing works with complex passwords."""
        # Test with a complex password
        complex_password = "P@ssw0rd!123_-+=[]{}|;:,.<>?/~`"
        hashed_password = get_password_hash(complex_password)

        # Verify the password
        self.assertTrue(verify_password(complex_password, hashed_password))


if __name__ == "__main__":
    unittest.main()
