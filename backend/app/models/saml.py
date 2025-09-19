"""
SAML SSO database models for enterprise authentication.

Provides models for:
- SAML configuration per tenant
- SAML authentication sessions
- Identity provider metadata
- User attribute mapping
"""

import uuid as uuid_module
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Dict, List, Optional

from sqlalchemy import Boolean, ForeignKey, Index, String, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from .tenant import Tenant
    from .user import User


class SAMLStatus(str, Enum):
    """SAML configuration status."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    TESTING = "testing"
    ERROR = "error"


class IdentityProvider(str, Enum):
    """Supported identity provider types."""
    OKTA = "okta"
    AZURE_AD = "azure_ad"
    GOOGLE_WORKSPACE = "google_workspace"
    ONELOGIN = "onelogin"
    ADFS = "adfs"
    GENERIC = "generic"


class SAMLConfig(Base):
    """
    SAML configuration model for tenant-specific SSO settings.
    
    Stores complete SAML configuration including:
    - Identity Provider metadata and certificates
    - Service Provider settings
    - Attribute mapping configuration
    - Security and validation settings
    """
    
    __tablename__ = "saml_configs"
    
    # Core identification
    uuid: Mapped[uuid_module.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid_module.uuid4,
        unique=True,
        index=True,
        nullable=False,
    )
    
    # Tenant relationship
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tenant: Mapped["Tenant"] = relationship("Tenant")
    
    # Identity Provider configuration
    idp_type: Mapped[IdentityProvider] = mapped_column(
        default=IdentityProvider.GENERIC,
        nullable=False,
        index=True,
        doc="Type of identity provider"
    )
    idp_entity_id: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        doc="Identity Provider Entity ID"
    )
    idp_sso_url: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
        doc="Identity Provider Single Sign-On URL"
    )
    idp_slo_url: Mapped[Optional[str]] = mapped_column(
        String(1000),
        nullable=True,
        doc="Identity Provider Single Logout URL"
    )
    idp_x509_cert: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Identity Provider X.509 certificate for signature verification"
    )
    idp_metadata_url: Mapped[Optional[str]] = mapped_column(
        String(1000),
        nullable=True,
        doc="URL to fetch IdP metadata (for auto-configuration)"
    )
    
    # Service Provider configuration
    sp_entity_id: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        doc="Service Provider Entity ID"
    )
    sp_acs_url: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
        doc="Service Provider Assertion Consumer Service URL"
    )
    sp_slo_url: Mapped[Optional[str]] = mapped_column(
        String(1000),
        nullable=True,
        doc="Service Provider Single Logout URL"
    )
    sp_x509_cert: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Service Provider X.509 certificate (if SP signing enabled)"
    )
    sp_private_key: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Service Provider private key (encrypted, if SP signing enabled)"
    )
    
    # Configuration status and metadata
    status: Mapped[SAMLStatus] = mapped_column(
        default=SAMLStatus.TESTING,
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        doc="Human-readable configuration name"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Configuration description"
    )
    
    # User provisioning settings
    auto_provision: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        doc="Automatically create users from SAML assertions"
    )
    attribute_mapping: Mapped[Dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        doc="Mapping of SAML attributes to user fields"
    )
    default_role: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Default role for auto-provisioned users"
    )
    group_mapping: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Mapping of SAML groups to application roles"
    )
    
    # Security settings
    require_signed_assertions: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        doc="Require digitally signed SAML assertions"
    )
    require_signed_responses: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Require digitally signed SAML responses"
    )
    encrypt_assertions: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Encrypt SAML assertions"
    )
    signature_algorithm: Mapped[str] = mapped_column(
        String(100),
        default="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
        nullable=False,
        doc="XML signature algorithm"
    )
    digest_algorithm: Mapped[str] = mapped_column(
        String(100),
        default="http://www.w3.org/2001/04/xmlenc#sha256",
        nullable=False,
        doc="XML digest algorithm"
    )
    
    # Session and timeout settings
    session_timeout_minutes: Mapped[int] = mapped_column(
        default=480,  # 8 hours
        nullable=False,
        doc="SAML session timeout in minutes"
    )
    max_authentication_age: Mapped[int] = mapped_column(
        default=86400,  # 24 hours
        nullable=False,
        doc="Maximum authentication age in seconds"
    )
    
    # Advanced configuration
    settings: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Additional SAML settings and feature flags"
    )
    
    # Lifecycle management
    last_metadata_refresh: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Last time IdP metadata was refreshed"
    )
    last_test_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Last time configuration was tested"
    )
    test_result: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Result of last configuration test"
    )
    
    # Relationships
    sessions: Mapped[List["SAMLSession"]] = relationship(
        "SAMLSession",
        back_populates="config",
        cascade="all, delete-orphan",
    )
    
    # Indexes for performance
    __table_args__ = (
        Index("idx_saml_config_tenant_status", "tenant_id", "status"),
        Index("idx_saml_config_idp_type", "idp_type"),
        Index("idx_saml_config_entity_id", "sp_entity_id"),
    )
    
    def __repr__(self) -> str:
        return f"SAMLConfig(tenant_id={self.tenant_id}, name='{self.name}', status='{self.status}')"


class SAMLSessionStatus(str, Enum):
    """SAML session status."""
    INITIATED = "initiated"
    AUTHENTICATED = "authenticated"
    EXPIRED = "expired"
    TERMINATED = "terminated"
    ERROR = "error"


class SAMLSession(Base):
    """
    SAML authentication session tracking.
    
    Tracks individual SAML authentication flows including:
    - AuthnRequest generation and tracking
    - Response validation and processing
    - Session lifecycle management
    - Audit trail for authentication events
    """
    
    __tablename__ = "saml_sessions"
    
    # Core identification
    uuid: Mapped[uuid_module.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid_module.uuid4,
        unique=True,
        index=True,
        nullable=False,
    )
    session_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
        doc="SAML session identifier"
    )
    request_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
        doc="SAML AuthnRequest ID"
    )
    
    # Configuration relationship
    config_id: Mapped[int] = mapped_column(
        ForeignKey("saml_configs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    config: Mapped["SAMLConfig"] = relationship("SAMLConfig", back_populates="sessions")
    
    # User relationship (after authentication)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    user: Mapped[Optional["User"]] = relationship("User")
    
    # Session status and lifecycle
    status: Mapped[SAMLSessionStatus] = mapped_column(
        default=SAMLSessionStatus.INITIATED,
        nullable=False,
        index=True,
    )
    initiated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        doc="When the SAML flow was initiated"
    )
    authenticated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="When authentication was completed"
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="When the session expires"
    )
    terminated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="When the session was terminated"
    )
    
    # SAML flow details
    relay_state: Mapped[Optional[str]] = mapped_column(
        String(1000),
        nullable=True,
        doc="RelayState parameter for maintaining state"
    )
    name_id: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="NameID from SAML assertion"
    )
    name_id_format: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
        doc="NameID format from SAML assertion"
    )
    session_index: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="SessionIndex for single logout"
    )
    
    # Assertion details
    assertion_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        doc="ID of the SAML assertion"
    )
    assertion_attributes: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Attributes from SAML assertion"
    )
    assertion_conditions: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Conditions from SAML assertion"
    )
    
    # Security and audit information
    client_ip: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
        doc="Client IP address"
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Client user agent string"
    )
    error_details: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Error details if authentication failed"
    )
    
    # Indexes for performance and security
    __table_args__ = (
        Index("idx_saml_session_config_status", "config_id", "status"),
        Index("idx_saml_session_user", "user_id"),
        Index("idx_saml_session_created", "initiated_at"),
        Index("idx_saml_session_expires", "expires_at"),
        Index("idx_saml_session_name_id", "name_id"),
    )
    
    def __repr__(self) -> str:
        return f"SAMLSession(session_id='{self.session_id}', status='{self.status}')"


class SAMLAttributeMapping(Base):
    """
    SAML attribute mapping templates for different identity providers.
    
    Provides reusable attribute mapping configurations for:
    - Different identity provider types
    - Custom attribute mappings per tenant
    - Template-based configuration management
    """
    
    __tablename__ = "saml_attribute_mappings"
    
    # Core identification
    uuid: Mapped[uuid_module.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid_module.uuid4,
        unique=True,
        index=True,
        nullable=False,
    )
    
    # Template metadata
    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        doc="Template name"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Template description"
    )
    idp_type: Mapped[IdentityProvider] = mapped_column(
        default=IdentityProvider.GENERIC,
        nullable=False,
        index=True,
        doc="Target identity provider type"
    )
    
    # Tenant relationship (optional - global templates have no tenant)
    tenant_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        doc="Tenant ID for custom templates (null for global templates)"
    )
    tenant: Mapped[Optional["Tenant"]] = relationship("Tenant")
    
    # Attribute mapping configuration
    attribute_mappings: Mapped[Dict] = mapped_column(
        JSONB,
        nullable=False,
        doc="Mapping of SAML attributes to user fields"
    )
    group_mappings: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Mapping of SAML groups to application roles"
    )
    default_attributes: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Default values for user attributes"
    )
    
    # Template settings
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )
    is_system: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="System-provided template (read-only)"
    )
    
    # Usage tracking
    usage_count: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
        doc="Number of times this template has been used"
    )
    last_used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="When this template was last used"
    )
    
    # Indexes
    __table_args__ = (
        Index("idx_saml_attr_mapping_tenant", "tenant_id"),
        Index("idx_saml_attr_mapping_idp_type", "idp_type"),
        Index("idx_saml_attr_mapping_active", "is_active"),
        Index("idx_saml_attr_mapping_system", "is_system"),
    )
    
    def __repr__(self) -> str:
        return f"SAMLAttributeMapping(name='{self.name}', idp_type='{self.idp_type}')"


class SAMLAuditLog(Base):
    """
    Audit log for SAML authentication events.
    
    Tracks all SAML-related activities for security and compliance:
    - Authentication attempts and results
    - Configuration changes
    - Error conditions and security events
    - Performance and usage metrics
    """
    
    __tablename__ = "saml_audit_logs"
    
    # Core identification
    uuid: Mapped[uuid_module.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid_module.uuid4,
        unique=True,
        index=True,
        nullable=False,
    )
    
    # Tenant and configuration context
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tenant: Mapped["Tenant"] = relationship("Tenant")
    
    config_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("saml_configs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    config: Mapped[Optional["SAMLConfig"]] = relationship("SAMLConfig")
    
    session_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("saml_sessions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    session: Mapped[Optional["SAMLSession"]] = relationship("SAMLSession")
    
    # Event details
    event_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        doc="Type of SAML event (e.g., 'auth_success', 'config_updated')"
    )
    event_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        doc="Event status (success, failure, error)"
    )
    event_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Human-readable event message"
    )
    event_details: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Detailed event information"
    )
    
    # Actor and context
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        doc="User who triggered the event"
    )
    user: Mapped[Optional["User"]] = relationship("User")
    
    client_ip: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
        doc="Client IP address"
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Client user agent string"
    )
    
    # Performance metrics
    duration_ms: Mapped[Optional[int]] = mapped_column(
        nullable=True,
        doc="Event duration in milliseconds"
    )
    
    # Security indicators
    risk_score: Mapped[Optional[int]] = mapped_column(
        nullable=True,
        doc="Risk score for the event (0-100)"
    )
    security_flags: Mapped[Optional[List]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Security-related flags or indicators"
    )
    
    # Indexes for performance and security
    __table_args__ = (
        Index("idx_saml_audit_tenant_event", "tenant_id", "event_type"),
        Index("idx_saml_audit_status", "event_status"),
        Index("idx_saml_audit_user", "user_id"),
        Index("idx_saml_audit_created", "created_at"),
        Index("idx_saml_audit_client_ip", "client_ip"),
        Index("idx_saml_audit_risk", "risk_score"),
    )
    
    def __repr__(self) -> str:
        return f"SAMLAuditLog(tenant_id={self.tenant_id}, event_type='{self.event_type}', status='{self.event_status}')"