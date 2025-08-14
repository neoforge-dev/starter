"""AI Workflow Database Models.

SQLModel database models for AI workflow state persistence including
agent communication, task execution, quality gates, and state management.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
import uuid
from sqlalchemy import Column, DateTime, String, Text, Boolean, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class WorkflowSession(Base):
    """Workflow session for tracking AI workflow execution."""
    
    __tablename__ = "workflow_sessions"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, completed, failed, paused
    created_by: Mapped[str] = mapped_column(String(255))  # Agent or user ID
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    extra_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    
    # Relationships
    checkpoints: Mapped[List["WorkflowCheckpoint"]] = relationship(
        "WorkflowCheckpoint",
        back_populates="session",
        cascade="all, delete-orphan"
    )
    task_batches: Mapped[List["TaskBatch"]] = relationship(
        "TaskBatch", 
        back_populates="session",
        cascade="all, delete-orphan"
    )
    agent_messages: Mapped[List["AgentMessage"]] = relationship(
        "AgentMessage",
        back_populates="session",
        cascade="all, delete-orphan"
    )


class WorkflowCheckpoint(Base):
    """Workflow checkpoint for state recovery."""
    
    __tablename__ = "workflow_checkpoints"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    checkpoint_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    session_id: Mapped[str] = mapped_column(String(255), index=True)
    agent_id: Mapped[str] = mapped_column(String(255), index=True)
    checkpoint_type: Mapped[str] = mapped_column(String(50))  # automatic, manual, milestone
    context_data: Mapped[Dict[str, Any]] = mapped_column(JSONB)
    compressed: Mapped[bool] = mapped_column(Boolean, default=False)
    size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    previous_checkpoint_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tags: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    extra_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    
    # Foreign key relationship
    workflow_session_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True), 
        nullable=True,
        index=True
    )
    
    # Relationships
    session: Mapped[Optional["WorkflowSession"]] = relationship(
        "WorkflowSession",
        back_populates="checkpoints"
    )


class AgentMessage(Base):
    """Agent communication message."""
    
    __tablename__ = "agent_messages"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    from_agent: Mapped[str] = mapped_column(String(255), index=True)
    to_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)  # None for broadcast
    message_type: Mapped[str] = mapped_column(String(100), index=True)
    payload: Mapped[Dict[str, Any]] = mapped_column(JSONB)
    priority: Mapped[int] = mapped_column(Integer, default=5)
    correlation_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    reply_to: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Status tracking
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, delivered, acknowledged, expired
    delivery_attempts: Mapped[int] = mapped_column(Integer, default=0)
    max_delivery_attempts: Mapped[int] = mapped_column(Integer, default=3)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Session relationship
    session_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    workflow_session_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )
    
    # Relationships
    session: Mapped[Optional["WorkflowSession"]] = relationship(
        "WorkflowSession",
        back_populates="agent_messages"
    )


class TaskBatch(Base):
    """Batch of tasks for execution."""
    
    __tablename__ = "task_batches"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Execution configuration
    execution_strategy: Mapped[str] = mapped_column(String(50), default="sequential")  # sequential, parallel, dag
    rollback_strategy: Mapped[str] = mapped_column(String(50), default="reverse_order")
    timeout_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Status tracking
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, running, completed, failed, cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Session relationship
    session_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    workflow_session_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )
    
    # Metadata
    extra_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    
    # Relationships
    session: Mapped[Optional["WorkflowSession"]] = relationship(
        "WorkflowSession",
        back_populates="task_batches"
    )
    tasks: Mapped[List["Task"]] = relationship(
        "Task",
        back_populates="batch",
        cascade="all, delete-orphan"
    )


class Task(Base):
    """Individual task within a batch."""
    
    __tablename__ = "tasks"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    task_type: Mapped[str] = mapped_column(String(100), index=True)
    agent_id: Mapped[str] = mapped_column(String(255), index=True)
    
    # Priority and execution
    priority: Mapped[str] = mapped_column(String(50), default="normal")  # critical, high, normal, low
    parameters: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict)
    timeout_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_retries: Mapped[int] = mapped_column(Integer, default=3)
    retry_delay_seconds: Mapped[int] = mapped_column(Integer, default=30)
    rollback_on_failure: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Status tracking
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, scheduled, running, completed, failed, cancelled, rolled_back
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    execution_time_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Results and errors
    result_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rollback_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    
    # Batch relationship
    batch_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    task_batch_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )
    
    # Metadata
    extra_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    
    # Relationships
    batch: Mapped[Optional["TaskBatch"]] = relationship(
        "TaskBatch",
        back_populates="tasks"
    )
    dependencies: Mapped[List["TaskDependency"]] = relationship(
        "TaskDependency",
        foreign_keys="[TaskDependency.task_id]",
        back_populates="task",
        cascade="all, delete-orphan"
    )
    dependents: Mapped[List["TaskDependency"]] = relationship(
        "TaskDependency",
        foreign_keys="[TaskDependency.depends_on_task_id]",
        back_populates="depends_on_task"
    )


class TaskDependency(Base):
    """Task dependency relationship."""
    
    __tablename__ = "task_dependencies"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), index=True)
    depends_on_task_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), index=True)
    dependency_type: Mapped[str] = mapped_column(String(50), default="completion")  # completion, partial, custom
    condition: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    task: Mapped["Task"] = relationship(
        "Task",
        foreign_keys=[task_id],
        back_populates="dependencies"
    )
    depends_on_task: Mapped["Task"] = relationship(
        "Task",
        foreign_keys=[depends_on_task_id],
        back_populates="dependents"
    )


class QualityGateExecution(Base):
    """Quality gate execution record."""
    
    __tablename__ = "quality_gate_executions"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    gate_type: Mapped[str] = mapped_column(String(100), index=True)
    gate_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Execution details
    status: Mapped[str] = mapped_column(String(50))  # passed, failed, warning, skipped, running
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    metrics: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommendations: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True)
    
    # Timing
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    execution_time_seconds: Mapped[float] = mapped_column(Float)
    timeout_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Context
    session_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    batch_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    triggered_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Configuration used
    configuration: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    extra_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)


class AgentRegistry(Base):
    """Registry of active agents in the system."""
    
    __tablename__ = "agent_registry"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    agent_type: Mapped[str] = mapped_column(String(100), index=True)  # execution, monitoring, quality, custom
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, inactive, error
    last_heartbeat: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Capabilities
    supported_task_types: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True)
    capabilities: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    
    # Registration details
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    registered_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Configuration
    configuration: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    extra_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)


class WorkflowMetrics(Base):
    """Workflow execution metrics and statistics."""
    
    __tablename__ = "workflow_metrics"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    metric_name: Mapped[str] = mapped_column(String(255), index=True)
    metric_type: Mapped[str] = mapped_column(String(50))  # counter, gauge, histogram, summary
    value: Mapped[float] = mapped_column(Float)
    labels: Mapped[Optional[Dict[str, str]]] = mapped_column(JSONB, nullable=True)
    
    # Context
    session_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    agent_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    component: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)  # messaging, execution, quality_gates
    
    # Timing
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    time_window: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # 1m, 5m, 15m, 1h, 1d
    
    # Metadata
    extra_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)


# Create indexes for better query performance
from sqlalchemy import Index

# Workflow session indexes
Index('idx_workflow_sessions_status', WorkflowSession.status)
Index('idx_workflow_sessions_created_by', WorkflowSession.created_by)

# Checkpoint indexes
Index('idx_checkpoints_session_agent', WorkflowCheckpoint.session_id, WorkflowCheckpoint.agent_id)
Index('idx_checkpoints_type', WorkflowCheckpoint.checkpoint_type)

# Message indexes
Index('idx_messages_to_agent_status', AgentMessage.to_agent, AgentMessage.status)
Index('idx_messages_from_agent', AgentMessage.from_agent)
Index('idx_messages_correlation', AgentMessage.correlation_id)

# Task indexes
Index('idx_tasks_agent_status', Task.agent_id, Task.status)
Index('idx_tasks_type_priority', Task.task_type, Task.priority)
Index('idx_tasks_batch_status', Task.batch_id, Task.status)

# Quality gate indexes
Index('idx_quality_gates_type_status', QualityGateExecution.gate_type, QualityGateExecution.status)
Index('idx_quality_gates_session', QualityGateExecution.session_id)

# Agent registry indexes
Index('idx_agent_registry_type_status', AgentRegistry.agent_type, AgentRegistry.status)

# Metrics indexes
Index('idx_metrics_name_component', WorkflowMetrics.metric_name, WorkflowMetrics.component)
Index('idx_metrics_session_recorded', WorkflowMetrics.session_id, WorkflowMetrics.recorded_at)