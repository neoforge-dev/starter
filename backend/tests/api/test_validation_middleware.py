import pytest
from httpx import ASGITransport, Request, Response, AsyncClient
from fastapi import FastAPI, HTTPException
import httpx
from starlette.middleware.base import BaseHTTPMiddleware
import json
from app.api.middleware.validation import RequestValidationMiddleware, setup_validation_middleware
from app.core.config import settings
from unittest.mock import patch

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

class NoDefaultHeadersTransport(ASGITransport):
    """Transport that doesn't add default headers."""
    def __init__(self, app: FastAPI, **kwargs):
        super().__init__(app=app, **kwargs)

    async def handle_async_request(self, request: Request) -> Response:
        headers_list = [(k.lower().encode("ascii"), v.encode("ascii")) 
                       for k, v in request.headers.items()]

        if "content-length" in request.headers:
            body_bytes = await request.body()
            computed_length = str(len(body_bytes))
            headers_list = [pair for pair in headers_list if pair[0] != b"content-length"]
            headers_list.append((b"content-length", computed_length.encode("ascii")))
        
        scope = {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": request.method,
            "headers": headers_list,
            "path": str(request.url.path),
            "raw_path": str(request.url.path).encode("ascii"),
            "query_string": str(request.url.query).encode("ascii"),
            "scheme": request.url.scheme,
            "server": ("testserver", 80),
            "client": ("testclient", 50000),
        }

        body_bytes = await request.body()
        stream = MockStream(body_bytes)

        response_chunks = []
        async def send_wrapper(message: dict) -> None:
            response_chunks.append(message)

        await self.app(scope, stream.receive, send_wrapper)

        status_code = 500
        headers = []
        body = b""

        for chunk in response_chunks:
            if chunk["type"] == "http.response.start":
                status_code = chunk["status"]
                headers = chunk["headers"]
            elif chunk["type"] == "http.response.body":
                body += chunk["body"]

        return Response(status_code=status_code, headers=headers, content=body)

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

@pytest.mark.asyncio
async def test_validation_middleware_content_type(app):
    """Test validation middleware with various content type scenarios."""
    transport = NoDefaultHeadersTransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test without content-type header
        response = await client.post("/test", json={"test": "data"})
        assert response.status_code == 415
        assert "Content-Type must be application/json" in response.json()["message"]

        # Test with wrong content-type
        response = await client.post(
            "/test",
            content=b'{"test":"data"}',
            headers={"Content-Type": "text/plain"}
        )
        assert response.status_code == 415
        assert "Content-Type must be application/json" in response.json()["message"]

        # Test with correct content-type
        response = await client.post(
            "/test",
            json={"test": "data"},
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "test-client",
                "Content-Length": "20"
            }
        )
        assert response.status_code == 200
        assert response.json() == {"message": "success"}

@pytest.mark.asyncio
async def test_validation_middleware_content_length(app):
    """Test content length validation."""
    transport = NoDefaultHeadersTransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test missing content-length
        response = await client.post(
            "/test",
            json={"test": "data"},
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "test-client"
            }
        )
        assert response.status_code == 422
        assert "Content-Length header is required" in response.json()["detail"][0]["msg"]

        # Test invalid content-length
        response = await client.post(
            "/test",
            json={"test": "data"},
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "test-client",
                "Content-Length": "invalid"
            }
        )
        assert response.status_code == 422
        assert "Content-Length must be a valid integer" in response.json()["detail"][0]["msg"]

        # Test zero content-length
        response = await client.post(
            "/test",
            json={"test": "data"},
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "test-client",
                "Content-Length": "0"
            }
        )
        assert response.status_code == 422
        assert "Content-Length must be a positive integer" in response.json()["detail"][0]["msg"]

@pytest.mark.asyncio
async def test_validation_middleware_required_headers(app):
    """Test required headers validation."""
    transport = NoDefaultHeadersTransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test missing accept header
        response = await client.post(
            "/test",
            json={"test": "data"},
            headers={
                "Content-Type": "application/json",
                "User-Agent": "test-client",
                "Content-Length": "20"
            }
        )
        assert response.status_code == 422
        assert 'Header "accept" is required' in response.json()["detail"][0]["msg"]

        # Test missing user-agent header
        response = await client.post(
            "/test",
            json={"test": "data"},
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Content-Length": "20"
            }
        )
        assert response.status_code == 422
        assert 'Header "user-agent" is required' in response.json()["detail"][0]["msg"]

@pytest.mark.asyncio
async def test_validation_middleware_public_endpoints(app):
    """Test validation middleware behavior with public endpoints."""
    transport = NoDefaultHeadersTransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test health check endpoint (public)
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

        # Test auth endpoint (public)
        response = await client.post(f"{settings.api_v1_str}/auth/token")
        assert response.status_code == 404  # Route not defined, but middleware should skip validation

@pytest.mark.asyncio
async def test_validation_middleware_error_handling(app):
    """Test validation middleware error handling."""
    transport = NoDefaultHeadersTransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test internal server error
        with patch.object(RequestValidationMiddleware, "dispatch", side_effect=Exception("Test error")):
            response = await client.post("/test", json={"test": "data"})
            assert response.status_code == 500
            assert response.json()["detail"] == "Internal Server Error" 