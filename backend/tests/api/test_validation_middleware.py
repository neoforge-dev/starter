import pytest
from httpx import ASGITransport, Request, Response, AsyncClient
from fastapi import FastAPI, HTTPException
import httpx
from starlette.middleware.base import BaseHTTPMiddleware
import json
from app.api.middleware.validation import RequestValidationMiddleware, setup_validation_middleware
from app.core.config import settings
from unittest.mock import patch
from fastapi.testclient import TestClient

class MockStream:
    """Mock stream for testing."""
    def __init__(self, body: bytes):
        self.body = body
        self.sent = False

    async def receive(self) -> dict:
        if not self.sent:
            self.sent = True
            return {"type": "http.request", "body": self.body, "more_body": False}
        return {"type": "http.request", "body": b"", "more_body": False}

@pytest.fixture
def app():
    """Create test FastAPI application."""
    app = FastAPI()
    setup_validation_middleware(app)
    
    @app.post("/test")
    async def test_endpoint():
        return {"message": "success"}
    
    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}
    
    return app

@pytest.fixture
def app_validation_test():
    app = FastAPI()
    
    @app.post("/test-validation")
    async def validation_test_endpoint(data: dict):
        return {"received": data}
    
    app.add_middleware(RequestValidationMiddleware)
    return app

@pytest.mark.asyncio
async def test_validation_middleware_content_type(app_validation_test):
    """Test validation middleware Content-Type enforcement."""
    client = TestClient(app_validation_test)

    # Test POST with incorrect content-type
    headers_incorrect = {
        "Accept": "application/json", 
        "User-Agent": "test-client",
        "Content-Type": "text/plain"
    }
    response = client.post("/test-validation", content="some text", headers=headers_incorrect)
    assert response.status_code == 422

    # Test POST with correct content-type
    headers_correct = {
        "Accept": "application/json", 
        "User-Agent": "test-client",
        "Content-Type": "application/json"
    }
    response = client.post("/test-validation", json={"message": "hello"}, headers=headers_correct)
    assert response.status_code == 200

    # Test GET request (should ignore content-type)
    response = client.get("/test-validation")

@pytest.mark.asyncio
async def test_validation_middleware_content_length(app_validation_test):
    """Test Content-Length validation using TestClient."""
    client = TestClient(app_validation_test)
    headers = {
        "Accept": "application/json",
        "User-Agent": "test-client",
        "Content-Type": "application/json",
        # Content-Length is missing
    }
    response = client.post("/test-validation", json={"message": "hello"}, headers=headers)
    assert response.status_code == 411
    assert "Content-Length header required" in response.json()["detail"]

    headers_zero = {**headers, "Content-Length": "0"}
    response = client.post("/test-validation", json={}, headers=headers_zero)
    assert response.status_code == 400 # Or 411 depending on middleware logic for empty body
    # Assert specific detail message if middleware checks for zero length explicitly

    headers_invalid = {**headers, "Content-Length": "invalid"}
    response = client.post("/test-validation", json={"message": "hello"}, headers=headers_invalid)
    assert response.status_code == 400 # Bad Request for invalid header value
    assert "Invalid Content-Length header" in response.json()["detail"]

@pytest.mark.asyncio
async def test_validation_middleware_required_headers(app_validation_test):
    """Test required headers validation using TestClient."""
    client = TestClient(app_validation_test)
    base_headers = {
        "Content-Type": "application/json",
        "Content-Length": "20", # Use a valid length for the body
    }
    json_body = {"message": "hello"}

    # Test missing Accept header
    headers_no_accept = {**base_headers, "User-Agent": "test-client"}
    response = client.post("/test-validation", json=json_body, headers=headers_no_accept)
    assert response.status_code == 400
    assert "Accept header is required" in response.json()["detail"]

    # Test missing User-Agent header
    headers_no_agent = {**base_headers, "Accept": "application/json"}
    response = client.post("/test-validation", json=json_body, headers=headers_no_agent)
    assert response.status_code == 400
    assert "User-Agent header is required" in response.json()["detail"]

    # Test with all required headers
    headers_all = {
        "Content-Type": "application/json",
        "Content-Length": str(len(str(json_body).encode('utf-8'))), # Calculate actual length
        "Accept": "application/json", 
        "User-Agent": "test-client",
    }
    response = client.post("/test-validation", json=json_body, headers=headers_all)
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_validation_middleware_public_endpoints(app):
    """Test validation middleware behavior with public endpoints."""
    # Initialize client with transport
    transport = ASGITransport(app=app) 
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test health check endpoint (public)
        response = await client.get("/health")
        assert response.status_code == 200
        # Add more checks if needed for public endpoints

@pytest.mark.asyncio
async def test_validation_middleware_error_handling(app):
    """Test validation middleware error handling."""
    async with AsyncClient(base_url="http://test") as client:
        # Test internal server error
        with patch.object(RequestValidationMiddleware, "dispatch", side_effect=Exception("Test error")):
            response = await client.post("/test", json={"test": "data"})
            assert response.status_code == 500
            assert response.json()["detail"] == "Internal Server Error" 