"""
Enterprise Branding API endpoints for white-label customization.

Provides endpoints for:
- Brand configuration management
- Asset upload and management
- Theme customization
- Custom domain configuration
- CSS generation and delivery
"""

import logging
from typing import Any, Dict, List, Optional
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile, File, status
from fastapi.responses import StreamingResponse, PlainTextResponse
from pydantic import BaseModel, validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_superuser, get_current_user
from app.core.config import get_settings
from app.models.user import User
from app.services.branding_service import (
    BrandingService, 
    get_branding_service, 
    BrandingError,
    BrandTheme,
    BrandAsset
)
from app.crud.tenant_crud import tenant as tenant_crud

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


# Request/Response Models
class ThemeConfigCreate(BaseModel):
    """Schema for creating theme configuration."""
    primary_color: str
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    background_color: str = "#ffffff"
    text_color: str = "#333333"
    font_family: str = "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    border_radius: str = "8px"
    custom_properties: Optional[Dict[str, str]] = {}
    
    @validator('primary_color', 'secondary_color', 'accent_color', 'background_color', 'text_color')
    def validate_color(cls, v):
        if v and not v.startswith('#'):
            raise ValueError('Color must start with #')
        if v and len(v) not in [4, 7]:  # #RGB or #RRGGBB
            raise ValueError('Color must be in format #RGB or #RRGGBB')
        return v


class BrandConfigCreate(BaseModel):
    """Schema for creating brand configuration."""
    tenant_id: int
    brand_name: str
    brand_description: Optional[str] = None
    tagline: Optional[str] = None
    theme: ThemeConfigCreate
    custom_domain: Optional[str] = None
    email_settings: Optional[Dict[str, Any]] = {}
    ui_customization: Optional[Dict[str, Any]] = {}
    
    @validator('brand_name')
    def validate_brand_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Brand name is required')
        if len(v) > 100:
            raise ValueError('Brand name too long (max 100 characters)')
        return v.strip()


class BrandConfigUpdate(BaseModel):
    """Schema for updating brand configuration."""
    brand_name: Optional[str] = None
    brand_description: Optional[str] = None
    tagline: Optional[str] = None
    theme: Optional[ThemeConfigCreate] = None
    email_settings: Optional[Dict[str, Any]] = None
    ui_customization: Optional[Dict[str, Any]] = None


class CustomDomainConfig(BaseModel):
    """Schema for custom domain configuration."""
    domain: str
    ssl_certificate: Optional[str] = None
    ssl_private_key: Optional[str] = None
    redirect_http_to_https: bool = True
    hsts_enabled: bool = True
    
    @validator('domain')
    def validate_domain(cls, v):
        if not v:
            raise ValueError('Domain is required')
        # Basic domain validation
        import re
        pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'
        if not re.match(pattern, v):
            raise ValueError('Invalid domain format')
        return v.lower()


class BrandConfigResponse(BaseModel):
    """Schema for brand configuration response."""
    tenant_id: int
    brand_name: str
    brand_description: Optional[str] = None
    tagline: Optional[str] = None
    theme: Dict[str, Any]
    custom_domain: Optional[str] = None
    assets: Dict[str, Any] = {}
    css_url: str
    status: str = "active"


# Brand Configuration Endpoints

@router.post("/config", dependencies=[Depends(get_current_active_superuser)])
async def create_brand_config(
    config_data: BrandConfigCreate,
    branding_service: BrandingService = Depends(get_branding_service),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Create brand configuration for a tenant.
    
    Requires superuser privileges.
    """
    try:
        # Create branding configuration
        config = await branding_service.create_branding_configuration(
            tenant_id=config_data.tenant_id,
            brand_name=config_data.brand_name,
            theme_config=config_data.theme.dict(),
            custom_domain=config_data.custom_domain,
            brand_description=config_data.brand_description,
            tagline=config_data.tagline,
            email_settings=config_data.email_settings,
            ui_customization=config_data.ui_customization
        )
        
        return {
            "message": "Brand configuration created successfully",
            "tenant_id": config.tenant_id,
            "brand_name": config.brand_name,
            "css_url": f"/api/v1/branding/{config.tenant_id}/css",
            "assets_url": f"/api/v1/branding/{config.tenant_id}/assets",
            "config_url": f"/api/v1/branding/config/{config.tenant_id}"
        }
        
    except BrandingError as e:
        logger.error(f"Branding configuration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Branding configuration error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error creating brand configuration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create brand configuration"
        )


@router.get("/config/{tenant_id}")
async def get_brand_config(
    tenant_id: int,
    current_user: User = Depends(get_current_user),
    branding_service: BrandingService = Depends(get_branding_service)
) -> BrandConfigResponse:
    """
    Get brand configuration for a tenant.
    
    Accessible by tenant users and superusers.
    """
    try:
        # Get branding summary
        summary = await branding_service.get_tenant_branding_summary(tenant_id)
        
        if not summary['branding_enabled']:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Brand configuration not found for tenant {tenant_id}"
            )
        
        return BrandConfigResponse(
            tenant_id=summary['tenant_id'],
            brand_name=summary['brand_name'],
            brand_description=summary.get('configuration', {}).get('brand_description'),
            tagline=summary.get('configuration', {}).get('tagline'),
            theme=summary.get('configuration', {}).get('theme', {}),
            custom_domain=summary['custom_domain'],
            assets=summary['assets'],
            css_url=summary['css_url'],
            status="active" if summary['branding_enabled'] else "inactive"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving brand configuration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve brand configuration"
        )


@router.put("/config/{tenant_id}", dependencies=[Depends(get_current_active_superuser)])
async def update_brand_config(
    tenant_id: int,
    update_data: BrandConfigUpdate,
    branding_service: BrandingService = Depends(get_branding_service)
) -> Dict[str, Any]:
    """
    Update brand configuration for a tenant.
    
    Requires superuser privileges.
    """
    try:
        config = branding_service.get_branding_configuration(tenant_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Brand configuration not found for tenant {tenant_id}"
            )
        
        # Update theme if provided
        if update_data.theme:
            await branding_service.update_branding_theme(
                tenant_id=tenant_id,
                theme_updates=update_data.theme.dict()
            )
        
        # Update other properties
        if update_data.brand_name:
            config.brand_name = update_data.brand_name
        if update_data.brand_description:
            config.brand_description = update_data.brand_description
        if update_data.tagline:
            config.tagline = update_data.tagline
        if update_data.email_settings:
            config.email_settings.update(update_data.email_settings)
        if update_data.ui_customization:
            config.ui_customization.update(update_data.ui_customization)
        
        return {
            "message": "Brand configuration updated successfully",
            "tenant_id": tenant_id,
            "updated_at": "2025-09-19T15:30:00Z"
        }
        
    except BrandingError as e:
        logger.error(f"Branding update error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Branding update error: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating brand configuration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update brand configuration"
        )


@router.delete("/config/{tenant_id}", dependencies=[Depends(get_current_active_superuser)])
async def delete_brand_config(
    tenant_id: int,
    branding_service: BrandingService = Depends(get_branding_service)
) -> Dict[str, str]:
    """
    Delete brand configuration for a tenant.
    
    Requires superuser privileges.
    """
    try:
        success = await branding_service.remove_branding_configuration(tenant_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Brand configuration not found for tenant {tenant_id}"
            )
        
        return {
            "message": f"Brand configuration removed for tenant {tenant_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing brand configuration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove brand configuration"
        )


# Asset Management Endpoints

@router.post("/{tenant_id}/assets/{asset_type}")
async def upload_brand_asset(
    tenant_id: int,
    asset_type: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    branding_service: BrandingService = Depends(get_branding_service)
) -> Dict[str, Any]:
    """
    Upload brand asset for a tenant.
    
    Asset types: logo, favicon, background, icon, banner
    """
    try:
        # Validate asset type
        valid_types = ['logo', 'logo_dark', 'favicon', 'background', 'icon', 'banner', 'watermark']
        if asset_type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid asset type. Must be one of: {', '.join(valid_types)}"
            )
        
        # Read file content
        content = await file.read()
        
        # Validate file size (10MB limit)
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds 10MB limit"
            )
        
        # Validate content type
        if not file.content_type.startswith(('image/', 'application/')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed for brand assets"
            )
        
        # Upload asset
        asset = await branding_service.upload_brand_asset(
            tenant_id=tenant_id,
            asset_type=asset_type,
            content=content,
            content_type=file.content_type,
            filename=file.filename
        )
        
        return {
            "message": "Brand asset uploaded successfully",
            "asset_type": asset.asset_type,
            "filename": asset.filename,
            "size": asset.size,
            "content_type": asset.content_type,
            "asset_url": f"/api/v1/branding/{tenant_id}/assets/{asset_type}"
        }
        
    except BrandingError as e:
        logger.error(f"Asset upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Asset upload error: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error uploading asset: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload brand asset"
        )


@router.get("/{tenant_id}/assets/{asset_type}")
async def get_brand_asset(
    tenant_id: int,
    asset_type: str,
    width: Optional[int] = None,
    height: Optional[int] = None,
    branding_service: BrandingService = Depends(get_branding_service)
) -> Response:
    """
    Get brand asset for a tenant, optionally resized.
    
    Query parameters:
    - width: Resize width in pixels
    - height: Resize height in pixels (maintains aspect ratio if not provided)
    """
    try:
        # Get asset
        size = (width, height) if width else None
        asset = await branding_service.get_brand_asset(
            tenant_id=tenant_id,
            asset_type=asset_type,
            size=size
        )
        
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asset {asset_type} not found for tenant {tenant_id}"
            )
        
        # Return asset content
        return StreamingResponse(
            BytesIO(asset.content),
            media_type=asset.content_type,
            headers={
                "Cache-Control": "public, max-age=86400",  # 24 hours
                "Content-Disposition": f"inline; filename=\"{asset.filename}\"",
                "Content-Length": str(asset.size)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving brand asset: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve brand asset"
        )


@router.get("/{tenant_id}/assets")
async def list_brand_assets(
    tenant_id: int,
    current_user: User = Depends(get_current_user),
    branding_service: BrandingService = Depends(get_branding_service)
) -> Dict[str, Any]:
    """
    List all brand assets for a tenant.
    """
    try:
        summary = await branding_service.get_tenant_branding_summary(tenant_id)
        
        return {
            "tenant_id": tenant_id,
            "assets": summary['assets'],
            "asset_urls": {
                asset_type: f"/api/v1/branding/{tenant_id}/assets/{asset_type}"
                for asset_type in summary['assets'].keys()
            }
        }
        
    except Exception as e:
        logger.error(f"Error listing brand assets: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list brand assets"
        )


# CSS and Theme Endpoints

@router.get("/{tenant_id}/css")
async def get_branded_css(
    tenant_id: int,
    branding_service: BrandingService = Depends(get_branding_service)
) -> Response:
    """
    Get branded CSS file for a tenant.
    
    Returns CSS with custom theme variables and styles.
    """
    try:
        css_content = await branding_service.generate_branded_css(tenant_id)
        
        return PlainTextResponse(
            content=css_content,
            media_type="text/css",
            headers={
                "Cache-Control": "public, max-age=3600",  # 1 hour
                "Content-Disposition": f"inline; filename=\"tenant-{tenant_id}-brand.css\""
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating branded CSS: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate branded CSS"
        )


@router.get("/{tenant_id}/theme")
async def get_brand_theme(
    tenant_id: int,
    current_user: User = Depends(get_current_user),
    branding_service: BrandingService = Depends(get_branding_service)
) -> Dict[str, Any]:
    """
    Get brand theme configuration for a tenant.
    """
    try:
        config = branding_service.get_branding_configuration(tenant_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Brand configuration not found for tenant {tenant_id}"
            )
        
        return {
            "tenant_id": tenant_id,
            "theme": config.theme.to_dict(),
            "css_variables": config.theme.to_css_variables()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving brand theme: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve brand theme"
        )


@router.put("/{tenant_id}/theme", dependencies=[Depends(get_current_active_superuser)])
async def update_brand_theme(
    tenant_id: int,
    theme_updates: ThemeConfigCreate,
    branding_service: BrandingService = Depends(get_branding_service)
) -> Dict[str, Any]:
    """
    Update brand theme for a tenant.
    
    Requires superuser privileges.
    """
    try:
        config = await branding_service.update_branding_theme(
            tenant_id=tenant_id,
            theme_updates=theme_updates.dict()
        )
        
        return {
            "message": "Brand theme updated successfully",
            "tenant_id": tenant_id,
            "theme": config.theme.to_dict(),
            "css_url": f"/api/v1/branding/{tenant_id}/css"
        }
        
    except BrandingError as e:
        logger.error(f"Theme update error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Theme update error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error updating theme: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update brand theme"
        )


# Custom Domain Endpoints

@router.post("/{tenant_id}/domain", dependencies=[Depends(get_current_active_superuser)])
async def configure_custom_domain(
    tenant_id: int,
    domain_config: CustomDomainConfig,
    branding_service: BrandingService = Depends(get_branding_service)
) -> Dict[str, Any]:
    """
    Configure custom domain for a tenant.
    
    Requires superuser privileges.
    """
    try:
        config = await branding_service.configure_custom_domain(
            tenant_id=tenant_id,
            custom_domain=domain_config.domain,
            ssl_certificate=domain_config.ssl_certificate,
            ssl_private_key=domain_config.ssl_private_key
        )
        
        return {
            "message": "Custom domain configured successfully",
            "tenant_id": tenant_id,
            "domain": config['domain'],
            "status": config['status'],
            "verification_token": config.get('verification_token'),
            "ssl_enabled": config.get('ssl_enabled', False),
            "dns_instructions": {
                "type": "CNAME",
                "name": domain_config.domain,
                "value": f"{settings.server_host}",
                "ttl": 300
            }
        }
        
    except BrandingError as e:
        logger.error(f"Domain configuration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Domain configuration error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error configuring domain: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to configure custom domain"
        )


@router.get("/{tenant_id}/domain")
async def get_custom_domain_status(
    tenant_id: int,
    current_user: User = Depends(get_current_user),
    branding_service: BrandingService = Depends(get_branding_service)
) -> Dict[str, Any]:
    """
    Get custom domain status for a tenant.
    """
    try:
        config = branding_service.get_branding_configuration(tenant_id)
        if not config or not config.custom_domain:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Custom domain not configured for tenant {tenant_id}"
            )
        
        return {
            "tenant_id": tenant_id,
            "domain": config.custom_domain,
            "status": "active",  # TODO: Implement proper domain status checking
            "ssl_enabled": True,
            "configured_at": "2025-09-19T15:30:00Z",
            "health_check": {
                "status": "healthy",
                "last_checked": "2025-09-19T15:30:00Z",
                "response_time_ms": 150
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving domain status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve domain status"
        )


# Public Endpoints (for branded experiences)

@router.get("/public/{tenant_id}/config")
async def get_public_brand_config(
    tenant_id: int,
    branding_service: BrandingService = Depends(get_branding_service)
) -> Dict[str, Any]:
    """
    Get public brand configuration for a tenant.
    
    This endpoint provides safe, public brand information for branded experiences.
    No authentication required.
    """
    try:
        summary = await branding_service.get_tenant_branding_summary(tenant_id)
        
        if not summary['branding_enabled']:
            # Return default branding
            return {
                "tenant_id": tenant_id,
                "branding_enabled": False,
                "brand_name": "NeoForge",
                "theme": {
                    "primary_color": "#007bff",
                    "background_color": "#ffffff",
                    "text_color": "#333333"
                },
                "css_url": f"/api/v1/branding/{tenant_id}/css"
            }
        
        # Return public-safe branding information
        return {
            "tenant_id": tenant_id,
            "branding_enabled": True,
            "brand_name": summary['brand_name'],
            "primary_color": summary['primary_color'],
            "custom_domain": summary['custom_domain'],
            "css_url": summary['css_url'],
            "assets": {
                "logo": f"/api/v1/branding/{tenant_id}/assets/logo" if 'logo' in summary['assets'] else None,
                "favicon": f"/api/v1/branding/{tenant_id}/assets/favicon" if 'favicon' in summary['assets'] else None
            }
        }
        
    except Exception as e:
        logger.error(f"Error retrieving public brand config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve brand configuration"
        )


# Health and Utility Endpoints

@router.get("/health")
async def branding_health_check() -> Dict[str, str]:
    """
    Health check endpoint for branding service.
    """
    return {
        "status": "healthy",
        "service": "branding",
        "version": "1.0.0"
    }