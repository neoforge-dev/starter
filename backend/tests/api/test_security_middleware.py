import pytest
from fastapi import FastAPI, Request
from starlette.testclient import TestClient

from app.api.middleware.validation import RequestValidationMiddleware


@pytest.mark.asyncio
async def test_request_validation_content_type(app_with_validation: FastAPI):
    """Test content type validation for POST requests."""
    client = TestClient(app_with_validation)

    # Required headers for all requests
    base_headers = {
        "Accept": "application/json",
        "User-Agent": "test-client",
    }

    # Test POST without content-type - Expect 422 because body is required and invalid
    response = client.post("/test-post", content=b"{}", headers=base_headers)
    assert response.status_code == 422  # Expect 422 (Unprocessable Entity)

    # Test POST with wrong content-type
    headers = {**base_headers, "Content-Type": "text/plain"}
    response = client.post("/test-post", content=b"not json", headers=headers)
    assert response.status_code == 422

    # Test POST with correct content-type and valid body
    headers_correct = {**base_headers, "Content-Type": "application/json"}
    response = client.post(
        "/test-post", json={"message": "hello"}, headers=headers_correct
    )
    assert response.status_code == 200

    # Ensure lines 31 through 59 (inclusive) from the original file are removed
    # (This includes the scope definition, Request creation, and middleware.dispatch call)
