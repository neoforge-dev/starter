"""OpenAPI schema compliance tests."""
import pytest
from typing import Dict, Any


class ContractTestHelper:
    """Helper class for contract testing utilities."""
    
    @staticmethod
    def assert_response_status(response, expected_status: int) -> None:
        """Assert response has expected status code."""
        assert response.status_code == expected_status, (
            f"Expected status {expected_status}, got {response.status_code}. "
            f"Response: {response.text}"
        )
    
    @staticmethod
    def assert_response_content_type(response, expected_type: str) -> None:
        """Assert response has expected content type."""
        content_type = response.headers.get("content-type", "").split(";")[0]
        assert content_type == expected_type, (
            f"Expected content-type '{expected_type}', got '{content_type}'"
        )
    
    @staticmethod
    def assert_json_response(response) -> Dict[str, Any]:
        """Assert response is valid JSON and return parsed data."""
        ContractTestHelper.assert_response_content_type(response, "application/json")
        try:
            return response.json()
        except Exception as e:
            pytest.fail(f"Invalid JSON response: {e}")
    
    @staticmethod
    def assert_error_response_format(response) -> None:
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


@pytest.fixture
def contract_helper() -> ContractTestHelper:
    """Contract testing helper utilities."""
    return ContractTestHelper()


class TestOpenAPICompliance:
    """Test API endpoints against OpenAPI specification."""
    
    def test_openapi_spec_accessible(
        self, 
        contract_client,
        contract_helper: ContractTestHelper
    ):
        """Test that OpenAPI specification is accessible."""
        response = contract_client.get("/api/openapi.json")
        contract_helper.assert_response_status(response, 200)
        contract_helper.assert_response_content_type(response, "application/json")
        
        spec = contract_helper.assert_json_response(response)
        
        # Validate basic OpenAPI structure
        assert "openapi" in spec
        assert "info" in spec
        assert "paths" in spec
        assert isinstance(spec["paths"], dict)
        assert len(spec["paths"]) > 0
    
    def test_health_endpoint_schema(
        self,
        contract_client,
        contract_helper: ContractTestHelper
    ):
        """Test health endpoint follows expected schema."""
        response = contract_client.get("/health")
        contract_helper.assert_response_status(response, 200)
        
        data = contract_helper.assert_json_response(response)
        
        # Validate health response structure
        required_fields = ["status", "timestamp", "checks"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        assert data["status"] in ["healthy", "unhealthy"]
        assert isinstance(data["checks"], dict)
    
    def test_ready_endpoint_schema(
        self,
        contract_client,
        contract_helper: ContractTestHelper
    ):
        """Test ready endpoint follows expected schema."""
        response = contract_client.get("/ready")
        contract_helper.assert_response_status(response, 200)
        
        data = contract_helper.assert_json_response(response)
        
        # Validate readiness response structure
        required_fields = ["status", "timestamp"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        assert data["status"] in ["ready", "not_ready"]


class TestAPIEndpointSchemas:
    """Test core API endpoint schemas."""
    
    @pytest.mark.parametrize("endpoint", [
        "/api/v1/auth/login",
        "/api/v1/auth/register", 
        "/api/v1/users",
        "/api/v1/items",
        "/api/v1/organizations",
    ])
    def test_endpoint_returns_valid_error_for_missing_auth(
        self,
        contract_client,
        contract_helper: ContractTestHelper,
        endpoint: str
    ):
        """Test endpoints return proper error format for unauthorized access."""
        # Test GET without authentication
        response = contract_client.get(endpoint)
        
        # Should return 401 or 422 for most protected endpoints
        assert response.status_code in [401, 422, 403, 405], (
            f"Unexpected status {response.status_code} for {endpoint}"
        )
        
        # Validate error response format
        if response.status_code != 405:  # Method not allowed has different format
            contract_helper.assert_error_response_format(response)
    
    def test_cors_headers_present(
        self,
        contract_client,
        contract_helper: ContractTestHelper
    ):
        """Test CORS headers are properly configured."""
        response = contract_client.options("/api/v1/auth/login")
        
        # CORS headers should be present
        cors_headers = [
            "access-control-allow-origin",
            "access-control-allow-methods", 
            "access-control-allow-headers"
        ]
        
        for header in cors_headers:
            assert header in response.headers, f"Missing CORS header: {header}"


class TestResponseContentTypes:
    """Test API response content types."""
    
    @pytest.mark.parametrize("endpoint,expected_type", [
        ("/health", "application/json"),
        ("/ready", "application/json"),
        ("/api/openapi.json", "application/json"),
        ("/docs", "text/html"),
    ])
    def test_endpoint_content_types(
        self,
        contract_client,
        contract_helper: ContractTestHelper,
        endpoint: str,
        expected_type: str
    ):
        """Test endpoints return correct content types."""
        response = contract_client.get(endpoint)
        
        # Should return 200 for these basic endpoints
        contract_helper.assert_response_status(response, 200)
        contract_helper.assert_response_content_type(response, expected_type)


class TestAPIVersioning:
    """Test API versioning compliance."""
    
    def test_api_v1_prefix_consistency(
        self,
        openapi_spec: Dict[str, Any]
    ):
        """Test all API endpoints follow v1 prefix convention."""
        paths = openapi_spec["paths"]
        
        api_paths = [path for path in paths.keys() if path.startswith("/api/")]
        
        # All API paths should be under /api/v1/
        for path in api_paths:
            if not path.startswith("/api/openapi.json"):  # Exception for OpenAPI spec
                assert path.startswith("/api/v1/"), (
                    f"API path {path} does not follow /api/v1/ convention"
                )
    
    def test_openapi_info_section(
        self,
        openapi_spec: Dict[str, Any]
    ):
        """Test OpenAPI info section is properly configured."""
        info = openapi_spec["info"]
        
        required_fields = ["title", "version"]
        for field in required_fields:
            assert field in info, f"Missing info field: {field}"
        
        assert isinstance(info["title"], str)
        assert isinstance(info["version"], str)
        assert len(info["title"]) > 0
        assert len(info["version"]) > 0