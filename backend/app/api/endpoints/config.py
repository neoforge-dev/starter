"""Configuration endpoint for serving runtime config to frontend."""
from typing import Dict, List, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.config import Settings, get_settings

router = APIRouter()

class FrontendConfig(BaseModel):
    """Frontend configuration schema."""
    environment: str
    api_base_url: str
    cors_origins: List[str]
    cors_methods: List[str]
    cors_headers: List[str]
    security_headers: Dict[str, Any]
    trusted_domains: Dict[str, List[str]]
    csp_nonce_required: bool
    reporting_enabled: bool

@router.get("/config", response_model=FrontendConfig)
async def get_frontend_config(settings: Settings = Depends(get_settings)) -> FrontendConfig:
    """
    Get frontend configuration derived from backend settings.
    
    This endpoint serves as the single source of truth for configuration,
    eliminating duplication between backend and frontend config files.
    """
    # Build trusted domains from CORS origins
    trusted_domains = {
        "scripts": ["cdn.jsdelivr.net", "unpkg.com"],
        "styles": ["fonts.googleapis.com", "fonts.gstatic.com"], 
        "images": [],
        "connects": []
    }
    
    # Extract domains from CORS origins for connect-src
    for origin in settings.cors_origins:
        if origin.startswith("http"):
            domain = origin.replace("https://", "").replace("http://", "")
            trusted_domains["connects"].append(domain)
    
    # Build security headers config
    security_headers = {
        "hsts": {
            "max_age": 31536000,
            "include_subdomains": True,
            "preload": True
        } if settings.environment.value == "production" else None,
        "frame_ancestors": [],
        "referrer_policy": "strict-origin-when-cross-origin",
        "permissions": {
            "camera": [],
            "microphone": [],
            "geolocation": [],
            "payment": [],
            "fullscreen": ["self"]
        }
    }
    
    return FrontendConfig(
        environment=settings.environment.value,
        api_base_url=f"{settings.frontend_url}{settings.api_v1_str}",
        cors_origins=settings.cors_origins,
        cors_methods=settings.cors_methods,
        cors_headers=settings.cors_headers,
        security_headers=security_headers,
        trusted_domains=trusted_domains,
        csp_nonce_required=settings.environment.value == "production",
        reporting_enabled=settings.environment.value == "production"
    )