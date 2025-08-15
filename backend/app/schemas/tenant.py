"""Pydantic schemas for tenant and organization models."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.tenant import TenantStatus, OrganizationType, MembershipStatus


# Tenant Schemas

class TenantBase(BaseModel):
    """Base tenant schema."""
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=100, pattern="^[a-z0-9-]+$")
    domain: Optional[str] = Field(None, max_length=255)
    subscription_tier: str = Field("trial", max_length=50)
    billing_email: Optional[EmailStr] = None
    require_mfa: bool = False
    session_timeout_minutes: int = Field(480, ge=5, le=10080)  # 5 min to 1 week


class TenantCreate(TenantBase):
    """Schema for creating tenant."""
    settings: Optional[Dict[str, Any]] = None
    limits: Optional[Dict[str, Any]] = None
    
    @field_validator('slug')
    def validate_slug(cls, v):
        """Validate tenant slug format."""
        if not v or len(v) < 3:
            raise ValueError('Slug must be at least 3 characters long')
        if v.startswith('-') or v.endswith('-'):
            raise ValueError('Slug cannot start or end with hyphen')
        return v.lower()


class TenantUpdate(BaseModel):
    """Schema for updating tenant."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    domain: Optional[str] = Field(None, max_length=255)
    subscription_tier: Optional[str] = Field(None, max_length=50)
    billing_email: Optional[EmailStr] = None
    settings: Optional[Dict[str, Any]] = None
    limits: Optional[Dict[str, Any]] = None
    require_mfa: Optional[bool] = None
    session_timeout_minutes: Optional[int] = Field(None, ge=5, le=10080)
    allowed_ip_ranges: Optional[List[str]] = None


class TenantResponse(TenantBase):
    """Schema for tenant response."""
    id: int
    uuid: UUID
    status: TenantStatus
    schema_name: str
    settings: Optional[Dict[str, Any]] = None
    limits: Optional[Dict[str, Any]] = None
    branding: Optional[Dict[str, Any]] = None
    trial_ends_at: Optional[datetime] = None
    suspended_at: Optional[datetime] = None
    suspension_reason: Optional[str] = None
    allowed_ip_ranges: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Organization Schemas

class OrganizationBase(BaseModel):
    """Base organization schema."""
    slug: str = Field(..., min_length=1, max_length=100, pattern="^[a-z0-9-]+$")
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    type: OrganizationType = OrganizationType.TEAM
    parent_id: Optional[int] = None
    visibility: str = Field("private", pattern="^(private|internal|public)$")
    requires_approval: bool = True


class OrganizationCreate(OrganizationBase):
    """Schema for creating organization."""
    settings: Optional[Dict[str, Any]] = None
    
    @field_validator('slug')
    def validate_slug(cls, v):
        """Validate organization slug format."""
        if not v or len(v) < 2:
            raise ValueError('Slug must be at least 2 characters long')
        if v.startswith('-') or v.endswith('-'):
            raise ValueError('Slug cannot start or end with hyphen')
        return v.lower()


class OrganizationUpdate(BaseModel):
    """Schema for updating organization."""
    slug: Optional[str] = Field(None, min_length=1, max_length=100, pattern="^[a-z0-9-]+$")
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    type: Optional[OrganizationType] = None
    parent_id: Optional[int] = None
    settings: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    visibility: Optional[str] = Field(None, pattern="^(private|internal|public)$")
    requires_approval: Optional[bool] = None
    
    @field_validator('slug')
    def validate_slug(cls, v):
        """Validate organization slug format."""
        if v is not None:
            if len(v) < 2:
                raise ValueError('Slug must be at least 2 characters long')
            if v.startswith('-') or v.endswith('-'):
                raise ValueError('Slug cannot start or end with hyphen')
            return v.lower()
        return v


class OrganizationResponse(OrganizationBase):
    """Schema for organization response."""
    id: int
    uuid: UUID
    tenant_id: int
    settings: Optional[Dict[str, Any]] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Optional nested data
    parent: Optional['OrganizationResponse'] = None
    children: Optional[List['OrganizationResponse']] = None
    member_count: Optional[int] = None
    
    class Config:
        from_attributes = True


class OrganizationHierarchyResponse(BaseModel):
    """Schema for organization hierarchy response."""
    organization: OrganizationResponse
    ancestors: List[OrganizationResponse]
    descendants: List[OrganizationResponse]
    total_depth: int


# Organization Membership Schemas

class OrganizationMembershipBase(BaseModel):
    """Base organization membership schema."""
    status: MembershipStatus = MembershipStatus.PENDING
    notes: Optional[str] = Field(None, max_length=1000)


class OrganizationMembershipCreate(OrganizationMembershipBase):
    """Schema for creating organization membership."""
    user_id: int
    role_id: Optional[int] = None
    permissions_override: Optional[Dict[str, Any]] = None


class OrganizationMembershipUpdate(BaseModel):
    """Schema for updating organization membership."""
    status: Optional[MembershipStatus] = None
    role_id: Optional[int] = None
    permissions_override: Optional[Dict[str, Any]] = None
    notes: Optional[str] = Field(None, max_length=1000)


class OrganizationMembershipResponse(OrganizationMembershipBase):
    """Schema for organization membership response."""
    id: int
    user_id: int
    organization_id: int
    role_id: Optional[int] = None
    joined_at: Optional[datetime] = None
    invited_by_id: Optional[int] = None
    invitation_token: Optional[str] = None
    invitation_expires_at: Optional[datetime] = None
    permissions_override: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    # Optional nested data
    user: Optional['UserResponse'] = None
    organization: Optional[OrganizationResponse] = None
    role: Optional['RoleResponse'] = None
    invited_by: Optional['UserResponse'] = None
    
    class Config:
        from_attributes = True


class OrganizationInviteCreate(BaseModel):
    """Schema for inviting user to organization."""
    email: EmailStr
    role: Optional[str] = "member"
    auto_approve: bool = False
    message: Optional[str] = Field(None, max_length=500)
    expires_in_days: int = Field(7, ge=1, le=30)


class OrganizationInviteResponse(BaseModel):
    """Schema for organization invite response."""
    id: int
    email: str
    organization_id: int
    role: str
    status: MembershipStatus
    invitation_token: str
    invitation_expires_at: datetime
    invited_by_id: int
    message: Optional[str] = None
    created_at: datetime


# RBAC Schemas

class PermissionBase(BaseModel):
    """Base permission schema."""
    name: str = Field(..., min_length=1, max_length=100)
    display_name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    resource_type: str = Field(..., min_length=1, max_length=50)
    action: str
    scope: str = "organization"


class PermissionCreate(PermissionBase):
    """Schema for creating permission."""
    requires_permissions: Optional[List[str]] = None
    conflicts_with: Optional[List[str]] = None
    conditions: Optional[Dict[str, Any]] = None


class PermissionUpdate(BaseModel):
    """Schema for updating permission."""
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = None
    requires_permissions: Optional[List[str]] = None
    conflicts_with: Optional[List[str]] = None
    conditions: Optional[Dict[str, Any]] = None


class PermissionResponse(PermissionBase):
    """Schema for permission response."""
    id: int
    is_system: bool
    is_active: bool
    requires_permissions: Optional[List[str]] = None
    conflicts_with: Optional[List[str]] = None
    conditions: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RoleBase(BaseModel):
    """Base role schema."""
    name: str = Field(..., min_length=1, max_length=100)
    display_name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    type: str = "custom"
    priority: int = Field(0, ge=0, le=100)


class RoleCreate(RoleBase):
    """Schema for creating role."""
    tenant_id: Optional[int] = None
    organization_id: Optional[int] = None
    parent_role_id: Optional[int] = None
    permission_ids: Optional[List[int]] = None
    settings: Optional[Dict[str, Any]] = None


class RoleUpdate(BaseModel):
    """Schema for updating role."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=0, le=100)
    parent_role_id: Optional[int] = None
    permission_ids: Optional[List[int]] = None
    settings: Optional[Dict[str, Any]] = None


class RoleResponse(RoleBase):
    """Schema for role response."""
    id: int
    tenant_id: Optional[int] = None
    organization_id: Optional[int] = None
    parent_role_id: Optional[int] = None
    is_system: bool
    is_active: bool
    settings: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    # Optional nested data
    permissions: Optional[List[PermissionResponse]] = None
    parent_role: Optional['RoleResponse'] = None
    child_roles: Optional[List['RoleResponse']] = None
    
    class Config:
        from_attributes = True


class RoleAssignmentCreate(BaseModel):
    """Schema for creating role assignment."""
    user_id: int
    role_id: int
    tenant_id: Optional[int] = None
    organization_id: Optional[int] = None


class RoleAssignmentResponse(BaseModel):
    """Schema for role assignment response."""
    user_id: int
    role_id: int
    tenant_id: Optional[int] = None
    organization_id: Optional[int] = None
    assigned_at: datetime
    assigned_by_id: Optional[int] = None
    
    # Optional nested data
    user: Optional['UserResponse'] = None
    role: Optional[RoleResponse] = None
    assigned_by: Optional['UserResponse'] = None
    
    class Config:
        from_attributes = True


class ResourcePermissionCreate(BaseModel):
    """Schema for creating resource permission."""
    user_id: int
    permission_name: str
    resource_type: str
    resource_id: str
    granted: bool = True
    expires_at: Optional[datetime] = None
    conditions: Optional[Dict[str, Any]] = None
    notes: Optional[str] = Field(None, max_length=1000)


class ResourcePermissionResponse(BaseModel):
    """Schema for resource permission response."""
    id: int
    user_id: int
    permission_id: int
    resource_type: str
    resource_id: str
    granted: bool
    tenant_id: int
    granted_by_id: Optional[int] = None
    expires_at: Optional[datetime] = None
    conditions: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Optional nested data
    user: Optional['UserResponse'] = None
    permission: Optional[PermissionResponse] = None
    granted_by: Optional['UserResponse'] = None
    
    class Config:
        from_attributes = True


# Audit Schemas

class TenantAuditLogResponse(BaseModel):
    """Schema for tenant audit log response."""
    id: int
    tenant_id: int
    actor_id: Optional[int] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    
    # Optional nested data
    actor: Optional['UserResponse'] = None
    
    class Config:
        from_attributes = True


# User Schema (minimal definition, would be in user schemas)
class UserResponse(BaseModel):
    """Minimal user response schema."""
    id: int
    email: str
    full_name: str
    is_active: bool
    is_verified: bool
    
    class Config:
        from_attributes = True


# Update forward references
OrganizationResponse.model_rebuild()
OrganizationMembershipResponse.model_rebuild()
RoleResponse.model_rebuild()
RoleAssignmentResponse.model_rebuild()
ResourcePermissionResponse.model_rebuild()
TenantAuditLogResponse.model_rebuild()