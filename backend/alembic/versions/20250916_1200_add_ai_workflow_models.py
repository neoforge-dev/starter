"""Add AI workflow models

Revision ID: 20250916_1200_ai_workflow
Revises: 20250903_1230_add_subscription_tables
Create Date: 2025-09-16 12:00:00.000000

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20250916_1200_ai_workflow"
down_revision = "20250903_1230_add_subscription_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add AI workflow model tables."""

    # Create workflow_sessions table
    op.create_table(
        "workflow_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("created_by", sa.String(255), nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("extra_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id"),
    )

    # Create workflow_checkpoints table
    op.create_table(
        "workflow_checkpoints",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("checkpoint_id", sa.String(255), nullable=False),
        sa.Column("session_id", sa.String(255), nullable=False),
        sa.Column("agent_id", sa.String(255), nullable=False),
        sa.Column("checkpoint_type", sa.String(50), nullable=False),
        sa.Column("context_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("compressed", sa.Boolean(), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=True),
        sa.Column("previous_checkpoint_id", sa.String(255), nullable=True),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("extra_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("workflow_session_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("checkpoint_id"),
        sa.ForeignKeyConstraint(["workflow_session_id"], ["workflow_sessions.id"]),
    )

    # Create agent_messages table
    op.create_table(
        "agent_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("message_id", sa.String(255), nullable=False),
        sa.Column("from_agent", sa.String(255), nullable=False),
        sa.Column("to_agent", sa.String(255), nullable=True),
        sa.Column("message_type", sa.String(100), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False),
        sa.Column("correlation_id", sa.String(255), nullable=True),
        sa.Column("reply_to", sa.String(255), nullable=True),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("delivery_attempts", sa.Integer(), nullable=False),
        sa.Column("max_delivery_attempts", sa.Integer(), nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("expires_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("delivered_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("acknowledged_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("session_id", sa.String(255), nullable=True),
        sa.Column("workflow_session_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("message_id"),
        sa.ForeignKeyConstraint(["workflow_session_id"], ["workflow_sessions.id"]),
    )

    # Create task_batches table
    op.create_table(
        "task_batches",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("batch_id", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("execution_strategy", sa.String(50), nullable=False),
        sa.Column("rollback_strategy", sa.String(50), nullable=False),
        sa.Column("timeout_seconds", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("started_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("completed_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("session_id", sa.String(255), nullable=True),
        sa.Column("workflow_session_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("extra_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("batch_id"),
        sa.ForeignKeyConstraint(["workflow_session_id"], ["workflow_sessions.id"]),
    )

    # Create tasks table
    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("task_id", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("task_type", sa.String(100), nullable=False),
        sa.Column("agent_id", sa.String(255), nullable=False),
        sa.Column("priority", sa.String(50), nullable=False),
        sa.Column("parameters", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("timeout_seconds", sa.Integer(), nullable=True),
        sa.Column("max_retries", sa.Integer(), nullable=False),
        sa.Column("retry_delay_seconds", sa.Integer(), nullable=False),
        sa.Column("rollback_on_failure", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("scheduled_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("started_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("completed_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("execution_time_seconds", sa.Float(), nullable=True),
        sa.Column("result_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("rollback_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("batch_id", sa.String(255), nullable=True),
        sa.Column("task_batch_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("extra_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("task_id"),
        sa.ForeignKeyConstraint(["task_batch_id"], ["task_batches.id"]),
    )

    # Create task_dependencies table
    op.create_table(
        "task_dependencies",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("depends_on_task_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("dependency_type", sa.String(50), nullable=False),
        sa.Column("condition", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"]),
        sa.ForeignKeyConstraint(["depends_on_task_id"], ["tasks.id"]),
    )

    # Create quality_gate_executions table
    op.create_table(
        "quality_gate_executions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("execution_id", sa.String(255), nullable=False),
        sa.Column("gate_type", sa.String(100), nullable=False),
        sa.Column("gate_name", sa.String(255), nullable=True),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("details", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("metrics", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("recommendations", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("started_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("completed_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("execution_time_seconds", sa.Float(), nullable=False),
        sa.Column("timeout_seconds", sa.Integer(), nullable=True),
        sa.Column("session_id", sa.String(255), nullable=True),
        sa.Column("batch_id", sa.String(255), nullable=True),
        sa.Column("triggered_by", sa.String(255), nullable=True),
        sa.Column("configuration", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("extra_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("execution_id"),
    )

    # Create agent_registry table
    op.create_table(
        "agent_registry",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agent_id", sa.String(255), nullable=False),
        sa.Column("agent_type", sa.String(100), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("last_heartbeat", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("version", sa.String(50), nullable=True),
        sa.Column("supported_task_types", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("capabilities", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("registered_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("registered_by", sa.String(255), nullable=True),
        sa.Column("configuration", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("extra_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("agent_id"),
    )

    # Create workflow_metrics table
    op.create_table(
        "workflow_metrics",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("metric_name", sa.String(255), nullable=False),
        sa.Column("metric_type", sa.String(50), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("labels", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("session_id", sa.String(255), nullable=True),
        sa.Column("agent_id", sa.String(255), nullable=True),
        sa.Column("component", sa.String(100), nullable=True),
        sa.Column("recorded_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("time_window", sa.String(50), nullable=True),
        sa.Column("extra_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes
    op.create_index("idx_workflow_sessions_status", "workflow_sessions", ["status"])
    op.create_index("idx_workflow_sessions_created_by", "workflow_sessions", ["created_by"])
    op.create_index("idx_checkpoints_session_agent", "workflow_checkpoints", ["session_id", "agent_id"])
    op.create_index("idx_checkpoints_type", "workflow_checkpoints", ["checkpoint_type"])
    op.create_index("idx_messages_to_agent_status", "agent_messages", ["to_agent", "status"])
    op.create_index("idx_messages_from_agent", "agent_messages", ["from_agent"])
    op.create_index("idx_messages_correlation", "agent_messages", ["correlation_id"])
    op.create_index("idx_tasks_agent_status", "tasks", ["agent_id", "status"])
    op.create_index("idx_tasks_type_priority", "tasks", ["task_type", "priority"])
    op.create_index("idx_tasks_batch_status", "tasks", ["batch_id", "status"])
    op.create_index("idx_quality_gates_type_status", "quality_gate_executions", ["gate_type", "status"])
    op.create_index("idx_quality_gates_session", "quality_gate_executions", ["session_id"])
    op.create_index("idx_agent_registry_type_status", "agent_registry", ["agent_type", "status"])
    op.create_index("idx_metrics_name_component", "workflow_metrics", ["metric_name", "component"])
    op.create_index("idx_metrics_session_recorded", "workflow_metrics", ["session_id", "recorded_at"])


def downgrade() -> None:
    """Remove AI workflow model tables."""

    # Drop tables in reverse order to handle foreign key dependencies
    op.drop_table("workflow_metrics")
    op.drop_table("agent_registry")
    op.drop_table("quality_gate_executions")
    op.drop_table("task_dependencies")
    op.drop_table("tasks")
    op.drop_table("task_batches")
    op.drop_table("agent_messages")
    op.drop_table("workflow_checkpoints")
    op.drop_table("workflow_sessions")</content>
</xai:function_call: write> <file name="backend/alembic/versions/20250916_1200_add_ai_workflow_models.py">Created file: backend/alembic/versions/20250916_1200_add_ai_workflow_models.py