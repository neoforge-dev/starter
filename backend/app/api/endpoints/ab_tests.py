"""A/B Testing API endpoints for experiment management and analytics."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.api.deps import get_current_user, get_db
from app.crud import ab_test
from app.crud import event as event_crud
from app.models.user import User
from app.schemas.ab_test import (
    AbTestAnalyticsQuery,
    AbTestAnalyticsResponse,
    AbTestAssignmentRequest,
    AbTestAssignmentResponse,
    AbTestConversionRequest,
    AbTestCreate,
    AbTestListResponse,
    AbTestResponse,
    AbTestStatisticalReport,
    AbTestStatus,
    AbTestUpdate,
    AbTestVariantResponse,
    AbTestVariantUpdate,
)
from app.schemas.common import PaginatedResponse
from app.schemas.event import EventCreate, EventType
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("/", response_model=AbTestListResponse)
async def list_ab_tests(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Number of tests to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of tests to return"),
    status_filter: Optional[List[AbTestStatus]] = Query(
        None, description="Filter by test status"
    ),
    created_by: Optional[int] = Query(None, description="Filter by creator user ID"),
) -> AbTestListResponse:
    """List A/B tests with filtering and pagination."""
    # Build filter criteria
    filters = {}
    if status_filter:
        filters["status__in"] = status_filter
    if created_by:
        filters["created_by"] = created_by

    tests = await ab_test.get_multi(db, skip=skip, limit=limit, **filters)
    total = await ab_test.count(db, **filters)

    return AbTestListResponse(
        tests=tests,
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        total_pages=(total + limit - 1) // limit,
    )


@router.post("/", response_model=AbTestResponse, status_code=status.HTTP_201_CREATED)
async def create_ab_test(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    test_in: AbTestCreate,
) -> AbTestResponse:
    """Create a new A/B test with variants."""
    # Check if test key already exists
    existing_test = await ab_test.get_by_test_key(db, test_key=test_in.test_key)
    if existing_test:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Test key already exists"
        )

    # Create test
    db_test = await ab_test.create_with_variants(
        db, obj_in=test_in, created_by=current_user.id
    )

    return db_test


@router.get("/{test_id}", response_model=AbTestResponse)
async def get_ab_test(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    test_id: int,
) -> AbTestResponse:
    """Get A/B test by ID."""
    test = await ab_test.get(db, id=test_id)
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Test not found"
        )

    return test


@router.put("/{test_id}", response_model=AbTestResponse)
async def update_ab_test(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    test_id: int,
    test_in: AbTestUpdate,
) -> AbTestResponse:
    """Update an A/B test."""
    test = await ab_test.get(db, id=test_id)
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Test not found"
        )

    # Check permissions (only creator or admin can update)
    if test.created_by != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    # Validate status transitions
    if test_in.status and test_in.status != test.status:
        if not _is_valid_status_transition(test.status, test_in.status):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from {test.status} to {test_in.status}",
            )

    updated_test = await ab_test.update(db, db_obj=test, obj_in=test_in)
    return updated_test


@router.delete("/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ab_test(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    test_id: int,
) -> None:
    """Delete an A/B test (only if not active)."""
    test = await ab_test.get(db, id=test_id)
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Test not found"
        )

    # Check permissions
    if test.created_by != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    # Can't delete active tests
    if test.status == AbTestStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete active test. Stop the test first.",
        )

    await ab_test.remove(db, id=test_id)


@router.post("/{test_id}/start", response_model=AbTestResponse)
async def start_ab_test(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    test_id: int,
) -> AbTestResponse:
    """Start an A/B test."""
    updated_test = await ab_test.update_test_status(
        db, test_id=test_id, status=AbTestStatus.ACTIVE
    )

    if not updated_test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Test not found"
        )

    return updated_test


@router.post("/{test_id}/stop", response_model=AbTestResponse)
async def stop_ab_test(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    test_id: int,
    winner_variant_id: Optional[int] = Query(None, description="ID of winning variant"),
) -> AbTestResponse:
    """Stop an A/B test and optionally declare a winner."""
    status_value = AbTestStatus.COMPLETED if winner_variant_id else AbTestStatus.PAUSED

    updated_test = await ab_test.update_test_status(
        db, test_id=test_id, status=status_value, winner_variant_id=winner_variant_id
    )

    if not updated_test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Test not found"
        )

    return updated_test


@router.get("/{test_id}/analytics", response_model=AbTestStatisticalReport)
async def get_ab_test_analytics(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    test_id: int,
    start_date: Optional[datetime] = Query(None, description="Analysis start date"),
    end_date: Optional[datetime] = Query(None, description="Analysis end date"),
) -> AbTestStatisticalReport:
    """Get comprehensive analytics for an A/B test."""
    analytics = await ab_test.get_test_analytics(
        db, test_id=test_id, start_date=start_date, end_date=end_date
    )

    if not analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test not found or insufficient data",
        )

    return analytics


@router.put("/{test_id}/variants/{variant_id}", response_model=AbTestVariantResponse)
async def update_ab_test_variant(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    test_id: int,
    variant_id: int,
    variant_in: AbTestVariantUpdate,
) -> AbTestVariantResponse:
    """Update an A/B test variant."""
    # First check if test exists and user has permissions
    test = await ab_test.get(db, id=test_id)
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Test not found"
        )

    if test.created_by != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    # Can't update variants of active tests
    if test.status == AbTestStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update variants of active test",
        )

    # Find and update variant
    variant = None
    for v in test.variants:
        if v.id == variant_id:
            variant = v
            break

    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found"
        )

    # Update variant fields
    for field, value in variant_in.model_dump(exclude_unset=True).items():
        setattr(variant, field, value)

    await db.commit()
    await db.refresh(variant)

    return variant


# Public endpoints for test assignment and conversion tracking


@router.post("/assign", response_model=AbTestAssignmentResponse)
async def assign_user_to_test(
    *,
    db: AsyncSession = Depends(get_db),
    assignment_request: AbTestAssignmentRequest,
) -> AbTestAssignmentResponse:
    """Assign user to A/B test variant."""
    result = await ab_test.assign_user_to_test(db, request=assignment_request)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test not found or user not eligible",
        )

    test_obj, variant = result

    # Track assignment event
    await _track_assignment_event(
        db, test_obj, variant, assignment_request.user_id, assignment_request.session_id
    )

    return AbTestAssignmentResponse(
        test_id=test_obj.id,
        test_key=test_obj.test_key,
        variant_id=variant.id,
        variant_key=variant.variant_key,
        variant_configuration=variant.configuration,
        assigned_at=datetime.utcnow(),
        is_control=variant.is_control,
    )


@router.post("/convert", status_code=status.HTTP_200_OK)
async def track_conversion(
    *,
    db: AsyncSession = Depends(get_db),
    conversion_request: AbTestConversionRequest,
) -> Dict[str, Any]:
    """Track conversion for A/B test."""
    success = await ab_test.track_conversion(db, request=conversion_request)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test not found or user not assigned",
        )

    # Track conversion event
    await _track_conversion_event(db, conversion_request)

    return {"status": "success", "message": "Conversion tracked"}


@router.get("/active", response_model=List[AbTestResponse])
async def get_active_tests(
    *,
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> List[AbTestResponse]:
    """Get all currently active A/B tests."""
    tests = await ab_test.get_active_tests(db, skip=skip, limit=limit)
    return tests


@router.get("/user-tests")
async def get_user_tests(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[int] = Query(None, description="User ID (if authenticated)"),
    session_id: Optional[str] = Query(
        None, description="Session ID (for anonymous users)"
    ),
) -> List[Dict[str, Any]]:
    """Get all tests a user is assigned to."""
    if not user_id and not session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either user_id or session_id must be provided",
        )

    user_tests = await ab_test.get_user_tests(
        db, user_id=user_id, session_id=session_id, active_only=True
    )

    result = []
    for test_obj, variant in user_tests:
        result.append(
            {
                "test_id": test_obj.id,
                "test_key": test_obj.test_key,
                "test_name": test_obj.name,
                "variant_id": variant.id,
                "variant_key": variant.variant_key,
                "variant_configuration": variant.configuration,
                "is_control": variant.is_control,
            }
        )

    return result


@router.get("/performance", response_model=Dict[str, Any])
async def get_performance_metrics(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    test_ids: Optional[List[int]] = Query(None, description="Specific test IDs"),
    date_range_days: int = Query(30, ge=1, le=365, description="Date range in days"),
) -> Dict[str, Any]:
    """Get performance metrics across A/B tests."""
    metrics = await ab_test.get_test_performance_metrics(
        db, test_ids=test_ids, date_range_days=date_range_days
    )

    return metrics


# Helper functions


def _is_valid_status_transition(current_status: str, new_status: str) -> bool:
    """Check if status transition is valid."""
    valid_transitions = {
        AbTestStatus.DRAFT: [AbTestStatus.ACTIVE, AbTestStatus.ARCHIVED],
        AbTestStatus.ACTIVE: [AbTestStatus.PAUSED, AbTestStatus.COMPLETED],
        AbTestStatus.PAUSED: [
            AbTestStatus.ACTIVE,
            AbTestStatus.COMPLETED,
            AbTestStatus.ARCHIVED,
        ],
        AbTestStatus.COMPLETED: [AbTestStatus.ARCHIVED],
        AbTestStatus.ARCHIVED: [],  # No transitions from archived
    }

    return new_status in valid_transitions.get(current_status, [])


async def _track_assignment_event(
    db: AsyncSession,
    test: Any,
    variant: Any,
    user_id: Optional[int],
    session_id: Optional[str],
) -> None:
    """Track A/B test assignment as an event."""
    event_data = EventCreate(
        event_type=EventType.INTERACTION,
        event_name="ab_test_assignment",
        session_id=session_id,
        properties={
            "test_id": test.id,
            "test_key": test.test_key,
            "variant_id": variant.id,
            "variant_key": variant.variant_key,
            "is_control": variant.is_control,
        },
    )

    await event_crud.create(db, obj_in=event_data, user_id=user_id)


async def _track_conversion_event(
    db: AsyncSession,
    conversion_request: AbTestConversionRequest,
) -> None:
    """Track A/B test conversion as an event."""
    event_data = EventCreate(
        event_type=EventType.BUSINESS,
        event_name="ab_test_conversion",
        session_id=conversion_request.session_id,
        value=conversion_request.value,
        properties={
            "test_key": conversion_request.test_key,
            "metric_name": conversion_request.metric_name,
            **(conversion_request.properties or {}),
        },
    )

    await event_crud.create(db, obj_in=event_data, user_id=conversion_request.user_id)
