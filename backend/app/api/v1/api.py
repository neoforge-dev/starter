"""API v1 router configuration."""
from fastapi import APIRouter

from app.api.v1.endpoints import users, items, auth, admin, webhooks, events
from app.api.v1.endpoints import projects, support, community, status as status_ep, analytics
from app.api.endpoints import health, examples, config, csp, pagination_metrics, ab_tests

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(health.router, prefix="/health", tags=["system"])
api_router.include_router(config.router, tags=["system"])
api_router.include_router(examples.router, tags=["examples"]) 
api_router.include_router(csp.router, tags=["security"]) 
api_router.include_router(projects.router, tags=["projects"])
api_router.include_router(support.router, tags=["support"])
api_router.include_router(community.router, tags=["community"])
api_router.include_router(status_ep.router, tags=["status"]) 
api_router.include_router(analytics.router, tags=["analytics"])
api_router.include_router(pagination_metrics.router, prefix="/metrics", tags=["monitoring"])
api_router.include_router(ab_tests.router, prefix="/ab-tests", tags=["ab-testing"]) 