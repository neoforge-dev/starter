"""Workflow State Management System.

Robust state management with checkpoint/recovery, progressive summarization,
and context compression for maintaining workflow state across long-running sessions.
"""

import asyncio
import json
import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
import aiofiles
import aiofiles.os
from pydantic import BaseModel, Field
import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from .metrics import increment_counter
from app.db.session import get_db

logger = structlog.get_logger(__name__)


class WorkflowContext(BaseModel):
    """Workflow context data structure."""
    session_id: str
    agent_id: str
    context_data: Dict[str, Any]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    size_bytes: Optional[int] = None
    compressed: bool = False
    
    def model_post_init(self, __context: Any) -> None:
        """Calculate size after initialization."""
        if self.size_bytes is None:
            content = self.model_dump_json()
            self.size_bytes = len(content.encode('utf-8'))


class WorkflowCheckpoint(BaseModel):
    """Workflow checkpoint for recovery."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    agent_id: str
    checkpoint_type: str  # 'automatic', 'manual', 'milestone'
    context: WorkflowContext
    previous_checkpoint_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tags: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    
    
class ContextSummary(BaseModel):
    """Compressed context summary."""
    original_size: int
    compressed_size: int
    compression_ratio: float
    summary_data: Dict[str, Any]
    key_insights: List[str] = Field(default_factory=list)
    important_decisions: List[str] = Field(default_factory=list)
    active_tasks: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WorkflowStateManager:
    """Manages workflow state persistence and recovery.
    
    Provides checkpoint creation, context compression, state recovery,
    and progressive summarization for managing large workflow contexts.
    """
    
    def __init__(self, base_path: Optional[Path] = None):
        """Initialize state manager with base path for state storage."""
        settings = get_settings()
        self.base_path = base_path or Path("/tmp/ai_workflow/state")
        self.base_path.mkdir(parents=True, exist_ok=True)
        
        # Compression settings
        self.max_context_size = 10 * 1024 * 1024  # 10MB
        self.compression_threshold = 1 * 1024 * 1024  # 1MB
        self.max_checkpoints_per_session = 50
        
        # Metrics
        self._checkpoint_counter = 0
        self._recovery_counter = 0
        self._compression_counter = 0
        
        # State locks for concurrent access
        self._locks: Dict[str, asyncio.Lock] = {}
    
    async def _get_lock(self, key: str) -> asyncio.Lock:
        """Get or create lock for a given key."""
        if key not in self._locks:
            self._locks[key] = asyncio.Lock()
        return self._locks[key]
    
    async def _get_session_path(self, session_id: str) -> Path:
        """Get session directory path."""
        session_path = self.base_path / session_id
        session_path.mkdir(parents=True, exist_ok=True)
        return session_path
    
    async def _get_checkpoints_path(self, session_id: str) -> Path:
        """Get checkpoints directory path."""
        checkpoints_path = await self._get_session_path(session_id) / "checkpoints"
        checkpoints_path.mkdir(parents=True, exist_ok=True)
        return checkpoints_path
    
    async def _get_context_path(self, session_id: str) -> Path:
        """Get context directory path."""
        context_path = await self._get_session_path(session_id) / "context"
        context_path.mkdir(parents=True, exist_ok=True)
        return context_path
    
    async def save_checkpoint(
        self,
        session_id: str,
        agent_id: str,
        context_data: Dict[str, Any],
        checkpoint_type: str = "automatic",
        tags: Optional[List[str]] = None,
        description: Optional[str] = None
    ) -> str:
        """Create recovery checkpoint.
        
        Args:
            session_id: Workflow session identifier
            agent_id: Agent creating the checkpoint
            context_data: Context data to checkpoint
            checkpoint_type: Type of checkpoint ('automatic', 'manual', 'milestone')
            tags: Optional tags for categorization
            description: Optional description
            
        Returns:
            Checkpoint ID for later recovery
        """
        try:
            # Create context object
            context = WorkflowContext(
                session_id=session_id,
                agent_id=agent_id,
                context_data=context_data,
                metadata={
                    "checkpoint_type": checkpoint_type,
                    "agent_version": "1.0.0",  # Could be dynamic
                    "platform": "neoforge"
                }
            )
            
            # Compress if needed
            if context.size_bytes and context.size_bytes > self.compression_threshold:
                context = await self._compress_context(context)
            
            # Get most recent checkpoint for linking
            previous_checkpoint = await self._get_latest_checkpoint(session_id, agent_id)
            previous_id = previous_checkpoint.id if previous_checkpoint else None
            
            # Create checkpoint
            checkpoint = WorkflowCheckpoint(
                session_id=session_id,
                agent_id=agent_id,
                checkpoint_type=checkpoint_type,
                context=context,
                previous_checkpoint_id=previous_id,
                tags=tags or [],
                description=description
            )
            
            # Save checkpoint
            checkpoints_path = await self._get_checkpoints_path(session_id)
            lock = await self._get_lock(f"checkpoint_{session_id}")
            
            async with lock:
                checkpoint_file = checkpoints_path / f"{checkpoint.id}.json"
                async with aiofiles.open(checkpoint_file, 'w') as f:
                    await f.write(checkpoint.model_dump_json(indent=2))
                
                # Cleanup old checkpoints if needed
                await self._cleanup_old_checkpoints(session_id, agent_id)
            
            self._checkpoint_counter += 1
            logger.info(
                "Checkpoint saved",
                checkpoint_id=checkpoint.id,
                session_id=session_id,
                agent_id=agent_id,
                checkpoint_type=checkpoint_type,
                size_bytes=context.size_bytes,
                compressed=context.compressed
            )
            increment_counter("ai_workflow_checkpoint_saved")
            
            return checkpoint.id
            
        except Exception as e:
            logger.error(
                "Failed to save checkpoint",
                error=str(e),
                session_id=session_id,
                agent_id=agent_id
            )
            increment_counter("ai_workflow_checkpoint_save_error")
            raise
    
    async def restore_checkpoint(self, checkpoint_id: str) -> Dict[str, Any]:
        """Restore from checkpoint.
        
        Args:
            checkpoint_id: Checkpoint ID to restore from
            
        Returns:
            Restored context data
            
        Raises:
            ValueError: If checkpoint not found
        """
        try:
            # Find checkpoint file
            checkpoint_file = None
            for session_dir in self.base_path.iterdir():
                if session_dir.is_dir():
                    checkpoints_dir = session_dir / "checkpoints"
                    if checkpoints_dir.exists():
                        potential_file = checkpoints_dir / f"{checkpoint_id}.json"
                        if potential_file.exists():
                            checkpoint_file = potential_file
                            break
            
            if not checkpoint_file:
                raise ValueError(f"Checkpoint {checkpoint_id} not found")
            
            # Load checkpoint
            async with aiofiles.open(checkpoint_file, 'r') as f:
                content = await f.read()
                checkpoint = WorkflowCheckpoint.model_validate_json(content)
            
            # Decompress context if needed
            context_data = checkpoint.context.context_data
            if checkpoint.context.compressed:
                context_data = await self._decompress_context(checkpoint.context)
            
            self._recovery_counter += 1
            logger.info(
                "Checkpoint restored",
                checkpoint_id=checkpoint_id,
                session_id=checkpoint.session_id,
                agent_id=checkpoint.agent_id,
                compressed=checkpoint.context.compressed
            )
            increment_counter("ai_workflow_checkpoint_restored")
            
            return context_data
            
        except Exception as e:
            logger.error(
                "Failed to restore checkpoint",
                error=str(e),
                checkpoint_id=checkpoint_id
            )
            increment_counter("ai_workflow_checkpoint_restore_error")
            raise
    
    async def compress_context(self, context_data: Dict[str, Any]) -> Dict[str, Any]:
        """Progressive summarization for context management.
        
        Args:
            context_data: Full context data to compress
            
        Returns:
            Compressed context data
        """
        try:
            # Create temporary context for compression
            temp_context = WorkflowContext(
                session_id="temp",
                agent_id="temp",
                context_data=context_data
            )
            
            compressed_context = await self._compress_context(temp_context)
            
            self._compression_counter += 1
            increment_counter("ai_workflow_context_compressed")
            
            return compressed_context.context_data
            
        except Exception as e:
            logger.error("Failed to compress context", error=str(e))
            increment_counter("ai_workflow_compression_error")
            raise
    
    async def _compress_context(self, context: WorkflowContext) -> WorkflowContext:
        """Internal context compression using progressive summarization."""
        original_size = context.size_bytes or 0
        
        # Extract key information for summarization
        summary_data = {}
        key_insights = []
        important_decisions = []
        active_tasks = []
        
        # Compress different sections of context
        if "conversation_history" in context.context_data:
            # Keep only recent messages and summaries
            history = context.context_data["conversation_history"]
            if isinstance(history, list) and len(history) > 50:
                # Keep first 10, last 20, and create summary of middle
                recent = history[-20:]
                important = history[:10]
                middle_summary = f"[Summarized {len(history) - 30} messages from conversation]"
                summary_data["conversation_history"] = important + [{"summary": middle_summary}] + recent
            else:
                summary_data["conversation_history"] = history
        
        # Extract task information
        if "tasks" in context.context_data:
            tasks = context.context_data["tasks"]
            if isinstance(tasks, list):
                active_tasks = [
                    task.get("id", str(i)) for i, task in enumerate(tasks)
                    if task.get("status") in ["pending", "in_progress"]
                ]
                summary_data["tasks"] = [
                    task for task in tasks
                    if task.get("status") in ["pending", "in_progress", "completed"]
                ][:20]  # Keep only recent tasks
        
        # Extract decisions and insights
        if "decisions" in context.context_data:
            decisions = context.context_data["decisions"]
            if isinstance(decisions, list):
                important_decisions = [
                    decision.get("summary", str(decision))
                    for decision in decisions[-10:]  # Keep last 10 decisions
                ]
                summary_data["decisions"] = decisions[-10:]
        
        # Keep essential metadata
        for key in ["session_metadata", "agent_config", "current_state"]:
            if key in context.context_data:
                summary_data[key] = context.context_data[key]
        
        # Create compressed context
        compressed_context = WorkflowContext(
            session_id=context.session_id,
            agent_id=context.agent_id,
            context_data=summary_data,
            metadata={
                **context.metadata,
                "compression_summary": {
                    "key_insights": key_insights,
                    "important_decisions": important_decisions,
                    "active_tasks": active_tasks,
                    "original_size": original_size,
                    "compressed_at": datetime.now(timezone.utc).isoformat()
                }
            },
            timestamp=context.timestamp,
            compressed=True
        )
        
        # Recalculate size
        compressed_content = compressed_context.model_dump_json()
        compressed_context.size_bytes = len(compressed_content.encode('utf-8'))
        
        compression_ratio = (original_size - compressed_context.size_bytes) / original_size
        logger.info(
            "Context compressed",
            original_size=original_size,
            compressed_size=compressed_context.size_bytes,
            compression_ratio=compression_ratio
        )
        
        return compressed_context
    
    async def _decompress_context(self, context: WorkflowContext) -> Dict[str, Any]:
        """Decompress context data (simplified implementation)."""
        # In a full implementation, this would reconstruct context from summaries
        # For now, we just return the compressed data with metadata about compression
        
        context_data = context.context_data.copy()
        
        # Add decompression metadata
        if "compression_summary" in context.metadata:
            context_data["_decompression_info"] = {
                "was_compressed": True,
                "compression_metadata": context.metadata["compression_summary"]
            }
        
        return context_data
    
    async def _get_latest_checkpoint(
        self,
        session_id: str,
        agent_id: str
    ) -> Optional[WorkflowCheckpoint]:
        """Get the latest checkpoint for a session and agent."""
        try:
            checkpoints_path = await self._get_checkpoints_path(session_id)
            if not checkpoints_path.exists():
                return None
            
            latest_checkpoint = None
            latest_timestamp = None
            
            for checkpoint_file in checkpoints_path.glob("*.json"):
                try:
                    async with aiofiles.open(checkpoint_file, 'r') as f:
                        content = await f.read()
                        checkpoint = WorkflowCheckpoint.model_validate_json(content)
                        
                        if checkpoint.agent_id == agent_id:
                            if latest_timestamp is None or checkpoint.created_at > latest_timestamp:
                                latest_checkpoint = checkpoint
                                latest_timestamp = checkpoint.created_at
                except Exception as e:
                    logger.warning(
                        "Failed to read checkpoint file",
                        file=str(checkpoint_file),
                        error=str(e)
                    )
            
            return latest_checkpoint
            
        except Exception as e:
            logger.error(
                "Failed to get latest checkpoint",
                session_id=session_id,
                agent_id=agent_id,
                error=str(e)
            )
            return None
    
    async def _cleanup_old_checkpoints(self, session_id: str, agent_id: str) -> None:
        """Clean up old checkpoints beyond the maximum limit."""
        try:
            checkpoints_path = await self._get_checkpoints_path(session_id)
            if not checkpoints_path.exists():
                return
            
            # Get all checkpoints for this agent
            agent_checkpoints = []
            for checkpoint_file in checkpoints_path.glob("*.json"):
                try:
                    async with aiofiles.open(checkpoint_file, 'r') as f:
                        content = await f.read()
                        checkpoint = WorkflowCheckpoint.model_validate_json(content)
                        
                        if checkpoint.agent_id == agent_id:
                            agent_checkpoints.append((checkpoint, checkpoint_file))
                except Exception:
                    continue
            
            # Sort by creation time (newest first)
            agent_checkpoints.sort(key=lambda x: x[0].created_at, reverse=True)
            
            # Remove oldest checkpoints beyond limit
            if len(agent_checkpoints) > self.max_checkpoints_per_session:
                for checkpoint, checkpoint_file in agent_checkpoints[self.max_checkpoints_per_session:]:
                    try:
                        await aiofiles.os.remove(checkpoint_file)
                        logger.debug(
                            "Old checkpoint removed",
                            checkpoint_id=checkpoint.id,
                            session_id=session_id,
                            agent_id=agent_id
                        )
                    except Exception as e:
                        logger.warning(
                            "Failed to remove old checkpoint",
                            checkpoint_id=checkpoint.id,
                            error=str(e)
                        )
                        
        except Exception as e:
            logger.error(
                "Failed to cleanup old checkpoints",
                session_id=session_id,
                agent_id=agent_id,
                error=str(e)
            )
    
    async def list_checkpoints(
        self,
        session_id: str,
        agent_id: Optional[str] = None,
        limit: int = 50
    ) -> List[WorkflowCheckpoint]:
        """List checkpoints for a session.
        
        Args:
            session_id: Session identifier
            agent_id: Optional agent filter
            limit: Maximum number of checkpoints to return
            
        Returns:
            List of checkpoints sorted by creation time (newest first)
        """
        try:
            checkpoints_path = await self._get_checkpoints_path(session_id)
            if not checkpoints_path.exists():
                return []
            
            checkpoints = []
            for checkpoint_file in checkpoints_path.glob("*.json"):
                try:
                    async with aiofiles.open(checkpoint_file, 'r') as f:
                        content = await f.read()
                        checkpoint = WorkflowCheckpoint.model_validate_json(content)
                        
                        if agent_id is None or checkpoint.agent_id == agent_id:
                            checkpoints.append(checkpoint)
                except Exception as e:
                    logger.warning(
                        "Failed to read checkpoint file",
                        file=str(checkpoint_file),
                        error=str(e)
                    )
            
            # Sort by creation time (newest first)
            checkpoints.sort(key=lambda x: x.created_at, reverse=True)
            
            return checkpoints[:limit]
            
        except Exception as e:
            logger.error(
                "Failed to list checkpoints",
                session_id=session_id,
                agent_id=agent_id,
                error=str(e)
            )
            return []
    
    async def delete_checkpoint(self, checkpoint_id: str) -> bool:
        """Delete a specific checkpoint.
        
        Args:
            checkpoint_id: Checkpoint ID to delete
            
        Returns:
            True if checkpoint was deleted successfully
        """
        try:
            # Find and delete checkpoint file
            for session_dir in self.base_path.iterdir():
                if session_dir.is_dir():
                    checkpoints_dir = session_dir / "checkpoints"
                    if checkpoints_dir.exists():
                        checkpoint_file = checkpoints_dir / f"{checkpoint_id}.json"
                        if checkpoint_file.exists():
                            await aiofiles.os.remove(checkpoint_file)
                            logger.info("Checkpoint deleted", checkpoint_id=checkpoint_id)
                            increment_counter("ai_workflow_checkpoint_deleted")
                            return True
            
            logger.warning("Checkpoint not found for deletion", checkpoint_id=checkpoint_id)
            return False
            
        except Exception as e:
            logger.error(
                "Failed to delete checkpoint",
                checkpoint_id=checkpoint_id,
                error=str(e)
            )
            increment_counter("ai_workflow_checkpoint_delete_error")
            return False
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get state manager statistics.
        
        Returns:
            Dictionary containing various statistics
        """
        # Count sessions and checkpoints
        session_count = 0
        checkpoint_count = 0
        total_size = 0
        
        try:
            for session_dir in self.base_path.iterdir():
                if session_dir.is_dir():
                    session_count += 1
                    checkpoints_dir = session_dir / "checkpoints"
                    if checkpoints_dir.exists():
                        for checkpoint_file in checkpoints_dir.glob("*.json"):
                            checkpoint_count += 1
                            try:
                                total_size += checkpoint_file.stat().st_size
                            except Exception:
                                pass
        except Exception as e:
            logger.error("Failed to calculate statistics", error=str(e))
        
        return {
            "total_sessions": session_count,
            "total_checkpoints": checkpoint_count,
            "total_size_bytes": total_size,
            "checkpoints_saved": self._checkpoint_counter,
            "recoveries_performed": self._recovery_counter,
            "compressions_performed": self._compression_counter,
            "base_path": str(self.base_path),
            "max_context_size": self.max_context_size,
            "compression_threshold": self.compression_threshold
        }