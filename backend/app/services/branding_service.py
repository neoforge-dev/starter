"""
Enterprise White-Label Branding Service for NeoForge.

Provides comprehensive branding customization for enterprise tenants:
- Custom logos and brand assets
- Theme and color customization
- Custom domain management with SSL automation
- Tenant-specific UI/UX customization
- Email template branding
- Multi-brand support within organizations
"""

import logging
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
from urllib.parse import urlparse
import base64
import json

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from PIL import Image
import io
import re

from app.core.config import get_settings
from app.models.tenant import Tenant
from app.crud.tenant_crud import tenant as tenant_crud

logger = logging.getLogger(__name__)
settings = get_settings()


class BrandingError(Exception):
    """Base exception for branding-related errors."""
    pass


class BrandingValidationError(BrandingError):
    """Error in branding validation."""
    pass


class BrandingAssetError(BrandingError):
    """Error with branding assets."""
    pass


class BrandingConfigurationError(BrandingError):
    """Error in branding configuration."""
    pass


class BrandTheme:
    """Brand theme configuration."""
    
    def __init__(
        self,
        primary_color: str,
        secondary_color: str = None,
        accent_color: str = None,
        background_color: str = "#ffffff",
        text_color: str = "#333333",
        font_family: str = "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        border_radius: str = "8px",
        **custom_properties
    ):
        self.primary_color = primary_color
        self.secondary_color = secondary_color or self._lighten_color(primary_color, 20)
        self.accent_color = accent_color or self._darken_color(primary_color, 10)
        self.background_color = background_color
        self.text_color = text_color
        self.font_family = font_family
        self.border_radius = border_radius
        self.custom_properties = custom_properties
        
        # Validate colors
        self._validate_colors()
    
    def _validate_colors(self):
        """Validate color format."""
        colors = [
            self.primary_color,
            self.secondary_color,
            self.accent_color,
            self.background_color,
            self.text_color
        ]
        
        hex_pattern = re.compile(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
        
        for color in colors:
            if color and not hex_pattern.match(color):
                raise BrandingValidationError(f"Invalid color format: {color}")
    
    def _lighten_color(self, color: str, percent: int) -> str:
        """Lighten a hex color by percentage."""
        if not color.startswith('#'):
            return color
        
        # Convert to RGB
        color = color.lstrip('#')
        if len(color) == 3:
            color = ''.join([c*2 for c in color])
        
        r, g, b = tuple(int(color[i:i+2], 16) for i in (0, 2, 4))
        
        # Lighten
        r = min(255, int(r + (255 - r) * percent / 100))
        g = min(255, int(g + (255 - g) * percent / 100))
        b = min(255, int(b + (255 - b) * percent / 100))
        
        return f"#{r:02x}{g:02x}{b:02x}"
    
    def _darken_color(self, color: str, percent: int) -> str:
        """Darken a hex color by percentage."""
        if not color.startswith('#'):
            return color
        
        # Convert to RGB
        color = color.lstrip('#')
        if len(color) == 3:
            color = ''.join([c*2 for c in color])
        
        r, g, b = tuple(int(color[i:i+2], 16) for i in (0, 2, 4))
        
        # Darken
        r = max(0, int(r * (100 - percent) / 100))
        g = max(0, int(g * (100 - percent) / 100))
        b = max(0, int(b * (100 - percent) / 100))
        
        return f"#{r:02x}{g:02x}{b:02x}"
    
    def to_css_variables(self) -> Dict[str, str]:
        """Convert theme to CSS custom properties."""
        return {
            "--brand-primary": self.primary_color,
            "--brand-secondary": self.secondary_color,
            "--brand-accent": self.accent_color,
            "--brand-background": self.background_color,
            "--brand-text": self.text_color,
            "--brand-font-family": self.font_family,
            "--brand-border-radius": self.border_radius,
            **{f"--brand-{key}": value for key, value in self.custom_properties.items()}
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert theme to dictionary."""
        return {
            "primary_color": self.primary_color,
            "secondary_color": self.secondary_color,
            "accent_color": self.accent_color,
            "background_color": self.background_color,
            "text_color": self.text_color,
            "font_family": self.font_family,
            "border_radius": self.border_radius,
            "custom_properties": self.custom_properties
        }


class BrandAsset:
    """Brand asset management."""
    
    def __init__(
        self,
        asset_type: str,
        content: bytes,
        content_type: str,
        filename: str = None,
        metadata: Dict[str, Any] = None
    ):
        self.asset_type = asset_type  # logo, favicon, background, etc.
        self.content = content
        self.content_type = content_type
        self.filename = filename or f"{asset_type}_{uuid.uuid4().hex[:8]}"
        self.metadata = metadata or {}
        self.size = len(content)
        self.hash = hashlib.sha256(content).hexdigest()
        
        # Validate asset
        self._validate_asset()
    
    def _validate_asset(self):
        """Validate asset content and type."""
        # Size limits (in bytes)
        max_sizes = {
            "logo": 2 * 1024 * 1024,  # 2MB
            "favicon": 1 * 1024 * 1024,  # 1MB
            "background": 5 * 1024 * 1024,  # 5MB
            "icon": 1 * 1024 * 1024,  # 1MB
        }
        
        max_size = max_sizes.get(self.asset_type, 5 * 1024 * 1024)  # Default 5MB
        
        if self.size > max_size:
            raise BrandingAssetError(
                f"Asset {self.asset_type} exceeds maximum size of {max_size} bytes"
            )
        
        # Validate image types
        if self.content_type.startswith('image/'):
            self._validate_image()
    
    def _validate_image(self):
        """Validate image content."""
        try:
            image = Image.open(io.BytesIO(self.content))
            
            # Store image metadata
            self.metadata.update({
                "width": image.width,
                "height": image.height,
                "format": image.format,
                "mode": image.mode
            })
            
            # Validate dimensions based on asset type
            if self.asset_type == "logo":
                # Logo should be reasonable size
                if image.width > 2000 or image.height > 1000:
                    raise BrandingAssetError(
                        f"Logo dimensions too large: {image.width}x{image.height}"
                    )
            elif self.asset_type == "favicon":
                # Favicon should be square and small
                if image.width != image.height or image.width > 512:
                    raise BrandingAssetError(
                        f"Favicon should be square and ≤512px: {image.width}x{image.height}"
                    )
            
            # Close image
            image.close()
            
        except Exception as e:
            raise BrandingAssetError(f"Invalid image content: {str(e)}")
    
    def resize_image(self, width: int, height: int = None) -> "BrandAsset":
        """Resize image asset."""
        if not self.content_type.startswith('image/'):
            raise BrandingAssetError("Can only resize image assets")
        
        try:
            image = Image.open(io.BytesIO(self.content))
            
            # Calculate height if not provided (maintain aspect ratio)
            if height is None:
                aspect_ratio = image.height / image.width
                height = int(width * aspect_ratio)
            
            # Resize image
            resized_image = image.resize((width, height), Image.Resampling.LANCZOS)
            
            # Save to bytes
            output = io.BytesIO()
            format = image.format or 'PNG'
            resized_image.save(output, format=format, optimize=True, quality=95)
            resized_content = output.getvalue()
            
            # Clean up
            image.close()
            resized_image.close()
            output.close()
            
            # Create new asset
            return BrandAsset(
                asset_type=f"{self.asset_type}_resized_{width}x{height}",
                content=resized_content,
                content_type=self.content_type,
                filename=f"resized_{width}x{height}_{self.filename}",
                metadata={
                    **self.metadata,
                    "resized_from": f"{self.metadata.get('width', 0)}x{self.metadata.get('height', 0)}",
                    "width": width,
                    "height": height
                }
            )
            
        except Exception as e:
            raise BrandingAssetError(f"Failed to resize image: {str(e)}")
    
    def to_base64_data_url(self) -> str:
        """Convert asset to base64 data URL."""
        b64_content = base64.b64encode(self.content).decode('utf-8')
        return f"data:{self.content_type};base64,{b64_content}"


class BrandingConfiguration:
    """Complete branding configuration for a tenant."""
    
    def __init__(
        self,
        tenant_id: int,
        brand_name: str,
        theme: BrandTheme,
        assets: Dict[str, BrandAsset] = None,
        custom_domain: str = None,
        email_settings: Dict[str, Any] = None,
        ui_customization: Dict[str, Any] = None,
        **kwargs
    ):
        self.tenant_id = tenant_id
        self.brand_name = brand_name
        self.theme = theme
        self.assets = assets or {}
        self.custom_domain = custom_domain
        self.email_settings = email_settings or {}
        self.ui_customization = ui_customization or {}
        
        # Additional configuration
        for key, value in kwargs.items():
            setattr(self, key, value)
        
        # Validate configuration
        self._validate_configuration()
    
    def _validate_configuration(self):
        """Validate branding configuration."""
        # Validate brand name
        if not self.brand_name or len(self.brand_name.strip()) == 0:
            raise BrandingValidationError("Brand name is required")
        
        if len(self.brand_name) > 100:
            raise BrandingValidationError("Brand name too long (max 100 characters)")
        
        # Validate custom domain
        if self.custom_domain:
            self._validate_custom_domain(self.custom_domain)
    
    def _validate_custom_domain(self, domain: str):
        """Validate custom domain format."""
        # Basic domain validation
        domain_pattern = re.compile(
            r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'
        )
        
        if not domain_pattern.match(domain):
            raise BrandingValidationError(f"Invalid domain format: {domain}")
        
        # Check for reserved domains
        reserved_domains = ['localhost', 'example.com', 'test.com', 'neoforge.dev']
        if any(reserved in domain.lower() for reserved in reserved_domains):
            raise BrandingValidationError(f"Domain not allowed: {domain}")
    
    def add_asset(self, asset: BrandAsset):
        """Add brand asset."""
        self.assets[asset.asset_type] = asset
    
    def get_asset(self, asset_type: str) -> Optional[BrandAsset]:
        """Get brand asset by type."""
        return self.assets.get(asset_type)
    
    def remove_asset(self, asset_type: str):
        """Remove brand asset."""
        if asset_type in self.assets:
            del self.assets[asset_type]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary."""
        return {
            "tenant_id": self.tenant_id,
            "brand_name": self.brand_name,
            "theme": self.theme.to_dict(),
            "assets": {
                asset_type: {
                    "filename": asset.filename,
                    "content_type": asset.content_type,
                    "size": asset.size,
                    "hash": asset.hash,
                    "metadata": asset.metadata
                }
                for asset_type, asset in self.assets.items()
            },
            "custom_domain": self.custom_domain,
            "email_settings": self.email_settings,
            "ui_customization": self.ui_customization
        }


class BrandingService:
    """Enterprise branding management service."""
    
    def __init__(self, db: Session):
        self.db = db
        self._configurations: Dict[int, BrandingConfiguration] = {}
    
    async def create_branding_configuration(
        self,
        tenant_id: int,
        brand_name: str,
        theme_config: Dict[str, Any],
        custom_domain: str = None,
        **options
    ) -> BrandingConfiguration:
        """
        Create branding configuration for a tenant.
        
        Args:
            tenant_id: Tenant ID
            brand_name: Brand name
            theme_config: Theme configuration
            custom_domain: Optional custom domain
            **options: Additional configuration options
            
        Returns:
            BrandingConfiguration: The created configuration
            
        Raises:
            BrandingError: If configuration is invalid
        """
        try:
            # Validate tenant exists
            tenant = await tenant_crud.get(self.db, id=tenant_id)
            if not tenant:
                raise BrandingConfigurationError(f"Tenant {tenant_id} not found")
            
            # Create theme
            theme = BrandTheme(**theme_config)
            
            # Create configuration
            config = BrandingConfiguration(
                tenant_id=tenant_id,
                brand_name=brand_name,
                theme=theme,
                custom_domain=custom_domain,
                **options
            )
            
            # Store configuration (in production, this would be in database)
            self._configurations[tenant_id] = config
            
            # Store in tenant settings
            tenant_settings = tenant.settings or {}
            tenant_settings['branding_config'] = {
                'enabled': True,
                'brand_name': brand_name,
                'theme': theme.to_dict(),
                'custom_domain': custom_domain,
                'email_settings': config.email_settings,
                'ui_customization': config.ui_customization,
                'configured_at': datetime.now(timezone.utc).isoformat()
            }
            
            await tenant_crud.update(
                self.db,
                db_obj=tenant,
                obj_in={'settings': tenant_settings}
            )
            
            logger.info(f"Branding configuration created for tenant {tenant_id}: {brand_name}")
            return config
            
        except Exception as e:
            logger.error(f"Failed to create branding configuration for tenant {tenant_id}: {str(e)}")
            raise BrandingConfigurationError(f"Failed to create branding configuration: {str(e)}")
    
    def get_branding_configuration(self, tenant_id: int) -> Optional[BrandingConfiguration]:
        """Get branding configuration for a tenant."""
        return self._configurations.get(tenant_id)
    
    async def update_branding_theme(
        self,
        tenant_id: int,
        theme_updates: Dict[str, Any]
    ) -> BrandingConfiguration:
        """
        Update branding theme for a tenant.
        
        Args:
            tenant_id: Tenant ID
            theme_updates: Theme property updates
            
        Returns:
            Updated BrandingConfiguration
        """
        config = self.get_branding_configuration(tenant_id)
        if not config:
            raise BrandingConfigurationError(f"Branding not configured for tenant {tenant_id}")
        
        try:
            # Update theme properties
            current_theme = config.theme.to_dict()
            current_theme.update(theme_updates)
            
            # Create new theme
            new_theme = BrandTheme(**current_theme)
            config.theme = new_theme
            
            # Update tenant settings
            await self._update_tenant_branding_settings(tenant_id, config)
            
            logger.info(f"Branding theme updated for tenant {tenant_id}")
            return config
            
        except Exception as e:
            logger.error(f"Failed to update branding theme for tenant {tenant_id}: {str(e)}")
            raise BrandingConfigurationError(f"Failed to update branding theme: {str(e)}")
    
    async def upload_brand_asset(
        self,
        tenant_id: int,
        asset_type: str,
        content: bytes,
        content_type: str,
        filename: str = None
    ) -> BrandAsset:
        """
        Upload brand asset for a tenant.
        
        Args:
            tenant_id: Tenant ID
            asset_type: Type of asset (logo, favicon, etc.)
            content: Asset content bytes
            content_type: MIME type
            filename: Optional filename
            
        Returns:
            BrandAsset: The uploaded asset
        """
        config = self.get_branding_configuration(tenant_id)
        if not config:
            raise BrandingConfigurationError(f"Branding not configured for tenant {tenant_id}")
        
        try:
            # Create asset
            asset = BrandAsset(
                asset_type=asset_type,
                content=content,
                content_type=content_type,
                filename=filename
            )
            
            # Add to configuration
            config.add_asset(asset)
            
            # Update tenant settings
            await self._update_tenant_branding_settings(tenant_id, config)
            
            logger.info(f"Brand asset uploaded for tenant {tenant_id}: {asset_type}")
            return asset
            
        except Exception as e:
            logger.error(f"Failed to upload brand asset for tenant {tenant_id}: {str(e)}")
            raise BrandingAssetError(f"Failed to upload brand asset: {str(e)}")
    
    async def get_brand_asset(
        self,
        tenant_id: int,
        asset_type: str,
        size: Optional[Tuple[int, int]] = None
    ) -> Optional[BrandAsset]:
        """
        Get brand asset for a tenant, optionally resized.
        
        Args:
            tenant_id: Tenant ID
            asset_type: Type of asset
            size: Optional (width, height) for resizing
            
        Returns:
            BrandAsset or None if not found
        """
        config = self.get_branding_configuration(tenant_id)
        if not config:
            return None
        
        asset = config.get_asset(asset_type)
        if not asset:
            return None
        
        # Resize if requested
        if size and asset.content_type.startswith('image/'):
            try:
                width, height = size
                resized_key = f"{asset_type}_resized_{width}x{height}"
                
                # Check if already have resized version
                resized_asset = config.get_asset(resized_key)
                if resized_asset:
                    return resized_asset
                
                # Create resized version
                resized_asset = asset.resize_image(width, height)
                config.add_asset(resized_asset)
                
                return resized_asset
                
            except Exception as e:
                logger.warning(f"Failed to resize asset {asset_type}: {str(e)}")
                return asset
        
        return asset
    
    async def configure_custom_domain(
        self,
        tenant_id: int,
        custom_domain: str,
        ssl_certificate: Optional[str] = None,
        ssl_private_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Configure custom domain for a tenant.
        
        Args:
            tenant_id: Tenant ID
            custom_domain: Custom domain
            ssl_certificate: Optional SSL certificate
            ssl_private_key: Optional SSL private key
            
        Returns:
            Domain configuration details
        """
        config = self.get_branding_configuration(tenant_id)
        if not config:
            raise BrandingConfigurationError(f"Branding not configured for tenant {tenant_id}")
        
        try:
            # Validate domain
            config._validate_custom_domain(custom_domain)
            
            # Update configuration
            config.custom_domain = custom_domain
            
            # Domain configuration
            domain_config = {
                "domain": custom_domain,
                "status": "pending_verification",
                "configured_at": datetime.now(timezone.utc).isoformat(),
                "ssl_enabled": ssl_certificate is not None,
                "verification_token": f"neoforge-verify-{uuid.uuid4().hex[:16]}"
            }
            
            # Store SSL info if provided (in production, encrypt this)
            if ssl_certificate and ssl_private_key:
                domain_config.update({
                    "ssl_certificate": ssl_certificate,
                    "ssl_private_key": ssl_private_key,
                    "ssl_configured_at": datetime.now(timezone.utc).isoformat()
                })
            
            # Update tenant settings
            tenant_settings = (await tenant_crud.get(self.db, id=tenant_id)).settings or {}
            tenant_settings.setdefault('branding_config', {})
            tenant_settings['branding_config']['custom_domain'] = domain_config
            
            await tenant_crud.update(
                self.db,
                db_obj=await tenant_crud.get(self.db, id=tenant_id),
                obj_in={'settings': tenant_settings}
            )
            
            logger.info(f"Custom domain configured for tenant {tenant_id}: {custom_domain}")
            return domain_config
            
        except Exception as e:
            logger.error(f"Failed to configure custom domain for tenant {tenant_id}: {str(e)}")
            raise BrandingConfigurationError(f"Failed to configure custom domain: {str(e)}")
    
    async def generate_branded_css(self, tenant_id: int) -> str:
        """
        Generate CSS file with branded styles for a tenant.
        
        Args:
            tenant_id: Tenant ID
            
        Returns:
            CSS content as string
        """
        config = self.get_branding_configuration(tenant_id)
        if not config:
            return self._get_default_css()
        
        css_variables = config.theme.to_css_variables()
        
        css_content = f"""
/* NeoForge Branded Styles for Tenant {tenant_id} */
/* Generated at {datetime.now(timezone.utc).isoformat()} */

:root {{
{chr(10).join(f'  {key}: {value};' for key, value in css_variables.items())}
}}

/* Brand-specific component styles */
.brand-header {{
  background-color: var(--brand-primary);
  color: var(--brand-text);
  font-family: var(--brand-font-family);
}}

.brand-button {{
  background-color: var(--brand-primary);
  color: var(--brand-background);
  border-radius: var(--brand-border-radius);
  font-family: var(--brand-font-family);
}}

.brand-button:hover {{
  background-color: var(--brand-accent);
}}

.brand-card {{
  background-color: var(--brand-background);
  border-radius: var(--brand-border-radius);
  border: 1px solid var(--brand-secondary);
}}

.brand-text-primary {{
  color: var(--brand-primary);
}}

.brand-text-secondary {{
  color: var(--brand-secondary);
}}

.brand-bg-primary {{
  background-color: var(--brand-primary);
}}

.brand-bg-secondary {{
  background-color: var(--brand-secondary);
}}

/* Custom UI customizations */
{self._generate_custom_css(config.ui_customization)}
"""
        return css_content.strip()
    
    def _get_default_css(self) -> str:
        """Get default CSS when no branding is configured."""
        return """
/* NeoForge Default Styles */
:root {
  --brand-primary: #007bff;
  --brand-secondary: #6c757d;
  --brand-accent: #0056b3;
  --brand-background: #ffffff;
  --brand-text: #333333;
  --brand-font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  --brand-border-radius: 4px;
}
"""
    
    def _generate_custom_css(self, ui_customization: Dict[str, Any]) -> str:
        """Generate CSS from UI customization settings."""
        if not ui_customization:
            return ""
        
        css_rules = []
        
        # Handle custom CSS rules
        if 'custom_css' in ui_customization:
            css_rules.append(f"/* Custom CSS */\n{ui_customization['custom_css']}")
        
        # Handle component overrides
        if 'components' in ui_customization:
            for component, styles in ui_customization['components'].items():
                if isinstance(styles, dict):
                    style_props = '; '.join(f"{key}: {value}" for key, value in styles.items())
                    css_rules.append(f".{component} {{ {style_props}; }}")
        
        return '\n'.join(css_rules)
    
    async def _update_tenant_branding_settings(
        self,
        tenant_id: int,
        config: BrandingConfiguration
    ):
        """Update tenant branding settings in database."""
        tenant = await tenant_crud.get(self.db, id=tenant_id)
        if not tenant:
            raise BrandingConfigurationError(f"Tenant {tenant_id} not found")
        
        tenant_settings = tenant.settings or {}
        tenant_settings['branding_config'] = {
            'enabled': True,
            'brand_name': config.brand_name,
            'theme': config.theme.to_dict(),
            'custom_domain': config.custom_domain,
            'email_settings': config.email_settings,
            'ui_customization': config.ui_customization,
            'assets_count': len(config.assets),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        
        await tenant_crud.update(
            self.db,
            db_obj=tenant,
            obj_in={'settings': tenant_settings}
        )
    
    async def remove_branding_configuration(self, tenant_id: int) -> bool:
        """
        Remove branding configuration for a tenant.
        
        Args:
            tenant_id: Tenant ID
            
        Returns:
            True if configuration was removed
        """
        try:
            # Remove from memory
            if tenant_id in self._configurations:
                del self._configurations[tenant_id]
            
            # Update tenant settings
            tenant = await tenant_crud.get(self.db, id=tenant_id)
            if tenant and tenant.settings:
                tenant_settings = tenant.settings.copy()
                if 'branding_config' in tenant_settings:
                    tenant_settings['branding_config']['enabled'] = False
                    tenant_settings['branding_config']['removed_at'] = datetime.now(timezone.utc).isoformat()
                    
                    await tenant_crud.update(
                        self.db,
                        db_obj=tenant,
                        obj_in={'settings': tenant_settings}
                    )
            
            logger.info(f"Branding configuration removed for tenant {tenant_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to remove branding configuration for tenant {tenant_id}: {str(e)}")
            return False
    
    async def get_tenant_branding_summary(self, tenant_id: int) -> Dict[str, Any]:
        """
        Get branding summary for a tenant.
        
        Args:
            tenant_id: Tenant ID
            
        Returns:
            Branding summary
        """
        config = self.get_branding_configuration(tenant_id)
        
        if not config:
            return {
                "tenant_id": tenant_id,
                "branding_enabled": False,
                "brand_name": None,
                "custom_domain": None,
                "assets": {},
                "theme_configured": False
            }
        
        return {
            "tenant_id": tenant_id,
            "branding_enabled": True,
            "brand_name": config.brand_name,
            "custom_domain": config.custom_domain,
            "assets": {
                asset_type: {
                    "filename": asset.filename,
                    "size": asset.size,
                    "content_type": asset.content_type
                }
                for asset_type, asset in config.assets.items()
            },
            "theme_configured": True,
            "primary_color": config.theme.primary_color,
            "css_url": f"/api/v1/branding/{tenant_id}/css",
            "configuration": config.to_dict()
        }


def get_branding_service(db: Session) -> BrandingService:
    """Dependency to get branding service instance."""
    return BrandingService(db)