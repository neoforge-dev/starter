"""Database base model."""
from app.db.base_class import Base
from app.models.ab_test import AbTest, AbTestVariant, AbTestAssignment  # noqa: F401
from app.models.admin import Admin, AdminAuditLog, AdminPermission  # noqa: F401
from app.models.ai_workflow import (  # noqa: F401
    AgentMessage,
    AgentRegistry,
    QualityGateExecution,
    Task,
    TaskBatch,
    TaskDependency,
    WorkflowCheckpoint,
    WorkflowMetrics,
    WorkflowSession,
)
from app.models.article import Article  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.comment import Comment  # noqa: F401
from app.models.community_post import CommunityPost  # noqa: F401
from app.models.content_suggestion import (  # noqa: F401
    ContentItem,
    ContentSuggestion,
    ContentSuggestionFeedback,
    ContentAnalysisJob,
)
from app.models.email_tracking import EmailTracking, EmailEvent  # noqa: F401
from app.models.event import Event  # noqa: F401
from app.models.funnel import ConversionFunnel, FunnelStep, FunnelUserJourney  # noqa: F401
from app.models.idempotency_key import IdempotencyKey  # noqa: F401
from app.models.item import Item  # noqa: F401
from app.models.password_reset_token import PasswordResetToken  # noqa: F401
from app.models.personalization import (  # noqa: F401
    PersonalizationProfile,
    PersonalizationRule,
    PersonalizationInteraction,
    UserPersonalizationRules,
    PersonalizationSegmentAnalysis,
)
from app.models.project import Project  # noqa: F401
from app.models.rbac import (  # noqa: F401
    Permission,
    Role,
    ResourcePermission,
    PermissionCache,
    RoleAuditLog,
)
from app.models.recommendation import (  # noqa: F401
    Recommendation,
    UserPreferences,
    RecommendationFeedback,
    SimilarUsers,
)
from app.models.status_event import StatusEvent  # noqa: F401
from app.models.subscription import (  # noqa: F401
    SubscriptionPlan,
    UserSubscription,
    Payment,
    UsageRecord,
    Invoice,
    PromoCode,
    SubscriptionEvent,
)
from app.models.support_ticket import SupportTicket  # noqa: F401
from app.models.tag import Tag  # noqa: F401
from app.models.tenant import (  # noqa: F401
    Tenant,
    Organization,
    OrganizationMembership,
    TenantAuditLog,
)
from app.models.user import User  # noqa: F401
from app.models.user_session import UserSession  # noqa: F401

# SQLAlchemy needs to know about all models for metadata
metadata = Base.metadata
