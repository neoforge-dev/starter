"""Tenant and organization models for multi-tenant architecture."""
import uuid as uuid_module
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, List, Optional

from app.db.base_class import Base
from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .rbac import Permission, Role
    from .user import User


class TenantStatus(str, Enum):
    """Tenant status enum."""

    ACTIVE = "active"
    SUSPENDED = "suspended"
    TRIAL = "trial"
    CANCELLED = "cancelled"


class OrganizationType(str, Enum):
    """Organization type enum."""

    ENTERPRISE = "enterprise"
    TEAM = "team"
    DEPARTMENT = "department"
    PROJECT = "project"


class Tenant(Base):
    """
    Tenant model for complete data isolation.

    Each tenant represents a complete isolated environment with:
    - Dedicated database schema
    - Independent user base
    - Isolated resources and data
    - Custom configuration and branding
    """

    __tablename__ = "tenants"

    # Core tenant identification
    slug: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
        doc="URL-safe tenant identifier (e.g., 'acme-corp')",
    )
    uuid: Mapped[uuid_module.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid_module.uuid4,
        unique=True,
        index=True,
        nullable=False,
        doc="Unique tenant UUID for API identification",
    )

    # Tenant metadata
    name: Mapped[str] = mapped_column(
        String(200), nullable=False, doc="Display name for the tenant"
    )
    domain: Mapped[Optional[str]] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=True,
        doc="Custom domain for tenant (e.g., 'acme.example.com')",
    )
    status: Mapped[TenantStatus] = mapped_column(
        default=TenantStatus.TRIAL, nullable=False, index=True
    )

    # Database isolation
    schema_name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        doc="PostgreSQL schema name for data isolation",
    )

    # Configuration and limits
    settings: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, doc="Tenant-specific configuration and feature flags"
    )
    limits: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, doc="Resource limits (users, storage, API calls, etc.)"
    )
    branding: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, doc="Custom branding (logo, colors, theme)"
    )

    # Billing and subscription
    subscription_tier: Mapped[str] = mapped_column(
        String(50),
        default="trial",
        nullable=False,
        doc="Subscription tier (trial, basic, pro, enterprise)",
    )
    billing_email: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, doc="Primary billing contact email"
    )

    # Lifecycle management
    trial_ends_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True, doc="Trial expiration date"
    )
    suspended_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True, doc="When tenant was suspended"
    )
    suspension_reason: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, doc="Reason for suspension"
    )

    # Security settings
    require_mfa: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Require multi-factor authentication for all users",
    )
    allowed_ip_ranges: Mapped[Optional[List[str]]] = mapped_column(
        JSONB, nullable=True, doc="Allowed IP ranges for tenant access"
    )
    session_timeout_minutes: Mapped[int] = mapped_column(
        Integer,
        default=480,  # 8 hours
        nullable=False,
        doc="Session timeout in minutes",
    )

    # Relationships
    organizations: Mapped[List["Organization"]] = relationship(
        "Organization",
        back_populates="tenant",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"Tenant(slug='{self.slug}', name='{self.name}', status='{self.status}')"


class Organization(Base):
    """
    Organization model for hierarchical structure within tenants.

    Organizations provide:
    - Hierarchical structure (unlimited nesting)
    - Role-based access control
    - Resource organization and permissions
    - Member management
    """

    __tablename__ = "organizations"

    # Core identification
    slug: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        doc="URL-safe organization identifier within tenant",
    )
    uuid: Mapped[uuid_module.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid_module.uuid4,
        unique=True,
        index=True,
        nullable=False,
    )

    # Organization metadata
    name: Mapped[str] = mapped_column(
        String(200), nullable=False, doc="Organization display name"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, doc="Organization description and purpose"
    )
    type: Mapped[OrganizationType] = mapped_column(
        default=OrganizationType.TEAM, nullable=False, index=True
    )

    # Tenant relationship
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="organizations")

    # Hierarchical structure
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        doc="Parent organization for hierarchy",
    )
    parent: Mapped[Optional["Organization"]] = relationship(
        "Organization", remote_side="Organization.id", back_populates="children"
    )
    children: Mapped[List["Organization"]] = relationship(
        "Organization", back_populates="parent", cascade="all, delete-orphan"
    )

    # Organization settings
    settings: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, doc="Organization-specific settings and preferences"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, index=True
    )

    # Access control settings
    visibility: Mapped[str] = mapped_column(
        String(20),
        default="private",
        nullable=False,
        doc="Organization visibility (private, internal, public)",
    )
    requires_approval: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        doc="Require approval for membership requests",
    )

    # Relationships
    memberships: Mapped[List["OrganizationMembership"]] = relationship(
        "OrganizationMembership",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="select",
    )

    # Add indexes for performance
    __table_args__ = (
        Index("idx_org_tenant_slug", "tenant_id", "slug", unique=True),
        Index("idx_org_tenant_parent", "tenant_id", "parent_id"),
        Index("idx_org_type_active", "type", "is_active"),
    )

    def __repr__(self) -> str:
        return f"Organization(slug='{self.slug}', name='{self.name}', tenant_id={self.tenant_id})"


class MembershipStatus(str, Enum):
    """Organization membership status."""

    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REMOVED = "removed"


class OrganizationMembership(Base):
    """
    Organization membership model for user-organization relationships.

    Manages:
    - User membership in organizations
    - Role assignments within organizations
    - Membership status and permissions
    - Invitation and approval workflows
    """

    __tablename__ = "organization_memberships"

    # Core relationships
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user: Mapped["User"] = relationship("User")

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="memberships"
    )

    # Membership details
    status: Mapped[MembershipStatus] = mapped_column(
        default=MembershipStatus.PENDING, nullable=False, index=True
    )
    role_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("roles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        doc="Primary role within this organization",
    )
    role: Mapped[Optional["Role"]] = relationship("Role")

    # Membership metadata
    joined_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True, doc="When membership was activated"
    )
    invited_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        doc="User who sent the invitation",
    )
    invited_by: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[invited_by_id]
    )
    invitation_token: Mapped[Optional[str]] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
        doc="Unique token for invitation acceptance",
    )
    invitation_expires_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True, doc="Invitation expiration date"
    )

    # Access settings
    permissions_override: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, doc="Member-specific permission overrides"
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, doc="Administrative notes about membership"
    )

    # Add constraints and indexes
    __table_args__ = (
        Index("idx_membership_user_org", "user_id", "organization_id", unique=True),
        Index("idx_membership_status", "status"),
        Index("idx_membership_role", "role_id"),
        Index("idx_invitation_token", "invitation_token", unique=True),
    )

    def __repr__(self) -> str:
        return f"OrganizationMembership(user_id={self.user_id}, org_id={self.organization_id}, status='{self.status}')"


class TenantAuditLog(Base):
    """
    Audit log for tenant-level operations.

    Tracks:
    - Tenant configuration changes
    - Organization management actions
    - Membership changes
    - Security events
    """

    __tablename__ = "tenant_audit_logs"

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
        doc="Action type (e.g., 'organization.created', 'member.invited')",
    )
    resource_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True, doc="Type of resource affected"
    )
    resource_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, index=True, doc="ID of the affected resource"
    )

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
        Index("idx_audit_tenant_action", "tenant_id", "action"),
        Index("idx_audit_actor", "actor_id"),
        Index("idx_audit_resource", "resource_type", "resource_id"),
        Index("idx_audit_created", "created_at"),
    )

    def __repr__(self) -> str:
        return f"TenantAuditLog(tenant_id={self.tenant_id}, action='{self.action}', resource='{self.resource_type}')"
