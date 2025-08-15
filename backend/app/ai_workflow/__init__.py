"""AI Workflow Foundation System.

This module provides the core components for autonomous AI workflow management,
including agent communication, state persistence, task execution, and quality gates.

The system is designed to support:
- Multi-agent coordination through file-based messaging
- Robust state management with checkpoint/recovery
- Task execution with automatic rollback capabilities
- Continuous quality validation and monitoring
"""

from .messaging import AgentMessageBus
from .state_manager import WorkflowStateManager  
from .execution_engine import TaskExecutionEngine
from .quality_gates import AutomatedQualityGates

__all__ = [
    "AgentMessageBus",
    "WorkflowStateManager", 
    "TaskExecutionEngine",
    "AutomatedQualityGates",
]