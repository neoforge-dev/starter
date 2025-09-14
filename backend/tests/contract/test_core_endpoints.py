"""Core API endpoint contract tests."""
import pytest
from typing import Dict, Any


class TestAuthEndpointContracts:
    """Test authentication endpoint contracts."""
    
    def test_auth_login_endpoint_schema(
        self,
        contract_client,
        contract_helper
    ):
        """Test login endpoint request/response schema."""
        # Test with missing credentials (should return validation error)
        response = contract_client.post("/api/v1/auth/login", json={})
        
        # Should return 422 for validation error
        assert response.status_code == 422
        contract_helper.assert_error_response_format(response)
        
        # Test with invalid credentials format
        invalid_data = {"email": "not-an-email", "password": "short"}
        response = contract_client.post("/api/v1/auth/login", json=invalid_data)
        
        assert response.status_code in [400, 422]
        contract_helper.assert_error_response_format(response)
    
    def test_auth_register_endpoint_schema(
        self,
        contract_client,
        contract_helper
    ):
        """Test register endpoint request/response schema."""
        # Test with missing required fields
        response = contract_client.post("/api/v1/auth/register", json={})
        
        assert response.status_code == 422
        contract_helper.assert_error_response_format(response)
        
        # Test with invalid email format
        invalid_data = {
            "email": "invalid-email",
            "password": "Test123!",
            "full_name": "Test User"
        }
        response = contract_client.post("/api/v1/auth/register", json=invalid_data)
        
        assert response.status_code in [400, 422]
        contract_helper.assert_error_response_format(response)
    
    def test_auth_token_response_format(
        self,
        contract_client,
        contract_helper
    ):
        """Test token response follows expected format."""
        # Create a valid user first
        user_data = {
            "email": "test-contract@example.com",
            "password": "TestPassword123!",
            "full_name": "Contract Test User"
        }
        
        # Register (may already exist)
        contract_client.post("/api/v1/auth/register", json=user_data)
        
        # Test login response format
        login_data = {"email": user_data["email"], "password": user_data["password"]}
        response = contract_client.post("/api/v1/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = contract_helper.assert_json_response(response)
            
            # Validate token response structure
            required_fields = ["access_token", "token_type"]
            for field in required_fields:
                assert field in data, f"Missing token field: {field}"
            
            assert data["token_type"] == "bearer"
            assert isinstance(data["access_token"], str)
            assert len(data["access_token"]) > 0


class TestUserEndpointContracts:
    """Test user management endpoint contracts."""
    
    def test_users_list_endpoint_schema(
        self,
        authenticated_contract_client,
        contract_helper
    ):
        """Test users list endpoint response schema."""
        response = authenticated_contract_client.get("/api/v1/users")
        
        if response.status_code == 200:
            # Should return pagination format
            contract_helper.assert_pagination_response(response)
        elif response.status_code in [401, 403]:
            # Authentication/authorization error
            contract_helper.assert_error_response_format(response)
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")
    
    def test_user_create_endpoint_schema(
        self,
        authenticated_contract_client,
        contract_helper
    ):
        """Test user creation endpoint schema."""
        # Test with missing required fields
        response = authenticated_contract_client.post("/api/v1/users", json={})
        
        assert response.status_code in [400, 422]
        contract_helper.assert_error_response_format(response)
        
        # Test with invalid data types
        invalid_data = {
            "email": 123,  # Should be string
            "full_name": None,
            "password": "short"
        }
        response = authenticated_contract_client.post("/api/v1/users", json=invalid_data)
        
        assert response.status_code in [400, 422]
        contract_helper.assert_error_response_format(response)
    
    def test_user_profile_endpoint_schema(
        self,
        authenticated_contract_client,
        contract_helper
    ):
        """Test user profile endpoint response schema."""
        response = authenticated_contract_client.get("/api/v1/users/me")
        
        if response.status_code == 200:
            data = contract_helper.assert_json_response(response)
            
            # Validate user profile structure
            required_fields = ["id", "email", "full_name", "created_at"]
            for field in required_fields:
                assert field in data, f"Missing user profile field: {field}"
            
            # Validate data types
            assert isinstance(data["id"], (int, str))
            assert isinstance(data["email"], str)
            assert isinstance(data["full_name"], str)
            assert isinstance(data["created_at"], str)
            
            # Ensure password is not exposed
            assert "password" not in data
            assert "hashed_password" not in data
        elif response.status_code in [401, 403]:
            contract_helper.assert_error_response_format(response)


class TestItemsEndpointContracts:
    """Test items management endpoint contracts."""
    
    def test_items_list_endpoint_schema(
        self,
        authenticated_contract_client,
        contract_helper
    ):
        """Test items list endpoint response schema."""
        response = authenticated_contract_client.get("/api/v1/items")
        
        if response.status_code == 200:
            # Should return pagination format
            data = contract_helper.assert_pagination_response(response)
            
            # Validate items structure if any exist
            if data["items"]:
                item = data["items"][0]
                required_fields = ["id", "title", "created_at"]
                for field in required_fields:
                    assert field in item, f"Missing item field: {field}"
        elif response.status_code in [401, 403]:
            contract_helper.assert_error_response_format(response)
    
    def test_item_create_endpoint_schema(
        self,
        authenticated_contract_client,
        contract_helper
    ):
        """Test item creation endpoint schema."""
        # Test with missing required fields
        response = authenticated_contract_client.post("/api/v1/items", json={})
        
        assert response.status_code in [400, 422]
        contract_helper.assert_error_response_format(response)
        
        # Test with valid item data
        valid_data = {
            "title": "Test Item",
            "description": "Test Description"
        }
        response = authenticated_contract_client.post("/api/v1/items", json=valid_data)
        
        if response.status_code == 201:
            data = contract_helper.assert_json_response(response)
            
            # Validate created item structure
            required_fields = ["id", "title", "description", "created_at", "owner_id"]
            for field in required_fields:
                assert field in data, f"Missing created item field: {field}"
            
            assert data["title"] == valid_data["title"]
            assert data["description"] == valid_data["description"]
        elif response.status_code in [401, 403]:
            contract_helper.assert_error_response_format(response)
    
    def test_item_detail_endpoint_schema(
        self,
        authenticated_contract_client,
        contract_helper
    ):
        """Test item detail endpoint response schema."""
        # Try to get item with non-existent ID
        response = authenticated_contract_client.get("/api/v1/items/99999")
        
        if response.status_code == 404:
            contract_helper.assert_error_response_format(response)
        elif response.status_code in [401, 403]:
            contract_helper.assert_error_response_format(response)
        elif response.status_code == 200:
            data = contract_helper.assert_json_response(response)
            
            # Validate item detail structure
            required_fields = ["id", "title", "created_at", "owner_id"]
            for field in required_fields:
                assert field in data, f"Missing item detail field: {field}"


class TestOrganizationEndpointContracts:
    """Test organization management endpoint contracts."""
    
    def test_organizations_list_endpoint_schema(
        self,
        authenticated_contract_client,
        contract_helper
    ):
        """Test organizations list endpoint response schema."""
        response = authenticated_contract_client.get("/api/v1/organizations")
        
        if response.status_code == 200:
            # Should return pagination format
            data = contract_helper.assert_pagination_response(response)
            
            # Validate organization structure if any exist
            if data["items"]:
                org = data["items"][0]
                required_fields = ["id", "name", "created_at"]
                for field in required_fields:
                    assert field in org, f"Missing organization field: {field}"
        elif response.status_code in [401, 403]:
            contract_helper.assert_error_response_format(response)
    
    def test_organization_create_endpoint_schema(
        self,
        authenticated_contract_client,
        contract_helper
    ):
        """Test organization creation endpoint schema."""
        # Test with missing required fields
        response = authenticated_contract_client.post("/api/v1/organizations", json={})
        
        assert response.status_code in [400, 422]
        contract_helper.assert_error_response_format(response)
        
        # Test with invalid data types
        invalid_data = {
            "name": "",  # Empty name should be invalid
            "description": None
        }
        response = authenticated_contract_client.post("/api/v1/organizations", json=invalid_data)
        
        assert response.status_code in [400, 422]
        contract_helper.assert_error_response_format(response)


class TestEndpointResponseConsistency:
    """Test consistent response formats across endpoints."""
    
    @pytest.mark.parametrize("endpoint", [
        "/api/v1/users",
        "/api/v1/items", 
        "/api/v1/organizations",
        "/api/v1/events",
        "/api/v1/projects"
    ])
    def test_list_endpoints_pagination_consistency(
        self,
        authenticated_contract_client,
        contract_helper,
        endpoint: str
    ):
        """Test all list endpoints return consistent pagination format."""
        response = authenticated_contract_client.get(endpoint)
        
        if response.status_code == 200:
            data = contract_helper.assert_pagination_response(response)
            
            # Additional pagination validation
            assert data["page"] >= 1
            assert data["per_page"] >= 0
            assert data["pages"] >= 0
            assert data["total"] >= 0
            assert len(data["items"]) <= data["per_page"]
        elif response.status_code in [401, 403, 404, 405]:
            # Expected error responses
            contract_helper.assert_error_response_format(response)
        else:
            pytest.fail(f"Unexpected status code {response.status_code} for {endpoint}")
    
    @pytest.mark.parametrize("endpoint", [
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/users",
        "/api/v1/items",
        "/api/v1/organizations"
    ])
    def test_error_response_consistency(
        self,
        contract_client,
        contract_helper,
        endpoint: str
    ):
        """Test error responses are consistent across endpoints."""
        # Send invalid request to trigger error
        response = contract_client.post(endpoint, json={"invalid": "data"})
        
        # Should return error status code
        assert response.status_code >= 400
        
        # Should follow error response format
        contract_helper.assert_error_response_format(response)
    
    def test_content_type_consistency(
        self,
        contract_client,
        contract_helper
    ):
        """Test all API endpoints return JSON content type."""
        endpoints = [
            "/api/v1/auth/login",
            "/api/v1/users",
            "/api/v1/items", 
            "/api/v1/organizations"
        ]
        
        for endpoint in endpoints:
            # Test with empty POST (will likely fail but should return JSON)
            response = contract_client.post(endpoint, json={})
            
            # All API responses should be JSON
            contract_helper.assert_response_content_type(response, "application/json")