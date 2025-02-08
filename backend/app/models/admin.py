"""Admin model for role-based access control."""
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base
from app.models.user import User


class AdminRole(str, enum.Enum):
    """Admin role enumeration."""
    SUPER_ADMIN = "super_admin"
    CONTENT_ADMIN = "content_admin"
    USER_ADMIN = "user_admin"
    READONLY_ADMIN = "readonly_admin"


class AdminPermission(Base):
    """Admin permission model."""
    __tablename__ = "admin_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(Enum(AdminRole), nullable=False)
    resource = Column(String, nullable=False)  # e.g., "users", "content", "settings"
    can_create = Column(Boolean, default=False)
    can_read = Column(Boolean, default=True)
    can_update = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Admin(Base):
    """Admin model extending the base user model."""
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    role = Column(Enum(AdminRole), nullable=False)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="admin")
    audit_logs = relationship("AdminAuditLog", back_populates="admin")


class AdminAuditLog(Base):
    """Admin audit log for tracking admin actions."""
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    action = Column(String, nullable=False)  # e.g., "create", "update", "delete"
    resource = Column(String, nullable=False)  # e.g., "users", "content"
    resource_id = Column(String, nullable=True)  # ID of the affected resource
    details = Column(String, nullable=True)  # Additional action details
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    admin = relationship("Admin", back_populates="audit_logs") 