"""Test validation middleware functionality."""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

from app.api.middleware.validation import RequestValidationMiddleware

pytestmark = pytest.mark.asyncio


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
    
    @app.put("/test")
    async def test_put_endpoint(data: dict):
        return {"received": data}
    
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
    transport = ASGITransport(app=app_with_validation)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/test")  # No headers
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        assert "Accept header is required" in str(data)
        assert "User-Agent header is required" in str(data)


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
    transport = ASGITransport(app=app_with_validation)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Missing content-length header
        headers = {
            "accept": "application/json",
            "user-agent": "test-client/1.0",
            "content-type": "application/json",
        }
        response = await client.put("/test", headers=headers, json={"test": "data"})
        assert response.status_code == 422
        assert "Content-Length header is required" in str(response.json())
        
        # All required headers
        headers["content-length"] = "20"
        response = await client.put("/test", headers=headers, json={"test": "data"})
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