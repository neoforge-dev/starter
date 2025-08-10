"""Tests for Celery health check integration."""
import pytest
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient
from app.main import app


class TestCeleryHealthChecks:
    """Test Celery integration in health check endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)
    
    def test_health_check_with_celery_workers(self, client):
        """Test health check when Celery workers are active."""
        with patch('app.main.celery_app.control.inspect') as mock_inspect:
            # Mock Celery inspect to return active workers
            mock_inspector = Mock()
            mock_inspector.active.return_value = {
                'worker1@hostname': [
                    {'id': 'task-123', 'name': 'send_welcome_email_task'},
                    {'id': 'task-456', 'name': 'send_verification_email_task'}
                ]
            }
            mock_inspect.return_value = mock_inspector
            
            # Mock database and Redis to be healthy
            with patch('app.main.get_db') as mock_get_db, \
                 patch('app.main.get_redis') as mock_get_redis:
                
                # Mock database session
                mock_db = Mock()
                mock_db.execute = Mock()
                mock_get_db.return_value = mock_db
                
                # Mock Redis client
                mock_redis = Mock()
                mock_redis.ping = Mock()
                mock_get_redis.return_value = mock_redis
                
                response = client.get("/health")
                
                assert response.status_code == 200
                data = response.json()
                
                assert data["status"] == "healthy"
                assert "healthy" in data["celery_status"]
                assert "1 workers" in data["celery_status"]
                assert "2 active tasks" in data["celery_status"]
    
    def test_health_check_with_no_celery_workers(self, client):
        """Test health check when no Celery workers are active."""
        with patch('app.main.celery_app.control.inspect') as mock_inspect:
            # Mock Celery inspect to return no active workers
            mock_inspector = Mock()
            mock_inspector.active.return_value = {}
            mock_inspect.return_value = mock_inspector
            
            # Mock database and Redis to be healthy
            with patch('app.main.get_db') as mock_get_db, \
                 patch('app.main.get_redis') as mock_get_redis:
                
                mock_db = Mock()
                mock_db.execute = Mock()
                mock_get_db.return_value = mock_db
                
                mock_redis = Mock()
                mock_redis.ping = Mock()
                mock_get_redis.return_value = mock_redis
                
                response = client.get("/health")
                
                assert response.status_code == 200
                data = response.json()
                
                assert data["status"] == "unhealthy"  # Overall status is unhealthy due to no workers
                assert data["celery_status"] == "no_workers"
    
    def test_health_check_with_celery_connection_error(self, client):
        """Test health check when Celery connection fails."""
        with patch('app.main.celery_app.control.inspect') as mock_inspect:
            # Mock Celery inspect to raise connection error
            mock_inspect.side_effect = Exception("Connection to broker failed")
            
            # Mock database and Redis to be healthy
            with patch('app.main.get_db') as mock_get_db, \
                 patch('app.main.get_redis') as mock_get_redis:
                
                mock_db = Mock()
                mock_db.execute = Mock()
                mock_get_db.return_value = mock_db
                
                mock_redis = Mock()
                mock_redis.ping = Mock()
                mock_get_redis.return_value = mock_redis
                
                response = client.get("/health")
                
                assert response.status_code == 200
                data = response.json()
                
                assert data["status"] == "unhealthy"
                assert "error" in data["celery_status"]
                assert "Connection to broker failed" in data["celery_status"]
    
    def test_detailed_health_check_with_celery_stats(self, client):
        """Test detailed health check with Celery worker statistics."""
        with patch('app.main.celery_app.control.inspect') as mock_inspect:
            # Mock comprehensive Celery inspect responses
            mock_inspector = Mock()
            mock_inspector.active.return_value = {
                'worker1@hostname': [{'id': 'task-123', 'name': 'send_welcome_email_task'}]
            }
            mock_inspector.registered.return_value = {
                'worker1@hostname': [
                    'send_welcome_email_task',
                    'send_verification_email_task',
                    'send_password_reset_email_task'
                ]
            }
            mock_inspector.stats.return_value = {
                'worker1@hostname': {
                    'pool': {'max-concurrency': 2, 'processes': [123, 456]},
                    'total': {'tasks.send_welcome_email_task': 5}
                }
            }
            mock_inspect.return_value = mock_inspector
            
            # Mock database and Redis to be healthy
            with patch('app.main.get_db') as mock_get_db, \
                 patch('app.main.get_redis') as mock_get_redis:
                
                mock_db = Mock()
                mock_db.execute = Mock()
                mock_get_db.return_value = mock_db
                
                mock_redis = Mock()
                mock_redis.ping = Mock()
                mock_get_redis.return_value = mock_redis
                
                response = client.get("/health/detailed")
                
                assert response.status_code == 200
                data = response.json()
                
                assert data["status"] == "healthy"
                assert data["celery_status"] == "healthy"
                
                # Check detailed Celery information
                celery_details = data["celery_details"]
                assert celery_details["worker_count"] == 1
                assert celery_details["active_tasks_total"] == 1
                assert "worker1@hostname" in celery_details["active_workers"]
                assert "send_welcome_email_task" in celery_details["registered_tasks"]
                assert "worker1@hostname" in celery_details["worker_stats"]
    
    def test_detailed_health_check_celery_error(self, client):
        """Test detailed health check when Celery inspection fails."""
        with patch('app.main.celery_app.control.inspect') as mock_inspect:
            # Mock Celery inspect to raise error
            mock_inspect.side_effect = Exception("Broker connection timeout")
            
            # Mock database and Redis to be healthy
            with patch('app.main.get_db') as mock_get_db, \
                 patch('app.main.get_redis') as mock_get_redis:
                
                mock_db = Mock()
                mock_db.execute = Mock()
                mock_get_db.return_value = mock_db
                
                mock_redis = Mock()
                mock_redis.ping = Mock()
                mock_get_redis.return_value = mock_redis
                
                response = client.get("/health/detailed")
                
                assert response.status_code == 200
                data = response.json()
                
                assert data["status"] == "unhealthy"
                assert "error" in data["celery_status"]
                
                # Check error details
                celery_details = data["celery_details"]
                assert "error" in celery_details
                assert "Broker connection timeout" in celery_details["error"]
    
    def test_health_check_response_model_structure(self, client):
        """Test that health check response follows expected model structure."""
        with patch('app.main.celery_app.control.inspect') as mock_inspect, \
             patch('app.main.get_db') as mock_get_db, \
             patch('app.main.get_redis') as mock_get_redis:
            
            # Mock all services to be healthy
            mock_inspector = Mock()
            mock_inspector.active.return_value = {'worker1@hostname': []}
            mock_inspect.return_value = mock_inspector
            
            mock_db = Mock()
            mock_db.execute = Mock()
            mock_get_db.return_value = mock_db
            
            mock_redis = Mock()
            mock_redis.ping = Mock()
            mock_get_redis.return_value = mock_redis
            
            response = client.get("/health")
            
            assert response.status_code == 200
            data = response.json()
            
            # Verify all expected fields are present
            required_fields = ["status", "version", "database_status", "redis_status", "celery_status"]
            for field in required_fields:
                assert field in data
            
            # Verify field types
            assert isinstance(data["status"], str)
            assert isinstance(data["version"], str)
            assert isinstance(data["database_status"], str)
            assert isinstance(data["redis_status"], str)
            assert isinstance(data["celery_status"], str)
    
    def test_detailed_health_check_response_model_structure(self, client):
        """Test that detailed health check response follows expected model structure."""
        with patch('app.main.celery_app.control.inspect') as mock_inspect, \
             patch('app.main.get_db') as mock_get_db, \
             patch('app.main.get_redis') as mock_get_redis:
            
            # Mock all services to be healthy
            mock_inspector = Mock()
            mock_inspector.active.return_value = {'worker1@hostname': []}
            mock_inspector.registered.return_value = {'worker1@hostname': []}
            mock_inspector.stats.return_value = {'worker1@hostname': {}}
            mock_inspect.return_value = mock_inspector
            
            mock_db = Mock()
            mock_db.execute = Mock()
            mock_get_db.return_value = mock_db
            
            mock_redis = Mock()
            mock_redis.ping = Mock()
            mock_get_redis.return_value = mock_redis
            
            response = client.get("/health/detailed")
            
            assert response.status_code == 200
            data = response.json()
            
            # Verify all expected fields from DetailedHealthCheck model
            required_fields = [
                "status", "version", "database_status", "redis_status", "celery_status",
                "database_latency_ms", "redis_latency_ms", "environment", "celery_details"
            ]
            for field in required_fields:
                assert field in data
            
            # Verify field types
            assert isinstance(data["status"], str)
            assert isinstance(data["version"], str)
            assert isinstance(data["database_latency_ms"], (int, float))
            assert isinstance(data["redis_latency_ms"], (int, float))
            assert isinstance(data["environment"], str)
            assert isinstance(data["celery_details"], dict)