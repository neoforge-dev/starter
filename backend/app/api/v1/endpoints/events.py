"""Event tracking endpoints for analytics and UX optimization."""
import time
from datetime import datetime, timedelta
from typing import Annotated, Any, Dict, List, Optional

from app.schemas.event import (
    EventAggregateResult,
    EventAnalyticsQuery,
    EventAnalyticsResponse,
    EventAnonymizationRequest,
    EventCreate,
    EventCreateBulk,
    EventDataExportRequest,
    EventResponse,
    EventSource,
    EventType,
)
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud, models
from app.api import deps
from app.core.config import Settings, get_settings
from app.core.redis import get_redis

router = APIRouter()

# Optional authentication for anonymous event tracking
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)


async def get_current_user_optional(
    token: str = Depends(oauth2_scheme_optional),
    db: AsyncSession = Depends(deps.get_db),
    settings: Settings = Depends(get_settings),
) -> Optional[models.User]:
    """Get current user from token, but allow None for anonymous events."""
    if not token:
        return None

    try:
        # Decode JWT token
        secret_value = settings.secret_key.get_secret_value()
        payload = jwt.decode(token, secret_value, algorithms=[settings.algorithm])

        user_id = payload.get("sub")
        if not user_id:
            return None

        user = await crud.user.get(db, id=int(user_id))
        if not user or not user.is_active:
            return None

        return user
    except (JWTError, ValueError, Exception):
        # Don't raise exception for optional auth - just return None
        return None


def get_client_ip(request: Request) -> Optional[str]:
    """Extract client IP address from request headers."""
    # Check for IP in various headers (reverse proxy, load balancer, etc.)
    ip_headers = [
        "X-Forwarded-For",
        "X-Real-IP",
        "X-Client-IP",
        "CF-Connecting-IP",  # Cloudflare
        "X-Forwarded-Host",
    ]

    for header in ip_headers:
        ip = request.headers.get(header)
        if ip:
            # X-Forwarded-For can contain multiple IPs, take the first one
            return ip.split(",")[0].strip()

    # Fallback to direct client IP
    if hasattr(request, "client") and request.client:
        return str(request.client.host)

    return None


async def queue_event_processing(
    redis: Redis,
    event_id: str,
    event_type: str,
    user_id: Optional[int] = None,
) -> None:
    """Queue event for background processing and real-time aggregation."""
    try:
        # Create background processing task
        task_data = {
            "event_id": event_id,
            "event_type": event_type,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Queue for real-time processing
        await redis.lpush("event_processing_queue", str(task_data))

        # Update real-time counters
        counter_key = (
            f"event_count:{event_type}:{datetime.utcnow().strftime('%Y-%m-%d:%H')}"
        )
        await redis.incr(counter_key)
        await redis.expire(counter_key, 86400)  # 24 hour expiration

        # User-specific counters if applicable
        if user_id:
            user_counter_key = (
                f"user_event_count:{user_id}:{datetime.utcnow().strftime('%Y-%m-%d')}"
            )
            await redis.incr(user_counter_key)
            await redis.expire(user_counter_key, 604800)  # 7 day expiration

    except Exception as e:
        # Don't fail the main request if background processing fails
        # Log error in production
        pass


@router.post(
    "/track", response_model=EventResponse, status_code=status.HTTP_201_CREATED
)
async def track_event(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
    background_tasks: BackgroundTasks,
    request: Request,
    event_in: EventCreate,
    current_user: Annotated[Optional[models.User], Depends(get_current_user_optional)],
) -> Any:
    """
    Track a single event.

    Supports both authenticated and anonymous event tracking.
    Automatically captures client IP and user agent for context.
    Queues event for real-time processing and aggregation.
    """
    # Get client context
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")

    # Create event with privacy considerations
    event = await crud.event.create(
        db,
        obj_in=event_in,
        user_id=current_user.id if current_user else None,
        ip_address=ip_address,
    )

    # Set user agent if provided and not too long
    if user_agent and len(user_agent) <= 500:
        await crud.event.update(db, db_obj=event, obj_in={"user_agent": user_agent})

    # Queue for background processing
    background_tasks.add_task(
        queue_event_processing,
        redis,
        event.event_id,
        event.event_type.value,
        event.user_id,
    )

    return event


@router.post(
    "/track/bulk",
    response_model=List[EventResponse],
    status_code=status.HTTP_201_CREATED,
)
async def track_events_bulk(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
    background_tasks: BackgroundTasks,
    request: Request,
    events_in: EventCreateBulk,
    current_user: Annotated[Optional[models.User], Depends(get_current_user_optional)],
) -> Any:
    """
    Track multiple events in a single request for high-throughput scenarios.

    Efficiently processes up to 100 events per request with bulk database operations.
    """
    # Rate limiting check for bulk requests
    if len(events_in.events) > 100:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Maximum 100 events per bulk request",
        )

    # Get client context
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")

    # Create events in bulk
    events = await crud.event.create_bulk(
        db,
        obj_in=events_in,
        user_id=current_user.id if current_user else None,
        ip_address=ip_address,
    )

    # Update user agents if provided
    if user_agent and len(user_agent) <= 500:
        for event in events:
            await crud.event.update(db, db_obj=event, obj_in={"user_agent": user_agent})

    # Queue all events for background processing
    for event in events:
        background_tasks.add_task(
            queue_event_processing,
            redis,
            event.event_id,
            event.event_type.value,
            event.user_id,
        )

    return events


@router.get("/analytics", response_model=EventAnalyticsResponse)
async def get_event_analytics(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
    query: EventAnalyticsQuery,
    current_user: Annotated[models.User, Depends(deps.get_current_active_user)],
) -> Any:
    """
    Get event analytics with aggregation and filtering.

    Supports complex queries with grouping, time ranges, and multiple aggregate functions.
    Results are cached for performance optimization.
    """
    start_time = time.time()

    # Create cache key from query parameters
    cache_key = f"analytics:{hash(str(query.model_dump()))}"

    # Try to get from cache first
    cached_result = await redis.get(cache_key)
    if cached_result:
        return EventAnalyticsResponse(
            results=eval(
                cached_result
            ),  # Note: In production, use proper JSON serialization
            total_count=0,  # Would be stored in cache
            query_time_ms=(time.time() - start_time) * 1000,
            cached=True,
        )

    # Execute analytics query
    results = await crud.event.analytics_query(db, query_params=query)

    # Convert to response format
    aggregate_results = []
    total_count = 0

    for result in results:
        # Extract dimensions and metrics
        dimensions = {}
        metrics = {}
        count = 0

        for key, value in result.items():
            if key == "count":
                count = value
                total_count += value
            elif key.endswith("_value"):
                metrics[key] = value
            else:
                dimensions[key] = value

        aggregate_results.append(
            EventAggregateResult(
                dimensions=dimensions,
                metrics=metrics,
                count=count,
                timestamp_range={
                    "start": query.start_date,
                    "end": query.end_date,
                },
            )
        )

    response = EventAnalyticsResponse(
        results=aggregate_results,
        total_count=total_count,
        query_time_ms=(time.time() - start_time) * 1000,
        cached=False,
    )

    # Cache results for 5 minutes
    await redis.setex(cache_key, 300, str(response.model_dump()))

    return response


@router.get("/user/{user_id}", response_model=List[EventResponse])
async def get_user_events(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    user_id: int,
    event_types: Optional[List[EventType]] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: Annotated[models.User, Depends(deps.get_current_active_user)],
) -> Any:
    """
    Get events for a specific user.

    Requires authentication and only allows access to own events unless admin.
    """
    # Check permissions - users can only access their own events
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access user events",
        )

    # Validate user exists
    user = await crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    events = await crud.event.get_user_events(
        db,
        user_id=user_id,
        event_types=event_types,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )

    return events


@router.get("/session/{session_id}", response_model=List[EventResponse])
async def get_session_events(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    session_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user: Annotated[models.User, Depends(deps.get_current_active_user)],
) -> Any:
    """Get all events for a specific session (user journey tracking)."""
    events = await crud.event.get_events_by_session(
        db, session_id=session_id, skip=skip, limit=limit
    )

    # Check if user has permission to view these events
    if events and not current_user.is_superuser:
        # Check if any event belongs to the current user
        user_events = [e for e in events if e.user_id == current_user.id]
        if not user_events and events[0].user_id is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to access session events",
            )

    return events


@router.get("/recent", response_model=List[EventResponse])
async def get_recent_events(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    minutes: int = 60,
    event_types: Optional[List[EventType]] = None,
    limit: int = 100,
    current_user: Annotated[models.User, Depends(deps.get_current_active_user)],
) -> Any:
    """Get recent events within specified timeframe (admin only)."""
    # Only admins can view all recent events
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    events = await crud.event.get_recent_events(
        db, minutes=minutes, event_types=event_types, limit=limit
    )

    return events


@router.get("/counts", response_model=Dict[str, int])
async def get_event_counts(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user_id: Optional[int] = None,
    current_user: Annotated[models.User, Depends(deps.get_current_active_user)],
) -> Any:
    """Get event counts by type."""
    # Permission check for user-specific counts
    if user_id and current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    counts = await crud.event.get_event_counts_by_type(
        db, start_date=start_date, end_date=end_date, user_id=user_id
    )

    return counts


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    event_id: str,
    current_user: Annotated[models.User, Depends(deps.get_current_active_user)],
) -> Any:
    """Get a specific event by ID."""
    event = await crud.event.get_by_event_id(db, event_id=event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found"
        )

    # Permission check - users can only access their own events
    if (
        event.user_id
        and current_user.id != event.user_id
        and not current_user.is_superuser
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    return event


# Privacy and data management endpoints


@router.post("/anonymize", status_code=status.HTTP_200_OK)
async def anonymize_events(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    request: EventAnonymizationRequest,
    current_user: Annotated[models.User, Depends(deps.get_current_active_superuser)],
) -> Dict[str, Any]:
    """Anonymize events for GDPR compliance (admin only)."""
    count = await crud.event.anonymize_user_events(db, request=request)

    return {
        "message": f"{'Would anonymize' if request.dry_run else 'Anonymized'} {count} events",
        "count": count,
        "dry_run": request.dry_run,
    }


@router.post("/export", response_model=List[EventResponse])
async def export_user_events(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    request: EventDataExportRequest,
    current_user: Annotated[models.User, Depends(deps.get_current_active_user)],
) -> Any:
    """Export user events for GDPR compliance."""
    # Users can only export their own events
    if current_user.id != request.user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    events = await crud.event.export_user_events(
        db,
        user_id=request.user_id,
        event_types=request.event_types,
        start_date=request.start_date,
        end_date=request.end_date,
        include_anonymized=request.include_anonymized,
    )

    return events


@router.delete("/cleanup", status_code=status.HTTP_200_OK)
async def cleanup_expired_events(
    *,
    db: Annotated[AsyncSession, Depends(deps.get_db)],
    batch_size: int = 1000,
    current_user: Annotated[models.User, Depends(deps.get_current_active_superuser)],
) -> Dict[str, Any]:
    """Clean up expired events based on retention policies (admin only)."""
    deleted_count = await crud.event.delete_expired_events(db, batch_size=batch_size)

    return {
        "message": f"Deleted {deleted_count} expired events",
        "deleted_count": deleted_count,
    }
