import pytest
import pytest_asyncio
# from httpx import ASGITransport, Request, Response, AsyncClient # Comment out if client is removed
from fastapi import FastAPI, HTTPException
# import httpx # Comment out if client is removed
from starlette.middleware.base import BaseHTTPMiddleware
import json
from starlette.datastructures import URL, Headers
from starlette.responses import JSONResponse
from unittest.mock import patch, MagicMock, AsyncMock
from app.api.middleware.validation import RequestValidationMiddleware
from app.core.config import settings
# from tests.conftest import Settings # Comment out if client is removed
from fastapi.testclient import TestClient
from app.main import app
from typing import AsyncGenerator, Callable, Awaitable, TYPE_CHECKING

# Add TYPE_CHECKING guard for Request if needed to avoid circular imports
if TYPE_CHECKING:
    from starlette.requests import Request
    from starlette.responses import Response

# Dummy call_next function for middleware testing
async def dummy_call_next(request: 'Request') -> 'Response': # Use quotes for type hint
    return JSONResponse({"message": "Called Next"}, status_code=200)

# Helper to create a mock Request object
def create_mock_request(method: str, path: str, headers: dict, body: bytes = b'') -> 'Request': # Use quotes
    url = URL(f"http://test{path}")
    # Ensure headers are bytes for scope
    scope_headers = [(k.lower().encode('latin-1'), v.encode('latin-1')) for k, v in headers.items()]
    scope = {
        "type": "http",
        "method": method,
        "path": path,
        "headers": scope_headers,
        "url": url,
        "query_string": b"",
        "root_path": "",
        "client": ("127.0.0.1", 8080),
        "server": ("testserver", 80),
        # Add other necessary scope fields if middleware uses them
    }
    
    async def receive(): # pragma: no cover - Simple mock
        return {"type": "http.request", "body": body, "more_body": False}
        
    # We need an object that behaves like Starlette's Request
    mock_req = MagicMock()
    mock_req.method = method
    mock_req.url = url
    # Use Starlette Headers for the mock's headers attribute
    mock_req.headers = Headers(scope=scope) # Initialize Headers correctly from scope
    mock_req.scope = scope
    mock_req.receive = receive # Attach the async receive function

    # Mock json() method
    if method in ["POST", "PUT", "PATCH"]:
        async def mock_json(): # pragma: no cover - Simple mock
            if not body:
                 # Mimic Starlette's behavior for empty body
                raise json.JSONDecodeError("Expecting value", "", 0)
            try:
                return json.loads(body.decode('utf-8'))
            except json.JSONDecodeError as e:
                 # Re-raise to mimic Starlette behavior
                 raise json.JSONDecodeError(e.msg, e.doc, e.pos)
            except UnicodeDecodeError:
                 # Handle non-utf8 body if necessary, or let it raise
                 raise json.JSONDecodeError("Invalid utf-8", body.decode('latin-1'), 0) # Example
        mock_req.json = mock_json
    else:
         # For methods without bodies, .json() should ideally not be called,
         # but if it is, Starlette might raise an error. Let's mock it to raise.
         async def mock_json_no_body(): # pragma: no cover
             raise RuntimeError("Cannot call .json() on a request with no body or non-JSON Content-Type.")
         mock_req.json = mock_json_no_body
        
    return mock_req

@pytest.fixture(scope="module")
def validation_middleware() -> RequestValidationMiddleware:
    # Instantiate the middleware once for the module
    # Patch 'get_metrics' if it's called during __init__ and requires setup
    with patch("app.api.middleware.validation.get_metrics") as mock_get_metrics:
        # Setup mock metrics if needed by middleware init or dispatch
        mock_metrics_instance = {
            "http_request_duration_seconds": MagicMock(),
            "http_requests": MagicMock()
        }
        mock_get_metrics.return_value = mock_metrics_instance
        middleware = RequestValidationMiddleware(app=None) # app isn't strictly needed for dispatch test
    return middleware

@pytest.mark.asyncio
async def test_validation_content_type(validation_middleware: RequestValidationMiddleware):
    """Test middleware Content-Type enforcement via direct dispatch call."""
    path = f"{settings.api_v1_str}/test"

    # Test POST with incorrect content-type
    headers_incorrect = {
        "Accept": "application/json",
        "User-Agent": "test-client",
        "Content-Type": "text/plain",
        "Content-Length": "9"
    }
    request_incorrect = create_mock_request("POST", path, headers_incorrect, body=b"some text")
    response = await validation_middleware.dispatch(request_incorrect, dummy_call_next)
    assert response.status_code == 415
    assert json.loads(response.body) == {"detail": "Content-Type must be application/json"}

    # Test POST with correct content-type (should call next)
    headers_correct = {
        "Accept": "application/json",
        "User-Agent": "test-client",
        "Content-Type": "application/json",
        "Content-Length": "2"
    }
    request_correct = create_mock_request("POST", path, headers_correct, body=b'{}')
    response = await validation_middleware.dispatch(request_correct, dummy_call_next)
    assert response.status_code == 200 # From dummy_call_next
    assert json.loads(response.body) == {"message": "Called Next"}

    # Test GET request (should ignore content-type and call next)
    headers_get = {"Accept": "application/json", "User-Agent": "test-client"}
    request_get = create_mock_request("GET", path, headers_get)
    response = await validation_middleware.dispatch(request_get, dummy_call_next)
    assert response.status_code == 200 # From dummy_call_next

@pytest.mark.asyncio
async def test_validation_content_length(validation_middleware: RequestValidationMiddleware):
    """Test Content-Length validation via direct dispatch call."""
    path = f"{settings.api_v1_str}/test"
    base_headers = {
        "Accept": "application/json",
        "User-Agent": "test-client",
        "Content-Type": "application/json",
    }

    # Test POST with missing Content-Length
    request_missing = create_mock_request(
        "POST", path, {k: v for k, v in base_headers.items() if k != "Content-Length"}, body=b'{}'
    )
    response = await validation_middleware.dispatch(request_missing, dummy_call_next)
    assert response.status_code == 411
    assert json.loads(response.body) == {"detail": "Content-Length header required"}

    # Test POST with Content-Length: 0 - Middleware tries to parse empty body -> 422
    headers_zero = {**base_headers, "Content-Length": "0"}
    request_zero = create_mock_request("POST", path, headers_zero, body=b'') # Empty body for CL 0
    response = await validation_middleware.dispatch(request_zero, dummy_call_next)
    assert response.status_code == 422 # Expect 422 due to JSONDecodeError on empty body
    assert json.loads(response.body) == {"detail": "Invalid JSON in request body"} # Check detail

    # Test POST with invalid Content-Length - Middleware should return 400
    headers_invalid = {**base_headers, "Content-Length": "invalid"}
    request_invalid = create_mock_request("POST", path, headers_invalid, body=b'{}')
    response = await validation_middleware.dispatch(request_invalid, dummy_call_next)
    assert response.status_code == 400
    assert json.loads(response.body) == {"detail": "Invalid Content-Length header"}

@pytest.mark.asyncio
async def test_validation_required_headers(validation_middleware: RequestValidationMiddleware):
    """Test required headers validation via direct dispatch call."""
    path = f"{settings.api_v1_str}/test"
    json_body = {"title": "Test", "description": "Desc"}
    body_bytes = json.dumps(json_body).encode('utf-8')
    content_length = str(len(body_bytes))

    base_headers = {
        "Content-Type": "application/json",
        "Content-Length": content_length,
    }

    # Test missing Accept header
    headers_no_accept = {**base_headers, "User-Agent": "test-client"}
    request_no_accept = create_mock_request("POST", path, headers_no_accept, body=body_bytes)
    response = await validation_middleware.dispatch(request_no_accept, dummy_call_next)
    assert response.status_code == 400
    assert json.loads(response.body) == {"detail": "Accept header is required"}

    # Test missing User-Agent header
    headers_no_user_agent = {**base_headers, "Accept": "application/json"}
    request_no_ua = create_mock_request("POST", path, headers_no_user_agent, body=body_bytes)
    response = await validation_middleware.dispatch(request_no_ua, dummy_call_next)
    assert response.status_code == 400
    assert json.loads(response.body) == {"detail": "User-Agent header is required"}

    # Test missing both required headers
    headers_missing_both = {k: v for k, v in base_headers.items() if k not in {"Accept", "User-Agent"}}
    request_missing_both = create_mock_request("POST", path, headers_missing_both, body=body_bytes)
    response = await validation_middleware.dispatch(request_missing_both, dummy_call_next)
    assert response.status_code == 400
    # Check detail is one of the expected missing headers
    detail = json.loads(response.body).get("detail")
    assert detail in ["Accept header is required", "User-Agent header is required"]

@pytest.mark.asyncio
async def test_validation_public_endpoints(validation_middleware: RequestValidationMiddleware):
    """Test that public endpoints skip validation checks via direct dispatch call."""
    # Health endpoint (GET)
    health_path = "/health"
    headers = {} # Missing required headers
    request_health = create_mock_request("GET", health_path, headers)
    response = await validation_middleware.dispatch(request_health, dummy_call_next)
    assert response.status_code == 200 # Should call next, not 400

    # Auth token endpoint (POST)
    auth_path = f"{settings.api_v1_str}/auth/token"
    headers_auth = { # Missing required headers, wrong content-type, missing length
         "Content-Type": "text/plain" 
    }
    request_auth = create_mock_request("POST", auth_path, headers_auth, body=b"data")
    response = await validation_middleware.dispatch(request_auth, dummy_call_next)
    assert response.status_code == 200 # Should call next, not 4xx

@pytest.mark.asyncio
async def test_validation_error_handling(validation_middleware: RequestValidationMiddleware):
    """Test validation middleware general error handling via direct dispatch call."""
    path = f"{settings.api_v1_str}/test"
    headers = {
        "Accept": "application/json",
        "User-Agent": "test-client",
        "Content-Type": "application/json",
        "Content-Length": "2"
    }
    request = create_mock_request("POST", path, headers, body=b'{}')

    # Mock call_next to raise an unhandled exception
    # Use string hints for Request/Response
    async def failing_call_next(req: 'Request') -> 'Response':
        raise Exception("Internal test error")

    response = await validation_middleware.dispatch(request, failing_call_next)
    assert response.status_code == 500
    assert json.loads(response.body) == {
        "detail": "Internal Server Error",
        "message": "An error occurred while processing your request",
    }

# Remove or comment out the old fixtures and client-based tests
# @pytest.mark.asyncio
# async def test_validation_middleware_content_type(validation_test_client: AsyncClient): ... (and others)

# @pytest.fixture(scope="module")
# def validation_test_app() -> FastAPI: ...

# @pytest_asyncio.fixture(scope="function")
# async def validation_test_client(validation_test_app: FastAPI, test_settings: Settings) -> AsyncGenerator[AsyncClient, None]: ...

# Keep endpoint tests if desired, but they no longer test middleware directly
# @pytest.mark.asyncio
# async def test_headers_endpoint_get(client: AsyncClient): ...

# @pytest.mark.asyncio
# async def test_headers_endpoint_post(client: AsyncClient): ... 