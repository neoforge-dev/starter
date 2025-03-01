"""Admin model for role-based access control."""
from datetime import datetime
from typing import Optional, List

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, Enum as SQLEnum
import enum

from app.db.base_class import Base
from app.db.types import TZDateTime
from app.utils.datetime import utc_now


class AdminRole(str, enum.Enum):
    """Admin role enumeration."""
    SUPER_ADMIN = "super_admin"
    CONTENT_ADMIN = "content_admin"
    USER_ADMIN = "user_admin"
    READONLY_ADMIN = "readonly_admin"


class AdminPermission(Base):
    """Admin permission model."""
    __tablename__ = "admin_permissions"

    role: Mapped[AdminRole] = mapped_column(SQLEnum(AdminRole), nullable=False)
    resource: Mapped[str] = mapped_column(String, nullable=False)  # e.g., "users", "content", "settings"
    can_create: Mapped[bool] = mapped_column(default=False)
    can_read: Mapped[bool] = mapped_column(default=True)
    can_update: Mapped[bool] = mapped_column(default=False)
    can_delete: Mapped[bool] = mapped_column(default=False)


class Admin(Base):
    """Admin model extending the base user model."""
    __tablename__ = "admins"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    role: Mapped[AdminRole] = mapped_column(SQLEnum(AdminRole), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)
    last_login: Mapped[Optional[datetime]] = mapped_column(TZDateTime, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="admin")
    audit_logs: Mapped[List["AdminAuditLog"]] = relationship("AdminAuditLog", back_populates="admin")


class AdminAuditLog(Base):
    """Admin audit log for tracking admin actions."""
    __tablename__ = "admin_audit_logs"

    admin_id: Mapped[int] = mapped_column(ForeignKey("admins.id"), nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)  # e.g., "create", "update", "delete"
    resource: Mapped[str] = mapped_column(String, nullable=False)  # e.g., "users", "content"
    resource_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # ID of the affected resource
    details: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # Additional action details

    # Relationships
    admin: Mapped["Admin"] = relationship("Admin", back_populates="audit_logs") 