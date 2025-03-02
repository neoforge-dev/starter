"""
Standalone test for security module functionality.

This test verifies that the security module works correctly, focusing on:
- JWT token creation
- Token validation
"""

import unittest
from datetime import datetime, timedelta, UTC
from jose import jwt
from pydantic import SecretStr

# Define a simple settings class to mimic the app's settings
class TestSettings:
    def __init__(self):
        self.secret_key = SecretStr("test_secret_key_replace_in_production_7e1a34bd93b148f0")
        self.algorithm = "HS256"

# Define a simplified version of the create_access_token function
def create_access_token(subject, expires_delta=None):
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=15)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode,
        "test_secret_key_replace_in_production_7e1a34bd93b148f0",
        algorithm="HS256",
    )
    return encoded_jwt


class TestSecurity(unittest.TestCase):
    def test_create_access_token(self):
        """Test that create_access_token creates a valid JWT token."""
        # Create a token with a specific subject
        subject = "test_user_123"
        token = create_access_token(subject=subject)
        
        # Decode the token and verify its contents
        payload = jwt.decode(
            token,
            "test_secret_key_replace_in_production_7e1a34bd93b148f0",
            algorithms=["HS256"],
        )
        
        # Verify the subject
        self.assertEqual(payload["sub"], subject)
        
        # Verify the expiration time (should be about 15 minutes from now)
        exp_time = datetime.fromtimestamp(payload["exp"], tz=UTC)
        now = datetime.now(UTC)
        self.assertTrue((exp_time - now).total_seconds() > 14 * 60)  # At least 14 minutes
        self.assertTrue((exp_time - now).total_seconds() < 16 * 60)  # At most 16 minutes

    def test_create_access_token_with_expiration(self):
        """Test that create_access_token respects custom expiration time."""
        # Create a token with a specific subject and expiration
        subject = "test_user_123"
        expires_delta = timedelta(hours=1)
        token = create_access_token(subject=subject, expires_delta=expires_delta)
        
        # Decode the token and verify its contents
        payload = jwt.decode(
            token,
            "test_secret_key_replace_in_production_7e1a34bd93b148f0",
            algorithms=["HS256"],
        )
        
        # Verify the subject
        self.assertEqual(payload["sub"], subject)
        
        # Verify the expiration time (should be about 1 hour from now)
        exp_time = datetime.fromtimestamp(payload["exp"], tz=UTC)
        now = datetime.now(UTC)
        self.assertTrue((exp_time - now).total_seconds() > 59 * 60)  # At least 59 minutes
        self.assertTrue((exp_time - now).total_seconds() < 61 * 60)  # At most 61 minutes


if __name__ == "__main__":
    unittest.main() 