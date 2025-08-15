"""Account lifecycle management endpoints."""
from typing import Annotated, Dict, Any
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.core.security_audit import (
    security_auditor, 
    SecurityEventType, 
    SecuritySeverity,
    log_login_attempt,
    log_token_event,
    log_suspicious_activity
)
from app.crud import user as user_crud
from app.models.user import User
from app.utils.audit import audit_event
from app.core.auth import revoke_all_user_tokens
from app.core.redis import get_redis
import structlog

logger = structlog.get_logger()
router = APIRouter()


class DeactivateAccountRequest(BaseModel):
    """Deactivate account request schema."""
    reason: str
    confirm_deactivation: bool = False


class ScheduleDeletionRequest(BaseModel):
    """Schedule account deletion request schema."""
    reason: str
    retention_days: int = 30
    confirm_deletion: bool = False


class ChangePasswordRequest(BaseModel):
    """Change password request schema."""
    current_password: str
    new_password: str
    revoke_all_sessions: bool = True


@router.post("/deactivate", response_model=Dict[str, Any])
async def deactivate_account(
    request: DeactivateAccountRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> Dict[str, Any]:
    """
    Deactivate user account.
    
    This endpoint:
    1. Validates the request and user confirmation
    2. Deactivates the user account
    3. Revokes all refresh tokens
    4. Logs the deactivation event
    5. Returns confirmation
    """
    logger.info(f"Account deactivation requested by user {current_user.id}")
    
    if not request.confirm_deactivation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account deactivation requires confirmation"
        )
    
    try:
        # Deactivate the account
        deactivated_user = await user_crud.deactivate_account(
            db=db,
            user_id=current_user.id,
            reason=request.reason
        )
        
        if not deactivated_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to deactivate account"
            )
        
        # Revoke all refresh tokens
        async for redis in get_redis():
            revoked_tokens = await revoke_all_user_tokens(
                redis=redis,
                user_id=current_user.id
            )
        
        # Log security event
        await security_auditor.log_security_event(
            db=db,
            event_type=SecurityEventType.ACCOUNT_DEACTIVATED,
            user_id=current_user.id,
            severity=SecuritySeverity.MEDIUM,
            details={
                "reason": request.reason,
                "revoked_tokens": revoked_tokens,
                "deactivated_at": deactivated_user.deactivated_at.isoformat()
            },
            success=True
        )
        
        await db.commit()
        
        logger.info(
            "account_deactivated",
            user_id=current_user.id,
            reason=request.reason,
            revoked_tokens=revoked_tokens
        )
        
        return {
            "message": "Account has been successfully deactivated",
            "deactivated_at": deactivated_user.deactivated_at.isoformat(),
            "reason": request.reason,
            "revoked_sessions": revoked_tokens
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Account deactivation failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate account"
        )


@router.post("/reactivate", response_model=Dict[str, Any])
async def reactivate_account(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> Dict[str, Any]:
    """
    Reactivate user account (only works if account is deactivated but not deleted).
    
    This endpoint:
    1. Checks if account can be reactivated
    2. Reactivates the account
    3. Logs the reactivation event
    4. Returns confirmation
    """
    logger.info(f"Account reactivation requested by user {current_user.id}")
    
    if not current_user.is_account_deactivated():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is not deactivated"
        )
    
    if current_user.should_be_deleted():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is scheduled for deletion and cannot be reactivated. Contact support."
        )
    
    try:
        # Reactivate the account
        reactivated_user = await user_crud.reactivate_account(
            db=db,
            user_id=current_user.id
        )
        
        if not reactivated_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to reactivate account"
            )
        
        # Log security event
        await security_auditor.log_security_event(
            db=db,
            event_type=SecurityEventType.ACCOUNT_CREATED,  # Using created as "reactivated"
            user_id=current_user.id,
            severity=SecuritySeverity.MEDIUM,
            details={
                "action": "reactivated",
                "previous_deactivation_reason": current_user.deactivation_reason,
                "reactivated_at": datetime.utcnow().isoformat()
            },
            success=True
        )
        
        await db.commit()
        
        logger.info(
            "account_reactivated",
            user_id=current_user.id,
            previous_reason=current_user.deactivation_reason
        )
        
        return {
            "message": "Account has been successfully reactivated",
            "reactivated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Account reactivation failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reactivate account"
        )


@router.post("/schedule-deletion", response_model=Dict[str, Any])
async def schedule_account_deletion(
    request: ScheduleDeletionRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> Dict[str, Any]:
    """
    Schedule user account for deletion after retention period.
    
    This endpoint:
    1. Validates the request and user confirmation
    2. Schedules the account for deletion
    3. Deactivates the account immediately
    4. Revokes all refresh tokens
    5. Logs the deletion scheduling event
    6. Returns confirmation with deletion date
    """
    logger.info(f"Account deletion scheduled by user {current_user.id}")
    
    if not request.confirm_deletion:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account deletion requires confirmation"
        )
    
    if request.retention_days < 1 or request.retention_days > 365:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Retention period must be between 1 and 365 days"
        )
    
    try:
        # Schedule deletion
        scheduled_user = await user_crud.schedule_deletion(
            db=db,
            user_id=current_user.id,
            retention_days=request.retention_days
        )
        
        if not scheduled_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to schedule account deletion"
            )
        
        # Revoke all refresh tokens
        async for redis in get_redis():
            revoked_tokens = await revoke_all_user_tokens(
                redis=redis,
                user_id=current_user.id
            )
        
        # Log security event
        await security_auditor.log_security_event(
            db=db,
            event_type=SecurityEventType.ACCOUNT_DELETED,
            user_id=current_user.id,
            severity=SecuritySeverity.HIGH,
            details={
                "action": "scheduled_for_deletion",
                "reason": request.reason,
                "retention_days": request.retention_days,
                "deletion_scheduled_for": scheduled_user.data_retention_until.isoformat(),
                "revoked_tokens": revoked_tokens
            },
            success=True
        )
        
        await db.commit()
        
        logger.info(
            "account_deletion_scheduled",
            user_id=current_user.id,
            reason=request.reason,
            deletion_date=scheduled_user.data_retention_until.isoformat(),
            revoked_tokens=revoked_tokens
        )
        
        return {
            "message": "Account has been scheduled for deletion",
            "scheduled_deletion_date": scheduled_user.data_retention_until.isoformat(),
            "retention_days": request.retention_days,
            "reason": request.reason,
            "revoked_sessions": revoked_tokens,
            "can_cancel_until": scheduled_user.data_retention_until.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Account deletion scheduling failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to schedule account deletion"
        )


@router.post("/cancel-deletion", response_model=Dict[str, Any])
async def cancel_account_deletion(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> Dict[str, Any]:
    """
    Cancel scheduled account deletion.
    
    This endpoint:
    1. Checks if account is scheduled for deletion
    2. Cancels the deletion schedule
    3. Optionally reactivates account if it was only deactivated for deletion
    4. Logs the cancellation event
    5. Returns confirmation
    """
    logger.info(f"Account deletion cancellation requested by user {current_user.id}")
    
    if not current_user.data_retention_until:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is not scheduled for deletion"
        )
    
    if current_user.should_be_deleted():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deletion period has already passed. Contact support for account recovery."
        )
    
    try:
        # Cancel deletion
        updated_user = await user_crud.cancel_deletion(
            db=db,
            user_id=current_user.id
        )
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to cancel account deletion"
            )
        
        # Log security event
        await security_auditor.log_security_event(
            db=db,
            event_type=SecurityEventType.ACCOUNT_CREATED,  # Using as "deletion_cancelled"
            user_id=current_user.id,
            severity=SecuritySeverity.MEDIUM,
            details={
                "action": "deletion_cancelled",
                "was_scheduled_for": current_user.data_retention_until.isoformat(),
                "cancelled_at": datetime.utcnow().isoformat(),
                "account_reactivated": updated_user.is_active
            },
            success=True
        )
        
        await db.commit()
        
        logger.info(
            "account_deletion_cancelled",
            user_id=current_user.id,
            was_scheduled_for=current_user.data_retention_until.isoformat(),
            account_reactivated=updated_user.is_active
        )
        
        return {
            "message": "Account deletion has been cancelled",
            "cancelled_at": datetime.utcnow().isoformat(),
            "account_reactivated": updated_user.is_active
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Account deletion cancellation failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel account deletion"
        )


@router.post("/change-password", response_model=Dict[str, Any])
async def change_password(
    request: ChangePasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> Dict[str, Any]:
    """
    Change user password.
    
    This endpoint:
    1. Validates the current password
    2. Updates to the new password
    3. Optionally revokes all sessions
    4. Logs the password change event
    5. Returns confirmation
    """
    logger.info(f"Password change requested by user {current_user.id}")
    
    # Verify current password
    from app.core.auth import verify_password
    if not verify_password(request.current_password, current_user.hashed_password):
        # Log failed password change attempt
        await security_auditor.log_security_event(
            db=db,
            event_type=SecurityEventType.PASSWORD_CHANGED,
            user_id=current_user.id,
            severity=SecuritySeverity.MEDIUM,
            details={
                "result": "failed",
                "reason": "incorrect_current_password"
            },
            success=False
        )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    try:
        # Update password
        updated_user = await user_crud.update(
            db=db,
            db_obj=current_user,
            obj_in={"password": request.new_password}
        )
        
        # Update password change timestamp
        await user_crud.update_password_changed(
            db=db,
            user_id=current_user.id
        )
        
        revoked_tokens = 0
        if request.revoke_all_sessions:
            # Revoke all refresh tokens except current session would be complex
            # For security, we'll revoke all tokens when password is changed
            async for redis in get_redis():
                revoked_tokens = await revoke_all_user_tokens(
                    redis=redis,
                    user_id=current_user.id
                )
        
        # Log successful password change
        await security_auditor.log_security_event(
            db=db,
            event_type=SecurityEventType.PASSWORD_CHANGED,
            user_id=current_user.id,
            severity=SecuritySeverity.MEDIUM,
            details={
                "result": "success",
                "revoked_sessions": revoked_tokens,
                "changed_at": datetime.utcnow().isoformat()
            },
            success=True
        )
        
        await db.commit()
        
        logger.info(
            "password_changed",
            user_id=current_user.id,
            revoked_sessions=revoked_tokens
        )
        
        return {
            "message": "Password has been successfully changed",
            "changed_at": datetime.utcnow().isoformat(),
            "revoked_sessions": revoked_tokens,
            "requires_new_login": request.revoke_all_sessions
        }
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Password change failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )


@router.get("/status", response_model=Dict[str, Any])
async def get_account_status(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> Dict[str, Any]:
    """
    Get current account status and security information.
    
    Returns comprehensive account status including:
    - Account state (active, deactivated, locked, etc.)
    - Security information (last login, failed attempts, etc.)
    - Deletion status if applicable
    """
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "is_locked": current_user.is_account_locked(),
        "is_deactivated": current_user.is_account_deactivated(),
        "can_login": current_user.can_login(),
        "deactivated_at": current_user.deactivated_at.isoformat() if current_user.deactivated_at else None,
        "deactivation_reason": current_user.deactivation_reason,
        "last_login_at": current_user.last_login_at.isoformat() if current_user.last_login_at else None,
        "last_login_ip": current_user.last_login_ip,
        "failed_login_attempts": current_user.failed_login_attempts,
        "locked_until": current_user.locked_until.isoformat() if current_user.locked_until else None,
        "password_changed_at": current_user.password_changed_at.isoformat() if current_user.password_changed_at else None,
        "deletion_scheduled": current_user.data_retention_until is not None,
        "deletion_date": current_user.data_retention_until.isoformat() if current_user.data_retention_until else None,
        "should_be_deleted": current_user.should_be_deleted(),
        "account_created_at": current_user.created_at.isoformat()
    }