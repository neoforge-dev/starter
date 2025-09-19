"""API v1 router configuration."""
from app.api.endpoints import (
    ab_tests,
    config,
    csp,
    examples,
    health,
    pagination_metrics,
)
from app.api.v1.endpoints import (
    account,
    admin,
    analytics,
    auth,
    branding,
    community,
    content_suggestions,
    events,
    items,
    organizations,
    # personalization,  # Temporarily disabled due to NumPy production issues
    projects,
    rbac,
    # recommendations,  # Temporarily disabled due to NumPy production issues
    saml,
    security,
)
from app.api.v1.endpoints import billing
from app.api.v1.endpoints import status as status_ep
from app.api.v1.endpoints import support, users, webhooks
from fastapi import APIRouter

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(account.router, prefix="/account", tags=["account"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
# api_router.include_router(
#     recommendations.router, prefix="/recommendations", tags=["recommendations"]
# )  # Temporarily disabled due to NumPy production issues
# api_router.include_router(
#     personalization.router, prefix="/personalization", tags=["personalization"]
# )  # Temporarily disabled due to NumPy production issues
api_router.include_router(
    content_suggestions.router,
    prefix="/content-suggestions",
    tags=["content-suggestions"],
)
api_router.include_router(
    organizations.router, prefix="/organizations", tags=["organizations"]
)
api_router.include_router(rbac.router, prefix="/rbac", tags=["rbac"])
api_router.include_router(saml.router, prefix="/auth/saml", tags=["saml", "enterprise"])
api_router.include_router(branding.router, prefix="/branding", tags=["branding", "enterprise"])
api_router.include_router(security.router, prefix="/security", tags=["security"])
api_router.include_router(health.router, prefix="/health", tags=["system"])
api_router.include_router(config.router, tags=["system"])
api_router.include_router(examples.router, tags=["examples"])
api_router.include_router(csp.router, tags=["security"])
api_router.include_router(projects.router, tags=["projects"])
api_router.include_router(support.router, tags=["support"])
api_router.include_router(community.router, tags=["community"])
api_router.include_router(status_ep.router, tags=["status"])
api_router.include_router(analytics.router, tags=["analytics"])
api_router.include_router(
    pagination_metrics.router, prefix="/metrics", tags=["monitoring"]
)
api_router.include_router(ab_tests.router, prefix="/ab-tests", tags=["ab-testing"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
