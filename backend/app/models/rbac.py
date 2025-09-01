"""Role-Based Access Control (RBAC) models."""
import uuid as uuid_module
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, List, Optional, Set

from app.db.base_class import Base
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .tenant import Organization, Tenant
    from .user import User


class PermissionScope(str, Enum):
    """Permission scope levels."""

    GLOBAL = "global"  # System-wide permissions
    TENANT = "tenant"  # Tenant-wide permissions
    ORGANIZATION = "organization"  # Organization-specific permissions
    RESOURCE = "resource"  # Specific resource permissions


class PermissionAction(str, Enum):
    """Standard permission actions."""

    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    MANAGE = "manage"  # Full management permissions
    INVITE = "invite"  # Invite users/members
    APPROVE = "approve"  # Approve requests
    EXECUTE = "execute"  # Execute operations
    ADMIN = "admin"  # Administrative access


class RoleType(str, Enum):
    """Role type classification."""

    SYSTEM = "system"  # Built-in system roles
    CUSTOM = "custom"  # User-defined custom roles
    INHERITED = "inherited"  # Inherited from parent organization


# Association table for role-permission many-to-many relationship
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "permission_id",
        ForeignKey("permissions.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Index("idx_role_permissions_role", "role_id"),
    Index("idx_role_permissions_permission", "permission_id"),
)


# Association table for user-role assignments with context
user_role_assignments = Table(
    "user_role_assignments",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("tenant_id", ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True),
    Column(
        "organization_id",
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
    ),
    Column("assigned_at", DateTime, default=datetime.utcnow, nullable=False),
    Column(
        "assigned_by_id", ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    ),
    Index("idx_user_role_tenant", "user_id", "tenant_id"),
    Index("idx_user_role_org", "user_id", "organization_id"),
    Index("idx_role_assignments_role", "role_id"),
)


class Permission(Base):
    """
    Permission model for fine-grained access control.

    Permissions define specific actions that can be performed on resources:
    - Resource-based permissions (users.create, projects.read, etc.)
    - Scope-aware permissions (global, tenant, organization, resource)
    - Action-based permissions (create, read, update, delete, manage)
    """

    __tablename__ = "permissions"

    # Core permission identification
    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
        doc="Unique permission name (e.g., 'users.create', 'projects.manage')",
    )
    display_name: Mapped[str] = mapped_column(
        String(200), nullable=False, doc="Human-readable permission name"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, doc="Detailed description of what this permission allows"
    )

    # Permission classification
    resource_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        doc="Type of resource this permission applies to (users, projects, etc.)",
    )
    action: Mapped[PermissionAction] = mapped_column(
        nullable=False, index=True, doc="Action this permission allows"
    )
    scope: Mapped[PermissionScope] = mapped_column(
        default=PermissionScope.ORGANIZATION,
        nullable=False,
        index=True,
        doc="Scope level where this permission applies",
    )

    # Permission metadata
    is_system: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="System permission (cannot be deleted)",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, index=True
    )

    # Permission constraints and rules
    requires_permissions: Mapped[Optional[List[str]]] = mapped_column(
        JSONB,
        nullable=True,
        doc="List of permission names required before granting this permission",
    )
    conflicts_with: Mapped[Optional[List[str]]] = mapped_column(
        JSONB,
        nullable=True,
        doc="List of permission names that conflict with this permission",
    )

    # Metadata for permission evaluation
    conditions: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Additional conditions for permission evaluation (e.g., time-based, IP-based)",
    )

    # Relationships
    roles: Mapped[List["Role"]] = relationship(
        "Role", secondary=role_permissions, back_populates="permissions"
    )

    def __repr__(self) -> str:
        return f"Permission(name='{self.name}', action='{self.action}', scope='{self.scope}')"


class Role(Base):
    """
    Role model for grouping permissions and assigning to users.

    Roles provide:
    - Permission grouping and management
    - Hierarchical role inheritance
    - Context-aware role assignments (tenant, organization)
    - Built-in and custom role support
    """

    __tablename__ = "roles"

    # Core role identification
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        doc="Role name (unique within tenant/organization context)",
    )
    display_name: Mapped[str] = mapped_column(
        String(200), nullable=False, doc="Human-readable role name"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, doc="Role description and purpose"
    )

    # Role classification
    type: Mapped[RoleType] = mapped_column(
        default=RoleType.CUSTOM, nullable=False, index=True
    )
    is_system: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, doc="System role (cannot be deleted)"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, index=True
    )

    # Context assignment (roles can be tenant or organization-specific)
    tenant_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        doc="Tenant this role belongs to (NULL for global roles)",
    )
    tenant: Mapped[Optional["Tenant"]] = relationship("Tenant")

    organization_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        doc="Organization this role belongs to (NULL for tenant-wide roles)",
    )
    organization: Mapped[Optional["Organization"]] = relationship("Organization")

    # Role hierarchy
    parent_role_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("roles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        doc="Parent role for inheritance",
    )
    parent_role: Mapped[Optional["Role"]] = relationship(
        "Role", remote_side="Role.id", back_populates="child_roles"
    )
    child_roles: Mapped[List["Role"]] = relationship(
        "Role", back_populates="parent_role"
    )

    # Role metadata
    priority: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
        doc="Role priority for conflict resolution (higher = more important)",
    )
    settings: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, doc="Role-specific settings and configuration"
    )

    # Relationships
    permissions: Mapped[List["Permission"]] = relationship(
        "Permission", secondary=role_permissions, back_populates="roles"
    )
    users: Mapped[List["User"]] = relationship(
        "User", secondary=user_role_assignments, back_populates="roles"
    )

    # Add constraints and indexes
    __table_args__ = (
        # Unique role names within tenant/organization context
        UniqueConstraint(
            "name", "tenant_id", "organization_id", name="uq_role_name_context"
        ),
        Index("idx_role_tenant", "tenant_id"),
        Index("idx_role_organization", "organization_id"),
        Index("idx_role_type_active", "type", "is_active"),
        Index("idx_role_parent", "parent_role_id"),
    )

    def __repr__(self) -> str:
        return (
            f"Role(name='{self.name}', type='{self.type}', tenant_id={self.tenant_id})"
        )


class ResourcePermission(Base):
    """
    Resource-specific permission assignments.

    Allows fine-grained permissions on specific resources:
    - Direct user-resource permissions
    - Resource-specific permission overrides
    - Temporary permission grants
    """

    __tablename__ = "resource_permissions"

    # Core assignment
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user: Mapped["User"] = relationship("User")

    permission_id: Mapped[int] = mapped_column(
        ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    permission: Mapped["Permission"] = relationship("Permission")

    # Resource identification
    resource_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        doc="Type of resource (projects, users, organizations, etc.)",
    )
    resource_id: Mapped[str] = mapped_column(
        String(255), nullable=False, index=True, doc="Specific resource identifier"
    )

    # Permission details
    granted: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        doc="Whether permission is granted (True) or explicitly denied (False)",
    )

    # Context and metadata
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tenant: Mapped["Tenant"] = relationship("Tenant")

    granted_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        doc="User who granted this permission",
    )
    granted_by: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[granted_by_id]
    )

    # Temporal permissions
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True, doc="Permission expiration date (NULL for permanent)"
    )

    # Permission conditions
    conditions: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, doc="Additional conditions for this permission grant"
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, doc="Administrative notes about this permission grant"
    )

    # Add constraints and indexes
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "permission_id",
            "resource_type",
            "resource_id",
            name="uq_resource_permission",
        ),
        Index("idx_resource_perm_user", "user_id"),
        Index("idx_resource_perm_resource", "resource_type", "resource_id"),
        Index("idx_resource_perm_tenant", "tenant_id"),
        Index("idx_resource_perm_expires", "expires_at"),
    )

    def __repr__(self) -> str:
        return f"ResourcePermission(user_id={self.user_id}, resource='{self.resource_type}:{self.resource_id}')"


class PermissionCache(Base):
    """
    Permission cache for performance optimization.

    Caches computed permissions for users to avoid expensive
    permission resolution on every request:
    - User effective permissions
    - Context-specific permission cache
    - Cache invalidation tracking
    """

    __tablename__ = "permission_cache"

    # Cache identification
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user: Mapped["User"] = relationship("User")

    # Cache context
    tenant_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True
    )
    tenant: Mapped[Optional["Tenant"]] = relationship("Tenant")

    organization_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True
    )
    organization: Mapped[Optional["Organization"]] = relationship("Organization")

    # Cached permissions
    permissions: Mapped[List[str]] = mapped_column(
        JSONB,
        nullable=False,
        doc="List of permission names the user has in this context",
    )
    roles: Mapped[List[str]] = mapped_column(
        JSONB, nullable=False, doc="List of role names the user has in this context"
    )

    # Cache metadata
    cache_key: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        doc="Unique cache key for this permission set",
    )
    last_computed_at: Mapped[datetime] = mapped_column(
        nullable=False, doc="When permissions were last computed"
    )
    expires_at: Mapped[datetime] = mapped_column(
        nullable=False, index=True, doc="When this cache entry expires"
    )

    # Cache invalidation
    invalidated: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        doc="Whether this cache entry has been invalidated",
    )

    # Add constraints and indexes
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "tenant_id",
            "organization_id",
            name="uq_permission_cache_context",
        ),
        Index("idx_perm_cache_user", "user_id"),
        Index("idx_perm_cache_expires", "expires_at"),
        Index("idx_perm_cache_invalidated", "invalidated"),
    )

    def __repr__(self) -> str:
        return f"PermissionCache(user_id={self.user_id}, tenant_id={self.tenant_id}, org_id={self.organization_id})"


class RoleAuditLog(Base):
    """
    Audit log for role and permission changes.

    Tracks:
    - Role assignments and removals
    - Permission grants and revocations
    - Role and permission modifications
    - Security-related RBAC events
    """

    __tablename__ = "role_audit_logs"

    # Core audit fields
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tenant: Mapped["Tenant"] = relationship("Tenant")

    actor_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        doc="User who performed the action",
    )
    actor: Mapped[Optional["User"]] = relationship("User")

    # Action details
    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        doc="Action type (e.g., 'role.assigned', 'permission.granted')",
    )
    target_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        doc="User affected by the action",
    )
    target_user: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[target_user_id]
    )

    # RBAC entity details
    role_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("roles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    role: Mapped[Optional["Role"]] = relationship("Role")

    permission_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("permissions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    permission: Mapped[Optional["Permission"]] = relationship("Permission")

    # Context information
    organization_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True
    )
    organization: Mapped[Optional["Organization"]] = relationship("Organization")

    # Event metadata
    details: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, doc="Detailed information about the action"
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45), nullable=True, doc="IP address of the actor"
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, doc="User agent string"
    )

    # Add indexes for performance
    __table_args__ = (
        Index("idx_role_audit_tenant_action", "tenant_id", "action"),
        Index("idx_role_audit_actor", "actor_id"),
        Index("idx_role_audit_target", "target_user_id"),
        Index("idx_role_audit_role", "role_id"),
        Index("idx_role_audit_permission", "permission_id"),
        Index("idx_role_audit_created", "created_at"),
    )

    def __repr__(self) -> str:
        return f"RoleAuditLog(tenant_id={self.tenant_id}, action='{self.action}', target_user_id={self.target_user_id})"
