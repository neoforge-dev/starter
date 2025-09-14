"""Contract testing configuration and fixtures."""
import json
from typing import Any, Dict, Generator

import httpx
import pytest
from pydantic import SecretStr

from app.core.config import Settings, Environment


@pytest.fixture
def settings() -> Settings:
    """Test settings with contract testing configuration."""
    return Settings(
        environment=Environment.TEST,
        database_url_for_env="postgresql://test:test@localhost:5432/test_db",
        secret_key=SecretStr("test-secret-key-for-contract-testing"),
        testing=True,
    )


@pytest.fixture
def test_tenant_headers() -> Dict[str, str]:
    """Standard headers for tenant-aware contract testing."""
    return {
        "X-Tenant-ID": "test-tenant",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


@pytest.fixture
def contract_client(test_tenant_headers: Dict[str, str]) -> Generator[httpx.Client, None, None]:
    """Test client configured for contract testing."""
    from app.main import app
    
    # Use ASGITransport directly without type annotation issues
    with httpx.Client(
        transport=httpx.ASGITransport(app=app),  # type: ignore
        base_url="http://testserver",
        headers=test_tenant_headers,
        timeout=30.0
    ) as client:
        yield client


@pytest.fixture
def openapi_spec(contract_client: httpx.Client) -> Dict[str, Any]:
    """Get OpenAPI specification for contract validation."""
    response = contract_client.get("/api/openapi.json")
    if response.status_code != 200:
        pytest.skip(f"OpenAPI spec not available: {response.status_code}")
    return response.json()


@pytest.fixture
def authenticated_contract_client(
    contract_client: httpx.Client,
    test_tenant_headers: Dict[str, str]
) -> Generator[httpx.Client, None, None]:
    """Authenticated test client for contract testing."""
    # Create test user and get auth token
    user_data = {
        "email": "contract-test@example.com",
        "password": "TestPassword123!",
        "full_name": "Contract Test User"
    }
    
    # Register user
    register_response = contract_client.post("/api/v1/auth/register", json=user_data)
    if register_response.status_code not in [200, 201, 409]:  # 409 if user already exists
        pytest.skip(f"Failed to create test user: {register_response.status_code}")
    
    # Login to get token
    login_data = {"email": user_data["email"], "password": user_data["password"]}
    login_response = contract_client.post("/api/v1/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        pytest.skip(f"Failed to authenticate test user: {login_response.status_code}")
    
    token_data = login_response.json()
    access_token = token_data.get("access_token")
    
    if not access_token:
        pytest.skip("No access token received from login")
    
    # Update client headers with auth token
    auth_headers = {**test_tenant_headers, "Authorization": f"Bearer {access_token}"}
    contract_client.headers.update(auth_headers)
    
    yield contract_client


class ContractTestHelper:
    """Helper class for contract testing utilities."""
    
    @staticmethod
    def assert_response_status(response: httpx.Response, expected_status: int) -> None:
        """Assert response has expected status code."""
        assert response.status_code == expected_status, (
            f"Expected status {expected_status}, got {response.status_code}. "
            f"Response: {response.text}"
        )
    
    @staticmethod
    def assert_response_content_type(response: httpx.Response, expected_type: str) -> None:
        """Assert response has expected content type."""
        content_type = response.headers.get("content-type", "").split(";")[0]
        assert content_type == expected_type, (
            f"Expected content-type '{expected_type}', got '{content_type}'"
        )
    
    @staticmethod
    def assert_json_response(response: httpx.Response) -> Dict[str, Any]:
        """Assert response is valid JSON and return parsed data."""
        ContractTestHelper.assert_response_content_type(response, "application/json")
        try:
            return response.json()
        except json.JSONDecodeError as e:
            pytest.fail(f"Invalid JSON response: {e}")
    
    @staticmethod
    def assert_error_response_format(response: httpx.Response) -> None:
        """Assert error response follows standard format."""
        data = ContractTestHelper.assert_json_response(response)
        
        # Standard FastAPI error format
        if "detail" in data:
            assert isinstance(data["detail"], (str, list))
        else:
            # Custom error format validation
            required_fields = ["message", "status_code"]
            for field in required_fields:
                assert field in data, f"Missing required error field: {field}"
    
    @staticmethod
    def assert_pagination_response(response: httpx.Response) -> Dict[str, Any]:
        """Assert response follows pagination format."""
        data = ContractTestHelper.assert_json_response(response)
        
        pagination_fields = ["items", "total", "page", "per_page", "pages"]
        for field in pagination_fields:
            assert field in data, f"Missing pagination field: {field}"
        
        assert isinstance(data["items"], list)
        assert isinstance(data["total"], int)
        assert isinstance(data["page"], int)
        assert isinstance(data["per_page"], int)
        assert isinstance(data["pages"], int)
        
        return data


@pytest.fixture
def contract_helper() -> ContractTestHelper:
    """Contract testing helper utilities."""
    return ContractTestHelper()