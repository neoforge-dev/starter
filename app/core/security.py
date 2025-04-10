from app.core.config import Settings
from app.crud import user as user_crud
from app.schemas import TokenPayload
from app.models import User
from app.api.deps import get_db

async def get_current_user(
    settings: Settings,
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Gets the current user based on the provided token and settings."""
    logger.debug(f"Attempting to get current user with token: {token[:10]}...")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    inactive_exception = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Inactive user"
    )

    try:
        logger.debug("Decoding JWT token...")
        secret_value = settings.secret_key.get_secret_value()
        payload = jwt.decode(
            token, secret_value, algorithms=[settings.algorithm]
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            logger.warning("User ID ('sub') not found in token payload.")
            raise credentials_exception
        logger.debug(f"User ID from token: {user_id}")
        token_data = TokenPayload(sub=user_id)
        logger.debug(f"Token payload validated: {token_data}")

    except (JWTError, ValidationError) as e:
        logger.warning(f"Token validation/decoding error: {e}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error during token processing: {e}", exc_info=True)
        raise credentials_exception

    user = await user_crud.get(db, id=int(token_data.sub))

    if user is None:
        logger.warning(f"User with ID {token_data.sub} not found in DB.")
        raise credentials_exception

    if not user.is_active:
        logger.warning(f"User {user.id} is inactive.")
        raise inactive_exception

    logger.debug(f"Returning active user: {user.id}")
    return user 