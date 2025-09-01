from datetime import timedelta
from typing import Any

import structlog
from app.api.deps import get_db
from app.crud import user as user_crud
from app.models import User
from app.schemas import TokenPayload
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt

from app.core.config import Settings

logger = structlog.get_logger(__name__)


async def get_current_user(
    settings: Settings,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Gets the current user based on the provided token."""
    logger.debug(f"Attempting to get current user with token: {token[:10]}...")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    inactive_exception = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
    )

    try:
        logger.debug("Decoding JWT token...")
        secret_value = settings.secret_key.get_secret_value()
        logger.debug(
            f"[VERIFY_TOKEN] Using Secret Key: {secret_value[:5]}...{secret_value[-5:]}"
        )
        payload = jwt.decode(token, secret_value, algorithms=[settings.algorithm])
        logger.debug(f"Token payload decoded: {payload}")
        user_id: str | None = payload.get("sub")
        if user_id is None:
            logger.warning("User ID ('sub') not found in token payload.")
            raise credentials_exception
        logger.debug(f"User ID from token: {user_id}")
        token_data = TokenPayload(sub=user_id)
        logger.debug(f"Token payload validated: {token_data}")

    except JWTError as e:
        logger.warning(f"JWTError during token decoding: {e}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error during token processing: {e}", exc_info=True)
        raise credentials_exception

    logger.debug(f"Fetching user with ID: {user_id} from database...")
    user = await user_crud.get(db, id=int(user_id))
    if user is None:
        logger.warning(f"User with ID {user_id} not found in database.")
        raise credentials_exception

    if not user.is_active:
        logger.warning(f"User {user_id} is inactive.")
        raise inactive_exception

    logger.debug(f"Current user retrieved successfully: {user.email}")
    return user


def verify_password(plain_password: str, hashed_password: str) -> bool:
    pass


def get_password_hash(password: str) -> str:
    pass


def create_access_token(
    subject: str | Any, settings: Settings, expires_delta: timedelta | None = None
) -> str:
    pass
