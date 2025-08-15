"""Task Execution Engine.

Orchestrates task execution across agents with dependency resolution,
rollback capabilities, and comprehensive error handling.
"""

import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Union, Callable, Awaitable
from enum import Enum
from pathlib import Path
import aiofiles
from pydantic import BaseModel, Field
import structlog

from app.core.config import get_settings
from .metrics import increment_counter
from .messaging import AgentMessageBus
from .state_manager import WorkflowStateManager

logger = structlog.get_logger(__name__)


class TaskStatus(str, Enum):
    """Task execution status."""
    PENDING = "pending"
    SCHEDULED = "scheduled"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    ROLLED_BACK = "rolled_back"


class TaskPriority(str, Enum):
    """Task priority levels."""
    CRITICAL = "critical"
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


class TaskDependency(BaseModel):
    """Task dependency definition."""
    task_id: str
    dependency_type: str = "completion"  # 'completion', 'partial', 'custom'
    condition: Optional[Dict[str, Any]] = None


class TaskResult(BaseModel):
    """Task execution result."""
    task_id: str
    status: TaskStatus
    result_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    execution_time_seconds: Optional[float] = None
    rollback_data: Optional[Dict[str, Any]] = None


class Task(BaseModel):
    """Task definition."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    task_type: str
    agent_id: str
    priority: TaskPriority = TaskPriority.NORMAL
    parameters: Dict[str, Any] = Field(default_factory=dict)
    dependencies: List[TaskDependency] = Field(default_factory=list)
    timeout_seconds: Optional[int] = None
    max_retries: int = 3
    retry_delay_seconds: int = 30
    rollback_on_failure: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    scheduled_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class TaskBatch(BaseModel):
    """Batch of tasks for execution."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    tasks: List[Task]
    execution_strategy: str = "sequential"  # 'sequential', 'parallel', 'dag'
    rollback_strategy: str = "reverse_order"  # 'reverse_order', 'custom'
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    timeout_seconds: Optional[int] = None


class ExecutionContext(BaseModel):
    """Task execution context."""
    batch_id: str
    session_id: str
    agent_id: str
    dry_run: bool = False
    rollback_enabled: bool = True
    checkpoint_frequency: int = 5  # Checkpoint every N tasks
    metadata: Dict[str, Any] = Field(default_factory=dict)


TaskHandler = Callable[[Task, ExecutionContext], Awaitable[TaskResult]]


class TaskExecutionEngine:
    """Orchestrates task execution across agents.
    
    Provides task scheduling, dependency resolution, batch execution,
    rollback capabilities, and comprehensive monitoring.
    """
    
    def __init__(
        self,
        message_bus: AgentMessageBus,
        state_manager: WorkflowStateManager,
        base_path: Optional[Path] = None
    ):
        """Initialize execution engine."""
        self.message_bus = message_bus
        self.state_manager = state_manager
        
        settings = get_settings()
        self.base_path = base_path or Path("/tmp/ai_workflow/execution")
        self.base_path.mkdir(parents=True, exist_ok=True)
        
        # Task handlers registry
        self._task_handlers: Dict[str, TaskHandler] = {}
        
        # Active executions
        self._active_executions: Dict[str, asyncio.Task] = {}
        self._execution_results: Dict[str, List[TaskResult]] = {}
        
        # Metrics
        self._tasks_executed = 0
        self._tasks_failed = 0
        self._rollbacks_performed = 0
        
        # Execution locks
        self._locks: Dict[str, asyncio.Lock] = {}
    
    async def _get_lock(self, key: str) -> asyncio.Lock:
        """Get or create lock for a given key."""
        if key not in self._locks:
            self._locks[key] = asyncio.Lock()
        return self._locks[key]
    
    def register_task_handler(self, task_type: str, handler: TaskHandler) -> None:
        """Register a task handler for a specific task type.
        
        Args:
            task_type: Type of task this handler processes
            handler: Async function that executes the task
        """
        self._task_handlers[task_type] = handler
        logger.info("Task handler registered", task_type=task_type)
    
    async def schedule_task(
        self,
        task: Task,
        execution_context: Optional[ExecutionContext] = None
    ) -> str:
        """Schedule task with dependency resolution.
        
        Args:
            task: Task to schedule
            execution_context: Optional execution context
            
        Returns:
            Task ID for tracking
            
        Raises:
            ValueError: If task validation fails or dependencies cannot be resolved
        """
        try:
            # Validate task
            await self._validate_task(task)
            
            # Check dependencies
            if task.dependencies:
                await self._validate_dependencies(task.dependencies)
            
            # Create default execution context if not provided
            if execution_context is None:
                execution_context = ExecutionContext(
                    batch_id=str(uuid.uuid4()),
                    session_id=str(uuid.uuid4()),
                    agent_id=task.agent_id
                )
            
            # Schedule task
            task.scheduled_at = datetime.now(timezone.utc)
            
            # Store task for execution
            await self._store_task(task, execution_context)
            
            # Send message to agent if not local execution
            if task.agent_id != "local":
                await self.message_bus.send_message(
                    from_agent="execution_engine",
                    to_agent=task.agent_id,
                    message_type="task_scheduled",
                    payload={
                        "task_id": task.id,
                        "task_type": task.task_type,
                        "parameters": task.parameters,
                        "execution_context": execution_context.model_dump()
                    }
                )
            
            logger.info(
                "Task scheduled",
                task_id=task.id,
                task_type=task.task_type,
                agent_id=task.agent_id,
                priority=task.priority
            )
            increment_counter("ai_workflow_task_scheduled")
            
            return task.id
            
        except Exception as e:
            logger.error(
                "Failed to schedule task",
                task_id=task.id,
                error=str(e)
            )
            increment_counter("ai_workflow_task_schedule_error")
            raise
    
    async def execute_batch(
        self,
        batch: TaskBatch,
        execution_context: ExecutionContext,
        dry_run: bool = False
    ) -> List[TaskResult]:
        """Execute batch of tasks with rollback capability.
        
        Args:
            batch: Batch of tasks to execute
            execution_context: Execution context
            dry_run: If True, validate but don't execute tasks
            
        Returns:
            List of task results
        """
        execution_context.dry_run = dry_run
        execution_context.batch_id = batch.id
        
        results: List[TaskResult] = []
        executed_tasks: List[Task] = []
        
        try:
            logger.info(
                "Starting batch execution",
                batch_id=batch.id,
                task_count=len(batch.tasks),
                strategy=batch.execution_strategy,
                dry_run=dry_run
            )
            
            # Validate all tasks first
            for task in batch.tasks:
                await self._validate_task(task)
            
            if dry_run:
                # Return mock results for dry run
                return [
                    TaskResult(
                        task_id=task.id,
                        status=TaskStatus.COMPLETED,
                        result_data={"dry_run": True}
                    )
                    for task in batch.tasks
                ]
            
            # Execute based on strategy
            if batch.execution_strategy == "sequential":
                results = await self._execute_sequential(batch.tasks, execution_context)
            elif batch.execution_strategy == "parallel":
                results = await self._execute_parallel(batch.tasks, execution_context)
            elif batch.execution_strategy == "dag":
                results = await self._execute_dag(batch.tasks, execution_context)
            else:
                raise ValueError(f"Unknown execution strategy: {batch.execution_strategy}")
            
            # Check for failures and rollback if needed
            failed_tasks = [r for r in results if r.status == TaskStatus.FAILED]
            if failed_tasks and execution_context.rollback_enabled:
                logger.warning(
                    "Tasks failed, initiating rollback",
                    batch_id=batch.id,
                    failed_count=len(failed_tasks)
                )
                
                rollback_results = await self._rollback_batch(
                    executed_tasks,
                    execution_context,
                    batch.rollback_strategy
                )
                
                # Update results with rollback status
                for result in results:
                    if result.status == TaskStatus.COMPLETED:
                        result.status = TaskStatus.ROLLED_BACK
            
            # Store final results
            self._execution_results[batch.id] = results
            
            logger.info(
                "Batch execution completed",
                batch_id=batch.id,
                completed_count=len([r for r in results if r.status == TaskStatus.COMPLETED]),
                failed_count=len([r for r in results if r.status == TaskStatus.FAILED]),
                rolled_back_count=len([r for r in results if r.status == TaskStatus.ROLLED_BACK])
            )
            increment_counter("ai_workflow_batch_executed")
            
            return results
            
        except Exception as e:
            logger.error(
                "Batch execution failed",
                batch_id=batch.id,
                error=str(e)
            )
            
            # Attempt rollback on exception
            if executed_tasks and execution_context.rollback_enabled:
                try:
                    await self._rollback_batch(executed_tasks, execution_context, batch.rollback_strategy)
                except Exception as rollback_error:
                    logger.error(
                        "Rollback failed",
                        batch_id=batch.id,
                        error=str(rollback_error)
                    )
            
            increment_counter("ai_workflow_batch_execution_error")
            raise
    
    async def _execute_sequential(
        self,
        tasks: List[Task],
        execution_context: ExecutionContext
    ) -> List[TaskResult]:
        """Execute tasks sequentially."""
        results: List[TaskResult] = []
        
        for i, task in enumerate(tasks):
            try:
                # Create checkpoint periodically
                if i > 0 and i % execution_context.checkpoint_frequency == 0:
                    await self._create_execution_checkpoint(
                        execution_context.batch_id,
                        execution_context.session_id,
                        execution_context.agent_id,
                        {"completed_tasks": i, "total_tasks": len(tasks), "results": results}
                    )
                
                # Execute task
                result = await self._execute_single_task(task, execution_context)
                results.append(result)
                
                # Stop on failure if rollback is enabled
                if result.status == TaskStatus.FAILED and execution_context.rollback_enabled:
                    logger.warning(
                        "Task failed in sequential execution, stopping batch",
                        task_id=task.id,
                        batch_id=execution_context.batch_id
                    )
                    break
                    
            except Exception as e:
                error_result = TaskResult(
                    task_id=task.id,
                    status=TaskStatus.FAILED,
                    error=str(e)
                )
                results.append(error_result)
                
                if execution_context.rollback_enabled:
                    break
        
        return results
    
    async def _execute_parallel(
        self,
        tasks: List[Task],
        execution_context: ExecutionContext
    ) -> List[TaskResult]:
        """Execute tasks in parallel."""
        # Execute all tasks concurrently
        task_coroutines = [
            self._execute_single_task(task, execution_context)
            for task in tasks
        ]
        
        results = await asyncio.gather(*task_coroutines, return_exceptions=True)
        
        # Convert exceptions to failed task results
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                final_results.append(TaskResult(
                    task_id=tasks[i].id,
                    status=TaskStatus.FAILED,
                    error=str(result)
                ))
            else:
                final_results.append(result)
        
        return final_results
    
    async def _execute_dag(
        self,
        tasks: List[Task],
        execution_context: ExecutionContext
    ) -> List[TaskResult]:
        """Execute tasks based on dependency graph (DAG)."""
        # Build dependency graph
        task_map = {task.id: task for task in tasks}
        completed_tasks: set[str] = set()
        results: List[TaskResult] = []
        
        while len(completed_tasks) < len(tasks):
            # Find tasks that can be executed (all dependencies completed)
            ready_tasks = []
            for task in tasks:
                if task.id in completed_tasks:
                    continue
                
                dependencies_met = all(
                    dep.task_id in completed_tasks
                    for dep in task.dependencies
                )
                
                if dependencies_met:
                    ready_tasks.append(task)
            
            if not ready_tasks:
                # Check for circular dependencies
                remaining_tasks = [task for task in tasks if task.id not in completed_tasks]
                logger.error(
                    "Circular dependency detected or no tasks ready",
                    remaining_tasks=[task.id for task in remaining_tasks]
                )
                
                # Mark remaining tasks as failed
                for task in remaining_tasks:
                    results.append(TaskResult(
                        task_id=task.id,
                        status=TaskStatus.FAILED,
                        error="Circular dependency or unmet dependencies"
                    ))
                break
            
            # Execute ready tasks in parallel
            batch_results = await self._execute_parallel(ready_tasks, execution_context)
            results.extend(batch_results)
            
            # Update completed tasks
            for result in batch_results:
                if result.status == TaskStatus.COMPLETED:
                    completed_tasks.add(result.task_id)
                elif execution_context.rollback_enabled:
                    # Stop execution on failure
                    logger.warning(
                        "Task failed in DAG execution, stopping remaining tasks",
                        task_id=result.task_id
                    )
                    return results
        
        return results
    
    async def _execute_single_task(
        self,
        task: Task,
        execution_context: ExecutionContext
    ) -> TaskResult:
        """Execute a single task."""
        start_time = datetime.now(timezone.utc)
        
        try:
            # Check if handler exists
            if task.task_type not in self._task_handlers:
                return TaskResult(
                    task_id=task.id,
                    status=TaskStatus.FAILED,
                    error=f"No handler registered for task type: {task.task_type}",
                    started_at=start_time
                )
            
            handler = self._task_handlers[task.task_type]
            
            # Execute with timeout
            if task.timeout_seconds:
                result = await asyncio.wait_for(
                    handler(task, execution_context),
                    timeout=task.timeout_seconds
                )
            else:
                result = await handler(task, execution_context)
            
            end_time = datetime.now(timezone.utc)
            execution_time = (end_time - start_time).total_seconds()
            
            result.started_at = start_time
            result.completed_at = end_time
            result.execution_time_seconds = execution_time
            
            if result.status == TaskStatus.COMPLETED:
                self._tasks_executed += 1
                increment_counter("ai_workflow_task_completed")
            else:
                self._tasks_failed += 1
                increment_counter("ai_workflow_task_failed")
            
            logger.info(
                "Task executed",
                task_id=task.id,
                task_type=task.task_type,
                status=result.status,
                execution_time=execution_time
            )
            
            return result
            
        except asyncio.TimeoutError:
            return TaskResult(
                task_id=task.id,
                status=TaskStatus.FAILED,
                error=f"Task timed out after {task.timeout_seconds} seconds",
                started_at=start_time,
                completed_at=datetime.now(timezone.utc)
            )
        except Exception as e:
            self._tasks_failed += 1
            increment_counter("ai_workflow_task_failed")
            
            return TaskResult(
                task_id=task.id,
                status=TaskStatus.FAILED,
                error=str(e),
                started_at=start_time,
                completed_at=datetime.now(timezone.utc)
            )
    
    async def _rollback_batch(
        self,
        executed_tasks: List[Task],
        execution_context: ExecutionContext,
        rollback_strategy: str
    ) -> List[TaskResult]:
        """Rollback executed tasks."""
        rollback_results = []
        
        try:
            if rollback_strategy == "reverse_order":
                # Rollback in reverse order of execution
                for task in reversed(executed_tasks):
                    rollback_result = await self._rollback_single_task(task, execution_context)
                    rollback_results.append(rollback_result)
            
            self._rollbacks_performed += 1
            increment_counter("ai_workflow_rollback_performed")
            
            logger.info(
                "Batch rollback completed",
                batch_id=execution_context.batch_id,
                rollback_count=len(rollback_results)
            )
            
        except Exception as e:
            logger.error(
                "Rollback failed",
                batch_id=execution_context.batch_id,
                error=str(e)
            )
            increment_counter("ai_workflow_rollback_error")
            raise
        
        return rollback_results
    
    async def _rollback_single_task(
        self,
        task: Task,
        execution_context: ExecutionContext
    ) -> TaskResult:
        """Rollback a single task."""
        try:
            # Check if task has rollback handler
            rollback_handler_type = f"{task.task_type}_rollback"
            if rollback_handler_type in self._task_handlers:
                rollback_handler = self._task_handlers[rollback_handler_type]
                result = await rollback_handler(task, execution_context)
                result.status = TaskStatus.ROLLED_BACK
                return result
            
            # Default rollback behavior
            return TaskResult(
                task_id=task.id,
                status=TaskStatus.ROLLED_BACK,
                result_data={"rollback": "no_handler_default_rollback"}
            )
            
        except Exception as e:
            return TaskResult(
                task_id=task.id,
                status=TaskStatus.FAILED,
                error=f"Rollback failed: {str(e)}"
            )
    
    async def _validate_task(self, task: Task) -> None:
        """Validate task definition."""
        if not task.name:
            raise ValueError("Task name is required")
        
        if not task.task_type:
            raise ValueError("Task type is required")
        
        if not task.agent_id:
            raise ValueError("Agent ID is required")
        
        if task.timeout_seconds and task.timeout_seconds <= 0:
            raise ValueError("Timeout must be positive")
        
        if task.max_retries < 0:
            raise ValueError("Max retries must be non-negative")
    
    async def _validate_dependencies(self, dependencies: List[TaskDependency]) -> None:
        """Validate task dependencies."""
        for dep in dependencies:
            if not dep.task_id:
                raise ValueError("Dependency task ID is required")
            
            if dep.dependency_type not in ["completion", "partial", "custom"]:
                raise ValueError(f"Invalid dependency type: {dep.dependency_type}")
    
    async def _store_task(self, task: Task, execution_context: ExecutionContext) -> None:
        """Store task for execution tracking."""
        task_path = self.base_path / execution_context.batch_id
        task_path.mkdir(parents=True, exist_ok=True)
        
        task_file = task_path / f"{task.id}.json"
        async with aiofiles.open(task_file, 'w') as f:
            await f.write(task.model_dump_json(indent=2))
    
    async def _create_execution_checkpoint(
        self,
        batch_id: str,
        session_id: str,
        agent_id: str,
        context_data: Dict[str, Any]
    ) -> None:
        """Create execution checkpoint."""
        try:
            checkpoint_id = await self.state_manager.save_checkpoint(
                session_id=session_id,
                agent_id=agent_id,
                context_data={
                    "execution_state": context_data,
                    "batch_id": batch_id,
                    "checkpoint_type": "execution"
                },
                checkpoint_type="automatic",
                tags=["execution", "batch"],
                description=f"Execution checkpoint for batch {batch_id}"
            )
            
            logger.debug(
                "Execution checkpoint created",
                checkpoint_id=checkpoint_id,
                batch_id=batch_id
            )
            
        except Exception as e:
            logger.warning(
                "Failed to create execution checkpoint",
                batch_id=batch_id,
                error=str(e)
            )
    
    async def validate_completion(self, task_results: List[TaskResult]) -> bool:
        """Validate task completion against success criteria.
        
        Args:
            task_results: List of task results to validate
            
        Returns:
            True if all tasks completed successfully
        """
        if not task_results:
            return False
        
        # Check if all tasks completed successfully
        successful_tasks = [
            result for result in task_results
            if result.status == TaskStatus.COMPLETED
        ]
        
        failed_tasks = [
            result for result in task_results
            if result.status == TaskStatus.FAILED
        ]
        
        success_rate = len(successful_tasks) / len(task_results)
        
        logger.info(
            "Task completion validation",
            total_tasks=len(task_results),
            successful_tasks=len(successful_tasks),
            failed_tasks=len(failed_tasks),
            success_rate=success_rate
        )
        
        # Consider batch successful if all tasks completed
        return len(failed_tasks) == 0
    
    async def get_execution_status(self, batch_id: str) -> Optional[Dict[str, Any]]:
        """Get execution status for a batch.
        
        Args:
            batch_id: Batch identifier
            
        Returns:
            Execution status or None if not found
        """
        if batch_id in self._execution_results:
            results = self._execution_results[batch_id]
            
            return {
                "batch_id": batch_id,
                "total_tasks": len(results),
                "completed": len([r for r in results if r.status == TaskStatus.COMPLETED]),
                "failed": len([r for r in results if r.status == TaskStatus.FAILED]),
                "rolled_back": len([r for r in results if r.status == TaskStatus.ROLLED_BACK]),
                "results": [result.model_dump() for result in results]
            }
        
        return None
    
    async def cancel_execution(self, batch_id: str) -> bool:
        """Cancel an active execution.
        
        Args:
            batch_id: Batch identifier to cancel
            
        Returns:
            True if cancellation was successful
        """
        if batch_id in self._active_executions:
            execution_task = self._active_executions[batch_id]
            execution_task.cancel()
            
            try:
                await execution_task
            except asyncio.CancelledError:
                pass
            
            del self._active_executions[batch_id]
            
            logger.info("Execution cancelled", batch_id=batch_id)
            increment_counter("ai_workflow_execution_cancelled")
            
            return True
        
        return False
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get execution engine statistics.
        
        Returns:
            Dictionary containing various statistics
        """
        return {
            "registered_handlers": len(self._task_handlers),
            "active_executions": len(self._active_executions),
            "tasks_executed": self._tasks_executed,
            "tasks_failed": self._tasks_failed,
            "rollbacks_performed": self._rollbacks_performed,
            "success_rate": self._tasks_executed / max(self._tasks_executed + self._tasks_failed, 1),
            "base_path": str(self.base_path)
        }