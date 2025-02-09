from fastapi import FastAPI, Request
from starlette.testclient import TestClient
from app.api.middleware.validation import RequestValidationMiddleware
import pytest

@pytest.mark.asyncio
async def test_request_validation_content_type(app_with_validation: FastAPI):
    """Test content type validation for POST requests."""
    client = TestClient(app_with_validation)

    # Required headers for all requests
    base_headers = {
        "Accept": "application/json",
        "User-Agent": "test-client",
    }

    # Test POST without content-type
    response = client.post("/test-post", content=b"{}", headers=base_headers)
    assert response.status_code == 415
    assert "Content-Type must be application/json" in response.json()["message"]

    # Test POST with wrong content-type
    headers = {**base_headers, "Content-Type": "text/plain"}
    response = client.post("/test-post", content=b"{}", headers=headers)
    assert response.status_code == 415
    assert "Content-Type must be application/json" in response.json()["message"]

    # Test POST with correct content-type but missing content-length
    # Create a custom request without Content-Length header
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/test-post",
        "headers": [
            (b"accept", b"application/json"),
            (b"user-agent", b"test-client"),
            (b"content-type", b"application/json"),
        ],
        "client": ("testclient", 50000),
        "server": ("testserver", 80),
        "scheme": "http",
        "http_version": "1.1",
        "root_path": "",
        "query_string": b"",
    }

    # Create a request without Content-Length header
    request = Request(scope)
    request._body = b'{"test": "data"}'

    # Call the middleware directly
    middleware = RequestValidationMiddleware(app=app_with_validation)
    response = await middleware.dispatch(request, lambda _: None)

    assert response.status_code == 422
    assert "Content-Length header is required" in response.json()["message"]

    # Test POST with all required headers
    headers = {
        **base_headers,
        "Content-Type": "application/json",
        "Content-Length": "13",
    }
    response = client.post("/test-post", content=b'{"test":"ok"}', headers=headers)
    assert response.status_code == 200 