"""Dependencies for API endpoints."""
from typing import AsyncGenerator, Optional, Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app import crud
from app.models.user import User
from app.models.admin import Admin
from app.core import security
from app.core.config import settings
from app.db.session import AsyncSessionLocal, get_db
from app.schemas.auth import TokenPayload
from app.db.query_monitor import QueryMonitor

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.api_v1_str}/auth/token"
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session."""
    async with AsyncSessionLocal() as session:
        yield session


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    """Get current user from token."""
    logger = logging.getLogger(__name__)
    logger.debug(f"Attempting to decode token: {token[:10]}...")
    
    try:
        payload = jwt.decode(
            token, settings.secret_key.get_secret_value(), algorithms=[settings.algorithm]
        )
        logger.debug(f"Token decoded successfully, payload sub: {payload.get('sub')}")
        token_data = TokenPayload(**payload)
    except (jwt.JWTError, ValidationError) as e:
        logger.debug(f"Token validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    user = await crud.user.get(db, id=token_data.sub)
    if not user:
        logger.debug(f"User not found for id: {token_data.sub}")
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        logger.debug(f"User found but not active for id: {token_data.sub}")
        raise HTTPException(status_code=400, detail="Inactive user")
    logger.debug(f"User found for id: {token_data.sub}, email: {user.email}")
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active superuser."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user


async def get_current_admin(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Admin:
    """Get current admin user."""
    logger = logging.getLogger(__name__)
    logger.debug(f"Attempting to get admin for user_id: {current_user.id}")
    
    try:
        admin = await crud.admin.get_by_user_id(db=db, user_id=current_user.id)
        if not admin:
            logger.debug(f"No admin found for user_id: {current_user.id} - raising 403 FORBIDDEN")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The user is not an admin",
            )
        if not admin.is_active:
            logger.debug(f"Admin found but not active for user_id: {current_user.id} - raising 403 FORBIDDEN")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive admin user",
            )
        logger.debug(f"Admin found for user_id: {current_user.id}, admin_id: {admin.id}, role: {admin.role}")
        return admin
    except HTTPException as e:
        logger.debug(f"HTTPException in get_current_admin: status_code={e.status_code}, detail={e.detail}")
        raise
    except Exception as e:
        logger.debug(f"Unexpected exception in get_current_admin: {str(e)}")
        raise


async def get_current_active_admin(
    current_admin: Admin = Depends(get_current_admin),
) -> Admin:
    """Get current active admin."""
    if not current_admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive admin user",
        )
    return current_admin


async def get_monitored_db() -> AsyncGenerator[QueryMonitor, None]:
    """
    Get database session with query monitoring.
    
    This dependency provides a monitored database session that tracks:
    - Query execution time
    - Query types and tables
    - Slow queries (>100ms)
    - Query errors
    
    Example:
        @router.get("/items")
        async def get_items(db: Annotated[QueryMonitor, Depends(get_monitored_db)]):
            result = await db.execute("SELECT * FROM items")
            return result.fetchall()
    """
    try:
        # Create a generator to get the session
        session_gen = get_db()
        try:
            # Get the session from the generator
            session = await anext(session_gen)
            monitor = QueryMonitor(session)
            try:
                # Set initial query to None
                monitor.current_query = None
                yield monitor
            except Exception as e:
                # Ensure session is closed on error
                await session.close()
                # For health check endpoints, convert database errors to 503
                if hasattr(monitor, 'current_query') and monitor.current_query and 'health' in str(monitor.current_query).lower():
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=f"Database unhealthy: {str(e)}",
                    ) from e
                raise
            finally:
                await session.close()
        except StopAsyncIteration:
            # Handle the case where the generator is empty
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection failed",
            )
        except Exception as e:
            # For health check endpoints, convert database errors to 503
            if 'health' in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Database unhealthy: {str(e)}",
                ) from e
            raise
    except Exception as e:
        # For health check endpoints, convert database errors to 503
        if 'health' in str(e).lower() or 'health' in str(e.__context__).lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Database unhealthy: {str(e)}",
            ) from e
        raise

# Type alias for monitored database dependency
MonitoredDB = Annotated[QueryMonitor, Depends(get_monitored_db)] 