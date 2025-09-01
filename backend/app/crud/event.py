"""CRUD operations for event tracking with analytics and privacy controls."""
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
from uuid import uuid4

from app.crud.base import CRUDBase
from app.models.event import Event
from app.schemas.event import (
    EventAnalyticsQuery,
    EventAnonymizationRequest,
    EventCreate,
    EventCreateBulk,
    EventRetentionPolicy,
    EventSource,
    EventType,
)
from sqlalchemy import and_, desc, func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select


class CRUDEvent(CRUDBase[Event, EventCreate, Dict[str, Any]]):
    """CRUD operations for Event model with advanced analytics and privacy features."""

    async def create(
        self,
        db: AsyncSession,
        *,
        obj_in: EventCreate,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
    ) -> Event:
        """Create a new event with automatic ID generation and privacy controls."""
        event_data = obj_in.model_dump(exclude_unset=True)

        # Generate unique event ID if not provided
        event_data["event_id"] = str(uuid4())

        # Set user ID (can be None for anonymous events)
        if user_id is not None:
            event_data["user_id"] = user_id

        # Set IP address if provided (with privacy consideration)
        if ip_address:
            event_data["ip_address"] = ip_address

        # Set timestamp if not provided
        if "timestamp" not in event_data or event_data["timestamp"] is None:
            event_data["timestamp"] = datetime.utcnow()

        # Set retention date based on event type (default policies)
        retention_days = self._get_retention_days(obj_in.event_type)
        if retention_days:
            event_data["retention_date"] = event_data["timestamp"] + timedelta(
                days=retention_days
            )

        db_obj = Event(**event_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def create_bulk(
        self,
        db: AsyncSession,
        *,
        obj_in: EventCreateBulk,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
    ) -> List[Event]:
        """Create multiple events efficiently with batch processing."""
        events = []
        current_time = datetime.utcnow()

        for event_create in obj_in.events:
            event_data = event_create.model_dump(exclude_unset=True)

            # Generate unique event ID
            event_data["event_id"] = str(uuid4())

            # Set user ID for all events
            if user_id is not None:
                event_data["user_id"] = user_id

            # Set IP address if provided
            if ip_address:
                event_data["ip_address"] = ip_address

            # Set timestamp
            if "timestamp" not in event_data or event_data["timestamp"] is None:
                event_data["timestamp"] = current_time

            # Set retention date
            retention_days = self._get_retention_days(event_create.event_type)
            if retention_days:
                event_data["retention_date"] = event_data["timestamp"] + timedelta(
                    days=retention_days
                )

            db_obj = Event(**event_data)
            events.append(db_obj)

        # Bulk insert for performance
        db.add_all(events)
        await db.commit()

        # Refresh objects to get auto-generated fields
        for event in events:
            await db.refresh(event)

        return events

    async def get_by_event_id(
        self, db: AsyncSession, *, event_id: str
    ) -> Optional[Event]:
        """Get event by unique event_id."""
        result = await db.execute(select(Event).where(Event.event_id == event_id))
        return result.scalar_one_or_none()

    async def get_user_events(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        event_types: Optional[List[EventType]] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Event]:
        """Get events for a specific user with filtering."""
        query = select(Event).where(Event.user_id == user_id)

        # Apply filters
        if event_types:
            query = query.where(Event.event_type.in_(event_types))

        if start_date:
            query = query.where(Event.timestamp >= start_date)

        if end_date:
            query = query.where(Event.timestamp <= end_date)

        # Order by timestamp descending and paginate
        query = query.order_by(desc(Event.timestamp)).offset(skip).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_events_by_session(
        self,
        db: AsyncSession,
        *,
        session_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Event]:
        """Get all events for a specific session."""
        query = (
            select(Event)
            .where(Event.session_id == session_id)
            .order_by(Event.timestamp)
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(query)
        return list(result.scalars().all())

    async def analytics_query(
        self,
        db: AsyncSession,
        *,
        query_params: EventAnalyticsQuery,
    ) -> List[Dict[str, Any]]:
        """Execute analytics queries with aggregation and grouping."""
        # Build base query
        base_query = select(Event)

        # Apply filters
        filters = []

        if query_params.event_types:
            filters.append(Event.event_type.in_(query_params.event_types))

        if query_params.event_names:
            filters.append(Event.event_name.in_(query_params.event_names))

        if query_params.user_ids:
            filters.append(Event.user_id.in_(query_params.user_ids))

        if query_params.sources:
            filters.append(Event.source.in_(query_params.sources))

        if query_params.start_date:
            filters.append(Event.timestamp >= query_params.start_date)

        if query_params.end_date:
            filters.append(Event.timestamp <= query_params.end_date)

        if filters:
            base_query = base_query.where(and_(*filters))

        # Build aggregation query
        group_by_fields = []
        select_fields = []

        if query_params.group_by:
            for field in query_params.group_by:
                if hasattr(Event, field):
                    column = getattr(Event, field)
                    group_by_fields.append(column)
                    select_fields.append(column)

        # Add aggregate functions
        for func_name in query_params.aggregate_functions:
            if func_name == "count":
                select_fields.append(func.count(Event.id).label("count"))
            elif func_name == "sum" and hasattr(Event, "value"):
                select_fields.append(func.sum(Event.value).label("sum_value"))
            elif func_name == "avg" and hasattr(Event, "value"):
                select_fields.append(func.avg(Event.value).label("avg_value"))
            elif func_name == "min" and hasattr(Event, "value"):
                select_fields.append(func.min(Event.value).label("min_value"))
            elif func_name == "max" and hasattr(Event, "value"):
                select_fields.append(func.max(Event.value).label("max_value"))

        # Build final query
        analytics_query = select(*select_fields).select_from(Event)

        # Apply same filters
        if filters:
            analytics_query = analytics_query.where(and_(*filters))

        # Apply grouping
        if group_by_fields:
            analytics_query = analytics_query.group_by(*group_by_fields)

        # Apply pagination
        analytics_query = analytics_query.offset(query_params.offset).limit(
            query_params.limit
        )

        # Execute query
        result = await db.execute(analytics_query)

        # Convert to dict format
        results = []
        for row in result.all():
            row_dict = dict(row._mapping)
            results.append(row_dict)

        return results

    async def get_event_counts_by_type(
        self,
        db: AsyncSession,
        *,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        user_id: Optional[int] = None,
    ) -> Dict[str, int]:
        """Get event counts grouped by event type."""
        query = select(Event.event_type, func.count(Event.id).label("count"))

        filters = []
        if start_date:
            filters.append(Event.timestamp >= start_date)
        if end_date:
            filters.append(Event.timestamp <= end_date)
        if user_id:
            filters.append(Event.user_id == user_id)

        if filters:
            query = query.where(and_(*filters))

        query = query.group_by(Event.event_type)

        result = await db.execute(query)
        return {row.event_type: row.count for row in result.all()}

    async def get_recent_events(
        self,
        db: AsyncSession,
        *,
        minutes: int = 60,
        event_types: Optional[List[EventType]] = None,
        limit: int = 100,
    ) -> List[Event]:
        """Get recent events within specified timeframe."""
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)

        query = select(Event).where(Event.timestamp >= cutoff_time)

        if event_types:
            query = query.where(Event.event_type.in_(event_types))

        query = query.order_by(desc(Event.timestamp)).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    # Privacy and data management methods

    async def anonymize_user_events(
        self,
        db: AsyncSession,
        *,
        request: EventAnonymizationRequest,
    ) -> int:
        """Anonymize events based on criteria (GDPR compliance)."""
        filters = []

        if request.user_ids:
            filters.append(Event.user_id.in_(request.user_ids))

        if request.event_types:
            filters.append(Event.event_type.in_(request.event_types))

        if request.before_date:
            filters.append(Event.timestamp <= request.before_date)

        # Only process non-anonymized events
        filters.append(Event.anonymized == False)

        if request.dry_run:
            # Count events that would be anonymized
            count_query = select(func.count(Event.id)).where(and_(*filters))
            result = await db.execute(count_query)
            return result.scalar() or 0
        else:
            # Actually anonymize events
            update_query = (
                update(Event)
                .where(and_(*filters))
                .values(
                    user_id=None,
                    ip_address=None,
                    user_agent=None,
                    session_id=None,
                    anonymized=True,
                    # Clear PII from properties - done in application layer
                )
            )
            result = await db.execute(update_query)
            await db.commit()
            return result.rowcount

    async def delete_expired_events(
        self,
        db: AsyncSession,
        *,
        batch_size: int = 1000,
    ) -> int:
        """Delete events past their retention date."""
        current_time = datetime.utcnow()

        # Find expired events
        expired_query = (
            select(Event.id)
            .where(
                and_(
                    Event.retention_date.isnot(None),
                    Event.retention_date <= current_time,
                )
            )
            .limit(batch_size)
        )

        result = await db.execute(expired_query)
        expired_ids = [row.id for row in result.all()]

        if not expired_ids:
            return 0

        # Delete expired events
        delete_query = select(Event).where(Event.id.in_(expired_ids))
        events_to_delete = await db.execute(delete_query)

        for event in events_to_delete.scalars().all():
            await db.delete(event)

        await db.commit()
        return len(expired_ids)

    async def export_user_events(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        event_types: Optional[List[EventType]] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        include_anonymized: bool = False,
    ) -> List[Event]:
        """Export user events for GDPR compliance."""
        query = select(Event).where(Event.user_id == user_id)

        if not include_anonymized:
            query = query.where(Event.anonymized == False)

        if event_types:
            query = query.where(Event.event_type.in_(event_types))

        if start_date:
            query = query.where(Event.timestamp >= start_date)

        if end_date:
            query = query.where(Event.timestamp <= end_date)

        query = query.order_by(Event.timestamp)

        result = await db.execute(query)
        return list(result.scalars().all())

    def _get_retention_days(self, event_type: EventType) -> Optional[int]:
        """Get retention days for event type based on default policies."""
        # Default retention policies by event type
        retention_policies = {
            EventType.INTERACTION: 365,  # 1 year for UX analytics
            EventType.PERFORMANCE: 90,  # 3 months for performance monitoring
            EventType.BUSINESS: 2555,  # 7 years for business events
            EventType.ERROR: 180,  # 6 months for error tracking
            EventType.CUSTOM: 365,  # 1 year default for custom events
        }
        return retention_policies.get(event_type)


# Create instance
event = CRUDEvent(Event)
