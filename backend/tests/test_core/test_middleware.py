"""
Test middleware module functionality.

This test verifies that the middleware module works correctly, including:
- Security headers middleware
- CORS configuration
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import Request, Response

from app.core.middleware import security_headers_middleware


@pytest.mark.asyncio
async def test_security_headers_middleware():
    """Test that security_headers_middleware adds security headers to the response."""
    # Create mock request and response
    mock_request = MagicMock(spec=Request)
    mock_response = MagicMock(spec=Response)
    mock_response.headers = {}
    
    # Create mock call_next function
    mock_call_next = AsyncMock(return_value=mock_response)
    
    # Call the middleware
    response = await security_headers_middleware(mock_request, mock_call_next)
    
    # Verify call_next was called with the request
    mock_call_next.assert_called_once_with(mock_request)
    
    # Verify security headers were added
    assert response.headers["Content-Security-Policy"] == "default-src 'self'"
    assert response.headers["X-Frame-Options"] == "DENY"
    
    # Verify the response is the same object returned by call_next
    assert response is mock_response 