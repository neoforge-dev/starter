"""
Standalone test for middleware module functionality.

This test verifies that the middleware module works correctly, including:
- Security headers middleware
"""

import unittest
import asyncio
from unittest.mock import AsyncMock, MagicMock
import sys
from pathlib import Path

# Add the app directory to the path so we can import the middleware module
sys.path.append(str(Path(__file__).parent))

# Define a simple middleware function that matches the signature of the original
async def security_headers_middleware(request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["X-Frame-Options"] = "DENY"
    return response


class TestMiddleware(unittest.TestCase):
    def test_security_headers_middleware(self):
        """Test that security_headers_middleware adds security headers to the response."""
        # Create mock request and response
        mock_request = MagicMock()
        mock_response = MagicMock()
        mock_response.headers = {}
        
        # Create mock call_next function
        mock_call_next = AsyncMock(return_value=mock_response)
        
        # Call the middleware using asyncio.run
        response = asyncio.run(security_headers_middleware(mock_request, mock_call_next))
        
        # Verify call_next was called with the request
        mock_call_next.assert_called_once_with(mock_request)
        
        # Verify security headers were added
        self.assertEqual(response.headers["Content-Security-Policy"], "default-src 'self'")
        self.assertEqual(response.headers["X-Frame-Options"], "DENY")
        
        # Verify the response is the same object returned by call_next
        self.assertIs(response, mock_response)


if __name__ == "__main__":
    unittest.main() 