"""AI Workflow Pydantic Schemas.

Request/response schemas for AI workflow API endpoints.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# Base schemas
class TimestampMixin(BaseModel):
    """Mixin for timestamp fields."""

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# Workflow Session schemas
class WorkflowSessionBase(BaseModel):
    """Base workflow session schema."""

    session_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    status: str = "active"
    created_by: str
    metadata: Optional[Dict[str, Any]] = None


class WorkflowSessionCreate(WorkflowSessionBase):
    """Create workflow session schema."""

    pass


class WorkflowSessionUpdate(BaseModel):
    """Update workflow session schema."""

    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    completed_at: Optional[datetime] = None


class WorkflowSession(WorkflowSessionBase, TimestampMixin):
    """Workflow session response schema."""

    id: UUID
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class WorkflowSessionWithStats(WorkflowSession):
    """Workflow session with statistics."""

    batch_count: int = 0
    checkpoint_count: int = 0
    task_count: int = 0


# Workflow Checkpoint schemas
class WorkflowCheckpointBase(BaseModel):
    """Base checkpoint schema."""

    checkpoint_id: str
    session_id: str
    agent_id: str
    checkpoint_type: str = "automatic"
    context_data: Dict[str, Any]
    compressed: bool = False
    size_bytes: Optional[int] = None
    previous_checkpoint_id: Optional[str] = None
    tags: Optional[List[str]] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class WorkflowCheckpointCreate(WorkflowCheckpointBase):
    """Create checkpoint schema."""

    pass


class WorkflowCheckpointUpdate(BaseModel):
    """Update checkpoint schema."""

    description: Optional[str] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class WorkflowCheckpoint(WorkflowCheckpointBase, TimestampMixin):
    """Checkpoint response schema."""

    id: UUID

    model_config = {"from_attributes": True}


# Agent Message schemas
class AgentMessageBase(BaseModel):
    """Base agent message schema."""

    message_id: str
    from_agent: str
    to_agent: Optional[str] = None  # None for broadcast
    message_type: str
    payload: Dict[str, Any]
    priority: int = Field(default=5, ge=1, le=10)
    correlation_id: Optional[str] = None
    reply_to: Optional[str] = None
    session_id: Optional[str] = None
    expires_at: Optional[datetime] = None


class AgentMessageCreate(AgentMessageBase):
    """Create agent message schema."""

    pass


class AgentMessageUpdate(BaseModel):
    """Update agent message schema."""

    status: Optional[str] = None
    delivery_attempts: Optional[int] = None
    delivered_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None


class AgentMessage(AgentMessageBase, TimestampMixin):
    """Agent message response schema."""

    id: UUID
    status: str = "pending"
    delivery_attempts: int = 0
    max_delivery_attempts: int = 3
    delivered_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# Task Batch schemas
class TaskBatchBase(BaseModel):
    """Base task batch schema."""

    batch_id: str
    name: str
    description: Optional[str] = None
    execution_strategy: str = "sequential"
    rollback_strategy: str = "reverse_order"
    timeout_seconds: Optional[int] = None
    session_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class TaskBatchCreate(TaskBatchBase):
    """Create task batch schema."""

    pass


class TaskBatchUpdate(BaseModel):
    """Update task batch schema."""

    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class TaskBatch(TaskBatchBase, TimestampMixin):
    """Task batch response schema."""

    id: UUID
    status: str = "pending"
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TaskBatchWithStats(TaskBatch):
    """Task batch with statistics."""

    task_stats: Dict[str, int] = Field(default_factory=dict)
    total_tasks: int = 0


# Task schemas
class TaskDependencySchema(BaseModel):
    """Task dependency schema."""

    task_id: str
    dependency_type: str = "completion"
    condition: Optional[Dict[str, Any]] = None


class TaskBase(BaseModel):
    """Base task schema."""

    task_id: str
    name: str
    description: Optional[str] = None
    task_type: str
    agent_id: str
    priority: str = "normal"
    parameters: Dict[str, Any] = Field(default_factory=dict)
    timeout_seconds: Optional[int] = None
    max_retries: int = 3
    retry_delay_seconds: int = 30
    rollback_on_failure: bool = True
    batch_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class TaskCreate(TaskBase):
    """Create task schema."""

    dependencies: Optional[List[TaskDependencySchema]] = None


class TaskUpdate(BaseModel):
    """Update task schema."""

    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    execution_time_seconds: Optional[float] = None
    result_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    rollback_data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class Task(TaskBase, TimestampMixin):
    """Task response schema."""

    id: UUID
    status: str = "pending"
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    execution_time_seconds: Optional[float] = None
    result_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    rollback_data: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}


# Quality Gate Execution schemas
class QualityGateExecutionBase(BaseModel):
    """Base quality gate execution schema."""

    execution_id: str
    gate_type: str
    gate_name: Optional[str] = None
    status: str
    score: Optional[float] = None
    details: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    recommendations: Optional[List[str]] = None
    started_at: datetime
    execution_time_seconds: float
    timeout_seconds: Optional[int] = None
    session_id: Optional[str] = None
    batch_id: Optional[str] = None
    triggered_by: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class QualityGateExecutionCreate(QualityGateExecutionBase):
    """Create quality gate execution schema."""

    pass


class QualityGateExecutionUpdate(BaseModel):
    """Update quality gate execution schema."""

    status: Optional[str] = None
    score: Optional[float] = None
    details: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    recommendations: Optional[List[str]] = None
    completed_at: Optional[datetime] = None
    execution_time_seconds: Optional[float] = None


class QualityGateExecution(QualityGateExecutionBase, TimestampMixin):
    """Quality gate execution response schema."""

    id: UUID
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# Agent Registry schemas
class AgentRegistryBase(BaseModel):
    """Base agent registry schema."""

    agent_id: str
    agent_type: str
    name: str
    description: Optional[str] = None
    version: Optional[str] = None
    supported_task_types: Optional[List[str]] = None
    capabilities: Optional[Dict[str, Any]] = None
    configuration: Optional[Dict[str, Any]] = None
    registered_by: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AgentRegistryCreate(AgentRegistryBase):
    """Create agent registry schema."""

    pass


class AgentRegistryUpdate(BaseModel):
    """Update agent registry schema."""

    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    version: Optional[str] = None
    supported_task_types: Optional[List[str]] = None
    capabilities: Optional[Dict[str, Any]] = None
    configuration: Optional[Dict[str, Any]] = None
    last_heartbeat: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class AgentRegistry(AgentRegistryBase, TimestampMixin):
    """Agent registry response schema."""

    id: UUID
    status: str = "active"
    last_heartbeat: Optional[datetime] = None
    registered_at: datetime

    model_config = {"from_attributes": True}


# Workflow Metrics schemas
class WorkflowMetricsBase(BaseModel):
    """Base workflow metrics schema."""

    metric_name: str
    metric_type: str
    value: float
    labels: Optional[Dict[str, str]] = None
    session_id: Optional[str] = None
    agent_id: Optional[str] = None
    component: Optional[str] = None
    time_window: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class WorkflowMetrics(WorkflowMetricsBase):
    """Workflow metrics response schema."""

    id: UUID
    recorded_at: datetime

    model_config = {"from_attributes": True}


# API Response schemas
class MessageResponse(BaseModel):
    """Standard message response."""

    message: str
    success: bool = True


class ValidationErrorResponse(BaseModel):
    """Validation error response."""

    message: str
    errors: List[Dict[str, Any]]
    success: bool = False


class StatisticsResponse(BaseModel):
    """Statistics response."""

    statistics: Dict[str, Any]
    generated_at: datetime = Field(default_factory=datetime.now)


class HealthCheckResponse(BaseModel):
    """Health check response."""

    status: str
    components: Dict[str, Dict[str, Any]]
    timestamp: datetime = Field(default_factory=datetime.now)
