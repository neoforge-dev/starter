"""Dependencies for API endpoints."""
from typing import AsyncGenerator, Optional, Annotated

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.models.user import User
from app.models.admin import Admin
from app.core.security import get_current_user, oauth2_scheme
from app.core.config import Settings, get_settings
from app.db.session import AsyncSessionLocal, get_db
from app.db.query_monitor import QueryMonitor
from app import crud


# Dependency to get the current user based on token and settings
# Note: This is the raw dependency, usually used via other dependencies below
# def get_current_user_dependency( # REMOVED WRAPPER
#     settings: Settings = Depends(get_settings),
#     db: AsyncSession = Depends(get_db),
#     token: str = Depends(oauth2_scheme)
# ) -> User:
#     # This wrapper calls the actual refactored get_current_user
#     # We need this wrapper because FastAPI resolves dependencies based on
#     # the function signature provided to Depends(), not the signature of the
#     # underlying callable if it's different.
#     return get_current_user(settings=settings, db=db, token=token)


async def get_db(request: Request) -> AsyncGenerator[AsyncSession, None]:
    """Get database session, prioritizing test session from app state."""
    logger = logging.getLogger(__name__)
    if hasattr(request.app.state, "_test_session") and request.app.state._test_session:
        logger.debug(f"Using test session {id(request.app.state._test_session)} from app.state")
        yield request.app.state._test_session
        return
        
    logger.debug("Creating new session via AsyncSessionLocal")
    async with AsyncSessionLocal() as session:
        yield session


async def get_current_active_user(
    # Now depend directly on the components needed by get_current_user
    settings: Settings = Depends(get_settings),
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    request: Request = None 
) -> User:
    """Get current active user."""
    current_user = await get_current_user(settings=settings, db=db, token=token)
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user), # This dependency chain is now correct
) -> User:
    """Get current active superuser."""
    logger = logging.getLogger(__name__)
    logger.debug(f"Checking superuser status for user: {current_user.id}, is_superuser: {current_user.is_superuser}")
    if not current_user.is_superuser:
        logger.warning(f"User {current_user.id} is not a superuser.")
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    logger.debug(f"User {current_user.id} is a superuser.")
    return current_user


async def get_current_admin(
    # Depend on components needed by get_current_user and for admin lookup
    settings: Settings = Depends(get_settings),
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    request: Request = None 
) -> Admin:
    """Get current admin user."""
    # Get the user first
    current_user = await get_current_user(settings=settings, db=db, token=token)
    
    logger = logging.getLogger(__name__)
    logger.debug(f"Attempting to get admin for user_id: {current_user.id}") # Now current_user is a User object
    
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
    current_admin: Admin = Depends(get_current_admin), # This chain is now correct
) -> Admin:
    """Get current active admin."""
    if not current_admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive admin user",
        )
    return current_admin


async def get_monitored_db(request: Request) -> AsyncGenerator[QueryMonitor, None]:
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
    logger = logging.getLogger(__name__)
    if hasattr(request.app.state, "_test_session") and request.app.state._test_session:
        logger.debug(f"Using test session {id(request.app.state._test_session)} from app.state for monitored DB")
        session = request.app.state._test_session
        monitor = QueryMonitor(session) 
        try:
            monitor.current_query = None
            yield monitor
            # NOTE: We don't close the session here, as it's managed by the test fixture
        except Exception as e:
            # Log and potentially raise specific errors if needed
            logger.error(f"Error using monitored test session: {e}", exc_info=True)
            raise
        return # Exit after yielding the test session monitor

    logger.debug("Creating new monitored session via get_db")
    try:
        # Create a generator to get the session using the *modified* get_db
        session_gen = get_db(request) # Pass request here
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