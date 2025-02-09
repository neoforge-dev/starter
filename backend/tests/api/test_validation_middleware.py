"""Test validation middleware functionality."""
import pytest
from fastapi import FastAPI, Request, Depends
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport, Request, Response
from starlette.types import ASGIApp, Receive, Scope, Send

from app.api.middleware.validation import RequestValidationMiddleware

pytestmark = pytest.mark.asyncio


class MockStream:
    """Mock stream for testing."""
    async def receive(self) -> dict:
        """Return empty body."""
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(self, message: dict) -> None:
        """Do nothing."""
        pass


class NoDefaultHeadersTransport(ASGITransport):
    """Transport that doesn't add default headers."""
    async def handle_async_request(self, request: Request) -> object:
        """Handle async request without adding default headers."""
        # Convert headers to a list of tuples as required by ASGI
        headers = [(k.lower().encode("ascii"), v.encode("ascii")) for k, v in request.headers.items()]
        
        scope = {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": request.method,
            "headers": headers,  # Pass the headers from the request
            "path": str(request.url.path),
            "raw_path": str(request.url.path).encode("ascii"),
            "query_string": str(request.url.query).encode("ascii"),
            "scheme": request.url.scheme,
            "server": ("testserver", 80),
            "client": ("testclient", 50000),
        }
        stream = MockStream()
        
        # Create a list to store response chunks
        response_chunks = []
        
        # Create a send function that captures response chunks
        async def send_wrapper(message: dict) -> None:
            response_chunks.append(message)
            
        # Call the ASGI app and wait for it to complete
        await self.app(scope, stream.receive, send_wrapper)
        
        # Extract status and headers from response chunks
        status_code = 500
        headers = []
        body = b""
        
        for chunk in response_chunks:
            if chunk["type"] == "http.response.start":
                status_code = chunk["status"]
                headers = chunk["headers"]
            elif chunk["type"] == "http.response.body":
                body += chunk["body"]
        
        # Create and return a Response object
        return Response(status_code=status_code, headers=headers, content=body)


@pytest.fixture
def app_with_validation() -> FastAPI:
    """Create test FastAPI application with validation middleware."""
    app = FastAPI()
    app.add_middleware(RequestValidationMiddleware)
    
    @app.get("/test")
    async def test_endpoint():
        return {"message": "success"}
    
    @app.post("/test")
    async def test_post_endpoint(data: dict):
        return {"received": data}
    
    @app.put("/test", response_model=None)
    async def test_put_endpoint(request: Request = Depends()):
        body = await request.json()
        return {"received": body}
    
    @app.patch("/test")
    async def test_patch_endpoint(data: dict):
        return {"received": data}
    
    return app


async def test_valid_get_request(app_with_validation: FastAPI):
    """Test valid GET request with required headers."""
    transport = ASGITransport(app=app_with_validation)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {
            "accept": "application/json",
            "user-agent": "test-client/1.0",
        }
        response = await client.get("/test", headers=headers)
        assert response.status_code == 200
        assert response.json() == {"message": "success"}


async def test_missing_required_headers(app_with_validation: FastAPI):
    """Test request with missing required headers."""
    transport = NoDefaultHeadersTransport(app=app_with_validation)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/test")  # No headers
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        assert 'Header "accept" is required' in str(data)
        assert 'Header "user-agent" is required' in str(data)


async def test_post_request_content_type(app_with_validation: FastAPI):
    """Test POST request content type validation."""
    transport = ASGITransport(app=app_with_validation)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test with wrong content type
        headers = {
            "accept": "application/json",
            "user-agent": "test-client/1.0",
            "content-type": "text/plain",
            "content-length": "2",
        }
        response = await client.post("/test", headers=headers, content='{}')
        assert response.status_code == 415
        assert response.json()["detail"] == "Unsupported Media Type"
        
        # Test with correct content type
        headers["content-type"] = "application/json"
        response = await client.post("/test", headers=headers, json={"test": "data"})
        assert response.status_code == 200
        assert response.json() == {"received": {"test": "data"}}


async def test_put_request_validation(app_with_validation: FastAPI):
    """Test PUT request validation."""
    transport = NoDefaultHeadersTransport(app=app_with_validation)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Missing content-length header
        headers = {
            "accept": "application/json",
            "user-agent": "test-client/1.0",
            "content-type": "application/json",
        }
        response = await client.put("/test", headers=headers, content=b'{"test": "data"}')
        assert response.status_code == 422
        assert "Content-Length header is required" in str(response.json())
        
        # All required headers
        headers["content-length"] = "20"
        response = await client.put("/test", headers=headers, content=b'{"test": "data"}')
        assert response.status_code == 200
        assert response.json() == {"received": {"test": "data"}}


async def test_patch_request_validation(app_with_validation: FastAPI):
    """Test PATCH request validation."""
    transport = ASGITransport(app=app_with_validation)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test with all required headers
        headers = {
            "accept": "application/json",
            "user-agent": "test-client/1.0",
            "content-type": "application/json",
            "content-length": "20",
        }
        response = await client.patch("/test", headers=headers, json={"test": "data"})
        assert response.status_code == 200
        assert response.json() == {"received": {"test": "data"}}


async def test_internal_server_error(app_with_validation: FastAPI):
    """Test handling of internal server errors."""
    app = FastAPI()
    app.add_middleware(RequestValidationMiddleware)
    
    @app.get("/error")
    async def error_endpoint():
        raise RuntimeError("Test error")
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {
            "accept": "application/json",
            "user-agent": "test-client/1.0",
        }
        response = await client.get("/error", headers=headers)
        assert response.status_code == 500
        data = response.json()
        assert data["detail"] == "Internal Server Error"
        assert data["message"] == "An error occurred while processing your request" 