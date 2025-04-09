"""Authentication endpoints."""
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token
from app.core.config import Settings, get_settings
from app.crud.user import user as user_crud
from app.db.session import get_db
from app.schemas.auth import Token, TokenPayload
from app.models.user import User
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
    return Token(
        access_token=create_access_token(
            subject=user.id, settings=settings, expires_delta=access_token_expires
        ),
        token_type="bearer",
    )