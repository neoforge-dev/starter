"""Security monitoring and dashboard endpoints."""
from typing import Annotated, Dict, Any, List
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user
from app.core.security_audit import security_auditor, SecurityEventType, SecuritySeverity
from app.models.user import User
from app.utils.audit import audit_event

router = APIRouter()


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_security_dashboard(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    hours: int = Query(24, ge=1, le=168, description="Hours of history to include (1-168)")
) -> Dict[str, Any]:
    """
    Get security dashboard data for monitoring.
    
    Requires superuser privileges for access to system-wide security data.
    """
    # Check if user has admin privileges
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrative privileges required."
        )
    
    # Log dashboard access
    await audit_event(
        db,
        user_id=current_user.id,
        action="security.dashboard.access",
        resource="security_dashboard"
    )
    
    try:
        dashboard_data = await security_auditor.get_security_dashboard_data(db, hours=hours)
        return dashboard_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve security dashboard data"
        )


@router.get("/events/user/{user_id}", response_model=List[Dict[str, Any]])
async def get_user_security_events(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    limit: int = Query(50, ge=1, le=200, description="Maximum number of events to return")
) -> List[Dict[str, Any]]:
    """
    Get security event history for a specific user.
    
    Users can only access their own events unless they are superusers.
    """
    # Check permissions: users can only view their own events, admins can view any
    if not current_user.is_superuser and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only view your own security events."
        )
    
    # Log security event access
    await audit_event(
        db,
        user_id=current_user.id,
        action="security.events.user_access",
        resource=f"user:{user_id}"
    )
    
    try:
        events = await security_auditor.get_user_security_history(db, user_id, limit=limit)
        return events
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user security events"
        )


@router.get("/events/my", response_model=List[Dict[str, Any]])
async def get_my_security_events(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    limit: int = Query(50, ge=1, le=200, description="Maximum number of events to return")
) -> List[Dict[str, Any]]:
    """
    Get security event history for the current user.
    
    Allows users to view their own security activity.
    """
    try:
        events = await security_auditor.get_user_security_history(
            db, 
            current_user.id, 
            limit=limit
        )
        return events
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve your security events"
        )


@router.post("/events/log", response_model=Dict[str, str])
async def log_security_event(
    event_data: Dict[str, Any],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> Dict[str, str]:
    """
    Manually log a security event (for admin use).
    
    Requires superuser privileges.
    """
    # Check if user has admin privileges
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrative privileges required."
        )
    
    try:
        # Parse event type
        event_type_str = event_data.get("event_type")
        if not event_type_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="event_type is required"
            )
        
        try:
            event_type = SecurityEventType(event_type_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid event_type: {event_type_str}"
            )
        
        # Parse severity
        severity_str = event_data.get("severity", "medium")
        try:
            severity = SecuritySeverity(severity_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid severity: {severity_str}"
            )
        
        # Log the event
        await security_auditor.log_security_event(
            db=db,
            event_type=event_type,
            user_id=event_data.get("user_id"),
            ip_address=event_data.get("ip_address"),
            user_agent=event_data.get("user_agent"),
            resource=event_data.get("resource"),
            details=event_data.get("details", {}),
            severity=severity,
            success=event_data.get("success", True)
        )
        
        # Log admin action
        await audit_event(
            db,
            user_id=current_user.id,
            action="security.event.manual_log",
            resource=f"event_type:{event_type_str}"
        )
        
        return {"message": "Security event logged successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log security event"
        )


@router.get("/alerts/recent", response_model=List[Dict[str, Any]])
async def get_recent_security_alerts(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    hours: int = Query(24, ge=1, le=72, description="Hours of alerts to retrieve")
) -> List[Dict[str, Any]]:
    """
    Get recent security alerts.
    
    Requires superuser privileges.
    """
    # Check if user has admin privileges
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrative privileges required."
        )
    
    # Log alert access
    await audit_event(
        db,
        user_id=current_user.id,
        action="security.alerts.access",
        resource="security_alerts"
    )
    
    try:
        from app.core.redis import get_redis
        
        alerts = []
        async for redis in get_redis():
            # Get critical alerts from Redis
            alert_data = await redis.lrange("security_alerts:critical", 0, -1)
            
            for alert_str in alert_data:
                try:
                    # Parse alert data (stored as string representation)
                    import ast
                    alert_dict = ast.literal_eval(alert_str)
                    
                    # Filter by time window
                    alert_time = datetime.fromisoformat(alert_dict["timestamp"].replace("Z", "+00:00"))
                    cutoff_time = datetime.now().replace(tzinfo=alert_time.tzinfo) - timedelta(hours=hours)
                    
                    if alert_time >= cutoff_time:
                        alerts.append(alert_dict)
                except Exception as parse_error:
                    # Skip malformed alert data
                    continue
        
        # Sort by timestamp (newest first)
        alerts.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return alerts
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve security alerts"
        )


@router.get("/stats/summary", response_model=Dict[str, Any])
async def get_security_summary(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> Dict[str, Any]:
    """
    Get security summary statistics.
    
    Returns basic security metrics for the current user or system-wide for admins.
    """
    try:
        if current_user.is_superuser:
            # Admin view: system-wide stats
            dashboard_data = await security_auditor.get_security_dashboard_data(db, hours=24)
            
            summary = {
                "user_type": "admin",
                "total_events_24h": dashboard_data["total_events"],
                "failed_events_24h": dashboard_data["failed_events"],
                "security_level": "normal",  # Would be computed based on recent events
                "last_updated": dashboard_data["generated_at"]
            }
            
            # Determine security level based on failed events
            if dashboard_data["failed_events"] > 100:
                summary["security_level"] = "high_alert"
            elif dashboard_data["failed_events"] > 50:
                summary["security_level"] = "elevated"
            
        else:
            # User view: personal stats
            user_events = await security_auditor.get_user_security_history(db, current_user.id, limit=10)
            
            # Count recent failed events
            recent_failures = sum(1 for event in user_events if not event["success"])
            
            summary = {
                "user_type": "user",
                "recent_events": len(user_events),
                "failed_events": recent_failures,
                "security_level": "normal" if recent_failures < 3 else "attention_needed",
                "last_updated": datetime.now().isoformat()
            }
        
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve security summary"
        )