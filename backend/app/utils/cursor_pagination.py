"""Cursor-based pagination utilities for scalable API performance.

This module implements efficient cursor-based pagination to replace offset-based
pagination for better performance at scale. Supports HMAC-signed cursors to
prevent tampering and maintain API security.

Key Features:
- Base64-encoded JSON cursors with HMAC signatures
- Multiple sort fields support (created_at, updated_at, priority, status)
- Forward and backward pagination
- Filter preservation across pages
- Backward compatibility with offset pagination
- Performance optimized for large datasets

Usage:
    cursor_manager = CursorPaginationManager(secret_key="your-secret")
    cursor = cursor_manager.encode_cursor(
        sort_by="created_at",
        sort_direction="desc",
        last_value="2025-08-14T10:30:00Z",
        last_id=12345
    )
    decoded = cursor_manager.decode_cursor(cursor)
"""

import base64
import hashlib
import hmac
import json
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field, validator
from sqlalchemy import and_, asc, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.sql import Select

from app.core.config import get_settings


class SortDirection(str):
    """Valid sort directions for cursor pagination."""

    ASC = "asc"
    DESC = "desc"


class CursorData(BaseModel):
    """Data structure for cursor pagination information."""

    sort_by: str = Field(default="created_at", description="Field to sort by")
    sort_direction: str = Field(default="desc", description="Sort direction (asc/desc)")
    last_value: Optional[Union[str, int, float]] = Field(
        None, description="Last value from previous page"
    )
    last_id: Optional[int] = Field(
        None, description="Last ID from previous page for tie-breaking"
    )
    filters: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Active filters"
    )

    @validator("sort_direction")
    def validate_sort_direction(cls, v):
        if v not in [SortDirection.ASC, SortDirection.DESC]:
            raise ValueError("sort_direction must be 'asc' or 'desc'")
        return v


class PaginationInfo(BaseModel):
    """Enhanced pagination information with cursor support."""

    has_next: bool = Field(
        description="Whether there are more items after current page"
    )
    has_previous: bool = Field(
        description="Whether there are items before current page"
    )
    next_cursor: Optional[str] = Field(None, description="Cursor for next page")
    previous_cursor: Optional[str] = Field(None, description="Cursor for previous page")
    total_count: Optional[int] = Field(
        None, description="Total count (expensive for large datasets)"
    )
    current_sort: str = Field(description="Current sort field")
    current_direction: str = Field(description="Current sort direction")

    # Backward compatibility fields
    total: Optional[int] = Field(
        None, description="Backward compatibility: total count"
    )
    page: Optional[int] = Field(
        None, description="Backward compatibility: current page"
    )
    per_page: Optional[int] = Field(
        None, description="Backward compatibility: items per page"
    )


class CursorPaginatedResponse(BaseModel):
    """Enhanced paginated response with cursor support."""

    data: List[Any] = Field(description="Page data items")
    pagination: PaginationInfo = Field(description="Pagination metadata")


class CursorPaginationManager:
    """Manages cursor-based pagination with security and performance optimization."""

    def __init__(self, secret_key: Optional[str] = None):
        """Initialize with secret key for cursor signing."""
        self.secret_key = secret_key or get_settings().secret_key
        self.algorithm = hashlib.sha256

    def encode_cursor(
        self,
        sort_by: str = "created_at",
        sort_direction: str = "desc",
        last_value: Optional[Union[str, int, float, datetime]] = None,
        last_id: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Encode cursor data with HMAC signature for tamper prevention.

        Args:
            sort_by: Field to sort by
            sort_direction: Sort direction (asc/desc)
            last_value: Last value from previous page
            last_id: Last ID for tie-breaking
            filters: Active filters to preserve

        Returns:
            Base64-encoded signed cursor string
        """
        # Convert datetime to ISO string for JSON serialization
        if isinstance(last_value, datetime):
            last_value = last_value.isoformat()

        cursor_data = CursorData(
            sort_by=sort_by,
            sort_direction=sort_direction,
            last_value=last_value,
            last_id=last_id,
            filters=filters or {},
        )

        # Serialize to JSON
        json_data = cursor_data.model_dump()
        json_str = json.dumps(json_data, sort_keys=True, separators=(",", ":"))

        # Create HMAC signature
        secret_bytes = (
            self.secret_key.get_secret_value().encode()
            if hasattr(self.secret_key, "get_secret_value")
            else str(self.secret_key).encode()
        )
        signature = hmac.new(
            secret_bytes, json_str.encode(), self.algorithm
        ).hexdigest()

        # Combine data and signature
        signed_data = {"data": json_data, "signature": signature}
        signed_json = json.dumps(signed_data, separators=(",", ":"))

        # Base64 encode
        return base64.urlsafe_b64encode(signed_json.encode()).decode()

    def decode_cursor(self, cursor: str) -> CursorData:
        """Decode and verify cursor data.

        Args:
            cursor: Base64-encoded signed cursor string

        Returns:
            Validated cursor data

        Raises:
            ValueError: If cursor is invalid or tampered with
        """
        try:
            # Base64 decode
            signed_json = base64.urlsafe_b64decode(cursor.encode()).decode()
            signed_data = json.loads(signed_json)

            # Extract data and signature
            data = signed_data["data"]
            received_signature = signed_data["signature"]

            # Verify signature
            json_str = json.dumps(data, sort_keys=True, separators=(",", ":"))
            secret_bytes = (
                self.secret_key.get_secret_value().encode()
                if hasattr(self.secret_key, "get_secret_value")
                else str(self.secret_key).encode()
            )
            expected_signature = hmac.new(
                secret_bytes, json_str.encode(), self.algorithm
            ).hexdigest()

            if not hmac.compare_digest(received_signature, expected_signature):
                raise ValueError("Cursor signature verification failed")

            return CursorData(**data)

        except (json.JSONDecodeError, KeyError, ValueError) as e:
            raise ValueError(f"Invalid cursor format: {e}")

    def build_cursor_query(
        self,
        base_query: Select,
        model: DeclarativeBase,
        cursor_data: Optional[CursorData] = None,
        limit: int = 20,
        reverse: bool = False,
    ) -> Select:
        """Build optimized cursor-based query.

        Args:
            base_query: Base SQLAlchemy query
            model: SQLAlchemy model class
            cursor_data: Decoded cursor data for pagination
            limit: Number of items to fetch
            reverse: Whether to reverse pagination direction

        Returns:
            Optimized query with cursor-based WHERE clauses
        """
        query = base_query

        if cursor_data and cursor_data.last_value is not None:
            sort_field = getattr(model, cursor_data.sort_by)

            # Determine comparison operator based on direction and reverse flag
            if cursor_data.sort_direction == SortDirection.DESC:
                if reverse:
                    # Going backward in DESC order means > (newer items)
                    comparison_op = lambda field, value: field > value
                    tie_breaker_op = lambda field, value: field > value
                else:
                    # Going forward in DESC order means < (older items)
                    comparison_op = lambda field, value: field < value
                    tie_breaker_op = lambda field, value: field < value
            else:  # ASC
                if reverse:
                    # Going backward in ASC order means < (smaller items)
                    comparison_op = lambda field, value: field < value
                    tie_breaker_op = lambda field, value: field < value
                else:
                    # Going forward in ASC order means > (larger items)
                    comparison_op = lambda field, value: field > value
                    tie_breaker_op = lambda field, value: field > value

            # Handle datetime fields
            last_value = cursor_data.last_value
            if cursor_data.sort_by in ["created_at", "updated_at"] and isinstance(
                last_value, str
            ):
                last_value = datetime.fromisoformat(last_value)

            # Primary condition: compare by sort field
            primary_condition = comparison_op(sort_field, last_value)

            # Tie-breaker condition: if sort values are equal, compare by ID
            if cursor_data.last_id is not None:
                tie_breaker_condition = and_(
                    sort_field == last_value,
                    tie_breaker_op(model.id, cursor_data.last_id),
                )
                cursor_condition = or_(primary_condition, tie_breaker_condition)
            else:
                cursor_condition = primary_condition

            query = query.where(cursor_condition)

        # Apply sorting
        if cursor_data:
            sort_field = getattr(model, cursor_data.sort_by)
            if cursor_data.sort_direction == SortDirection.DESC:
                if reverse:
                    query = query.order_by(asc(sort_field), asc(model.id))
                else:
                    query = query.order_by(desc(sort_field), desc(model.id))
            else:
                if reverse:
                    query = query.order_by(desc(sort_field), desc(model.id))
                else:
                    query = query.order_by(asc(sort_field), asc(model.id))
        else:
            # Default sorting: newest first
            query = query.order_by(desc(model.created_at), desc(model.id))

        # Apply limit (fetch one extra to check if there are more pages)
        query = query.limit(limit + 1)

        return query

    def apply_filters(
        self, query: Select, model: DeclarativeBase, filters: Dict[str, Any]
    ) -> Select:
        """Apply filters to query based on model fields.

        Args:
            query: SQLAlchemy query
            model: SQLAlchemy model class
            filters: Filter dictionary

        Returns:
            Query with applied filters
        """
        for field_name, value in filters.items():
            if hasattr(model, field_name) and value is not None:
                field = getattr(model, field_name)

                # Handle different filter types
                if isinstance(value, list):
                    query = query.where(field.in_(value))
                elif isinstance(value, dict):
                    # Range filters like {"gte": 10, "lte": 100}
                    if "gte" in value:
                        query = query.where(field >= value["gte"])
                    if "lte" in value:
                        query = query.where(field <= value["lte"])
                    if "gt" in value:
                        query = query.where(field > value["gt"])
                    if "lt" in value:
                        query = query.where(field < value["lt"])
                elif isinstance(value, str) and field_name.endswith("_like"):
                    # Text search with LIKE
                    actual_field_name = field_name.replace("_like", "")
                    if hasattr(model, actual_field_name):
                        actual_field = getattr(model, actual_field_name)
                        query = query.where(actual_field.like(f"%{value}%"))
                else:
                    # Exact match
                    query = query.where(field == value)

        return query

    async def paginate(
        self,
        db: AsyncSession,
        base_query: Select,
        model: DeclarativeBase,
        cursor: Optional[str] = None,
        limit: int = 20,
        reverse: bool = False,
        include_total: bool = False,
        filters: Optional[Dict[str, Any]] = None,
        sort_by: str = "created_at",
        sort_direction: str = "desc",
    ) -> CursorPaginatedResponse:
        """Execute cursor-based pagination query.

        Args:
            db: Database session
            base_query: Base query to paginate
            model: SQLAlchemy model class
            cursor: Pagination cursor
            limit: Items per page (max 100)
            reverse: Reverse pagination direction
            include_total: Whether to include expensive total count
            filters: Additional filters to apply
            sort_by: Default sort field
            sort_direction: Default sort direction

        Returns:
            Paginated response with cursor metadata
        """
        # Validate and limit page size
        limit = min(max(1, limit), 100)

        # Decode cursor or create default
        if cursor:
            cursor_data = self.decode_cursor(cursor)
        else:
            cursor_data = CursorData(
                sort_by=sort_by, sort_direction=sort_direction, filters=filters or {}
            )

        # Apply filters
        if cursor_data.filters or filters:
            combined_filters = {**(cursor_data.filters or {}), **(filters or {})}
            base_query = self.apply_filters(base_query, model, combined_filters)

        # Build cursor query
        query = self.build_cursor_query(base_query, model, cursor_data, limit, reverse)

        # Execute query
        result = await db.execute(query)
        items = list(result.scalars().all())

        # Check if there are more pages
        has_more = len(items) > limit
        if has_more:
            items = items[:limit]  # Remove the extra item

        # If reversed, we need to reverse the results back
        if reverse:
            items = list(reversed(items))
            has_next = (
                cursor is not None
            )  # If we reversed from a cursor, there's a next page
            has_previous = has_more
        else:
            has_next = has_more
            has_previous = cursor is not None

        # Generate cursors for next/previous pages
        next_cursor = None
        previous_cursor = None

        if items:
            last_item = items[-1]
            first_item = items[0]

            # Next cursor (for forward pagination)
            if has_next:
                next_cursor = self.encode_cursor(
                    sort_by=cursor_data.sort_by,
                    sort_direction=cursor_data.sort_direction,
                    last_value=getattr(last_item, cursor_data.sort_by),
                    last_id=last_item.id,
                    filters=cursor_data.filters,
                )

            # Previous cursor (for backward pagination)
            if has_previous:
                previous_cursor = self.encode_cursor(
                    sort_by=cursor_data.sort_by,
                    sort_direction=cursor_data.sort_direction,
                    last_value=getattr(first_item, cursor_data.sort_by),
                    last_id=first_item.id,
                    filters=cursor_data.filters,
                )

        # Optional total count (expensive for large datasets)
        total_count = None
        if include_total:
            count_query = select(func.count()).select_from(base_query.subquery())
            if cursor_data.filters or filters:
                # Re-apply filters to count query
                combined_filters = {**(cursor_data.filters or {}), **(filters or {})}
                count_base_query = select(model)
                count_base_query = self.apply_filters(
                    count_base_query, model, combined_filters
                )
                count_query = select(func.count()).select_from(
                    count_base_query.subquery()
                )

            count_result = await db.execute(count_query)
            total_count = count_result.scalar()

        # Build pagination info
        pagination = PaginationInfo(
            has_next=has_next,
            has_previous=has_previous,
            next_cursor=next_cursor,
            previous_cursor=previous_cursor,
            total_count=total_count,
            current_sort=cursor_data.sort_by,
            current_direction=cursor_data.sort_direction,
            # Backward compatibility
            total=total_count,
        )

        return CursorPaginatedResponse(data=items, pagination=pagination)


# Global cursor manager instance
cursor_manager = CursorPaginationManager()


def get_cursor_manager() -> CursorPaginationManager:
    """Dependency injection for cursor pagination manager."""
    return cursor_manager
