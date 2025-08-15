"""Tenant-aware middleware for multi-tenant context resolution and isolation."""
import asyncio
import logging
from typing import Optional, Dict, Any, Callable
from urllib.parse import urlparse
import time

from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import redis.asyncio as redis

from app.models.tenant import Tenant, TenantStatus
from app.models.rbac import PermissionCache
from app.db.session import AsyncSessionLocal
from app.core.config import get_settings
from app.core.redis import get_redis


logger = logging.getLogger(__name__)


class TenantContext:
    """
    Tenant context holder for request-scoped tenant information.
    
    Provides:
    - Current tenant information
    - Database schema context
    - Permission cache keys
    - Security settings
    """
    
    def __init__(
        self,
        tenant: Optional[Tenant] = None,
        subdomain: Optional[str] = None,
        domain: Optional[str] = None,
        resolved_from: str = "none"
    ):
        self.tenant = tenant
        self.subdomain = subdomain
        self.domain = domain
        self.resolved_from = resolved_from
        self.schema_name = tenant.schema_name if tenant else "public"
        self.tenant_id = tenant.id if tenant else None
        self.tenant_uuid = str(tenant.uuid) if tenant else None
        self.settings = tenant.settings if tenant else {}
        self.is_active = tenant.status == TenantStatus.ACTIVE if tenant else False
        
    @property
    def cache_prefix(self) -> str:
        """Get cache key prefix for this tenant."""
        return f"tenant:{self.tenant_id}" if self.tenant_id else "tenant:default"
    
    @property
    def permission_cache_key(self, user_id: int) -> str:
        """Get permission cache key for a user in this tenant."""
        return f"{self.cache_prefix}:permissions:user:{user_id}"
    
    def __repr__(self) -> str:
        return f"TenantContext(tenant_id={self.tenant_id}, schema='{self.schema_name}', from='{self.resolved_from}')"


class TenantResolutionError(Exception):
    """Raised when tenant resolution fails."""
    pass


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Tenant resolution and context middleware.
    
    Responsibilities:
    - Resolve tenant from subdomain, header, or domain
    - Set up tenant context for request
    - Validate tenant status and access
    - Implement tenant isolation and security
    - Cache tenant information for performance
    """
    
    def __init__(
        self,
        app: ASGIApp,
        default_tenant_slug: str = "default",
        cache_ttl: int = 300,  # 5 minutes
        enable_domain_resolution: bool = True,
        enable_header_resolution: bool = True,
        allowed_origins: Optional[list] = None
    ):
        super().__init__(app)
        self.default_tenant_slug = default_tenant_slug
        self.cache_ttl = cache_ttl
        self.enable_domain_resolution = enable_domain_resolution
        self.enable_header_resolution = enable_header_resolution
        self.allowed_origins = allowed_origins or []
        self._tenant_cache: Dict[str, Tenant] = {}
        self._cache_timestamps: Dict[str, float] = {}
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request with tenant context resolution.
        
        Resolution order:
        1. X-Tenant-ID header (for API clients)
        2. Subdomain (e.g., acme.neoforge.dev)
        3. Custom domain (e.g., app.acme.com)
        4. Default tenant fallback
        """
        start_time = time.time()
        
        try:
            # Skip tenant resolution for health checks and static files
            if self._should_skip_tenant_resolution(request):
                request.state.tenant_context = TenantContext(resolved_from="skipped")
                return await call_next(request)
            
            # Resolve tenant context
            tenant_context = await self._resolve_tenant_context(request)
            request.state.tenant_context = tenant_context
            
            # Validate tenant access
            await self._validate_tenant_access(request, tenant_context)
            
            # Set database schema context if tenant is active
            if tenant_context.tenant and tenant_context.is_active:
                await self._set_database_context(request, tenant_context)
            
            # Process request
            response = await call_next(request)
            
            # Add tenant headers to response
            self._add_tenant_headers(response, tenant_context)
            
            # Log resolution performance
            resolution_time = (time.time() - start_time) * 1000
            logger.debug(
                f"Tenant resolution completed",
                extra={
                    "tenant_id": tenant_context.tenant_id,
                    "resolved_from": tenant_context.resolved_from,
                    "resolution_time_ms": resolution_time,
                    "path": request.url.path
                }
            )
            
            return response
            
        except TenantResolutionError as e:
            logger.warning(f"Tenant resolution failed: {e}")
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": f"Tenant resolution failed: {str(e)}"}
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error in tenant middleware: {e}", exc_info=True)
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Internal server error during tenant resolution"}
            )
    
    def _should_skip_tenant_resolution(self, request: Request) -> bool:
        """Check if tenant resolution should be skipped for this request."""
        skip_paths = {
            "/health",
            "/metrics",
            "/docs",
            "/openapi.json",
            "/favicon.ico"
        }
        
        # Skip for static files and health checks
        path = request.url.path
        if path in skip_paths or path.startswith("/static/"):
            return True
        
        # Skip for internal health checks
        user_agent = request.headers.get("user-agent", "")
        if "health-check" in user_agent.lower():
            return True
            
        return False
    
    async def _resolve_tenant_context(self, request: Request) -> TenantContext:
        """
        Resolve tenant context from request.
        
        Priority order:
        1. X-Tenant-ID header
        2. X-Tenant-Slug header  
        3. Subdomain extraction
        4. Custom domain lookup
        5. Default tenant fallback
        """
        # Try header-based resolution first (for API clients)
        if self.enable_header_resolution:
            tenant_context = await self._resolve_from_headers(request)
            if tenant_context.tenant:
                return tenant_context
        
        # Try domain/subdomain resolution
        if self.enable_domain_resolution:
            tenant_context = await self._resolve_from_domain(request)
            if tenant_context.tenant:
                return tenant_context
        
        # Fallback to default tenant
        logger.debug("Using default tenant fallback")
        default_tenant = await self._get_tenant_by_slug(self.default_tenant_slug)
        return TenantContext(
            tenant=default_tenant,
            resolved_from="default"
        )
    
    async def _resolve_from_headers(self, request: Request) -> TenantContext:
        """Resolve tenant from request headers."""
        # Try X-Tenant-ID header (UUID)
        tenant_id = request.headers.get("X-Tenant-ID")
        if tenant_id:
            try:
                tenant = await self._get_tenant_by_uuid(tenant_id)
                if tenant:
                    return TenantContext(
                        tenant=tenant,
                        resolved_from="header_id"
                    )
            except Exception as e:
                logger.warning(f"Failed to resolve tenant by ID {tenant_id}: {e}")
        
        # Try X-Tenant-Slug header
        tenant_slug = request.headers.get("X-Tenant-Slug")
        if tenant_slug:
            try:
                tenant = await self._get_tenant_by_slug(tenant_slug)
                if tenant:
                    return TenantContext(
                        tenant=tenant,
                        resolved_from="header_slug"
                    )
            except Exception as e:
                logger.warning(f"Failed to resolve tenant by slug {tenant_slug}: {e}")
        
        return TenantContext(resolved_from="header_failed")
    
    async def _resolve_from_domain(self, request: Request) -> TenantContext:
        """Resolve tenant from domain/subdomain."""
        host = request.headers.get("host", "")
        if not host:
            return TenantContext(resolved_from="no_host")
        
        # Parse host
        host_parts = host.split(".")
        
        # Try custom domain lookup first
        tenant = await self._get_tenant_by_domain(host)
        if tenant:
            return TenantContext(
                tenant=tenant,
                domain=host,
                resolved_from="custom_domain"
            )
        
        # Try subdomain extraction (e.g., acme.neoforge.dev)
        if len(host_parts) >= 3:
            subdomain = host_parts[0]
            # Skip common subdomains
            if subdomain not in {"www", "api", "app", "admin"}:
                tenant = await self._get_tenant_by_slug(subdomain)
                if tenant:
                    return TenantContext(
                        tenant=tenant,
                        subdomain=subdomain,
                        resolved_from="subdomain"
                    )
        
        return TenantContext(resolved_from="domain_failed")
    
    async def _get_tenant_by_uuid(self, tenant_uuid: str) -> Optional[Tenant]:
        """Get tenant by UUID with caching."""
        cache_key = f"tenant:uuid:{tenant_uuid}"
        return await self._get_cached_tenant(cache_key, "uuid", tenant_uuid)
    
    async def _get_tenant_by_slug(self, slug: str) -> Optional[Tenant]:
        """Get tenant by slug with caching."""
        cache_key = f"tenant:slug:{slug}"
        return await self._get_cached_tenant(cache_key, "slug", slug)
    
    async def _get_tenant_by_domain(self, domain: str) -> Optional[Tenant]:
        """Get tenant by custom domain with caching."""
        cache_key = f"tenant:domain:{domain}"
        return await self._get_cached_tenant(cache_key, "domain", domain)
    
    async def _get_cached_tenant(
        self, 
        cache_key: str, 
        field: str, 
        value: str
    ) -> Optional[Tenant]:
        """Get tenant with Redis caching."""
        # Check memory cache first
        if cache_key in self._tenant_cache:
            timestamp = self._cache_timestamps.get(cache_key, 0)
            if time.time() - timestamp < self.cache_ttl:
                return self._tenant_cache[cache_key]
        
        # Check Redis cache
        try:
            redis_client = await get_redis()
            cached_data = await redis_client.get(cache_key)
            if cached_data:
                # Would need to serialize/deserialize tenant data
                # For now, fall through to database lookup
                pass
        except Exception as e:
            logger.warning(f"Redis cache lookup failed for {cache_key}: {e}")
        
        # Database lookup
        try:
            async with AsyncSessionLocal() as db:
                if field == "uuid":
                    stmt = select(Tenant).where(Tenant.uuid == value)
                elif field == "slug":
                    stmt = select(Tenant).where(Tenant.slug == value)
                elif field == "domain":
                    stmt = select(Tenant).where(Tenant.domain == value)
                else:
                    return None
                
                result = await db.execute(stmt)
                tenant = result.scalar_one_or_none()
                
                if tenant:
                    # Update caches
                    self._tenant_cache[cache_key] = tenant
                    self._cache_timestamps[cache_key] = time.time()
                    
                    # Update Redis cache (async, don't wait)
                    asyncio.create_task(self._update_redis_cache(cache_key, tenant))
                
                return tenant
                
        except Exception as e:
            logger.error(f"Database tenant lookup failed for {field}={value}: {e}")
            return None
    
    async def _update_redis_cache(self, cache_key: str, tenant: Tenant):
        """Update Redis cache asynchronously."""
        try:
            redis_client = await get_redis()
            # Serialize tenant data for caching
            tenant_data = {
                "id": tenant.id,
                "slug": tenant.slug,
                "uuid": str(tenant.uuid),
                "name": tenant.name,
                "domain": tenant.domain,
                "status": tenant.status.value,
                "schema_name": tenant.schema_name,
                "settings": tenant.settings or {}
            }
            await redis_client.setex(
                cache_key, 
                self.cache_ttl,
                str(tenant_data)  # Would use JSON serialization in production
            )
        except Exception as e:
            logger.warning(f"Failed to update Redis cache for {cache_key}: {e}")
    
    async def _validate_tenant_access(
        self, 
        request: Request, 
        tenant_context: TenantContext
    ):
        """Validate tenant access and status."""
        if not tenant_context.tenant:
            # Allow access without tenant for certain endpoints
            if self._is_public_endpoint(request):
                return
            raise TenantResolutionError("Tenant not found")
        
        tenant = tenant_context.tenant
        
        # Check tenant status
        if tenant.status == TenantStatus.SUSPENDED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant is suspended"
            )
        elif tenant.status == TenantStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Tenant is cancelled"
            )
        
        # Check trial expiration
        if tenant.status == TenantStatus.TRIAL and tenant.trial_ends_at:
            from datetime import datetime, timezone
            if datetime.now(timezone.utc) > tenant.trial_ends_at:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Trial period has expired"
                )
        
        # Validate IP restrictions
        if tenant.allowed_ip_ranges:
            client_ip = self._get_client_ip(request)
            if not self._is_ip_allowed(client_ip, tenant.allowed_ip_ranges):
                logger.warning(
                    f"IP access denied for tenant {tenant.id}",
                    extra={"client_ip": client_ip, "tenant_id": tenant.id}
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied from this IP address"
                )
    
    def _is_public_endpoint(self, request: Request) -> bool:
        """Check if endpoint allows access without tenant."""
        public_paths = {
            "/api/v1/auth/register",
            "/api/v1/auth/login", 
            "/api/v1/tenants/signup",
            "/health",
            "/metrics"
        }
        return request.url.path in public_paths
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address from request."""
        # Check X-Forwarded-For header first (for load balancers)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        # Check X-Real-IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fall back to direct client IP
        return getattr(request.client, "host", "unknown")
    
    def _is_ip_allowed(self, ip: str, allowed_ranges: list) -> bool:
        """Check if IP is in allowed ranges."""
        try:
            import ipaddress
            ip_obj = ipaddress.ip_address(ip)
            
            for range_str in allowed_ranges:
                try:
                    network = ipaddress.ip_network(range_str, strict=False)
                    if ip_obj in network:
                        return True
                except Exception:
                    # Invalid range format, skip
                    continue
            
            return False
        except Exception:
            # Invalid IP format, deny access
            return False
    
    async def _set_database_context(
        self, 
        request: Request, 
        tenant_context: TenantContext
    ):
        """Set database schema context for tenant isolation."""
        # Store schema name for database operations
        request.state.db_schema = tenant_context.schema_name
        
        # Add schema to database session configuration
        # This would be used by a custom session factory
        request.state.tenant_schema = tenant_context.schema_name
    
    def _add_tenant_headers(self, response: Response, tenant_context: TenantContext):
        """Add tenant information to response headers."""
        if tenant_context.tenant:
            response.headers["X-Tenant-ID"] = str(tenant_context.tenant.uuid)
            response.headers["X-Tenant-Slug"] = tenant_context.tenant.slug
            response.headers["X-Tenant-Schema"] = tenant_context.schema_name
        
        response.headers["X-Tenant-Resolved-From"] = tenant_context.resolved_from


async def get_tenant_context(request: Request) -> TenantContext:
    """
    Dependency to get current tenant context.
    
    Usage:
        @router.get("/items")
        async def get_items(
            tenant: TenantContext = Depends(get_tenant_context)
        ):
            # Access tenant information
            tenant_id = tenant.tenant_id
            schema = tenant.schema_name
    """
    if not hasattr(request.state, "tenant_context"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Tenant context not available"
        )
    
    return request.state.tenant_context


async def require_tenant(request: Request) -> TenantContext:
    """
    Dependency that requires a valid tenant context.
    
    Raises HTTPException if no tenant is available.
    """
    tenant_context = await get_tenant_context(request)
    
    if not tenant_context.tenant or not tenant_context.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid tenant required for this operation"
        )
    
    return tenant_context


def create_tenant_middleware(
    default_tenant_slug: str = "default",
    cache_ttl: int = 300,
    enable_domain_resolution: bool = True,
    enable_header_resolution: bool = True
) -> TenantMiddleware:
    """Factory function to create tenant middleware with configuration."""
    return TenantMiddleware(
        app=None,  # Will be set by FastAPI
        default_tenant_slug=default_tenant_slug,
        cache_ttl=cache_ttl,
        enable_domain_resolution=enable_domain_resolution,
        enable_header_resolution=enable_header_resolution
    )