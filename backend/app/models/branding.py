"""
Enterprise Branding database models for white-label customization.

Provides models for:
- Brand configuration per tenant
- Brand assets (logos, themes, etc.)
- Custom domain management
- Theme and UI customization
"""

import uuid as uuid_module
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Dict, List, Optional

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, Text, DateTime, LargeBinary
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from .tenant import Tenant
    from .user import User


class BrandConfigStatus(str, Enum):
    """Brand configuration status."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    DRAFT = "draft"
    ARCHIVED = "archived"


class AssetType(str, Enum):
    """Brand asset types."""
    LOGO = "logo"
    LOGO_DARK = "logo_dark"
    FAVICON = "favicon"
    BACKGROUND = "background"
    ICON = "icon"
    BANNER = "banner"
    WATERMARK = "watermark"
    CUSTOM = "custom"


class DomainStatus(str, Enum):
    """Custom domain status."""
    PENDING = "pending"
    VERIFYING = "verifying"
    VERIFIED = "verified"
    ACTIVE = "active"
    FAILED = "failed"
    SUSPENDED = "suspended"


class BrandConfig(Base):
    """
    Brand configuration model for tenant-specific branding.
    
    Stores complete branding configuration including:
    - Brand identity and naming
    - Theme and color schemes
    - Custom domain settings
    - UI/UX customization options
    """
    
    __tablename__ = "brand_configs"
    
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
    
    # Brand identity
    brand_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        doc="Display name for the brand"
    )
    brand_description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Brand description and messaging"
    )
    tagline: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="Brand tagline or slogan"
    )
    
    # Status and metadata
    status: Mapped[BrandConfigStatus] = mapped_column(
        default=BrandConfigStatus.DRAFT,
        nullable=False,
        index=True,
    )
    version: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
        doc="Configuration version for change tracking"
    )
    
    # Theme configuration
    primary_color: Mapped[str] = mapped_column(
        String(7),  # #RRGGBB
        nullable=False,
        default="#007bff",
        doc="Primary brand color"
    )
    secondary_color: Mapped[Optional[str]] = mapped_column(
        String(7),
        nullable=True,
        doc="Secondary brand color"
    )
    accent_color: Mapped[Optional[str]] = mapped_column(
        String(7),
        nullable=True,
        doc="Accent brand color"
    )
    background_color: Mapped[str] = mapped_column(
        String(7),
        default="#ffffff",
        nullable=False,
        doc="Default background color"
    )
    text_color: Mapped[str] = mapped_column(
        String(7),
        default="#333333",
        nullable=False,
        doc="Default text color"
    )
    
    # Typography
    font_family: Mapped[str] = mapped_column(
        String(500),
        default="Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        nullable=False,
        doc="Primary font family"
    )
    font_size_base: Mapped[str] = mapped_column(
        String(20),
        default="16px",
        nullable=False,
        doc="Base font size"
    )
    
    # Layout and styling
    border_radius: Mapped[str] = mapped_column(
        String(20),
        default="8px",
        nullable=False,
        doc="Default border radius"
    )
    spacing_unit: Mapped[str] = mapped_column(
        String(20),
        default="8px",
        nullable=False,
        doc="Base spacing unit"
    )
    
    # Custom domain configuration
    custom_domain: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        index=True,
        doc="Custom domain for tenant branding"
    )
    domain_status: Mapped[DomainStatus] = mapped_column(
        default=DomainStatus.PENDING,
        nullable=False,
        doc="Status of custom domain configuration"
    )
    domain_verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="When domain was verified"
    )
    
    # SSL/TLS configuration
    ssl_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether SSL is enabled for custom domain"
    )
    ssl_certificate_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        doc="SSL certificate identifier"
    )
    ssl_configured_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="When SSL was configured"
    )
    
    # Email branding
    email_from_name: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
        doc="From name for branded emails"
    )
    email_reply_to: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        doc="Reply-to address for branded emails"
    )
    email_footer: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Custom footer for branded emails"
    )
    
    # UI/UX customization
    ui_customization: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Custom UI/UX configuration"
    )
    css_overrides: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Custom CSS overrides"
    )
    
    # Additional settings
    settings: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Additional brand configuration settings"
    )
    
    # Lifecycle tracking
    published_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="When configuration was published/activated"
    )
    last_modified_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        doc="User who last modified the configuration"
    )
    last_modified_by: Mapped[Optional["User"]] = relationship("User")
    
    # Relationships
    assets: Mapped[List["BrandAsset"]] = relationship(
        "BrandAsset",
        back_populates="brand_config",
        cascade="all, delete-orphan",
    )
    
    # Indexes for performance
    __table_args__ = (
        Index("idx_brand_config_tenant_status", "tenant_id", "status"),
        Index("idx_brand_config_domain", "custom_domain"),
        Index("idx_brand_config_published", "published_at"),
        Index("idx_brand_config_version", "tenant_id", "version"),
    )
    
    def __repr__(self) -> str:
        return f"BrandConfig(tenant_id={self.tenant_id}, brand_name='{self.brand_name}', status='{self.status}')"


class BrandAsset(Base):
    """
    Brand asset model for storing logos, images, and other brand assets.
    
    Stores assets with metadata including:
    - File content and metadata
    - Asset type and classification
    - Usage tracking and optimization
    - Version control and variants
    """
    
    __tablename__ = "brand_assets"
    
    # Core identification
    uuid: Mapped[uuid_module.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid_module.uuid4,
        unique=True,
        index=True,
        nullable=False,
    )
    
    # Brand configuration relationship
    brand_config_id: Mapped[int] = mapped_column(
        ForeignKey("brand_configs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    brand_config: Mapped["BrandConfig"] = relationship("BrandConfig", back_populates="assets")
    
    # Asset metadata
    asset_type: Mapped[AssetType] = mapped_column(
        nullable=False,
        index=True,
        doc="Type/category of the asset"
    )
    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Original filename"
    )
    display_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        doc="Human-readable display name"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Asset description and usage notes"
    )
    
    # File content and properties
    content_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        doc="MIME type of the asset"
    )
    file_size: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        doc="File size in bytes"
    )
    file_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
        doc="SHA-256 hash of file content for deduplication"
    )
    
    # Image-specific metadata
    width: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        doc="Image width in pixels"
    )
    height: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        doc="Image height in pixels"
    )
    image_format: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        doc="Image format (PNG, JPEG, SVG, etc.)"
    )
    
    # Asset content (stored as binary data)
    # Note: In production, consider storing in cloud storage and keeping only URLs
    content_data: Mapped[Optional[bytes]] = mapped_column(
        LargeBinary,
        nullable=True,
        doc="Binary content of the asset"
    )
    
    # External storage
    storage_url: Mapped[Optional[str]] = mapped_column(
        String(1000),
        nullable=True,
        doc="External storage URL (S3, CDN, etc.)"
    )
    storage_provider: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Storage provider (s3, gcs, azure, etc.)"
    )
    
    # Asset variants and optimization
    is_optimized: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether asset has been optimized"
    )
    optimization_settings: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Asset optimization settings and results"
    )
    
    # Usage and analytics
    usage_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        doc="Number of times asset has been accessed"
    )
    last_accessed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="When asset was last accessed"
    )
    
    # Versioning
    version: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
        doc="Asset version number"
    )
    parent_asset_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("brand_assets.id", ondelete="SET NULL"),
        nullable=True,
        doc="Parent asset for variants/derivatives"
    )
    parent_asset: Mapped[Optional["BrandAsset"]] = relationship(
        "BrandAsset", remote_side="BrandAsset.id", back_populates="variants"
    )
    variants: Mapped[List["BrandAsset"]] = relationship(
        "BrandAsset", back_populates="parent_asset", cascade="all, delete-orphan"
    )
    
    # Status and lifecycle
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )
    uploaded_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        doc="User who uploaded the asset"
    )
    uploaded_by: Mapped[Optional["User"]] = relationship("User")
    
    # Additional metadata
    metadata: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Additional asset metadata"
    )
    
    # Indexes for performance
    __table_args__ = (
        Index("idx_brand_asset_config_type", "brand_config_id", "asset_type"),
        Index("idx_brand_asset_hash", "file_hash"),
        Index("idx_brand_asset_active", "is_active"),
        Index("idx_brand_asset_accessed", "last_accessed_at"),
        Index("idx_brand_asset_parent", "parent_asset_id"),
    )
    
    def __repr__(self) -> str:
        return f"BrandAsset(filename='{self.filename}', type='{self.asset_type}', size={self.file_size})"


class CustomDomain(Base):
    """
    Custom domain model for tenant-specific domain management.
    
    Handles:
    - Domain registration and verification
    - SSL/TLS certificate management
    - DNS configuration tracking
    - Domain health monitoring
    """
    
    __tablename__ = "custom_domains"
    
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
    
    # Brand configuration relationship (optional)
    brand_config_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("brand_configs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    brand_config: Mapped[Optional["BrandConfig"]] = relationship("BrandConfig")
    
    # Domain configuration
    domain: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
        doc="Custom domain name"
    )
    subdomain: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Subdomain portion (e.g., 'app' in 'app.example.com')"
    )
    
    # Domain status and verification
    status: Mapped[DomainStatus] = mapped_column(
        default=DomainStatus.PENDING,
        nullable=False,
        index=True,
    )
    verification_token: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        doc="Token for domain verification"
    )
    verification_method: Mapped[str] = mapped_column(
        String(50),
        default="dns_txt",
        nullable=False,
        doc="Method used for domain verification (dns_txt, file, etc.)"
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="When domain was successfully verified"
    )
    
    # DNS configuration
    dns_records: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Required DNS records for domain setup"
    )
    dns_configured: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether DNS is properly configured"
    )
    dns_last_checked: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="When DNS was last checked"
    )
    
    # SSL/TLS configuration
    ssl_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether SSL/TLS is enabled"
    )
    ssl_provider: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="SSL certificate provider (letsencrypt, custom, etc.)"
    )
    ssl_certificate: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="SSL certificate (PEM format)"
    )
    ssl_private_key: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="SSL private key (encrypted)"
    )
    ssl_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="When SSL certificate expires"
    )
    ssl_auto_renew: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        doc="Whether to auto-renew SSL certificate"
    )
    
    # Health monitoring
    last_health_check: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="When domain health was last checked"
    )
    health_status: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Domain health status (healthy, degraded, down)"
    )
    health_details: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Detailed health check results"
    )
    
    # Configuration and settings
    redirect_http_to_https: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        doc="Whether to redirect HTTP to HTTPS"
    )
    hsts_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        doc="Whether HSTS header is enabled"
    )
    cdn_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether CDN is enabled for domain"
    )
    
    # Usage tracking
    request_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        doc="Total number of requests served"
    )
    last_request_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="When domain last served a request"
    )
    
    # Configuration metadata
    configuration: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Additional domain configuration"
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Administrative notes"
    )
    
    # User tracking
    configured_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        doc="User who configured the domain"
    )
    configured_by: Mapped[Optional["User"]] = relationship("User")
    
    # Indexes for performance and monitoring
    __table_args__ = (
        Index("idx_custom_domain_tenant", "tenant_id"),
        Index("idx_custom_domain_status", "status"),
        Index("idx_custom_domain_verified", "verified_at"),
        Index("idx_custom_domain_ssl_expires", "ssl_expires_at"),
        Index("idx_custom_domain_health", "health_status"),
        Index("idx_custom_domain_last_request", "last_request_at"),
    )
    
    def __repr__(self) -> str:
        return f"CustomDomain(domain='{self.domain}', tenant_id={self.tenant_id}, status='{self.status}')"


class BrandAuditLog(Base):
    """
    Audit log for branding operations.
    
    Tracks all branding-related activities for compliance and monitoring:
    - Configuration changes
    - Asset uploads and modifications
    - Domain configuration changes
    - Theme updates
    """
    
    __tablename__ = "brand_audit_logs"
    
    # Core identification
    uuid: Mapped[uuid_module.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid_module.uuid4,
        unique=True,
        index=True,
        nullable=False,
    )
    
    # Tenant context
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tenant: Mapped["Tenant"] = relationship("Tenant")
    
    # Brand configuration context
    brand_config_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("brand_configs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    brand_config: Mapped[Optional["BrandConfig"]] = relationship("BrandConfig")
    
    # Event details
    event_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        doc="Type of branding event"
    )
    event_action: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        doc="Action performed (create, update, delete, etc.)"
    )
    event_resource: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        doc="Resource affected (config, asset, domain, etc.)"
    )
    event_resource_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        doc="ID of the affected resource"
    )
    
    # Event metadata
    event_description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Human-readable event description"
    )
    event_details: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Detailed event information and changes"
    )
    
    # Actor information
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        doc="User who performed the action"
    )
    user: Mapped[Optional["User"]] = relationship("User")
    
    # Request context
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
        doc="IP address of the request"
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="User agent string"
    )
    
    # Change tracking
    old_values: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Previous values before change"
    )
    new_values: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="New values after change"
    )
    
    # Indexes for performance and compliance
    __table_args__ = (
        Index("idx_brand_audit_tenant_event", "tenant_id", "event_type"),
        Index("idx_brand_audit_user", "user_id"),
        Index("idx_brand_audit_resource", "event_resource", "event_resource_id"),
        Index("idx_brand_audit_created", "created_at"),
        Index("idx_brand_audit_action", "event_action"),
    )
    
    def __repr__(self) -> str:
        return f"BrandAuditLog(tenant_id={self.tenant_id}, event='{self.event_type}', action='{self.event_action}')"