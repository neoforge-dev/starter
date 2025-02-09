"""Test security and validation middleware."""
import pytest
from fastapi import FastAPI, Request
from starlette.testclient import TestClient
from starlette.responses import Response, JSONResponse
import json

from app.api.middleware.security import setup_security_middleware
from app.api.middleware.validation import setup_validation_middleware, RequestValidationMiddleware
from app.core.config import settings

pytestmark = pytest.mark.asyncio


@pytest.fixture
def app_with_security() -> FastAPI:
    """Create test FastAPI application with security middleware."""
    app = FastAPI()
    
    @app.get("/test")
    async def test_endpoint():
        return {"message": "success"}
    
    @app.post("/test-post")
    async def test_post_endpoint(data: dict):
        return {"received": data}
    
    setup_security_middleware(app)
    return app


@pytest.fixture
def app_with_validation() -> FastAPI:
    """Create test FastAPI application with validation middleware."""
    app = FastAPI()
    
    @app.get("/test")
    async def test_endpoint():
        return {"message": "success"}
    
    @app.post("/test-post")
    async def test_post_endpoint(data: dict):
        return {"received": data}
    
    setup_validation_middleware(app)
    return app


async def test_security_headers(app_with_security: FastAPI):
    """Test that security headers are properly set."""
    client = TestClient(app_with_security)
    response = client.get("/test")
    
    # Check status
    assert response.status_code == 200
    
    # Check security headers
    headers = response.headers
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert headers["X-XSS-Protection"] == "1; mode=block"
    assert headers["Strict-Transport-Security"] == "max-age=31536000; includeSubDomains"
    assert "Content-Security-Policy" in headers
    assert headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "Permissions-Policy" in headers


async def test_cors_configuration(app_with_security: FastAPI):
    """Test CORS configuration."""
    client = TestClient(app_with_security)
    
    # Test CORS preflight request
    headers = {
        "Origin": settings.cors_origins[0],
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Content-Type",
    }
    response = client.options("/test", headers=headers)
    
    assert response.status_code == 200
    assert response.headers["Access-Control-Allow-Origin"] == settings.cors_origins[0]
    assert response.headers["Access-Control-Allow-Methods"]
    assert "Content-Type" in response.headers["Access-Control-Allow-Headers"]


async def test_content_security_policy(app_with_security: FastAPI):
    """Test Content Security Policy header configuration."""
    client = TestClient(app_with_security)
    response = client.get("/test")
    
    csp = response.headers["Content-Security-Policy"]
    
    # Check CSP directives
    assert "default-src 'self'" in csp
    assert "script-src 'self'" in csp
    assert "style-src 'self'" in csp
    assert "img-src 'self' data: https:" in csp
    assert "font-src 'self' https: data:" in csp
    assert "connect-src 'self'" in csp
    assert "frame-ancestors 'none'" in csp
    assert "form-action 'self'" in csp
    assert "base-uri 'self'" in csp
    assert "object-src 'none'" in csp


async def test_request_validation_headers(app_with_validation: FastAPI):
    """Test request header validation."""
    client = TestClient(app_with_validation)
    
    # Test without required headers
    response = client.get("/test")
    assert response.status_code == 422
    assert "Validation Error" in response.json()["detail"]
    
    # Test with required headers
    headers = {
        "Accept": "application/json",
        "User-Agent": "test-client",
    }
    response = client.get("/test", headers=headers)
    assert response.status_code == 200


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

    # Convert the response body to JSON
    response_body = json.loads(response.body.decode())
    assert response.status_code == 422
    assert "Content-Length header is required" in response_body["message"]
    
    # Test POST with all required headers
    headers = {
        **base_headers,
        "Content-Type": "application/json",
        "Content-Length": "13",
    }
    response = client.post("/test-post", content=b'{"test":"ok"}', headers=headers)
    assert response.status_code == 200


async def test_request_validation_content_length(app_with_validation: FastAPI):
    """Test content length validation for POST requests."""
    client = TestClient(app_with_validation)
    
    headers = {
        "Accept": "application/json",
        "User-Agent": "test-client",
        "Content-Type": "application/json",
    }
    
    # Test POST without content-length
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

    # Convert the response body to JSON
    response_body = json.loads(response.body.decode())
    assert response.status_code == 422
    assert "Content-Length header is required" in response_body["message"]


@pytest.mark.parametrize("method", ["POST", "PUT", "PATCH"])
async def test_request_validation_write_methods(app_with_validation: FastAPI, method: str):
    """Test validation for different write methods."""
    client = TestClient(app_with_validation)
    
    # Basic headers
    headers = {
        "Accept": "application/json",
        "User-Agent": "test-client",
    }
    
    # Test without required headers
    response = client.request(method, "/test-post", headers=headers)
    assert response.status_code == 415
    assert "Content-Type must be application/json" in response.json()["message"]
    
    # Test with all required headers
    headers.update({
        "Content-Type": "application/json",
        "Content-Length": "2",
    })
    response = client.request(method, "/test-post", json={}, headers=headers)
    assert response.status_code in [200, 405]  # 405 if method not allowed 