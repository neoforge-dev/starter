"""AI Workflow CRUD Operations.

Database operations for AI workflow models including sessions, checkpoints,
tasks, messages, and quality gates.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from app.crud.base import CRUDBase
from app.models.ai_workflow import (
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
from app.schemas.ai_workflow import (
    AgentMessageCreate,
    AgentMessageUpdate,
    AgentRegistryCreate,
    AgentRegistryUpdate,
    QualityGateExecutionCreate,
    QualityGateExecutionUpdate,
    TaskBatchCreate,
    TaskBatchUpdate,
    TaskCreate,
    TaskUpdate,
    WorkflowCheckpointCreate,
    WorkflowCheckpointUpdate,
    WorkflowSessionCreate,
    WorkflowSessionUpdate,
)
from sqlalchemy import and_, asc, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


class CRUDWorkflowSession(
    CRUDBase[WorkflowSession, WorkflowSessionCreate, WorkflowSessionUpdate]
):
    """CRUD operations for workflow sessions."""

    async def get_by_session_id(
        self, db: AsyncSession, session_id: str
    ) -> Optional[WorkflowSession]:
        """Get session by session_id."""
        result = await db.execute(
            select(WorkflowSession)
            .where(WorkflowSession.session_id == session_id)
            .options(
                selectinload(WorkflowSession.checkpoints),
                selectinload(WorkflowSession.task_batches),
                selectinload(WorkflowSession.agent_messages),
            )
        )
        return result.scalar_one_or_none()

    async def get_active_sessions(
        self, db: AsyncSession, created_by: Optional[str] = None, limit: int = 50
    ) -> List[WorkflowSession]:
        """Get active workflow sessions."""
        query = select(WorkflowSession).where(WorkflowSession.status == "active")

        if created_by:
            query = query.where(WorkflowSession.created_by == created_by)

        query = query.order_by(desc(WorkflowSession.created_at)).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_sessions_with_stats(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get sessions with task and checkpoint statistics."""
        # Get sessions with counts
        query = (
            select(
                WorkflowSession,
                func.count(TaskBatch.id).label("batch_count"),
                func.count(WorkflowCheckpoint.id).label("checkpoint_count"),
            )
            .outerjoin(TaskBatch)
            .outerjoin(WorkflowCheckpoint)
            .group_by(WorkflowSession.id)
            .order_by(desc(WorkflowSession.created_at))
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(query)
        rows = result.all()

        return [
            {
                "session": row.WorkflowSession,
                "batch_count": row.batch_count,
                "checkpoint_count": row.checkpoint_count,
            }
            for row in rows
        ]

    async def update_status(
        self,
        db: AsyncSession,
        session_id: str,
        status: str,
        completed_at: Optional[datetime] = None,
    ) -> Optional[WorkflowSession]:
        """Update session status."""
        session = await self.get_by_session_id(db, session_id)
        if not session:
            return None

        session.status = status
        if completed_at:
            session.completed_at = completed_at

        await db.commit()
        await db.refresh(session)
        return session


class CRUDWorkflowCheckpoint(
    CRUDBase[WorkflowCheckpoint, WorkflowCheckpointCreate, WorkflowCheckpointUpdate]
):
    """CRUD operations for workflow checkpoints."""

    async def get_by_checkpoint_id(
        self, db: AsyncSession, checkpoint_id: str
    ) -> Optional[WorkflowCheckpoint]:
        """Get checkpoint by checkpoint_id."""
        result = await db.execute(
            select(WorkflowCheckpoint).where(
                WorkflowCheckpoint.checkpoint_id == checkpoint_id
            )
        )
        return result.scalar_one_or_none()

    async def get_latest_checkpoint(
        self, db: AsyncSession, session_id: str, agent_id: str
    ) -> Optional[WorkflowCheckpoint]:
        """Get the latest checkpoint for a session and agent."""
        result = await db.execute(
            select(WorkflowCheckpoint)
            .where(
                and_(
                    WorkflowCheckpoint.session_id == session_id,
                    WorkflowCheckpoint.agent_id == agent_id,
                )
            )
            .order_by(desc(WorkflowCheckpoint.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_session_checkpoints(
        self,
        db: AsyncSession,
        session_id: str,
        agent_id: Optional[str] = None,
        checkpoint_type: Optional[str] = None,
        limit: int = 50,
    ) -> List[WorkflowCheckpoint]:
        """Get checkpoints for a session."""
        query = select(WorkflowCheckpoint).where(
            WorkflowCheckpoint.session_id == session_id
        )

        if agent_id:
            query = query.where(WorkflowCheckpoint.agent_id == agent_id)

        if checkpoint_type:
            query = query.where(WorkflowCheckpoint.checkpoint_type == checkpoint_type)

        query = query.order_by(desc(WorkflowCheckpoint.created_at)).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def cleanup_old_checkpoints(
        self, db: AsyncSession, session_id: str, agent_id: str, keep_count: int = 50
    ) -> int:
        """Clean up old checkpoints beyond the keep limit."""
        # Get checkpoint IDs to delete
        subquery = (
            select(WorkflowCheckpoint.id)
            .where(
                and_(
                    WorkflowCheckpoint.session_id == session_id,
                    WorkflowCheckpoint.agent_id == agent_id,
                )
            )
            .order_by(desc(WorkflowCheckpoint.created_at))
            .offset(keep_count)
        )

        # Delete old checkpoints
        from sqlalchemy import delete

        result = await db.execute(
            delete(WorkflowCheckpoint).where(WorkflowCheckpoint.id.in_(subquery))
        )

        await db.commit()
        return result.rowcount


class CRUDAgentMessage(CRUDBase[AgentMessage, AgentMessageCreate, AgentMessageUpdate]):
    """CRUD operations for agent messages."""

    async def get_by_message_id(
        self, db: AsyncSession, message_id: str
    ) -> Optional[AgentMessage]:
        """Get message by message_id."""
        result = await db.execute(
            select(AgentMessage).where(AgentMessage.message_id == message_id)
        )
        return result.scalar_one_or_none()

    async def get_agent_messages(
        self,
        db: AsyncSession,
        agent_id: str,
        status: Optional[str] = None,
        message_type: Optional[str] = None,
        limit: int = 50,
    ) -> List[AgentMessage]:
        """Get messages for an agent."""
        query = select(AgentMessage).where(
            or_(
                AgentMessage.to_agent == agent_id,
                and_(
                    AgentMessage.to_agent.is_(None),  # Broadcast messages
                    AgentMessage.from_agent != agent_id,  # Not from self
                ),
            )
        )

        if status:
            query = query.where(AgentMessage.status == status)

        if message_type:
            query = query.where(AgentMessage.message_type == message_type)

        query = query.order_by(
            asc(AgentMessage.priority), desc(AgentMessage.created_at)
        ).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_conversation(
        self, db: AsyncSession, correlation_id: str, limit: int = 100
    ) -> List[AgentMessage]:
        """Get conversation by correlation ID."""
        result = await db.execute(
            select(AgentMessage)
            .where(AgentMessage.correlation_id == correlation_id)
            .order_by(asc(AgentMessage.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def update_message_status(
        self,
        db: AsyncSession,
        message_id: str,
        status: str,
        delivered_at: Optional[datetime] = None,
        acknowledged_at: Optional[datetime] = None,
    ) -> Optional[AgentMessage]:
        """Update message status."""
        message = await self.get_by_message_id(db, message_id)
        if not message:
            return None

        message.status = status
        if delivered_at:
            message.delivered_at = delivered_at
        if acknowledged_at:
            message.acknowledged_at = acknowledged_at

        await db.commit()
        await db.refresh(message)
        return message

    async def cleanup_expired_messages(
        self, db: AsyncSession, current_time: Optional[datetime] = None
    ) -> int:
        """Clean up expired messages."""
        if current_time is None:
            current_time = datetime.now(timezone.utc)

        from sqlalchemy import delete

        result = await db.execute(
            delete(AgentMessage).where(
                and_(
                    AgentMessage.expires_at.is_not(None),
                    AgentMessage.expires_at < current_time,
                )
            )
        )

        await db.commit()
        return result.rowcount


class CRUDTaskBatch(CRUDBase[TaskBatch, TaskBatchCreate, TaskBatchUpdate]):
    """CRUD operations for task batches."""

    async def get_by_batch_id(
        self, db: AsyncSession, batch_id: str
    ) -> Optional[TaskBatch]:
        """Get batch by batch_id."""
        result = await db.execute(
            select(TaskBatch)
            .where(TaskBatch.batch_id == batch_id)
            .options(selectinload(TaskBatch.tasks))
        )
        return result.scalar_one_or_none()

    async def get_active_batches(
        self, db: AsyncSession, session_id: Optional[str] = None, limit: int = 50
    ) -> List[TaskBatch]:
        """Get active task batches."""
        query = select(TaskBatch).where(TaskBatch.status.in_(["pending", "running"]))

        if session_id:
            query = query.where(TaskBatch.session_id == session_id)

        query = query.order_by(asc(TaskBatch.created_at)).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_batch_with_stats(
        self, db: AsyncSession, batch_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get batch with task statistics."""
        # Get batch
        batch = await self.get_by_batch_id(db, batch_id)
        if not batch:
            return None

        # Get task statistics
        task_stats = await db.execute(
            select(Task.status, func.count(Task.id).label("count"))
            .where(Task.batch_id == batch_id)
            .group_by(Task.status)
        )

        stats = {row.status: row.count for row in task_stats}

        return {"batch": batch, "task_stats": stats, "total_tasks": sum(stats.values())}


class CRUDTask(CRUDBase[Task, TaskCreate, TaskUpdate]):
    """CRUD operations for tasks."""

    async def get_by_task_id(self, db: AsyncSession, task_id: str) -> Optional[Task]:
        """Get task by task_id."""
        result = await db.execute(
            select(Task)
            .where(Task.task_id == task_id)
            .options(selectinload(Task.dependencies), selectinload(Task.dependents))
        )
        return result.scalar_one_or_none()

    async def get_agent_tasks(
        self,
        db: AsyncSession,
        agent_id: str,
        status: Optional[str] = None,
        task_type: Optional[str] = None,
        limit: int = 50,
    ) -> List[Task]:
        """Get tasks assigned to an agent."""
        query = select(Task).where(Task.agent_id == agent_id)

        if status:
            query = query.where(Task.status == status)

        if task_type:
            query = query.where(Task.task_type == task_type)

        query = query.order_by(asc(Task.priority), desc(Task.created_at)).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_ready_tasks(
        self, db: AsyncSession, batch_id: Optional[str] = None, limit: int = 50
    ) -> List[Task]:
        """Get tasks that are ready to execute (all dependencies completed)."""
        # Subquery to find tasks with unmet dependencies
        unmet_deps_subquery = (
            select(TaskDependency.task_id)
            .join(Task, TaskDependency.depends_on_task_id == Task.id)
            .where(Task.status != "completed")
        )

        query = select(Task).where(
            and_(Task.status == "pending", ~Task.id.in_(unmet_deps_subquery))
        )

        if batch_id:
            query = query.where(Task.batch_id == batch_id)

        query = query.order_by(asc(Task.priority), asc(Task.created_at)).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def update_task_status(
        self,
        db: AsyncSession,
        task_id: str,
        status: str,
        result_data: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
        started_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None,
        execution_time_seconds: Optional[float] = None,
    ) -> Optional[Task]:
        """Update task status and results."""
        task = await self.get_by_task_id(db, task_id)
        if not task:
            return None

        task.status = status
        if result_data is not None:
            task.result_data = result_data
        if error_message is not None:
            task.error_message = error_message
        if started_at is not None:
            task.started_at = started_at
        if completed_at is not None:
            task.completed_at = completed_at
        if execution_time_seconds is not None:
            task.execution_time_seconds = execution_time_seconds

        await db.commit()
        await db.refresh(task)
        return task


class CRUDQualityGateExecution(
    CRUDBase[
        QualityGateExecution, QualityGateExecutionCreate, QualityGateExecutionUpdate
    ]
):
    """CRUD operations for quality gate executions."""

    async def get_by_execution_id(
        self, db: AsyncSession, execution_id: str
    ) -> Optional[QualityGateExecution]:
        """Get execution by execution_id."""
        result = await db.execute(
            select(QualityGateExecution).where(
                QualityGateExecution.execution_id == execution_id
            )
        )
        return result.scalar_one_or_none()

    async def get_gate_history(
        self,
        db: AsyncSession,
        gate_type: Optional[str] = None,
        session_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
    ) -> List[QualityGateExecution]:
        """Get quality gate execution history."""
        query = select(QualityGateExecution)

        if gate_type:
            query = query.where(QualityGateExecution.gate_type == gate_type)

        if session_id:
            query = query.where(QualityGateExecution.session_id == session_id)

        if status:
            query = query.where(QualityGateExecution.status == status)

        query = query.order_by(desc(QualityGateExecution.started_at)).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_gate_statistics(
        self,
        db: AsyncSession,
        gate_type: Optional[str] = None,
        time_window_hours: int = 24,
    ) -> Dict[str, Any]:
        """Get quality gate statistics."""
        from datetime import timedelta

        start_time = datetime.now(timezone.utc) - timedelta(hours=time_window_hours)

        query = select(QualityGateExecution).where(
            QualityGateExecution.started_at >= start_time
        )

        if gate_type:
            query = query.where(QualityGateExecution.gate_type == gate_type)

        result = await db.execute(query)
        executions = list(result.scalars().all())

        if not executions:
            return {
                "total_executions": 0,
                "success_rate": 0.0,
                "average_execution_time": 0.0,
                "status_breakdown": {},
            }

        status_counts = {}
        total_time = 0.0

        for execution in executions:
            status = execution.status
            status_counts[status] = status_counts.get(status, 0) + 1
            total_time += execution.execution_time_seconds

        success_count = status_counts.get("passed", 0)
        success_rate = success_count / len(executions) if executions else 0.0
        avg_time = total_time / len(executions) if executions else 0.0

        return {
            "total_executions": len(executions),
            "success_rate": success_rate,
            "average_execution_time": avg_time,
            "status_breakdown": status_counts,
        }


class CRUDAgentRegistry(
    CRUDBase[AgentRegistry, AgentRegistryCreate, AgentRegistryUpdate]
):
    """CRUD operations for agent registry."""

    async def get_by_agent_id(
        self, db: AsyncSession, agent_id: str
    ) -> Optional[AgentRegistry]:
        """Get agent by agent_id."""
        result = await db.execute(
            select(AgentRegistry).where(AgentRegistry.agent_id == agent_id)
        )
        return result.scalar_one_or_none()

    async def get_active_agents(
        self, db: AsyncSession, agent_type: Optional[str] = None
    ) -> List[AgentRegistry]:
        """Get active agents."""
        query = select(AgentRegistry).where(AgentRegistry.status == "active")

        if agent_type:
            query = query.where(AgentRegistry.agent_type == agent_type)

        query = query.order_by(desc(AgentRegistry.last_heartbeat))

        result = await db.execute(query)
        return list(result.scalars().all())

    async def update_heartbeat(
        self, db: AsyncSession, agent_id: str, heartbeat_time: Optional[datetime] = None
    ) -> Optional[AgentRegistry]:
        """Update agent heartbeat."""
        agent = await self.get_by_agent_id(db, agent_id)
        if not agent:
            return None

        agent.last_heartbeat = heartbeat_time or datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(agent)
        return agent

    async def cleanup_stale_agents(
        self, db: AsyncSession, stale_threshold_minutes: int = 30
    ) -> int:
        """Mark agents as inactive if they haven't sent heartbeat."""
        from datetime import timedelta

        stale_time = datetime.now(timezone.utc) - timedelta(
            minutes=stale_threshold_minutes
        )

        from sqlalchemy import update

        result = await db.execute(
            update(AgentRegistry)
            .where(
                and_(
                    AgentRegistry.status == "active",
                    or_(
                        AgentRegistry.last_heartbeat.is_(None),
                        AgentRegistry.last_heartbeat < stale_time,
                    ),
                )
            )
            .values(status="inactive")
        )

        await db.commit()
        return result.rowcount


class CRUDWorkflowMetrics(CRUDBase[WorkflowMetrics, None, None]):
    """CRUD operations for workflow metrics."""

    async def record_metric(
        self,
        db: AsyncSession,
        metric_name: str,
        metric_type: str,
        value: float,
        labels: Optional[Dict[str, str]] = None,
        session_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        component: Optional[str] = None,
    ) -> WorkflowMetrics:
        """Record a metric value."""
        metric = WorkflowMetrics(
            metric_name=metric_name,
            metric_type=metric_type,
            value=value,
            labels=labels,
            session_id=session_id,
            agent_id=agent_id,
            component=component,
        )

        db.add(metric)
        await db.commit()
        await db.refresh(metric)
        return metric

    async def get_metrics(
        self,
        db: AsyncSession,
        metric_name: Optional[str] = None,
        component: Optional[str] = None,
        session_id: Optional[str] = None,
        time_window_hours: int = 24,
        limit: int = 1000,
    ) -> List[WorkflowMetrics]:
        """Get metrics with filters."""
        from datetime import timedelta

        start_time = datetime.now(timezone.utc) - timedelta(hours=time_window_hours)

        query = select(WorkflowMetrics).where(WorkflowMetrics.recorded_at >= start_time)

        if metric_name:
            query = query.where(WorkflowMetrics.metric_name == metric_name)

        if component:
            query = query.where(WorkflowMetrics.component == component)

        if session_id:
            query = query.where(WorkflowMetrics.session_id == session_id)

        query = query.order_by(desc(WorkflowMetrics.recorded_at)).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())


# Create CRUD instances
workflow_session = CRUDWorkflowSession(WorkflowSession)
workflow_checkpoint = CRUDWorkflowCheckpoint(WorkflowCheckpoint)
agent_message = CRUDAgentMessage(AgentMessage)
task_batch = CRUDTaskBatch(TaskBatch)
task = CRUDTask(Task)
quality_gate_execution = CRUDQualityGateExecution(QualityGateExecution)
agent_registry = CRUDAgentRegistry(AgentRegistry)
workflow_metrics = CRUDWorkflowMetrics(WorkflowMetrics)
