from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.sql import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from app.db.session import AsyncSessionLocal
import sys  # ensure APIRouter is imported, but it's already imported above

router = APIRouter()

@router.get("", tags=["system"], summary="Health Check")
async def health_check():
    return {"status": "healthy"}

 