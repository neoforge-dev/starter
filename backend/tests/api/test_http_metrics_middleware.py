"""Tests for HTTP metrics middleware."""
import pytest
import time
from unittest.mock import Mock, patch
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from prometheus_client import REGISTRY

from app.api.middleware.http_metrics import HTTPMetricsMiddleware, setup_http_metrics_middleware
from app.core.metrics import get_metrics, reset_metrics


class TestHTTPMetricsMiddleware:
    """Test suite for HTTP metrics middleware."""
    
    def setup_method(self):
        """Set up test fixtures."""
        # Reset metrics before each test
        reset_metrics()
        
        # Create a test FastAPI app
        self.app = FastAPI()
        
        # Add some test routes with path parameters
        @self.app.get("/")
        async def root():
            return {"message": "hello"}
        
        @self.app.get("/users/{user_id}")
        async def get_user(user_id: int):
            return {"user_id": user_id}
        
        @self.app.get("/users/{user_id}/items")
        async def get_user_items(user_id: int):
            return {"user_id": user_id, "items": []}
        
        @self.app.get("/items/{item_id}")
        async def get_item(item_id: int):
            return {"item_id": item_id}
        
        @self.app.get("/organizations/{organization_id}/members")
        async def get_org_members(organization_id: int):
            return {"organization_id": organization_id, "members": []}
        
        @self.app.get("/error")
        async def error_endpoint():
            raise Exception("Test error")
        
        @self.app.get("/server-error")
        async def server_error():
            from fastapi import HTTPException
            raise HTTPException(status_code=500, detail="Server error")
        
        # Set up HTTP metrics middleware
        setup_http_metrics_middleware(self.app)
        
        # Create test client
        self.client = TestClient(self.app)
    
    def teardown_method(self):
        """Clean up after tests."""
        reset_metrics()
    
    def test_path_normalization(self):
        """Test that paths with IDs are properly normalized."""
        middleware = HTTPMetricsMiddleware(Mock())
        
        test_cases = [
            ("/api/v1/users/123", "/api/v1/users/{user_id}"),
            ("/api/v1/users/456/items", "/api/v1/users/{user_id}/items"),
            ("/api/v1/items/789", "/api/v1/items/{item_id}"),
            ("/api/v1/organizations/101/members", "/api/v1/organizations/{organization_id}/members"),
            ("/api/v1/sessions/202", "/api/v1/sessions/{session_id}"),
            ("/api/v1/events/303", "/api/v1/events/{event_id}"),
            ("/api/v1/admin/404", "/api/v1/admin/{admin_id}"),
            ("/api/v1/roles/505", "/api/v1/roles/{role_id}"),
            ("/api/v1/projects/606", "/api/v1/projects/{project_id}"),
            ("/api/v1/content/707", "/api/v1/content/{content_id}"),
            ("/api/v1/user/808", "/api/v1/user/{user_id}"),
            ("/api/v1/profile/909", "/api/v1/profile/{user_id}"),
            ("/api/v1/preferences/1010", "/api/v1/preferences/{user_id}"),
            ("/api/v1/rules/rule-abc-123", "/api/v1/rules/{rule_id}"),
            ("/api/v1/rules/550e8400-e29b-41d4-a716-446655440000", "/api/v1/rules/{uuid}"),
            ("/health", "/health"),  # Excluded path should not be normalized
            ("/metrics", "/metrics"),  # Excluded path should not be normalized
        ]
        
        for input_path, expected in test_cases:
            normalized = middleware._normalize_path(input_path)
            assert normalized == expected, f"Path {input_path} normalized to {normalized}, expected {expected}"
    
    def test_basic_request_metrics(self):
        """Test that basic HTTP request metrics are recorded."""
        # Make a successful request
        response = self.client.get("/")
        assert response.status_code == 200
        
        # Get metrics
        metrics = get_metrics()
        
        # Check that http_requests counter was incremented
        requests_metric = metrics["http_requests"]
        samples = list(requests_metric.collect())[0].samples
        
        # Find the sample for our request
        request_sample = None
        for sample in samples:
            if (sample.labels.get("method") == "GET" and 
                sample.labels.get("endpoint") == "/" and 
                sample.labels.get("status") == "200"):
                request_sample = sample
                break
        
        assert request_sample is not None, "Request metric not found"
        assert request_sample.value >= 1.0, "Request count should be at least 1"
    
    def test_path_parameter_normalization_in_metrics(self):
        """Test that paths with parameters are normalized in recorded metrics."""
        # Make requests to endpoints with path parameters
        response1 = self.client.get("/users/123")
        assert response1.status_code == 200
        
        response2 = self.client.get("/users/456")
        assert response2.status_code == 200
        
        response3 = self.client.get("/users/789/items")
        assert response3.status_code == 200
        
        # Get metrics
        metrics = get_metrics()
        requests_metric = metrics["http_requests"]
        samples = list(requests_metric.collect())[0].samples
        
        # Check that all user requests are counted under normalized path
        user_requests_count = 0
        user_items_requests_count = 0
        
        for sample in samples:
            if (sample.labels.get("method") == "GET" and 
                sample.labels.get("endpoint") == "/users/{user_id}" and 
                sample.labels.get("status") == "200"):
                user_requests_count += sample.value
            elif (sample.labels.get("method") == "GET" and 
                  sample.labels.get("endpoint") == "/users/{user_id}/items" and 
                  sample.labels.get("status") == "200"):
                user_items_requests_count += sample.value
        
        assert user_requests_count == 2.0, f"Expected 2 user requests, got {user_requests_count}"
        assert user_items_requests_count == 1.0, f"Expected 1 user items request, got {user_items_requests_count}"
    
    def test_request_duration_histogram(self):
        """Test that request duration is recorded in histogram."""
        # Make a request
        response = self.client.get("/")
        assert response.status_code == 200
        
        # Get metrics
        metrics = get_metrics()
        duration_metric = metrics["http_request_duration_seconds"]
        samples = list(duration_metric.collect())[0].samples
        
        # Check that duration histogram has samples
        count_sample = None
        for sample in samples:
            if (sample.labels.get("method") == "GET" and 
                sample.labels.get("endpoint") == "/" and 
                sample.name.endswith("_count")):
                count_sample = sample
                break
        
        assert count_sample is not None, "Duration histogram count not found"
        assert count_sample.value >= 1.0, "Duration histogram should have at least 1 observation"
    
    def test_5xx_error_metrics(self):
        """Test that 5xx errors are properly recorded."""
        # Make a request that causes a 500 error
        response = self.client.get("/server-error")
        assert response.status_code == 500
        
        # Get metrics
        metrics = get_metrics()
        
        # Check http_requests counter
        requests_metric = metrics["http_requests"]
        requests_samples = list(requests_metric.collect())[0].samples
        
        error_request_found = False
        for sample in requests_samples:
            if (sample.labels.get("method") == "GET" and 
                sample.labels.get("endpoint") == "/server-error" and 
                sample.labels.get("status") == "500"):
                error_request_found = True
                break
        
        assert error_request_found, "5xx error request not found in http_requests metric"
        
        # Check http_5xx_responses counter
        error_metric = metrics["http_5xx_responses"]
        error_samples = list(error_metric.collect())[0].samples
        
        error_5xx_found = False
        for sample in error_samples:
            if (sample.labels.get("method") == "GET" and 
                sample.labels.get("endpoint") == "/server-error"):
                error_5xx_found = True
                assert sample.value >= 1.0, "5xx error count should be at least 1"
                break
        
        assert error_5xx_found, "5xx error not found in http_5xx_responses metric"
    
    def test_exception_handling(self):
        """Test that unhandled exceptions are properly recorded as 5xx errors."""
        # This test will cause an exception to be raised
        with pytest.raises(Exception):
            self.client.get("/error")
        
        # Get metrics
        metrics = get_metrics()
        
        # Check that 5xx error was recorded
        error_metric = metrics["http_5xx_responses"]
        error_samples = list(error_metric.collect())[0].samples
        
        error_found = False
        for sample in error_samples:
            if (sample.labels.get("method") == "GET" and 
                sample.labels.get("endpoint") == "/error"):
                error_found = True
                assert sample.value >= 1.0, "Exception should be recorded as 5xx error"
                break
        
        assert error_found, "Exception not recorded in 5xx metrics"
    
    def test_excluded_paths(self):
        """Test that excluded paths are not recorded in metrics."""
        middleware = HTTPMetricsMiddleware(Mock())
        
        # Test excluded paths
        excluded_paths = ["/metrics", "/health", "/ready", "/docs", "/redoc", "/openapi.json"]
        
        for path in excluded_paths:
            normalized = middleware._normalize_path(path)
            assert normalized == path, f"Excluded path {path} should not be normalized"
    
    def test_histogram_buckets(self):
        """Test that the histogram has appropriate buckets for latency profiling."""
        # Make a request to trigger metrics
        response = self.client.get("/")
        assert response.status_code == 200
        
        # Get the histogram metric
        metrics = get_metrics()
        duration_metric = metrics["http_request_duration_seconds"]
        samples = list(duration_metric.collect())[0].samples
        
        # Check that histogram buckets are present
        bucket_samples = [s for s in samples if s.name.endswith("_bucket")]
        
        # Expected buckets from metrics.py
        expected_buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
        
        for expected_bucket in expected_buckets:
            bucket_found = any(
                float(s.labels.get("le", 0)) == expected_bucket 
                for s in bucket_samples
            )
            assert bucket_found, f"Expected histogram bucket {expected_bucket} not found"
    
    def test_multiple_requests_aggregation(self):
        """Test that multiple requests to the same normalized endpoint are properly aggregated."""
        # Make multiple requests to different user IDs (should be aggregated)
        user_ids = [1, 2, 3, 100, 999]
        for user_id in user_ids:
            response = self.client.get(f"/users/{user_id}")
            assert response.status_code == 200
        
        # Get metrics
        metrics = get_metrics()
        requests_metric = metrics["http_requests"]
        samples = list(requests_metric.collect())[0].samples
        
        # Find the aggregated count for normalized user endpoint
        user_endpoint_count = 0
        for sample in samples:
            if (sample.labels.get("method") == "GET" and 
                sample.labels.get("endpoint") == "/users/{user_id}" and 
                sample.labels.get("status") == "200"):
                user_endpoint_count += sample.value
        
        assert user_endpoint_count == len(user_ids), f"Expected {len(user_ids)} requests, got {user_endpoint_count}"
    
    def test_different_http_methods(self):
        """Test that different HTTP methods are recorded separately."""
        # Add POST endpoint for testing
        @self.app.post("/users")
        async def create_user():
            return {"message": "created"}
        
        # Make GET and POST requests
        get_response = self.client.get("/users/123")
        post_response = self.client.post("/users")
        
        assert get_response.status_code == 200
        assert post_response.status_code == 200
        
        # Get metrics
        metrics = get_metrics()
        requests_metric = metrics["http_requests"]
        samples = list(requests_metric.collect())[0].samples
        
        # Check that GET and POST are recorded separately
        get_found = False
        post_found = False
        
        for sample in samples:
            if sample.labels.get("status") == "200":
                if (sample.labels.get("method") == "GET" and 
                    sample.labels.get("endpoint") == "/users/{user_id}"):
                    get_found = True
                elif (sample.labels.get("method") == "POST" and 
                      sample.labels.get("endpoint") == "/users"):
                    post_found = True
        
        assert get_found, "GET request not found in metrics"
        assert post_found, "POST request not found in metrics"


class TestHTTPMetricsSetup:
    """Test HTTP metrics middleware setup function."""
    
    def test_setup_function(self):
        """Test that setup function properly configures middleware."""
        app = FastAPI()
        
        # Setup should not raise an exception
        setup_http_metrics_middleware(app)
        
        # Check that middleware was added (this is a basic test since FastAPI 
        # doesn't provide easy introspection of middleware stack)
        assert len(app.user_middleware) > 0, "Middleware should be added to app"
    
    def test_setup_integration(self):
        """Test full integration of metrics middleware setup."""
        app = FastAPI()
        
        @app.get("/test")
        async def test_endpoint():
            return {"test": True}
        
        # Set up metrics middleware
        setup_http_metrics_middleware(app)
        
        # Create client and make request
        client = TestClient(app)
        response = client.get("/test")
        
        assert response.status_code == 200
        
        # Verify metrics were recorded
        metrics = get_metrics()
        requests_metric = metrics["http_requests"]
        samples = list(requests_metric.collect())[0].samples
        
        # Should have at least one sample
        assert len(samples) > 0, "Metrics should be recorded after request"