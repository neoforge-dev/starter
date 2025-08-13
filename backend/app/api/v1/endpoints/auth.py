"""Authentication endpoints."""
from datetime import timedelta, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import create_access_token, validate_verification_token
from app.core.config import Settings, get_settings
from app.api.deps import get_db, get_current_active_user
from app.schemas.auth import (
    Token,
    TokenPayload,
    PasswordResetRequest,
    PasswordResetConfirm,
    EmailVerification,
    ResendVerification,
    SessionOut,
)
from app.crud.user_session import user_session, hash_token
from app.utils.audit import audit_event
import secrets
from app.schemas.user import UserCreate, UserResponse
from app.models.user import User
from app.models.user_session import UserSession
from app.worker.email_worker import send_welcome_email_task, send_verification_email_task, send_password_reset_email_task
from app.core.auth import verify_password, get_password_hash
from app.crud import user as user_crud, password_reset_token
from app.schemas.common import PaginatedResponse
import logging # Import logging

router = APIRouter()
logger = logging.getLogger(__name__) # Get logger instance


@router.post("/token", response_model=Token)
async def login_access_token(
    settings: Annotated[Settings, Depends(get_settings)],
    db: Annotated[AsyncSession, Depends(get_db)],
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    """ 
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = await user_crud.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Log the user ID before creating the token
    logger.info(f"Generating token for User ID: {user.id}")
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access = create_access_token(subject=user.id, settings=settings, expires_delta=access_token_expires)
    # Issue refresh token (opaque) and store session
    refresh = secrets.token_urlsafe(32)
    await user_session.create(
        db,
        user_id=user.id,
        refresh_token=refresh,
        user_agent=getattr(form_data, "client_id", None),
        ip_address=None,
        expires_in_days=settings.refresh_token_expire_days,
    )
    await audit_event(db, user_id=user.id, action="auth.login", resource=f"user:{user.id}")
    return {"access_token": access, "token_type": "bearer", "refresh_token": refresh}


@router.post("/refresh", response_model=Token)
async def refresh_access_token(
    settings: Annotated[Settings, Depends(get_settings)],
    db: Annotated[AsyncSession, Depends(get_db)],
    refresh_token: str,
) -> Token:
    hashed = hash_token(refresh_token)
    session = await user_session.get_by_hashed(db, hashed=hashed)
    if not session or session.revoked_at is not None or session.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access = create_access_token(subject=session.user_id, settings=settings, expires_delta=access_token_expires)
    await audit_event(db, user_id=session.user_id, action="auth.refresh", resource=f"session:{session.id}")
    return Token(access_token=access, token_type="bearer")


@router.get("/sessions", response_model=PaginatedResponse)
async def list_sessions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    page: int = 1,
    page_size: int = 10,
) -> PaginatedResponse:
    skip = (page - 1) * page_size
    items, total = await user_session.list_for_user(
        db, user_id=current_user.id, skip=skip, limit=page_size
    )
    sessions = [
        SessionOut(
            id=it.id,
            user_agent=it.user_agent,
            ip_address=it.ip_address,
            created_at=it.created_at,
            expires_at=it.expires_at,
            revoked_at=it.revoked_at,
        )
        for it in items
    ]
    pages = (total + page_size - 1) // page_size if page_size else 1
    return PaginatedResponse(
        items=sessions, total=total, page=page, page_size=page_size, pages=pages
    )


@router.post("/sessions/{session_id}/revoke", response_model=SessionOut)
async def revoke_session(
    session_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> SessionOut:
    res = await db.execute(select(UserSession).where(UserSession.id == session_id))
    sess = res.scalar_one_or_none()
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if sess.revoked_at is None:
        await user_session.revoke(db, session=sess)
    return SessionOut(
        id=sess.id,
        user_agent=sess.user_agent,
        ip_address=sess.ip_address,
        created_at=sess.created_at,
        expires_at=sess.expires_at,
        revoked_at=sess.revoked_at,
    )


@router.post("/register", response_model=dict)
async def register_user(
    user_data: UserCreate,
    settings: Annotated[Settings, Depends(get_settings)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """
    Register a new user account.
    
    This endpoint:
    1. Validates the user input (including password confirmation)
    2. Checks if email is already registered
    3. Creates the user in the database with hashed password
    4. Sends a welcome email with verification token
    5. Returns user info and access token
    """
    logger.info(f"Registration attempt for email: {user_data.email}")
    
    # Check if user already exists
    existing_user = await user_crud.get_by_email(db, email=user_data.email)
    if existing_user:
        logger.warning(f"Registration failed: Email {user_data.email} already registered")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        # Create the user
        logger.info(f"Creating new user: {user_data.email}")
        user = await user_crud.create(db, obj_in=user_data)
        await db.commit()
        await db.refresh(user)
        
        logger.info(f"User created successfully: {user.email} (ID: {user.id})")
        
        # Generate verification token for the welcome email
        verification_token = create_access_token(
            subject=user.id, 
            settings=settings,
            expires_delta=timedelta(hours=24)  # Verification token expires in 24 hours
        )
        
        # Queue welcome email with verification link
        try:
            task_result = send_welcome_email_task.delay(
                user_email=user.email,
                user_name=user.full_name or user.email,
                verification_token=verification_token
            )
            logger.info(f"Welcome email task queued for: {user.email} (task_id: {task_result.id})")
        except Exception as email_error:
            # Log error but don't fail registration if email queuing fails
            logger.error(f"Failed to queue welcome email for {user.email}: {email_error}")
            # Note: We continue with registration even if email queuing fails
        
        # Generate access token for immediate login
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            subject=user.id, 
            settings=settings, 
            expires_delta=access_token_expires
        )
        
        logger.info(f"User registration completed successfully: {user.email}")
        
        # Return user info and access token
        return {
            "message": "User registered successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat()
            },
            "access_token": access_token,
            "token_type": "bearer"
        }
        
    except Exception as e:
        # Rollback the transaction on any error
        await db.rollback()
        logger.error(f"User registration failed for {user_data.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )


@router.post("/reset-password-request", response_model=dict)
async def reset_password_request(
    reset_data: PasswordResetRequest,
    settings: Annotated[Settings, Depends(get_settings)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """
    Request a password reset token.
    
    This endpoint:
    1. Validates the email address
    2. Finds the user (if exists)
    3. Generates a secure reset token
    4. Sends password reset email
    5. Returns generic success message (doesn't reveal if email exists)
    """
    logger.info(f"Password reset requested for email: {reset_data.email}")
    
    try:
        # Look up user by email
        user = await user_crud.get_by_email(db, email=reset_data.email)
        
        if user:
            # Check for recent reset requests to prevent spam
            has_recent_token = await password_reset_token.has_recent_token(
                db, user_id=user.id, minutes_threshold=5
            )
            
            if has_recent_token:
                logger.warning(f"Rate limit: Recent reset request for {reset_data.email}")
                # Return success anyway to prevent email enumeration
                return {
                    "message": "If the email address is registered, you will receive a password reset link shortly."
                }
            
            # Clean up any existing tokens for this user
            await password_reset_token.cleanup_tokens_for_user(db, user.id)
            
            # Create new reset token
            token_record, plain_token = await password_reset_token.create_for_user(
                db, user, expires_hours=24
            )
            
            await db.commit()
            
            logger.info(f"Password reset token created for user {user.id}")
            
            # Queue password reset email
            try:
                task_result = send_password_reset_email_task.delay(
                    user_email=user.email,
                    user_name=user.full_name or user.email,
                    reset_token=plain_token
                )
                logger.info(f"Password reset email task queued for: {user.email} (task_id: {task_result.id})")
            except Exception as email_error:
                # Log error but don't fail the request
                logger.error(f"Failed to queue password reset email for {user.email}: {email_error}")
                # Continue with success response
        else:
            logger.info(f"Password reset requested for non-existent email: {reset_data.email}")
            # Don't reveal that email doesn't exist
        
        # Always return the same message for security
        return {
            "message": "If the email address is registered, you will receive a password reset link shortly."
        }
        
    except Exception as e:
        logger.error(f"Password reset request failed for {reset_data.email}: {e}")
        # Return generic error to prevent information disclosure
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process password reset request. Please try again later."
        )


@router.post("/reset-password-confirm", response_model=dict)
async def reset_password_confirm(
    confirm_data: PasswordResetConfirm,
    settings: Annotated[Settings, Depends(get_settings)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """
    Confirm password reset with token and set new password.
    
    This endpoint:
    1. Validates the reset token
    2. Checks token is not expired or used
    3. Updates user's password
    4. Marks token as used
    5. Returns success confirmation
    """
    logger.info("Password reset confirmation attempt")
    
    # Get token from database
    token_record = await password_reset_token.get_by_token(db, confirm_data.token)
    
    if not token_record:
        logger.warning("Invalid password reset token provided")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if token is valid (not expired and not used)
    if not token_record.is_valid():
        logger.warning(f"Expired or used password reset token for user {token_record.user_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    try:
        # Get the user
        user = await user_crud.get(db, id=token_record.user_id)
        if not user:
            logger.error(f"User {token_record.user_id} not found for valid token")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Update user's password
        hashed_password = get_password_hash(confirm_data.new_password)
        user.hashed_password = hashed_password
        
        # Mark token as used
        await password_reset_token.mark_as_used(db, token_record)
        
        # Commit changes
        await db.commit()
        
        logger.info(f"Password successfully reset for user {user.id} ({user.email})")
        
        return {
            "message": "Password has been successfully reset. You can now log in with your new password."
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Password reset confirmation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to reset password. Please try again or request a new reset token."
        )


@router.post("/verify-email", response_model=dict)
async def verify_email(
    verify_data: EmailVerification,
    settings: Annotated[Settings, Depends(get_settings)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """
    Verify user's email address using verification token.
    
    This endpoint:
    1. Validates the verification token (JWT)
    2. Checks token is not expired
    3. Marks user's email as verified
    4. Returns success confirmation
    """
    logger.info("Email verification attempt")
    
    # Validate verification token and get user
    user = await validate_verification_token(
        verify_data.token, settings, db
    )
    
    if not user:
        logger.warning("Invalid or expired email verification token provided")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # Check if already verified
    if user.is_verified:
        logger.info(f"Email already verified for user {user.id} ({user.email})")
        return {
            "message": "Email address is already verified."
        }
    
    try:
        # Mark email as verified
        verified_user = await user_crud.verify_email(db, user_id=user.id)
        
        if not verified_user:
            logger.error(f"Failed to verify email for user {user.id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to verify email. Please try again."
            )
        
        await db.commit()
        
        logger.info(f"Email successfully verified for user {user.id} ({user.email})")
        
        return {
            "message": "Email address has been successfully verified. Welcome to our platform!"
        }
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Email verification failed for user {user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to verify email. Please try again or request a new verification link."
        )


@router.post("/resend-verification", response_model=dict)
async def resend_verification(
    resend_data: ResendVerification,
    settings: Annotated[Settings, Depends(get_settings)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """
    Resend email verification link.
    
    This endpoint:
    1. Validates the email address
    2. Finds the user (if exists and not verified)
    3. Generates a new verification token
    4. Sends verification email
    5. Returns generic success message (doesn't reveal if email exists)
    """
    logger.info(f"Verification resend requested for email: {resend_data.email}")
    
    try:
        # Look up user by email
        user = await user_crud.get_by_email(db, email=resend_data.email)
        
        if user:
            # Check if already verified
            if user.is_verified:
                logger.info(f"Verification resend requested for already verified user: {resend_data.email}")
                # Return success anyway to prevent email enumeration
                return {
                    "message": "If the email address is registered and not yet verified, you will receive a verification link shortly."
                }
            
            # Check for rate limiting - reuse password reset logic
            has_recent_reset = await password_reset_token.has_recent_token(
                db, user_id=user.id, minutes_threshold=5
            )
            
            if has_recent_reset:
                logger.warning(f"Rate limit: Recent verification resend for {resend_data.email}")
                # Return success anyway to prevent email enumeration
                return {
                    "message": "If the email address is registered and not yet verified, you will receive a verification link shortly."
                }
            
            # Generate new verification token
            verification_token = create_access_token(
                subject=user.id,
                settings=settings,
                expires_delta=timedelta(hours=24)  # 24-hour expiration
            )
            
            logger.info(f"New verification token generated for user {user.id}")
            
            # Queue verification email
            try:
                task_result = send_verification_email_task.delay(
                    user_email=user.email,
                    user_name=user.full_name or user.email,
                    verification_token=verification_token
                )
                logger.info(f"Verification email task queued for: {user.email} (task_id: {task_result.id})")
            except Exception as email_error:
                # Log error but don't fail the request
                logger.error(f"Failed to queue verification email for {user.email}: {email_error}")
                # Continue with success response
        else:
            logger.info(f"Verification resend requested for non-existent email: {resend_data.email}")
            # Don't reveal that email doesn't exist
        
        # Always return the same message for security
        return {
            "message": "If the email address is registered and not yet verified, you will receive a verification link shortly."
        }
        
    except Exception as e:
        logger.error(f"Verification resend failed for {resend_data.email}: {e}")
        # Return generic error to prevent information disclosure
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process verification resend request. Please try again later."
        )