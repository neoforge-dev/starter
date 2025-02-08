"""Admin schemas for request/response validation."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.admin import AdminRole


class AdminPermissionBase(BaseModel):
    """Base schema for admin permissions."""
    role: AdminRole
    resource: str
    can_create: bool = False
    can_read: bool = True
    can_update: bool = False
    can_delete: bool = False


class AdminPermissionCreate(AdminPermissionBase):
    """Schema for creating admin permissions."""
    pass


class AdminPermissionUpdate(AdminPermissionBase):
    """Schema for updating admin permissions."""
    role: Optional[AdminRole] = None
    resource: Optional[str] = None
    can_create: Optional[bool] = None
    can_read: Optional[bool] = None
    can_update: Optional[bool] = None
    can_delete: Optional[bool] = None


class AdminPermission(AdminPermissionBase):
    """Schema for admin permission responses."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class AdminBase(BaseModel):
    """Base schema for admin operations."""
    role: AdminRole
    is_active: bool = True


class AdminCreate(AdminBase):
    """Schema for creating admin users."""
    email: EmailStr
    full_name: str
    password: str


class AdminUpdate(AdminBase):
    """Schema for updating admin users."""
    role: Optional[AdminRole] = None
    is_active: Optional[bool] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None


class Admin(AdminBase):
    """Schema for admin responses."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class AdminAuditLogBase(BaseModel):
    """Base schema for admin audit logs."""
    action: str
    resource: str
    resource_id: Optional[str] = None
    details: Optional[str] = None


class AdminAuditLogCreate(AdminAuditLogBase):
    """Schema for creating admin audit logs."""
    admin_id: int


class AdminAuditLog(AdminAuditLogBase):
    """Schema for admin audit log responses."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    admin_id: int
    created_at: datetime 