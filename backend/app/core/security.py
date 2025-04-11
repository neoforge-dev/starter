"""Security utilities."""
from datetime import datetime, timedelta, UTC
from typing import Annotated, Any, Union, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.core.auth import verify_password
from app.crud.user import user as user_crud
from app.db.session import get_db
from app.schemas.user import UserResponse
from app.core.logging import logger
from app.models import User
from app.schemas import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


def create_access_token(
    subject: Union[str, Any], 
    settings: Settings,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT access token.
    
    Args:
        subject: Token subject (usually user ID)
        expires_delta: Optional token expiration time
        settings: Application settings dependency
        
    Returns:
        Encoded JWT token
    """
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    secret_value = settings.secret_key.get_secret_value()
    logger.debug(f"[CREATE_TOKEN] Using Secret Key: {secret_value[:5]}...{secret_value[-5:]}") # Log key safely
    encoded_jwt = jwt.encode(
        to_encode,
        secret_value,
        algorithm=settings.algorithm,
    )
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    """Gets the current user based on the provided token."""
    logger.debug(f"Attempting to get current user with token: {token[:10]}...")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        logger.debug("Decoding JWT token...")
        secret_value = settings.secret_key.get_secret_value()
        logger.debug(f"[VERIFY_TOKEN] Using Secret Key: {secret_value[:5]}...{secret_value[-5:]}") # Log key safely
        payload = jwt.decode(
            token, secret_value, algorithms=[settings.algorithm]
        )
        logger.debug(f"Token payload decoded: {payload}")
        user_id: str | None = payload.get("sub")
        if user_id is None:
            logger.warning("User ID ('sub') not found in token payload.")
            raise credentials_exception
        logger.debug(f"User ID from token: {user_id}")
        # Validate payload structure (optional but good practice)
        try:
             token_data = TokenPayload(sub=user_id)
             logger.debug(f"Token payload validated: {token_data}")
        except ValidationError as e:
            logger.warning(f"Token payload validation failed: {e}")
            raise credentials_exception


    except JWTError as e:
        logger.warning(f"JWTError during token decoding: {e}")
        raise credentials_exception
    except Exception as e: # Catch unexpected errors during decoding/validation
        logger.error(f"Unexpected error during token processing: {e}", exc_info=True)
        raise credentials_exception


    try:
        user_id_int = int(token_data.sub) # Convert sub to int
        logger.debug(f"Attempting to fetch user with ID: {user_id_int}")
        user = await user_crud.get(db, id=user_id_int)
        logger.debug(f"User lookup result: {'Found' if user else 'Not Found'}")
    except ValueError:
        logger.warning(f"Could not convert user ID '{token_data.sub}' to integer.")
        raise credentials_exception
    except Exception as e:
        # Log unexpected errors during user retrieval
        logger.error(f"Error retrieving user by ID {user_id_int}: {e}", exc_info=True)
        # Raise a generic 500 for unexpected DB errors, but maybe keep 401 for auth flow?
        raise credentials_exception # Or consider status.HTTP_500_INTERNAL_SERVER_ERROR

    if user is None:
        logger.warning(f"User with ID {user_id_int} not found in DB.")
        # Raise 404 specifically when user is not found
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Add detailed log before returning
    logger.info(f"get_current_user returning User ID: {user.id}, Email: {user.email}, Is Superuser: {user.is_superuser}") 
    logger.debug(f"Returning user: {user.email}, ID: {user.id}") # Keep debug log
    return user 