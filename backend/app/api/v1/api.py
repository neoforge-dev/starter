"""API v1 router configuration."""
from fastapi import APIRouter

from app.api.v1.endpoints import users, items, auth, admin
from app.api.endpoints import health, examples

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(health.router, prefix="/health", tags=["system"])
api_router.include_router(examples.router, tags=["examples"]) 