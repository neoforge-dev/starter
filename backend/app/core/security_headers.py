"""
Security Headers and CORS Management for NeoForge
Comprehensive protection with security headers, CORS policies, and API key management.
"""

import logging
import secrets
import hashlib
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field
import re

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


class SecurityHeader(Enum):
    """Security headers for HTTP responses."""
    CONTENT_SECURITY_POLICY = "Content-Security-Policy"
    X_FRAME_OPTIONS = "X-Frame-Options"
    X_CONTENT_TYPE_OPTIONS = "X-Content-Type-Options"
    X_XSS_PROTECTION = "X-XSS-Protection"
    STRICT_TRANSPORT_SECURITY = "Strict-Transport-Security"
    REFERRER_POLICY = "Referrer-Policy"
    PERMISSIONS_POLICY = "Permissions-Policy"
    X_PERMITTED_CROSS_DOMAIN_POLICIES = "X-Permitted-Cross-Domain-Policies"


@dataclass
class CORSConfig:
    """CORS configuration settings."""
    allow_origins: List[str] = field(default_factory=lambda: ["*"])
    allow_credentials: bool = False
    allow_methods: List[str] = field(default_factory=lambda: ["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    allow_headers: List[str] = field(default_factory=lambda: ["*"])
    expose_headers: List[str] = field(default_factory=list)
    max_age: int = 86400  # 24 hours

    def is_origin_allowed(self, origin: str) -> bool:
        """Check if origin is allowed."""
        if "*" in self.allow_origins:
            return True
        return origin in self.allow_origins


@dataclass
class APIKeyConfig:
    """API key configuration."""
    enabled: bool = True
    header_name: str = "X-API-Key"
    query_param: str = "api_key"
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 1000
    expiration_days: int = 365
    key_length: int = 32
    hash_algorithm: str = "sha256"


@dataclass
class SecurityConfig:
    """Comprehensive security configuration."""
    cors: CORSConfig = field(default_factory=CORSConfig)
    api_keys: APIKeyConfig = field(default_factory=APIKeyConfig)
    security_headers: Dict[str, str] = field(default_factory=dict)

    def __post_init__(self):
        """Initialize default security headers."""
        if not self.security_headers:
            self.security_headers = {
                SecurityHeader.CONTENT_SECURITY_POLICY.value: (
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                    "style-src 'self' 'unsafe-inline'; "
                    "img-src 'self' data: https:; "
                    "font-src 'self'; "
                    "connect-src 'self'; "
                    "media-src 'none'; "
                    "object-src 'none'; "
                    "child-src 'none'; "
                    "worker-src 'none'; "
                    "frame-ancestors 'none'"
                ),
                SecurityHeader.X_FRAME_OPTIONS.value: "DENY",
                SecurityHeader.X_CONTENT_TYPE_OPTIONS.value: "nosniff",
                SecurityHeader.X_XSS_PROTECTION.value: "1; mode=block",
                SecurityHeader.STRICT_TRANSPORT_SECURITY.value: "max-age=31536000; includeSubDomains; preload",
                SecurityHeader.REFERRER_POLICY.value: "strict-origin-when-cross-origin",
                SecurityHeader.PERMISSIONS_POLICY.value: (
                    "camera=(), microphone=(), geolocation=(), payment=()"
                ),
                SecurityHeader.X_PERMITTED_CROSS_DOMAIN_POLICIES.value: "none"
            }


class APIKey:
    """API key management and validation."""

    def __init__(self, config: APIKeyConfig):
        self.config = config
        self.keys: Dict[str, Dict[str, Any]] = {}
        self.revoked_keys: Set[str] = set()
        self._load_keys()

    def _load_keys(self):
        """Load API keys from storage (in production, use database)."""
        # This is a simple in-memory implementation
        # In production, load from secure database
        pass

    def generate_key(self, name: str, owner: str, scopes: Optional[List[str]] = None) -> str:
        """Generate a new API key."""
        key = secrets.token_urlsafe(self.config.key_length)
        key_hash = hashlib.sha256(key.encode()).hexdigest()

        self.keys[key_hash] = {
            "name": name,
            "owner": owner,
            "scopes": scopes if scopes is not None else [],
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=self.config.expiration_days),
            "last_used": None,
            "usage_count": 0
        }

        logger.info(f"Generated new API key: {name} for {owner}")
        return key

    def validate_key(self, key: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Validate an API key."""
        if not key:
            return False, None

        key_hash = hashlib.sha256(key.encode()).hexdigest()

        if key_hash in self.revoked_keys:
            return False, None

        if key_hash not in self.keys:
            return False, None

        key_data = self.keys[key_hash]

        # Check expiration
        if datetime.utcnow() > key_data["expires_at"]:
            self.revoke_key(key_hash)
            return False, None

        # Update usage statistics
        key_data["last_used"] = datetime.utcnow()
        key_data["usage_count"] += 1

        return True, key_data

    def revoke_key(self, key_hash: str):
        """Revoke an API key."""
        if key_hash in self.keys:
            self.revoked_keys.add(key_hash)
            del self.keys[key_hash]
            logger.info(f"Revoked API key: {key_hash}")

    def get_key_info(self, key_hash: str) -> Optional[Dict[str, Any]]:
        """Get information about an API key."""
        return self.keys.get(key_hash)

    def list_keys(self, owner: Optional[str] = None) -> List[Dict[str, Any]]:
        """List API keys, optionally filtered by owner."""
        keys = []
        for key_hash, key_data in self.keys.items():
            if owner is None or key_data["owner"] == owner:
                keys.append({
                    "hash": key_hash,
                    "name": key_data["name"],
                    "owner": key_data["owner"],
                    "scopes": key_data["scopes"],
                    "created_at": key_data["created_at"],
                    "expires_at": key_data["expires_at"],
                    "last_used": key_data["last_used"],
                    "usage_count": key_data["usage_count"]
                })
        return keys


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware for adding security headers and handling CORS.
    """

    def __init__(self, app, config: SecurityConfig):
        super().__init__(app)
        self.config = config
        self.api_key_manager = APIKey(config.api_keys)
        self.cors_middleware = self._create_cors_middleware()

    def _create_cors_middleware(self):
        """Create CORS middleware with configuration."""
        return CORSMiddleware(
            app=self.app,
            allow_origins=self.config.cors.allow_origins,
            allow_credentials=self.config.cors.allow_credentials,
            allow_methods=self.config.cors.allow_methods,
            allow_headers=self.config.cors.allow_headers,
            expose_headers=self.config.cors.expose_headers,
            max_age=self.config.cors.max_age
        )

    async def dispatch(self, request: Request, call_next):
        """Process request and add security headers."""
        # Handle CORS preflight requests
        if request.method == "OPTIONS":
            return await self._handle_cors_preflight(request)

        # Validate API key if required
        if self.config.api_keys.enabled:
            api_key_valid, key_info = await self._validate_api_key(request)
            if not api_key_valid:
                return JSONResponse(
                    status_code=401,
                    content={"error": "Invalid or missing API key"}
                )
            # Add key info to request state for later use
            request.state.api_key_info = key_info

        # Process the request
        response = await call_next(request)

        # Add security headers
        self._add_security_headers(response)

        # Add CORS headers
        self._add_cors_headers(request, response)

        return response

    async def _handle_cors_preflight(self, request: Request) -> Response:
        """Handle CORS preflight requests."""
        response = Response(status_code=200)

        origin = request.headers.get("origin")
        if origin and self.config.cors.is_origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = str(self.config.cors.allow_credentials).lower()
            response.headers["Access-Control-Allow-Methods"] = ", ".join(self.config.cors.allow_methods)
            response.headers["Access-Control-Allow-Headers"] = ", ".join(self.config.cors.allow_headers)
            response.headers["Access-Control-Max-Age"] = str(self.config.cors.max_age)

        self._add_security_headers(response)
        return response

    async def _validate_api_key(self, request: Request) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Validate API key from request."""
        # Check header first
        api_key = request.headers.get(self.config.api_keys.header_name)

        # If not in header, check query parameter
        if not api_key:
            api_key = request.query_params.get(self.config.api_keys.query_param)

        if not api_key:
            return False, None

        return self.api_key_manager.validate_key(api_key)

    def _add_security_headers(self, response: Response):
        """Add security headers to response."""
        for header_name, header_value in self.config.security_headers.items():
            response.headers[header_name] = header_value

    def _add_cors_headers(self, request: Request, response: Response):
        """Add CORS headers to response."""
        origin = request.headers.get("origin")
        if origin and self.config.cors.is_origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            if self.config.cors.allow_credentials:
                response.headers["Access-Control-Allow-Credentials"] = "true"
            if self.config.cors.expose_headers:
                response.headers["Access-Control-Expose-Headers"] = ", ".join(self.config.cors.expose_headers)


class SecurityManager:
    """
    Central security management system.
    """

    def __init__(self, config: Optional[SecurityConfig] = None):
        self.config = config or SecurityConfig()
        self.api_key_manager = APIKey(self.config.api_keys)
        self.middleware = SecurityHeadersMiddleware(None, self.config)  # App will be set later

    def create_middleware(self, app):
        """Create security middleware for FastAPI app."""
        self.middleware.app = app
        return self.middleware

    def generate_api_key(self, name: str, owner: str, scopes: Optional[List[str]] = None) -> str:
        """Generate a new API key."""
        return self.api_key_manager.generate_key(name, owner, scopes)

    def revoke_api_key(self, key_hash: str):
        """Revoke an API key."""
        self.api_key_manager.revoke_key(key_hash)

    def validate_api_key(self, key: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Validate an API key."""
        return self.api_key_manager.validate_key(key)

    def get_security_config(self) -> Dict[str, Any]:
        """Get current security configuration."""
        return {
            "cors": {
                "allow_origins": self.config.cors.allow_origins,
                "allow_credentials": self.config.cors.allow_credentials,
                "allow_methods": self.config.cors.allow_methods,
                "allow_headers": self.config.cors.allow_headers,
                "max_age": self.config.cors.max_age
            },
            "api_keys": {
                "enabled": self.config.api_keys.enabled,
                "header_name": self.config.api_keys.header_name,
                "rate_limit_per_minute": self.config.api_keys.rate_limit_per_minute,
                "rate_limit_per_hour": self.config.api_keys.rate_limit_per_hour,
                "expiration_days": self.config.api_keys.expiration_days
            },
            "security_headers": self.config.security_headers
        }

    def update_security_config(self, updates: Dict[str, Any]):
        """Update security configuration."""
        # Update CORS settings
        if "cors" in updates:
            cors_updates = updates["cors"]
            for key, value in cors_updates.items():
                if hasattr(self.config.cors, key):
                    setattr(self.config.cors, key, value)

        # Update API key settings
        if "api_keys" in updates:
            api_updates = updates["api_keys"]
            for key, value in api_updates.items():
                if hasattr(self.config.api_keys, key):
                    setattr(self.config.api_keys, key, value)

        # Update security headers
        if "security_headers" in updates:
            self.config.security_headers.update(updates["security_headers"])

        logger.info("Updated security configuration")

    def get_security_statistics(self) -> Dict[str, Any]:
        """Get security statistics."""
        return {
            "api_keys": {
                "total_keys": len(self.api_key_manager.keys),
                "revoked_keys": len(self.api_key_manager.revoked_keys),
                "active_keys": len(self.api_key_manager.keys) - len(self.api_key_manager.revoked_keys)
            },
            "cors": {
                "allowed_origins": len(self.config.cors.allow_origins),
                "allowed_methods": len(self.config.cors.allow_methods)
            },
            "security_headers": {
                "total_headers": len(self.config.security_headers)
            }
        }


# Global security manager instance
security_manager: Optional[SecurityManager] = None


def init_security_manager(config: Optional[SecurityConfig] = None) -> SecurityManager:
    """Initialize the global security manager."""
    global security_manager
    security_manager = SecurityManager(config)
    return security_manager


def get_security_manager() -> SecurityManager:
    """Get the global security manager."""
    if security_manager is None:
        raise RuntimeError("Security Manager not initialized")
    return security_manager


# Convenience functions
def generate_api_key(name: str, owner: str, scopes: Optional[List[str]] = None) -> str:
    """Generate a new API key."""
    return get_security_manager().generate_api_key(name, owner, scopes)


def validate_api_key(key: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """Validate an API key."""
    return get_security_manager().validate_api_key(key)