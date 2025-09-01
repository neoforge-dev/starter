"""Database base model."""
from app.db.base_class import Base
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
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.community_post import CommunityPost  # noqa: F401
from app.models.idempotency_key import IdempotencyKey  # noqa: F401
from app.models.item import Item  # noqa: F401
from app.models.project import Project  # noqa: F401
from app.models.status_event import StatusEvent  # noqa: F401
from app.models.support_ticket import SupportTicket  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.user_session import UserSession  # noqa: F401

# SQLAlchemy needs to know about all models for metadata
metadata = Base.metadata
