from __future__ import annotations
import logging
from typing import Optional, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request

from app.crud.audit_log import audit_log as audit_crud
from app.models.tenant import TenantAuditLog
from app.models.rbac import RoleAuditLog


logger = logging.getLogger(__name__)


async def audit_event(
    db: AsyncSession,
    *,
    user_id: Optional[int],
    action: str,
    resource: Optional[str] = None,
    metadata: Optional[str] = None,
) -> None:
    """Record an audit event. Fails silently to avoid impacting main flow."""
    try:
        await audit_crud.create(db, user_id=user_id, action=action, resource=resource, metadata=metadata)
    except Exception:
        # Intentionally ignore audit failures
        pass


async def create_audit_log(
    db: AsyncSession,
    tenant_id: int,
    actor_id: Optional[int],
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    request: Optional[Request] = None
) -> TenantAuditLog:
    """
    Create a tenant audit log entry.
    
    Args:
        db: Database session
        tenant_id: Tenant ID
        actor_id: User who performed the action
        action: Action performed (e.g., 'organization.created')
        resource_type: Type of resource affected
        resource_id: ID of the affected resource
        details: Additional details about the action
        ip_address: IP address of the actor
        user_agent: User agent string
        request: FastAPI request object (to extract IP/UA automatically)
        
    Returns:
        Created audit log entry
    """
    # Extract IP and user agent from request if provided
    if request:
        if not ip_address:
            ip_address = _get_client_ip(request)
        if not user_agent:
            user_agent = request.headers.get("user-agent")
    
    # Create audit log entry
    audit_log = TenantAuditLog(
        tenant_id=tenant_id,
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db.add(audit_log)
    await db.flush()
    
    logger.info(
        f"Audit log created: {action} on {resource_type}:{resource_id}",
        extra={
            "audit_log_id": audit_log.id,
            "tenant_id": tenant_id,
            "actor_id": actor_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "ip_address": ip_address
        }
    )
    
    return audit_log


def _get_client_ip(request: Request) -> str:
    """Extract client IP address from request."""
    # Check X-Forwarded-For header first (for load balancers)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    # Check X-Real-IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fall back to direct client IP
    return getattr(request.client, "host", "unknown")
