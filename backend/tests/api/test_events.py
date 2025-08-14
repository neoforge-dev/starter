"""Test event tracking API endpoints."""
import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import Mock, AsyncMock, patch
from typing import Dict, List
import json

from app import crud
from app.models.event import Event
from app.schemas.event import (
    EventCreate, EventType, EventSource, EventAnalyticsQuery,
    EventAnonymizationRequest, EventDataExportRequest
)
from app.core.config import get_settings, Settings
from tests.factories import UserFactory

pytestmark = pytest.mark.asyncio


@pytest.fixture
async def sample_event_data() -> Dict:
    """Sample event data for testing."""
    return {
        "event_type": "interaction",
        "event_name": "button_click",
        "source": "web",
        "page_url": "https://example.com/dashboard",
        "properties": {
            "element_id": "submit_button",
            "element_text": "Submit Form",
            "form_data": {"field1": "value1"}
        },
        "value": 1.0,
    }


@pytest.fixture
async def sample_events_bulk() -> Dict:
    """Sample bulk events data for testing."""
    return {
        "events": [
            {
                "event_type": "interaction",
                "event_name": "page_view",
                "source": "web",
                "page_url": "https://example.com/home",
                "properties": {"referrer": "google.com"}
            },
            {
                "event_type": "performance",
                "event_name": "api_response_time",
                "source": "api",
                "properties": {"endpoint": "/api/v1/users", "response_time": 150},
                "value": 150.0
            },
            {
                "event_type": "business",
                "event_name": "conversion",
                "source": "web",
                "properties": {"conversion_type": "signup", "revenue": 0},
                "value": 0.0
            }
        ]
    }


class TestEventTracking:
    """Test event tracking endpoints."""

    async def test_track_single_event_authenticated(
        self, 
        client: AsyncClient,
        db: AsyncSession,
        normal_user_token_headers: Dict,
        sample_event_data: Dict,
        test_settings: Settings
    ):
        """Test tracking single event with authentication."""
        # Mock Redis for background processing
        with patch('app.api.v1.endpoints.events.get_redis') as mock_redis:
            mock_redis_client = AsyncMock()
            mock_redis.return_value = mock_redis_client
            
            response = await client.post(
                f"{test_settings.api_v1_str}/events/track",
                json=sample_event_data,
                headers=normal_user_token_headers,
            )

            assert response.status_code == 201
            data = response.json()
            
            assert data["event_type"] == "interaction"
            assert data["event_name"] == "button_click"
            assert data["source"] == "web"
            assert data["page_url"] == "https://example.com/dashboard"
            assert "event_id" in data
            assert "timestamp" in data
            assert data["user_id"] is not None
            assert data["properties"]["element_id"] == "submit_button"
            assert data["value"] == 1.0

    async def test_track_single_event_anonymous(
        self,
        client: AsyncClient, 
        db: AsyncSession,
        sample_event_data: Dict,
        test_settings: Settings
    ):
        """Test tracking single event without authentication (anonymous)."""
        with patch('app.api.v1.endpoints.events.get_redis') as mock_redis:
            mock_redis_client = AsyncMock()
            mock_redis.return_value = mock_redis_client

            response = await client.post(
                f"{test_settings.api_v1_str}/events/track",
                json=sample_event_data,
            )

            assert response.status_code == 201
            data = response.json()
            
            assert data["event_type"] == "interaction"
            assert data["event_name"] == "button_click"
            assert data["user_id"] is None  # Anonymous event
            assert "event_id" in data

    async def test_track_bulk_events(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user_token_headers: Dict,
        sample_events_bulk: Dict,
        test_settings: Settings
    ):
        """Test bulk event tracking."""
        with patch('app.api.v1.endpoints.events.get_redis') as mock_redis:
            mock_redis_client = AsyncMock()
            mock_redis.return_value = mock_redis_client

            response = await client.post(
                f"{test_settings.api_v1_str}/events/track/bulk",
                json=sample_events_bulk,
                headers=normal_user_token_headers,
            )

            assert response.status_code == 201
            data = response.json()
            
            assert len(data) == 3
            assert data[0]["event_type"] == "interaction"
            assert data[1]["event_type"] == "performance"
            assert data[2]["event_type"] == "business"
            
            # All events should have the same user_id
            user_ids = [event["user_id"] for event in data]
            assert len(set(user_ids)) == 1  # All same user_id

    async def test_track_bulk_events_limit(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user_token_headers: Dict,
        test_settings: Settings
    ):
        """Test bulk event tracking with limit exceeded."""
        # Create payload with 101 events (over the limit)
        large_bulk = {
            "events": [
                {
                    "event_type": "interaction",
                    "event_name": f"test_event_{i}",
                    "source": "web",
                }
                for i in range(101)
            ]
        }

        response = await client.post(
            f"{test_settings.api_v1_str}/events/track/bulk",
            json=large_bulk,
            headers=normal_user_token_headers,
        )

        assert response.status_code == 413  # Request Entity Too Large

    async def test_get_user_events(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user_token_headers: Dict,
        sample_event_data: Dict,
        test_settings: Settings
    ):
        """Test retrieving user events."""
        # First, create some events
        with patch('app.api.v1.endpoints.events.get_redis') as mock_redis:
            mock_redis_client = AsyncMock()
            mock_redis.return_value = mock_redis_client

            # Create multiple events
            for i in range(3):
                event_data = sample_event_data.copy()
                event_data["event_name"] = f"test_event_{i}"
                
                await client.post(
                    f"{test_settings.api_v1_str}/events/track",
                    json=event_data,
                    headers=normal_user_token_headers,
                )

        # Get current user ID from token
        from jose import jwt
        from app.core.config import get_settings
        settings = get_settings()
        
        # Extract token from headers
        token = normal_user_token_headers["Authorization"].replace("Bearer ", "")
        secret_value = settings.secret_key.get_secret_value()
        payload = jwt.decode(token, secret_value, algorithms=[settings.algorithm])
        user_id = int(payload["sub"])

        # Retrieve user events
        response = await client.get(
            f"{test_settings.api_v1_str}/events/user/{user_id}",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 200
        data = response.json()
        
        assert len(data) >= 3
        assert all(event["user_id"] == user_id for event in data)

    async def test_get_user_events_forbidden(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user_token_headers: Dict,
        test_settings: Settings
    ):
        """Test that users cannot access other users' events."""
        response = await client.get(
            f"{test_settings.api_v1_str}/events/user/99999",  # Different user ID
            headers=normal_user_token_headers,
        )

        assert response.status_code == 403

    async def test_get_event_by_id(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user_token_headers: Dict,
        sample_event_data: Dict,
        test_settings: Settings
    ):
        """Test retrieving specific event by ID."""
        # Create an event first
        with patch('app.api.v1.endpoints.events.get_redis') as mock_redis:
            mock_redis_client = AsyncMock()
            mock_redis.return_value = mock_redis_client

            create_response = await client.post(
                f"{test_settings.api_v1_str}/events/track",
                json=sample_event_data,
                headers=normal_user_token_headers,
            )
            
            created_event = create_response.json()
            event_id = created_event["event_id"]

        # Retrieve the event
        response = await client.get(
            f"{test_settings.api_v1_str}/events/{event_id}",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["event_id"] == event_id
        assert data["event_type"] == "interaction"

    async def test_get_event_not_found(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user_token_headers: Dict,
        test_settings: Settings
    ):
        """Test retrieving non-existent event."""
        response = await client.get(
            f"{test_settings.api_v1_str}/events/nonexistent-event-id",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 404

    async def test_get_event_counts(
        self,
        client: AsyncClient,
        db: AsyncSession,
        superuser_token_headers: Dict,
        test_settings: Settings
    ):
        """Test retrieving event counts by type."""
        response = await client.get(
            f"{test_settings.api_v1_str}/events/counts",
            headers=superuser_token_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)

    async def test_event_analytics_query(
        self,
        client: AsyncClient,
        db: AsyncSession,
        superuser_token_headers: Dict,
        test_settings: Settings
    ):
        """Test event analytics with query parameters."""
        with patch('app.api.v1.endpoints.events.get_redis') as mock_redis:
            mock_redis_client = AsyncMock()
            mock_redis_client.get.return_value = None  # No cached results
            mock_redis.return_value = mock_redis_client

            query_params = {
                "event_types": ["interaction"],
                "aggregate_functions": ["count"],
                "group_by": ["event_type"],
                "limit": 10,
            }

            response = await client.get(
                f"{test_settings.api_v1_str}/events/analytics",
                params=query_params,
                headers=superuser_token_headers,
            )

            assert response.status_code == 200
            data = response.json()
            
            assert "results" in data
            assert "total_count" in data
            assert "query_time_ms" in data
            assert isinstance(data["results"], list)


class TestEventValidation:
    """Test event validation and schema enforcement."""

    async def test_invalid_event_type(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ):
        """Test event creation with invalid event type."""
        invalid_event = {
            "event_type": "invalid_type",
            "event_name": "test_event",
        }

        response = await client.post(
            f"{test_settings.api_v1_str}/events/track",
            json=invalid_event,
        )

        assert response.status_code == 422  # Validation error

    async def test_event_name_normalization(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ):
        """Test event name normalization to snake_case."""
        with patch('app.api.v1.endpoints.events.get_redis') as mock_redis:
            mock_redis_client = AsyncMock()
            mock_redis.return_value = mock_redis_client

            event_data = {
                "event_type": "interaction",
                "event_name": "Button Click Event",  # Will be normalized
                "source": "web",
            }

            response = await client.post(
                f"{test_settings.api_v1_str}/events/track",
                json=event_data,
            )

            assert response.status_code == 201
            data = response.json()
            assert data["event_name"] == "button_click_event"

    async def test_properties_size_limit(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ):
        """Test event properties size validation."""
        large_properties = {
            "large_field": "x" * 15000  # Larger than 10KB limit
        }

        event_data = {
            "event_type": "interaction",
            "event_name": "test_event",
            "properties": large_properties,
        }

        response = await client.post(
            f"{test_settings.api_v1_str}/events/track",
            json=event_data,
        )

        assert response.status_code == 422  # Validation error

    async def test_pii_field_rejection(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_settings: Settings
    ):
        """Test rejection of PII fields in properties."""
        event_data = {
            "event_type": "interaction",
            "event_name": "test_event",
            "properties": {
                "password": "secret123",  # PII field
                "regular_field": "value"
            }
        }

        response = await client.post(
            f"{test_settings.api_v1_str}/events/track",
            json=event_data,
        )

        assert response.status_code == 422  # Validation error


class TestEventPrivacy:
    """Test privacy-related functionality."""

    async def test_export_user_events(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user_token_headers: Dict,
        sample_event_data: Dict,
        test_settings: Settings
    ):
        """Test GDPR-compliant event export for user."""
        # Create some events first
        with patch('app.api.v1.endpoints.events.get_redis') as mock_redis:
            mock_redis_client = AsyncMock()
            mock_redis.return_value = mock_redis_client

            await client.post(
                f"{test_settings.api_v1_str}/events/track",
                json=sample_event_data,
                headers=normal_user_token_headers,
            )

        # Get current user ID
        from jose import jwt
        from app.core.config import get_settings
        settings = get_settings()
        
        token = normal_user_token_headers["Authorization"].replace("Bearer ", "")
        secret_value = settings.secret_key.get_secret_value()
        payload = jwt.decode(token, secret_value, algorithms=[settings.algorithm])
        user_id = int(payload["sub"])

        # Export user events
        export_request = {
            "user_id": user_id,
            "format": "json"
        }

        response = await client.post(
            f"{test_settings.api_v1_str}/events/export",
            json=export_request,
            headers=normal_user_token_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert all(event["user_id"] == user_id for event in data if event["user_id"])

    async def test_anonymize_events_admin_only(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user_token_headers: Dict,
        test_settings: Settings
    ):
        """Test that event anonymization requires admin privileges."""
        anonymize_request = {
            "user_ids": [1],
            "dry_run": True
        }

        response = await client.post(
            f"{test_settings.api_v1_str}/events/anonymize",
            json=anonymize_request,
            headers=normal_user_token_headers,
        )

        assert response.status_code == 403  # Forbidden

    async def test_cleanup_expired_events_admin_only(
        self,
        client: AsyncClient,
        db: AsyncSession,
        normal_user_token_headers: Dict,
        test_settings: Settings
    ):
        """Test that cleanup requires admin privileges."""
        response = await client.delete(
            f"{test_settings.api_v1_str}/events/cleanup",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 403  # Forbidden


class TestEventCRUD:
    """Test CRUD operations directly."""

    async def test_create_event_with_retention_policy(self, db: AsyncSession):
        """Test event creation with automatic retention date setting."""
        event_create = EventCreate(
            event_type=EventType.INTERACTION,
            event_name="test_event",
            source=EventSource.WEB,
        )

        event = await crud.event.create(db, obj_in=event_create, user_id=1)

        assert event.event_type == EventType.INTERACTION
        assert event.event_name == "test_event"
        assert event.user_id == 1
        assert event.retention_date is not None  # Should be set automatically
        assert event.retention_date > datetime.utcnow()

    async def test_bulk_event_creation(self, db: AsyncSession):
        """Test bulk event creation performance."""
        from app.schemas.event import EventCreateBulk
        
        events = [
            EventCreate(
                event_type=EventType.INTERACTION,
                event_name=f"test_event_{i}",
                source=EventSource.WEB,
            )
            for i in range(10)
        ]
        
        bulk_create = EventCreateBulk(events=events)
        
        created_events = await crud.event.create_bulk(
            db, obj_in=bulk_create, user_id=1
        )

        assert len(created_events) == 10
        assert all(event.user_id == 1 for event in created_events)
        assert all(event.event_id is not None for event in created_events)

    async def test_analytics_query_execution(self, db: AsyncSession):
        """Test analytics query with grouping and aggregation."""
        # Create test events
        for i in range(5):
            event_create = EventCreate(
                event_type=EventType.PERFORMANCE,
                event_name="api_response_time",
                source=EventSource.API,
                value=float(100 + i * 10),
            )
            await crud.event.create(db, obj_in=event_create)

        # Execute analytics query
        query = EventAnalyticsQuery(
            event_types=[EventType.PERFORMANCE],
            group_by=["event_type"],
            aggregate_functions=["count", "avg"],
        )

        results = await crud.event.analytics_query(db, query_params=query)

        assert len(results) > 0
        assert "count" in results[0]

    async def test_event_anonymization(self, db: AsyncSession):
        """Test event anonymization functionality."""
        # Create event with user data
        event_create = EventCreate(
            event_type=EventType.INTERACTION,
            event_name="test_event",
            source=EventSource.WEB,
            properties={"user_action": "click", "element_id": "button1"}
        )

        event = await crud.event.create(
            db, obj_in=event_create, user_id=1, ip_address="192.168.1.1"
        )

        # Test anonymization
        request = EventAnonymizationRequest(
            user_ids=[1],
            dry_run=False
        )

        anonymized_count = await crud.event.anonymize_user_events(db, request=request)

        assert anonymized_count == 1

        # Verify event was anonymized
        anonymized_event = await crud.event.get(db, id=event.id)
        assert anonymized_event.user_id is None
        assert anonymized_event.ip_address is None
        assert anonymized_event.anonymized is True

    async def test_retention_cleanup(self, db: AsyncSession):
        """Test automatic cleanup of expired events."""
        # Create event with past retention date
        event_create = EventCreate(
            event_type=EventType.INTERACTION,
            event_name="expired_event",
            source=EventSource.WEB,
        )

        event = await crud.event.create(db, obj_in=event_create)
        
        # Manually set retention date to past
        past_date = datetime.utcnow() - timedelta(days=1)
        await crud.event.update(
            db, db_obj=event, obj_in={"retention_date": past_date}
        )

        # Run cleanup
        deleted_count = await crud.event.delete_expired_events(db, batch_size=10)

        assert deleted_count == 1

        # Verify event was deleted
        deleted_event = await crud.event.get(db, id=event.id)
        assert deleted_event is None