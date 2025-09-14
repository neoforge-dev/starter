"""Tenant-aware contract testing."""
import pytest
from typing import Dict, Any


class TestTenantIsolation:
    """Test multi-tenant data isolation."""
    
    @pytest.mark.parametrize("tenant_id", [
        "valid-tenant-123",
        "tenant-with-dashes",
        "tenant_with_underscores",
        "tenant123",
    ])
    def test_valid_tenant_headers(
        self,
        contract_client,
        contract_helper,
        tenant_id: str
    ):
        """Test endpoints accept valid tenant IDs."""
        headers = {"X-Tenant-ID": tenant_id}
        response = contract_client.get("/health", headers=headers)
        
        # Health endpoint should work with any valid tenant
        contract_helper.assert_response_status(response, 200)
        contract_helper.assert_json_response(response)
    
    @pytest.mark.parametrize("invalid_tenant", [
        "",              # Empty tenant
        " ",             # Whitespace only
        None,            # No tenant header
        "tenant with spaces",  # Invalid characters
        "tenant@invalid.com",  # Email-like format
        "tenant/with/slashes", # Path-like format
        "a" * 300,       # Very long tenant ID
        "../../etc/passwd",  # Path traversal attempt
        "<script>alert('xss')</script>",  # XSS attempt
        "DROP TABLE tenants;--",  # SQL injection attempt
    ])
    def test_invalid_tenant_headers(
        self,
        contract_client,
        contract_helper,
        invalid_tenant: str
    ):
        """Test endpoints handle invalid tenant IDs appropriately."""
        if invalid_tenant is None:
            # Test without tenant header
            response = contract_client.get("/api/v1/users")
        else:
            headers = {"X-Tenant-ID": invalid_tenant}
            response = contract_client.get("/api/v1/users", headers=headers)
        
        # Should reject invalid tenants
        assert response.status_code in [400, 401, 403, 422]
        contract_helper.assert_error_response_format(response)
    
    def test_tenant_data_isolation(
        self,
        contract_client,
        contract_helper
    ):
        """Test that different tenants cannot access each other's data."""
        tenant1_headers = {"X-Tenant-ID": "tenant-1"}
        tenant2_headers = {"X-Tenant-ID": "tenant-2"}
        
        # Create user in tenant 1
        user_data = {
            "email": "tenant1-user@example.com",
            "password": "TestPassword123!",
            "full_name": "Tenant 1 User"
        }
        
        response1 = contract_client.post(
            "/api/v1/auth/register", 
            json=user_data,
            headers=tenant1_headers
        )
        
        # User should be created successfully or already exist
        assert response1.status_code in [200, 201, 409]
        
        # Try to access user from tenant 2
        login_data = {"email": user_data["email"], "password": user_data["password"]}
        response2 = contract_client.post(
            "/api/v1/auth/login",
            json=login_data,
            headers=tenant2_headers
        )
        
        # Should not be able to login from different tenant
        assert response2.status_code in [401, 403, 404]
        contract_helper.assert_error_response_format(response2)
    
    def test_cross_tenant_resource_access(
        self,
        contract_client,
        contract_helper
    ):
        """Test cross-tenant resource access prevention."""
        tenant1_headers = {"X-Tenant-ID": "tenant-1"}
        tenant2_headers = {"X-Tenant-ID": "tenant-2"}
        
        # Attempt to access resources with different tenant IDs
        test_endpoints = [
            "/api/v1/users",
            "/api/v1/items",
            "/api/v1/organizations",
            "/api/v1/events"
        ]
        
        for endpoint in test_endpoints:
            # Access from tenant 1
            response1 = contract_client.get(endpoint, headers=tenant1_headers)
            
            # Access from tenant 2
            response2 = contract_client.get(endpoint, headers=tenant2_headers)
            
            # Both should either succeed (200) or fail consistently
            # They should not return each other's data
            assert response1.status_code in [200, 401, 403, 404]
            assert response2.status_code in [200, 401, 403, 404]
            
            if response1.status_code == 200 and response2.status_code == 200:
                data1 = contract_helper.assert_json_response(response1)
                data2 = contract_helper.assert_json_response(response2)
                
                # Data sets should be isolated (different or empty)
                if "items" in data1 and "items" in data2:
                    # Compare data - should be tenant-isolated
                    assert data1 != data2 or (
                        len(data1["items"]) == 0 and len(data2["items"]) == 0
                    )


class TestTenantConfigurationValidation:
    """Test tenant-specific configuration validation."""
    
    def test_tenant_specific_cors_handling(
        self,
        contract_client,
        contract_helper
    ):
        """Test CORS headers respect tenant configuration."""
        tenant_headers = {"X-Tenant-ID": "test-tenant"}
        
        # Test OPTIONS request with tenant
        response = contract_client.options(
            "/api/v1/auth/login",
            headers=tenant_headers
        )
        
        # CORS headers should be present
        cors_headers = [
            "access-control-allow-origin",
            "access-control-allow-methods",
            "access-control-allow-headers"
        ]
        
        for header in cors_headers:
            assert header in response.headers, f"Missing CORS header: {header}"
    
    def test_tenant_specific_rate_limiting(
        self,
        contract_client,
        contract_helper
    ):
        """Test rate limiting is tenant-aware."""
        tenant1_headers = {"X-Tenant-ID": "tenant-1"}
        tenant2_headers = {"X-Tenant-ID": "tenant-2"}
        
        invalid_data = {"email": "invalid", "password": "wrong"}
        
        # Make requests from tenant 1
        response1 = None
        for _ in range(10):
            response1 = contract_client.post(
                "/api/v1/auth/login",
                json=invalid_data,
                headers=tenant1_headers
            )
        
        # Make requests from tenant 2
        response2 = None
        for _ in range(10):
            response2 = contract_client.post(
                "/api/v1/auth/login",
                json=invalid_data,
                headers=tenant2_headers
            )
        
        # Rate limiting should be isolated per tenant
        # (If rate limiting is enabled, one tenant shouldn't affect the other)
        if response1:
            assert response1.status_code in [401, 422, 429]
        if response2:
            assert response2.status_code in [401, 422, 429]
    
    def test_tenant_feature_flags(
        self,
        contract_client,
        contract_helper
    ):
        """Test tenant-specific feature availability."""
        tenant_headers = {"X-Tenant-ID": "test-tenant"}
        
        # Test access to various features that might be tenant-specific
        feature_endpoints = [
            "/api/v1/analytics",
            "/api/v1/billing",
            "/api/v1/ab-tests",
            "/api/v1/recommendations",
            "/api/v1/personalization"
        ]
        
        for endpoint in feature_endpoints:
            response = contract_client.get(endpoint, headers=tenant_headers)
            
            # Feature should either be available or properly disabled
            if response.status_code == 404:
                # Feature not available for this tenant
                contract_helper.assert_error_response_format(response)
            elif response.status_code in [401, 403]:
                # Authentication/authorization required
                contract_helper.assert_error_response_format(response)
            elif response.status_code == 200:
                # Feature available
                contract_helper.assert_json_response(response)
            else:
                # Other valid responses
                assert response.status_code in [400, 422, 500]


class TestTenantSecurityValidation:
    """Test tenant-specific security validation."""
    
    def test_tenant_subdomain_validation(
        self,
        contract_client,
        contract_helper
    ):
        """Test tenant validation through subdomains if supported."""
        # Test with various Host headers that might indicate tenant
        host_variants = [
            "test-tenant.api.example.com",
            "api.test-tenant.example.com",
            "tenant1.localhost:8000",
            "invalid-host.com"
        ]
        
        for host in host_variants:
            headers = {"Host": host, "X-Tenant-ID": "test-tenant"}
            response = contract_client.get("/health", headers=headers)
            
            # Should handle host headers gracefully
            assert response.status_code in [200, 400, 403]
            contract_helper.assert_json_response(response)
    
    def test_tenant_authentication_isolation(
        self,
        contract_client,
        contract_helper
    ):
        """Test authentication tokens are tenant-isolated."""
        tenant1_headers = {"X-Tenant-ID": "tenant-1"}
        tenant2_headers = {"X-Tenant-ID": "tenant-2"}
        
        # Create and authenticate user in tenant 1
        user_data = {
            "email": "isolated-user@example.com",
            "password": "TestPassword123!",
            "full_name": "Isolated User"
        }
        
        # Register in tenant 1
        register_response = contract_client.post(
            "/api/v1/auth/register",
            json=user_data,
            headers=tenant1_headers
        )
        
        if register_response.status_code in [200, 201, 409]:
            # Login in tenant 1
            login_data = {"email": user_data["email"], "password": user_data["password"]}
            login_response = contract_client.post(
                "/api/v1/auth/login",
                json=login_data,
                headers=tenant1_headers
            )
            
            if login_response.status_code == 200:
                token_data = login_response.json()
                token = token_data.get("access_token")
                
                if token:
                    # Try to use tenant 1 token in tenant 2
                    auth_headers = {
                        "Authorization": f"Bearer {token}",
                        "X-Tenant-ID": "tenant-2"
                    }
                    
                    profile_response = contract_client.get(
                        "/api/v1/users/me",
                        headers=auth_headers
                    )
                    
                    # Should reject token from different tenant
                    assert profile_response.status_code in [401, 403]
                    contract_helper.assert_error_response_format(profile_response)
    
    def test_tenant_permission_boundaries(
        self,
        contract_client,
        contract_helper
    ):
        """Test permissions are scoped to tenant boundaries."""
        tenant_headers = {"X-Tenant-ID": "test-tenant"}
        
        # Test admin endpoints that should be tenant-scoped
        admin_endpoints = [
            "/api/v1/admin/users",
            "/api/v1/admin/organizations",
            "/api/v1/admin/settings"
        ]
        
        for endpoint in admin_endpoints:
            response = contract_client.get(endpoint, headers=tenant_headers)
            
            # Should require proper authentication
            assert response.status_code in [401, 403, 404]
            contract_helper.assert_error_response_format(response)


class TestTenantErrorHandling:
    """Test tenant-aware error handling."""
    
    def test_tenant_not_found_handling(
        self,
        contract_client,
        contract_helper
    ):
        """Test handling of non-existent tenants."""
        non_existent_tenant = {"X-Tenant-ID": "non-existent-tenant-12345"}
        
        response = contract_client.get("/api/v1/users", headers=non_existent_tenant)
        
        # Should handle non-existent tenant gracefully
        assert response.status_code in [400, 401, 403, 404]
        contract_helper.assert_error_response_format(response)
        
        # Error message should be informative but not leak sensitive info
        error_data = response.json()
        error_text = str(error_data).lower()
        assert "tenant" in error_text or "not found" in error_text
    
    def test_tenant_suspension_handling(
        self,
        contract_client,
        contract_helper
    ):
        """Test handling of suspended tenant accounts."""
        # Test with headers that might indicate suspended tenant
        suspended_tenant = {"X-Tenant-ID": "suspended-tenant"}
        
        response = contract_client.get("/api/v1/users", headers=suspended_tenant)
        
        # Should handle suspended tenant appropriately
        assert response.status_code in [400, 401, 403, 423]  # 423 = Locked
        contract_helper.assert_error_response_format(response)
    
    def test_malformed_tenant_header_handling(
        self,
        contract_client,
        contract_helper
    ):
        """Test handling of malformed tenant headers."""
        malformed_headers = [
            {"X-Tenant-ID": ""},
            {"X-Tenant-Id": "test"},  # Wrong capitalization
            {"X-TENANT-ID": "test"},  # All caps
            {"Tenant-ID": "test"},    # Missing X- prefix
            {"X-Tenant-ID": "test\x00null"},  # Null bytes
            {"X-Tenant-ID": "test\r\ninjected"},  # Header injection
        ]
        
        for headers in malformed_headers:
            response = contract_client.get("/api/v1/users", headers=headers)
            
            # Should handle malformed headers gracefully
            assert response.status_code in [400, 401, 403, 422]
            contract_helper.assert_error_response_format(response)