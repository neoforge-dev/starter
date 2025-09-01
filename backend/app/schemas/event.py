"""Event tracking schemas for validation and API requests/responses."""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, validator


class EventType(str, Enum):
    """Event type enumeration for classification."""

    INTERACTION = (
        "interaction"  # User interactions (clicks, navigation, form submissions)
    )
    PERFORMANCE = "performance"  # Performance metrics (load times, API response times)
    BUSINESS = "business"  # Business events (conversions, feature usage)
    ERROR = "error"  # Error events (exceptions, failures)
    CUSTOM = "custom"  # Custom application-specific events


class EventSource(str, Enum):
    """Event source enumeration."""

    WEB = "web"  # Web browser events
    MOBILE = "mobile"  # Mobile application events
    API = "api"  # API/backend generated events
    SYSTEM = "system"  # System/infrastructure events


# Shared properties
class EventBase(BaseModel):
    """Base Event schema."""

    event_type: EventType = Field(..., description="Event category")
    event_name: str = Field(..., max_length=100, description="Specific event name")
    source: EventSource = Field(default=EventSource.WEB, description="Event source")

    # Optional context
    page_url: Optional[str] = Field(
        None, max_length=500, description="Page URL where event occurred"
    )
    user_agent: Optional[str] = Field(
        None, max_length=500, description="User agent string"
    )
    ip_address: Optional[str] = Field(
        None, max_length=45, description="Client IP address"
    )
    session_id: Optional[str] = Field(
        None, max_length=64, description="Session identifier"
    )

    # Event data
    properties: Optional[Dict[str, Any]] = Field(
        None, description="Event-specific properties"
    )
    value: Optional[float] = Field(None, description="Numeric value for metrics")

    @validator("event_name")
    def validate_event_name(cls, v):
        """Validate event name format."""
        if not v or not v.strip():
            raise ValueError("Event name cannot be empty")
        # Normalize to snake_case for consistency
        normalized = v.lower().replace(" ", "_").replace("-", "_")
        return normalized

    @validator("properties")
    def validate_properties(cls, v):
        """Validate properties for privacy and size constraints."""
        if v is None:
            return v

        # Size constraint (prevent large payloads)
        if len(str(v)) > 10000:  # ~10KB limit
            raise ValueError("Properties payload too large (max 10KB)")

        # Privacy check - prevent common PII fields
        pii_fields = {"password", "ssn", "credit_card", "social_security", "tax_id"}
        if isinstance(v, dict):
            for key in v.keys():
                if key.lower() in pii_fields:
                    raise ValueError(f"PII field '{key}' not allowed in properties")

        return v


# Properties to receive via API on creation
class EventCreate(EventBase):
    """Event creation schema for API requests."""

    # Required fields for tracking
    event_type: EventType = Field(..., description="Event category")
    event_name: str = Field(..., max_length=100, description="Specific event name")

    # Optional user association (can be null for anonymous events)
    user_id: Optional[int] = Field(None, description="User ID (optional for privacy)")

    # Timestamp can be provided or will default to current time
    timestamp: Optional[datetime] = Field(
        None, description="Event timestamp (defaults to now)"
    )


# Bulk event creation for high-throughput scenarios
class EventCreateBulk(BaseModel):
    """Bulk event creation schema."""

    events: List[EventCreate] = Field(
        ..., min_items=1, max_items=100, description="Events to create"
    )

    @validator("events")
    def validate_event_list(cls, v):
        """Validate event list constraints."""
        if len(v) > 100:
            raise ValueError("Maximum 100 events per bulk request")
        return v


# Properties shared by models stored in DB
class EventInDBBase(EventBase):
    """Base Event DB schema."""

    id: Optional[int] = None
    event_id: str = Field(..., description="Unique event identifier")
    user_id: Optional[int] = None
    timestamp: datetime = Field(..., description="Event occurrence timestamp")
    anonymized: bool = Field(default=False, description="Anonymization flag")
    retention_date: Optional[datetime] = Field(None, description="Data retention date")
    created_at: datetime
    updated_at: datetime

    class Config:
        """Schema configuration."""

        from_attributes = True


# Additional properties to return via API
class EventResponse(EventInDBBase):
    """Event response schema for API responses."""

    pass


# Analytics and aggregation schemas
class EventAnalyticsQuery(BaseModel):
    """Event analytics query parameters."""

    event_types: Optional[List[EventType]] = Field(
        None, description="Filter by event types"
    )
    event_names: Optional[List[str]] = Field(None, description="Filter by event names")
    user_ids: Optional[List[int]] = Field(None, description="Filter by user IDs")
    sources: Optional[List[EventSource]] = Field(None, description="Filter by sources")

    # Time range filters
    start_date: Optional[datetime] = Field(
        None, description="Start date for query range"
    )
    end_date: Optional[datetime] = Field(None, description="End date for query range")

    # Aggregation options
    group_by: Optional[List[str]] = Field(None, description="Group by fields")
    aggregate_functions: Optional[List[str]] = Field(
        ["count"], description="Aggregate functions"
    )

    # Pagination
    limit: int = Field(default=100, le=1000, description="Result limit")
    offset: int = Field(default=0, ge=0, description="Result offset")

    @validator("aggregate_functions")
    def validate_aggregate_functions(cls, v):
        """Validate aggregate functions."""
        allowed_functions = {"count", "sum", "avg", "min", "max"}
        for func in v:
            if func not in allowed_functions:
                raise ValueError(f"Aggregate function '{func}' not allowed")
        return v


class EventAggregateResult(BaseModel):
    """Event analytics aggregate result."""

    dimensions: Dict[str, Any] = Field(..., description="Grouping dimensions")
    metrics: Dict[str, Any] = Field(..., description="Aggregate metrics")
    count: int = Field(..., description="Event count")
    timestamp_range: Dict[str, Optional[datetime]] = Field(
        ..., description="Time range"
    )


class EventAnalyticsResponse(BaseModel):
    """Event analytics response schema."""

    results: List[EventAggregateResult] = Field(..., description="Analytics results")
    total_count: int = Field(..., description="Total events matching query")
    query_time_ms: float = Field(..., description="Query execution time")
    cached: bool = Field(default=False, description="Result from cache")


# Real-time event processing schemas
class EventProcessingStatus(BaseModel):
    """Event processing status for real-time updates."""

    event_id: str = Field(..., description="Event identifier")
    status: str = Field(..., description="Processing status")
    processed_at: Optional[datetime] = Field(None, description="Processing timestamp")
    error_message: Optional[str] = Field(None, description="Error message if failed")


class EventStreamConfig(BaseModel):
    """Configuration for real-time event streaming."""

    event_types: Optional[List[EventType]] = Field(
        None, description="Event types to stream"
    )
    user_ids: Optional[List[int]] = Field(None, description="User IDs to stream")
    buffer_size: int = Field(default=100, le=1000, description="Stream buffer size")
    batch_timeout_ms: int = Field(default=1000, le=10000, description="Batch timeout")


# Privacy and data management schemas
class EventAnonymizationRequest(BaseModel):
    """Request schema for event anonymization."""

    user_ids: Optional[List[int]] = Field(None, description="User IDs to anonymize")
    event_types: Optional[List[EventType]] = Field(
        None, description="Event types to anonymize"
    )
    before_date: Optional[datetime] = Field(
        None, description="Anonymize events before date"
    )
    dry_run: bool = Field(default=True, description="Dry run without actual changes")


class EventRetentionPolicy(BaseModel):
    """Event data retention policy configuration."""

    event_type: EventType = Field(..., description="Event type")
    retention_days: int = Field(
        ..., gt=0, le=2555, description="Retention period in days"
    )  # Max ~7 years
    auto_anonymize: bool = Field(
        default=False, description="Auto-anonymize before deletion"
    )
    anonymize_after_days: Optional[int] = Field(
        None, description="Days after which to anonymize"
    )


class EventDataExportRequest(BaseModel):
    """Request schema for event data export (GDPR compliance)."""

    user_id: int = Field(..., description="User ID for data export")
    event_types: Optional[List[EventType]] = Field(
        None, description="Event types to export"
    )
    start_date: Optional[datetime] = Field(None, description="Export start date")
    end_date: Optional[datetime] = Field(None, description="Export end date")
    format: str = Field(default="json", description="Export format")
    include_anonymized: bool = Field(
        default=False, description="Include anonymized events"
    )
