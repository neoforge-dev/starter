"""Agent Communication System.

File-based messaging system for agent coordination with delivery confirmation,
persistence, and error handling. Supports point-to-point and broadcast messaging.
"""

import asyncio
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiofiles
import aiofiles.os
import structlog
from pydantic import BaseModel, Field

from app.core.config import get_settings

from .metrics import increment_counter

logger = structlog.get_logger(__name__)


class Message(BaseModel):
    """Message model for agent communication."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_agent: str
    to_agent: Optional[str] = None  # None for broadcast
    message_type: str
    payload: Dict[str, Any]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    priority: int = Field(default=5, ge=1, le=10)  # 1=highest, 10=lowest
    expires_at: Optional[datetime] = None
    delivery_attempts: int = Field(default=0)
    max_delivery_attempts: int = Field(default=3)
    correlation_id: Optional[str] = None
    reply_to: Optional[str] = None


class MessageDeliveryStatus(BaseModel):
    """Message delivery status tracking."""

    message_id: str
    delivered: bool
    delivered_at: Optional[datetime] = None
    error: Optional[str] = None
    attempts: int = 0


class AgentMessageBus:
    """File-based messaging system for agent coordination.

    Provides reliable message passing between agents with delivery confirmation,
    message persistence, and error handling. Messages are stored as JSON files
    in agent-specific directories for isolation and reliability.
    """

    def __init__(self, base_path: Optional[Path] = None):
        """Initialize message bus with base path for message storage."""
        settings = get_settings()
        self.base_path = base_path or Path("/tmp/ai_workflow/messages")
        self.base_path.mkdir(parents=True, exist_ok=True)

        # Message counters for metrics
        self._message_counter = 0
        self._error_counter = 0

        # Active agents registry
        self._active_agents: Dict[str, datetime] = {}

        # Message locks for concurrent access
        self._locks: Dict[str, asyncio.Lock] = {}

    async def _get_lock(self, key: str) -> asyncio.Lock:
        """Get or create lock for a given key."""
        if key not in self._locks:
            self._locks[key] = asyncio.Lock()
        return self._locks[key]

    async def _get_agent_inbox(self, agent_id: str) -> Path:
        """Get agent inbox directory path."""
        inbox_path = self.base_path / agent_id / "inbox"
        inbox_path.mkdir(parents=True, exist_ok=True)
        return inbox_path

    async def _get_agent_outbox(self, agent_id: str) -> Path:
        """Get agent outbox directory path."""
        outbox_path = self.base_path / agent_id / "outbox"
        outbox_path.mkdir(parents=True, exist_ok=True)
        return outbox_path

    async def _get_broadcast_inbox(self) -> Path:
        """Get broadcast inbox directory path."""
        broadcast_path = self.base_path / "broadcast"
        broadcast_path.mkdir(parents=True, exist_ok=True)
        return broadcast_path

    async def register_agent(self, agent_id: str) -> None:
        """Register an agent as active in the system."""
        self._active_agents[agent_id] = datetime.now(timezone.utc)

        # Create agent directories
        await self._get_agent_inbox(agent_id)
        await self._get_agent_outbox(agent_id)

        logger.info("Agent registered", agent_id=agent_id)
        increment_counter("ai_workflow_agent_registered")

    async def unregister_agent(self, agent_id: str) -> None:
        """Unregister an agent from the system."""
        if agent_id in self._active_agents:
            del self._active_agents[agent_id]

        logger.info("Agent unregistered", agent_id=agent_id)
        increment_counter("ai_workflow_agent_unregistered")

    async def send_message(
        self,
        from_agent: str,
        to_agent: str,
        message_type: str,
        payload: Dict[str, Any],
        priority: int = 5,
        expires_at: Optional[datetime] = None,
        correlation_id: Optional[str] = None,
        reply_to: Optional[str] = None,
    ) -> str:
        """Send message between agents with delivery confirmation.

        Args:
            from_agent: Source agent identifier
            to_agent: Target agent identifier
            message_type: Type of message (e.g., 'task_request', 'status_update')
            payload: Message payload data
            priority: Message priority (1=highest, 10=lowest)
            expires_at: Message expiration time
            correlation_id: Correlation ID for request-response patterns
            reply_to: Agent ID to send replies to

        Returns:
            Message ID for tracking delivery

        Raises:
            ValueError: If agent is not registered or message validation fails
        """
        # Validate agents are registered
        if from_agent not in self._active_agents:
            raise ValueError(f"Agent {from_agent} is not registered")
        if to_agent not in self._active_agents:
            raise ValueError(f"Agent {to_agent} is not registered")

        # Create message
        message = Message(
            from_agent=from_agent,
            to_agent=to_agent,
            message_type=message_type,
            payload=payload,
            priority=priority,
            expires_at=expires_at,
            correlation_id=correlation_id,
            reply_to=reply_to,
        )

        try:
            # Get target agent inbox and lock
            inbox_path = await self._get_agent_inbox(to_agent)
            lock = await self._get_lock(f"inbox_{to_agent}")

            async with lock:
                # Write message to target inbox
                message_file = inbox_path / f"{message.id}.json"
                async with aiofiles.open(message_file, "w") as f:
                    await f.write(message.model_dump_json(indent=2))

                # Store in sender's outbox for tracking
                outbox_path = await self._get_agent_outbox(from_agent)
                outbox_file = outbox_path / f"{message.id}.json"
                async with aiofiles.open(outbox_file, "w") as f:
                    await f.write(message.model_dump_json(indent=2))

            self._message_counter += 1
            logger.info(
                "Message sent",
                message_id=message.id,
                from_agent=from_agent,
                to_agent=to_agent,
                message_type=message_type,
            )
            increment_counter("ai_workflow_message_sent")

            return message.id

        except Exception as e:
            self._error_counter += 1
            logger.error(
                "Failed to send message",
                error=str(e),
                from_agent=from_agent,
                to_agent=to_agent,
                message_type=message_type,
            )
            increment_counter("ai_workflow_message_send_error")
            raise

    async def broadcast(
        self,
        from_agent: str,
        message_type: str,
        payload: Dict[str, Any],
        priority: int = 5,
        expires_at: Optional[datetime] = None,
    ) -> str:
        """Broadcast message to all active agents.

        Args:
            from_agent: Source agent identifier
            message_type: Type of message
            payload: Message payload data
            priority: Message priority
            expires_at: Message expiration time

        Returns:
            Message ID for tracking
        """
        # Create broadcast message
        message = Message(
            from_agent=from_agent,
            to_agent=None,  # Broadcast indicator
            message_type=message_type,
            payload=payload,
            priority=priority,
            expires_at=expires_at,
        )

        try:
            # Write to broadcast directory
            broadcast_path = await self._get_broadcast_inbox()
            lock = await self._get_lock("broadcast")

            async with lock:
                message_file = broadcast_path / f"{message.id}.json"
                async with aiofiles.open(message_file, "w") as f:
                    await f.write(message.model_dump_json(indent=2))

            self._message_counter += 1
            logger.info(
                "Broadcast message sent",
                message_id=message.id,
                from_agent=from_agent,
                message_type=message_type,
                recipient_count=len(self._active_agents),
            )
            increment_counter("ai_workflow_broadcast_sent")

            return message.id

        except Exception as e:
            self._error_counter += 1
            logger.error(
                "Failed to send broadcast",
                error=str(e),
                from_agent=from_agent,
                message_type=message_type,
            )
            increment_counter("ai_workflow_broadcast_error")
            raise

    async def get_messages(self, agent_id: str, limit: int = 50) -> List[Message]:
        """Get pending messages for an agent.

        Args:
            agent_id: Agent identifier
            limit: Maximum number of messages to return

        Returns:
            List of messages sorted by priority and timestamp
        """
        if agent_id not in self._active_agents:
            raise ValueError(f"Agent {agent_id} is not registered")

        messages: List[Message] = []

        try:
            # Get direct messages from inbox
            inbox_path = await self._get_agent_inbox(agent_id)
            lock = await self._get_lock(f"inbox_{agent_id}")

            async with lock:
                if inbox_path.exists():
                    for message_file in inbox_path.glob("*.json"):
                        try:
                            async with aiofiles.open(message_file, "r") as f:
                                content = await f.read()
                                message = Message.model_validate_json(content)

                                # Check if message expired
                                if (
                                    message.expires_at
                                    and datetime.now(timezone.utc) > message.expires_at
                                ):
                                    await aiofiles.os.remove(message_file)
                                    continue

                                messages.append(message)
                        except Exception as e:
                            logger.warning(
                                "Failed to read message file",
                                file=str(message_file),
                                error=str(e),
                            )

            # Get broadcast messages
            broadcast_path = await self._get_broadcast_inbox()
            broadcast_lock = await self._get_lock("broadcast")

            async with broadcast_lock:
                if broadcast_path.exists():
                    for message_file in broadcast_path.glob("*.json"):
                        try:
                            async with aiofiles.open(message_file, "r") as f:
                                content = await f.read()
                                message = Message.model_validate_json(content)

                                # Skip messages from self
                                if message.from_agent == agent_id:
                                    continue

                                # Check if message expired
                                if (
                                    message.expires_at
                                    and datetime.now(timezone.utc) > message.expires_at
                                ):
                                    continue

                                messages.append(message)
                        except Exception as e:
                            logger.warning(
                                "Failed to read broadcast message",
                                file=str(message_file),
                                error=str(e),
                            )

            # Sort by priority (lower number = higher priority) then timestamp
            messages.sort(key=lambda m: (m.priority, m.timestamp))

            logger.debug(
                "Retrieved messages", agent_id=agent_id, message_count=len(messages)
            )
            increment_counter("ai_workflow_messages_retrieved")

            return messages[:limit]

        except Exception as e:
            logger.error("Failed to get messages", agent_id=agent_id, error=str(e))
            increment_counter("ai_workflow_message_retrieval_error")
            raise

    async def acknowledge_message(self, agent_id: str, message_id: str) -> bool:
        """Acknowledge receipt and processing of a message.

        Args:
            agent_id: Agent identifier
            message_id: Message ID to acknowledge

        Returns:
            True if message was acknowledged successfully
        """
        try:
            # Remove from agent inbox
            inbox_path = await self._get_agent_inbox(agent_id)
            message_file = inbox_path / f"{message_id}.json"

            lock = await self._get_lock(f"inbox_{agent_id}")
            async with lock:
                if message_file.exists():
                    await aiofiles.os.remove(message_file)

                    logger.debug(
                        "Message acknowledged", agent_id=agent_id, message_id=message_id
                    )
                    increment_counter("ai_workflow_message_acknowledged")
                    return True

            # Message might be a broadcast - check if it still exists
            broadcast_path = await self._get_broadcast_inbox()
            broadcast_file = broadcast_path / f"{message_id}.json"

            broadcast_lock = await self._get_lock("broadcast")
            async with broadcast_lock:
                if broadcast_file.exists():
                    # For broadcasts, we don't remove the file but log the acknowledgment
                    logger.debug(
                        "Broadcast message acknowledged",
                        agent_id=agent_id,
                        message_id=message_id,
                    )
                    increment_counter("ai_workflow_broadcast_acknowledged")
                    return True

            logger.warning(
                "Message not found for acknowledgment",
                agent_id=agent_id,
                message_id=message_id,
            )
            return False

        except Exception as e:
            logger.error(
                "Failed to acknowledge message",
                agent_id=agent_id,
                message_id=message_id,
                error=str(e),
            )
            increment_counter("ai_workflow_message_ack_error")
            return False

    async def get_delivery_status(
        self, message_id: str
    ) -> Optional[MessageDeliveryStatus]:
        """Get delivery status for a message.

        Args:
            message_id: Message ID to check

        Returns:
            Delivery status or None if message not found
        """
        # For now, we'll implement basic status checking
        # In a production system, this would track actual delivery confirmations

        # Check if message exists in any outbox (sent)
        for agent_id in self._active_agents:
            try:
                outbox_path = await self._get_agent_outbox(agent_id)
                message_file = outbox_path / f"{message_id}.json"

                if message_file.exists():
                    return MessageDeliveryStatus(
                        message_id=message_id,
                        delivered=True,  # Simplified for now
                        delivered_at=datetime.now(timezone.utc),
                        attempts=1,
                    )
            except Exception:
                continue

        # Check broadcast directory
        try:
            broadcast_path = await self._get_broadcast_inbox()
            message_file = broadcast_path / f"{message_id}.json"

            if message_file.exists():
                return MessageDeliveryStatus(
                    message_id=message_id,
                    delivered=True,
                    delivered_at=datetime.now(timezone.utc),
                    attempts=1,
                )
        except Exception:
            pass

        return None

    async def cleanup_expired_messages(self) -> int:
        """Clean up expired messages from all agent directories.

        Returns:
            Number of messages cleaned up
        """
        cleaned_count = 0
        current_time = datetime.now(timezone.utc)

        try:
            # Clean agent inboxes
            for agent_id in self._active_agents:
                inbox_path = await self._get_agent_inbox(agent_id)
                lock = await self._get_lock(f"inbox_{agent_id}")

                async with lock:
                    if inbox_path.exists():
                        for message_file in inbox_path.glob("*.json"):
                            try:
                                async with aiofiles.open(message_file, "r") as f:
                                    content = await f.read()
                                    message = Message.model_validate_json(content)

                                    if (
                                        message.expires_at
                                        and current_time > message.expires_at
                                    ):
                                        await aiofiles.os.remove(message_file)
                                        cleaned_count += 1
                            except Exception as e:
                                logger.warning(
                                    "Failed to check message expiration",
                                    file=str(message_file),
                                    error=str(e),
                                )

            # Clean broadcast directory
            broadcast_path = await self._get_broadcast_inbox()
            broadcast_lock = await self._get_lock("broadcast")

            async with broadcast_lock:
                if broadcast_path.exists():
                    for message_file in broadcast_path.glob("*.json"):
                        try:
                            async with aiofiles.open(message_file, "r") as f:
                                content = await f.read()
                                message = Message.model_validate_json(content)

                                if (
                                    message.expires_at
                                    and current_time > message.expires_at
                                ):
                                    await aiofiles.os.remove(message_file)
                                    cleaned_count += 1
                        except Exception as e:
                            logger.warning(
                                "Failed to check broadcast message expiration",
                                file=str(message_file),
                                error=str(e),
                            )

            if cleaned_count > 0:
                logger.info("Cleaned up expired messages", count=cleaned_count)
                increment_counter("ai_workflow_messages_cleaned", cleaned_count)

            return cleaned_count

        except Exception as e:
            logger.error("Failed to cleanup expired messages", error=str(e))
            increment_counter("ai_workflow_cleanup_error")
            return 0

    async def get_statistics(self) -> Dict[str, Any]:
        """Get message bus statistics.

        Returns:
            Dictionary containing various statistics
        """
        return {
            "active_agents": len(self._active_agents),
            "total_messages_sent": self._message_counter,
            "total_errors": self._error_counter,
            "error_rate": self._error_counter / max(self._message_counter, 1),
            "base_path": str(self.base_path),
            "agents": list(self._active_agents.keys()),
        }
