"""Tenant context utilities and isolation helpers."""
import asyncio
import logging
from typing import Optional, Dict, Any, List, Set, AsyncGenerator, Type, TypeVar
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
import hashlib
import uuid

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, AsyncEngine
from sqlalchemy import text, select, and_, or_
from sqlalchemy.orm import DeclarativeBase
import redis.asyncio as redis

from app.models.tenant import Tenant, Organization, OrganizationMembership, TenantStatus
from app.models.rbac import Role, Permission, ResourcePermission, PermissionCache
from app.models.user import User
from app.db.session import AsyncSessionLocal
from app.core.config import get_settings
from app.core.redis import get_redis


logger = logging.getLogger(__name__)

T = TypeVar('T', bound=DeclarativeBase)


class TenantIsolationError(Exception):
    """Raised when tenant isolation is violated."""
    pass


class PermissionDeniedError(Exception):
    """Raised when user lacks required permissions."""
    pass


class TenantManager:
    """
    Tenant management utilities for multi-tenant operations.
    
    Provides:
    - Tenant creation and configuration
    - Schema management for tenant isolation  
    - Tenant status management
    - Resource limits enforcement
    """
    
    def __init__(self, db: AsyncSession, redis_client: Optional[redis.Redis] = None):
        self.db = db
        self.redis = redis_client
        self.settings = get_settings()
    
    async def create_tenant(
        self,
        name: str,
        slug: str,
        domain: Optional[str] = None,
        subscription_tier: str = "trial",
        settings: Optional[Dict[str, Any]] = None,
        limits: Optional[Dict[str, Any]] = None
    ) -> Tenant:
        """
        Create a new tenant with isolated schema.
        
        Args:
            name: Display name for the tenant
            slug: URL-safe identifier
            domain: Custom domain (optional)
            subscription_tier: Subscription level
            settings: Tenant-specific configuration
            limits: Resource limits
            
        Returns:
            Created Tenant instance
        """
        # Generate unique schema name
        schema_name = f"tenant_{slug}_{uuid.uuid4().hex[:8]}"
        
        # Validate slug uniqueness
        existing = await self.db.execute(
            select(Tenant).where(Tenant.slug == slug)
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"Tenant slug '{slug}' already exists")
        
        # Validate domain uniqueness
        if domain:
            existing_domain = await self.db.execute(
                select(Tenant).where(Tenant.domain == domain)
            )
            if existing_domain.scalar_one_or_none():
                raise ValueError(f"Domain '{domain}' already in use")
        
        # Set default trial end date
        trial_ends_at = datetime.now(timezone.utc) + timedelta(days=30)
        
        # Create tenant
        tenant = Tenant(
            name=name,
            slug=slug,
            domain=domain,
            schema_name=schema_name,
            subscription_tier=subscription_tier,
            status=TenantStatus.TRIAL,
            trial_ends_at=trial_ends_at,
            settings=settings or {},
            limits=limits or self._get_default_limits(subscription_tier)
        )
        
        self.db.add(tenant)
        await self.db.flush()  # Get tenant ID
        
        # Create isolated database schema
        await self._create_tenant_schema(schema_name)
        
        # Create default organization
        await self._create_default_organization(tenant)
        
        # Create default roles and permissions
        await self._create_default_rbac(tenant)
        
        await self.db.commit()
        
        # Clear tenant cache
        await self._invalidate_tenant_cache(slug)
        
        logger.info(f"Created tenant: {tenant.slug} with schema: {schema_name}")
        return tenant
    
    async def delete_tenant(self, tenant_id: int, force: bool = False) -> bool:
        """
        Delete a tenant and all associated data.
        
        Args:
            tenant_id: Tenant ID to delete
            force: Force deletion even if tenant has active users
            
        Returns:
            True if deletion successful
        """
        tenant = await self.db.get(Tenant, tenant_id)
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")
        
        # Check if tenant can be safely deleted
        if not force:
            user_count = await self._count_tenant_users(tenant_id)
            if user_count > 0:
                raise ValueError(f"Cannot delete tenant with {user_count} active users")
        
        # Drop database schema
        await self._drop_tenant_schema(tenant.schema_name)
        
        # Delete tenant record (cascades to related data)
        await self.db.delete(tenant)
        await self.db.commit()
        
        # Clear caches
        await self._invalidate_tenant_cache(tenant.slug)
        
        logger.info(f"Deleted tenant: {tenant.slug}")
        return True
    
    async def suspend_tenant(
        self, 
        tenant_id: int, 
        reason: str,
        suspended_by: Optional[int] = None
    ) -> Tenant:
        """Suspend a tenant."""
        tenant = await self.db.get(Tenant, tenant_id)
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")
        
        tenant.status = TenantStatus.SUSPENDED
        tenant.suspended_at = datetime.now(timezone.utc)
        tenant.suspension_reason = reason
        
        await self.db.commit()
        
        # Invalidate all user sessions for this tenant
        await self._invalidate_tenant_sessions(tenant_id)
        
        logger.info(f"Suspended tenant: {tenant.slug}, reason: {reason}")
        return tenant
    
    async def reactivate_tenant(self, tenant_id: int) -> Tenant:
        """Reactivate a suspended tenant."""
        tenant = await self.db.get(Tenant, tenant_id)
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")
        
        tenant.status = TenantStatus.ACTIVE
        tenant.suspended_at = None
        tenant.suspension_reason = None
        
        await self.db.commit()
        
        logger.info(f"Reactivated tenant: {tenant.slug}")
        return tenant
    
    async def _create_tenant_schema(self, schema_name: str):
        """Create isolated database schema for tenant."""
        try:
            # Create schema
            await self.db.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
            
            # Set search path for subsequent operations
            await self.db.execute(text(f"SET search_path TO {schema_name}, public"))
            
            # Create tenant-specific tables (would copy main schema structure)
            # This is a simplified version - in production, you'd copy the full schema
            await self.db.execute(text(f"""
                CREATE TABLE {schema_name}.tenant_users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    full_name VARCHAR(255) NOT NULL,
                    hashed_password VARCHAR(255) NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    is_verified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            
            await self.db.commit()
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to create schema {schema_name}: {e}")
            raise
    
    async def _drop_tenant_schema(self, schema_name: str):
        """Drop tenant database schema."""
        try:
            await self.db.execute(text(f"DROP SCHEMA {schema_name} CASCADE"))
            await self.db.commit()
        except Exception as e:
            logger.error(f"Failed to drop schema {schema_name}: {e}")
            raise
    
    async def _create_default_organization(self, tenant: Tenant):
        """Create default root organization for tenant."""
        org = Organization(
            slug="root",
            name=f"{tenant.name} Organization",
            description="Root organization",
            tenant_id=tenant.id,
            type="enterprise",
            parent_id=None
        )
        self.db.add(org)
        await self.db.flush()
    
    async def _create_default_rbac(self, tenant: Tenant):
        """Create default roles and permissions for tenant."""
        # Create tenant admin role
        admin_role = Role(
            name="tenant_admin",
            display_name="Tenant Administrator", 
            description="Full administrative access to tenant",
            type="system",
            is_system=True,
            tenant_id=tenant.id,
            priority=100
        )
        self.db.add(admin_role)
        
        # Create org admin role
        org_admin_role = Role(
            name="org_admin",
            display_name="Organization Administrator",
            description="Administrative access to organization",
            type="system", 
            is_system=True,
            tenant_id=tenant.id,
            priority=90
        )
        self.db.add(org_admin_role)
        
        # Create member role
        member_role = Role(
            name="member",
            display_name="Member",
            description="Basic member access",
            type="system",
            is_system=True,
            tenant_id=tenant.id,
            priority=10
        )
        self.db.add(member_role)
        
        await self.db.flush()
    
    def _get_default_limits(self, subscription_tier: str) -> Dict[str, Any]:
        """Get default resource limits for subscription tier."""
        limits = {
            "trial": {
                "max_users": 5,
                "max_organizations": 3,
                "max_projects": 10,
                "storage_gb": 1,
                "api_calls_per_hour": 1000
            },
            "basic": {
                "max_users": 25,
                "max_organizations": 10,
                "max_projects": 50,
                "storage_gb": 10,
                "api_calls_per_hour": 10000
            },
            "pro": {
                "max_users": 100,
                "max_organizations": 50,
                "max_projects": 200,
                "storage_gb": 100,
                "api_calls_per_hour": 100000
            },
            "enterprise": {
                "max_users": -1,  # Unlimited
                "max_organizations": -1,
                "max_projects": -1,
                "storage_gb": -1,
                "api_calls_per_hour": -1
            }
        }
        return limits.get(subscription_tier, limits["trial"])
    
    async def _count_tenant_users(self, tenant_id: int) -> int:
        """Count active users in tenant."""
        # This would count users across tenant organizations
        result = await self.db.execute(
            select(User.id)
            .join(OrganizationMembership)
            .join(Organization)
            .where(
                and_(
                    Organization.tenant_id == tenant_id,
                    User.is_active == True,
                    OrganizationMembership.status == "active"
                )
            )
        )
        return len(result.fetchall())
    
    async def _invalidate_tenant_cache(self, slug: str):
        """Invalidate cached tenant data."""
        if self.redis:
            try:
                cache_keys = [
                    f"tenant:slug:{slug}",
                    f"tenant:uuid:*",  # Would need proper pattern matching
                    f"tenant:domain:*"
                ]
                for key in cache_keys:
                    await self.redis.delete(key)
            except Exception as e:
                logger.warning(f"Failed to invalidate tenant cache: {e}")
    
    async def _invalidate_tenant_sessions(self, tenant_id: int):
        """Invalidate all user sessions for tenant."""
        if self.redis:
            try:
                # Clear permission cache for all tenant users
                pattern = f"tenant:{tenant_id}:permissions:*"
                keys = await self.redis.keys(pattern)
                if keys:
                    await self.redis.delete(*keys)
            except Exception as e:
                logger.warning(f"Failed to invalidate tenant sessions: {e}")


class PermissionManager:
    """
    Permission management utilities for RBAC operations.
    
    Provides:
    - Permission checking and enforcement
    - Role assignment and management
    - Permission caching and invalidation
    - Resource-level access control
    """
    
    def __init__(self, db: AsyncSession, redis_client: Optional[redis.Redis] = None):
        self.db = db
        self.redis = redis_client
        self.cache_ttl = 300  # 5 minutes
    
    async def check_permission(
        self,
        user_id: int,
        permission_name: str,
        tenant_id: int,
        organization_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None
    ) -> bool:
        """
        Check if user has permission in given context.
        
        Args:
            user_id: User ID to check
            permission_name: Permission name (e.g., 'users.create')
            tenant_id: Tenant context
            organization_id: Organization context (optional)
            resource_type: Specific resource type (optional)
            resource_id: Specific resource ID (optional)
            
        Returns:
            True if user has permission
        """
        # Try cache first
        cache_key = self._get_permission_cache_key(
            user_id, tenant_id, organization_id
        )
        
        cached_permissions = await self._get_cached_permissions(cache_key)
        if cached_permissions and permission_name in cached_permissions:
            return True
        
        # Check database permissions
        has_permission = await self._check_database_permissions(
            user_id, permission_name, tenant_id, organization_id,
            resource_type, resource_id
        )
        
        # Update cache if permission found
        if has_permission:
            await self._cache_user_permissions(user_id, tenant_id, organization_id)
        
        return has_permission
    
    async def require_permission(
        self,
        user_id: int,
        permission_name: str,
        tenant_id: int,
        organization_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None
    ):
        """
        Require user to have permission, raise exception if not.
        
        Raises:
            PermissionDeniedError: If user lacks permission
        """
        if not await self.check_permission(
            user_id, permission_name, tenant_id, organization_id,
            resource_type, resource_id
        ):
            raise PermissionDeniedError(
                f"User {user_id} lacks permission '{permission_name}' "
                f"in tenant {tenant_id}"
            )
    
    async def assign_role(
        self,
        user_id: int,
        role_id: int,
        tenant_id: int,
        organization_id: Optional[int] = None,
        assigned_by: Optional[int] = None
    ) -> bool:
        """Assign role to user in given context."""
        try:
            # Verify role exists and belongs to tenant/org
            role = await self.db.get(Role, role_id)
            if not role:
                raise ValueError(f"Role {role_id} not found")
            
            if role.tenant_id != tenant_id:
                raise ValueError(f"Role {role_id} does not belong to tenant {tenant_id}")
            
            if organization_id and role.organization_id != organization_id:
                raise ValueError(f"Role {role_id} does not belong to organization {organization_id}")
            
            # Create role assignment (using association table)
            # This would use SQLAlchemy relationship assignment
            # For now, we'll simulate the assignment
            
            # Invalidate permission cache
            await self._invalidate_user_permission_cache(user_id, tenant_id, organization_id)
            
            logger.info(f"Assigned role {role_id} to user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to assign role: {e}")
            return False
    
    async def revoke_role(
        self,
        user_id: int,
        role_id: int,
        tenant_id: int,
        organization_id: Optional[int] = None
    ) -> bool:
        """Revoke role from user."""
        try:
            # Remove role assignment
            # This would remove from association table
            
            # Invalidate permission cache
            await self._invalidate_user_permission_cache(user_id, tenant_id, organization_id)
            
            logger.info(f"Revoked role {role_id} from user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to revoke role: {e}")
            return False
    
    async def grant_resource_permission(
        self,
        user_id: int,
        permission_name: str,
        resource_type: str,
        resource_id: str,
        tenant_id: int,
        granted_by: Optional[int] = None,
        expires_at: Optional[datetime] = None
    ) -> ResourcePermission:
        """Grant specific resource permission to user."""
        # Get permission
        permission = await self.db.execute(
            select(Permission).where(Permission.name == permission_name)
        )
        permission = permission.scalar_one_or_none()
        if not permission:
            raise ValueError(f"Permission '{permission_name}' not found")
        
        # Create resource permission
        resource_perm = ResourcePermission(
            user_id=user_id,
            permission_id=permission.id,
            resource_type=resource_type,
            resource_id=resource_id,
            tenant_id=tenant_id,
            granted_by_id=granted_by,
            expires_at=expires_at,
            granted=True
        )
        
        self.db.add(resource_perm)
        await self.db.commit()
        
        # Invalidate cache
        await self._invalidate_user_permission_cache(user_id, tenant_id)
        
        return resource_perm
    
    async def _check_database_permissions(
        self,
        user_id: int,
        permission_name: str,
        tenant_id: int,
        organization_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None
    ) -> bool:
        """Check permissions from database."""
        # Check role-based permissions
        role_perms = await self.db.execute(
            select(Permission.name)
            .join(role_permissions)
            .join(Role)
            .join(user_role_assignments)
            .where(
                and_(
                    user_role_assignments.c.user_id == user_id,
                    Role.tenant_id == tenant_id,
                    Role.is_active == True,
                    Permission.name == permission_name,
                    Permission.is_active == True
                )
            )
        )
        
        if role_perms.scalar_one_or_none():
            return True
        
        # Check resource-specific permissions
        if resource_type and resource_id:
            resource_perms = await self.db.execute(
                select(ResourcePermission)
                .join(Permission)
                .where(
                    and_(
                        ResourcePermission.user_id == user_id,
                        ResourcePermission.tenant_id == tenant_id,
                        ResourcePermission.resource_type == resource_type,
                        ResourcePermission.resource_id == resource_id,
                        Permission.name == permission_name,
                        ResourcePermission.granted == True,
                        or_(
                            ResourcePermission.expires_at.is_(None),
                            ResourcePermission.expires_at > datetime.now(timezone.utc)
                        )
                    )
                )
            )
            
            if resource_perms.scalar_one_or_none():
                return True
        
        return False
    
    def _get_permission_cache_key(
        self, 
        user_id: int, 
        tenant_id: int, 
        organization_id: Optional[int] = None
    ) -> str:
        """Generate cache key for user permissions."""
        if organization_id:
            return f"tenant:{tenant_id}:permissions:user:{user_id}:org:{organization_id}"
        return f"tenant:{tenant_id}:permissions:user:{user_id}"
    
    async def _get_cached_permissions(self, cache_key: str) -> Optional[Set[str]]:
        """Get cached permissions for user."""
        if not self.redis:
            return None
        
        try:
            cached_data = await self.redis.get(cache_key)
            if cached_data:
                # Would deserialize permission set
                return set(cached_data.split(","))
        except Exception as e:
            logger.warning(f"Failed to get cached permissions: {e}")
        
        return None
    
    async def _cache_user_permissions(
        self, 
        user_id: int, 
        tenant_id: int, 
        organization_id: Optional[int] = None
    ):
        """Cache user permissions for performance."""
        if not self.redis:
            return
        
        try:
            # Get all user permissions
            permissions = await self._get_all_user_permissions(
                user_id, tenant_id, organization_id
            )
            
            cache_key = self._get_permission_cache_key(
                user_id, tenant_id, organization_id
            )
            
            # Cache permissions
            permission_list = ",".join(permissions)
            await self.redis.setex(cache_key, self.cache_ttl, permission_list)
            
        except Exception as e:
            logger.warning(f"Failed to cache user permissions: {e}")
    
    async def _get_all_user_permissions(
        self, 
        user_id: int, 
        tenant_id: int, 
        organization_id: Optional[int] = None
    ) -> Set[str]:
        """Get all permissions for user in context."""
        permissions = set()
        
        # Get role-based permissions
        role_perms = await self.db.execute(
            select(Permission.name)
            .join(role_permissions)
            .join(Role)
            .join(user_role_assignments)
            .where(
                and_(
                    user_role_assignments.c.user_id == user_id,
                    Role.tenant_id == tenant_id,
                    Role.is_active == True,
                    Permission.is_active == True
                )
            )
        )
        
        for perm in role_perms.scalars():
            permissions.add(perm)
        
        # Get resource permissions
        resource_perms = await self.db.execute(
            select(Permission.name)
            .join(ResourcePermission)
            .where(
                and_(
                    ResourcePermission.user_id == user_id,
                    ResourcePermission.tenant_id == tenant_id,
                    ResourcePermission.granted == True,
                    or_(
                        ResourcePermission.expires_at.is_(None),
                        ResourcePermission.expires_at > datetime.now(timezone.utc)
                    )
                )
            )
        )
        
        for perm in resource_perms.scalars():
            permissions.add(perm)
        
        return permissions
    
    async def _invalidate_user_permission_cache(
        self, 
        user_id: int, 
        tenant_id: int, 
        organization_id: Optional[int] = None
    ):
        """Invalidate user permission cache."""
        if not self.redis:
            return
        
        try:
            cache_key = self._get_permission_cache_key(
                user_id, tenant_id, organization_id
            )
            await self.redis.delete(cache_key)
        except Exception as e:
            logger.warning(f"Failed to invalidate permission cache: {e}")


@asynccontextmanager
async def tenant_context(tenant_id: int) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Context manager for tenant-isolated operations.
    
    Usage:
        async with tenant_context(tenant_id) as ctx:
            # Operations are automatically tenant-scoped
            tenant = ctx['tenant']
            db = ctx['db']
            permission_manager = ctx['permissions']
    """
    async with AsyncSessionLocal() as db:
        # Get tenant
        tenant = await db.get(Tenant, tenant_id)
        if not tenant:
            raise TenantIsolationError(f"Tenant {tenant_id} not found")
        
        if tenant.status != TenantStatus.ACTIVE:
            raise TenantIsolationError(f"Tenant {tenant_id} is not active")
        
        # Set database schema context
        await db.execute(text(f"SET search_path TO {tenant.schema_name}, public"))
        
        # Create managers
        redis_client = await get_redis()
        tenant_manager = TenantManager(db, redis_client)
        permission_manager = PermissionManager(db, redis_client)
        
        try:
            yield {
                'tenant': tenant,
                'db': db,
                'tenant_manager': tenant_manager,
                'permission_manager': permission_manager,
                'schema': tenant.schema_name
            }
        finally:
            # Reset schema
            await db.execute(text("SET search_path TO public"))


def require_permissions(*permission_names: str):
    """
    Decorator for requiring permissions on endpoints.
    
    Usage:
        @require_permissions('users.read', 'users.create')
        async def create_user(...)
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extract request and user context
            # This would integrate with FastAPI dependency injection
            # For now, we'll simulate the permission check
            
            # Get user and tenant from request context
            # user_id = get_current_user_id()
            # tenant_id = get_current_tenant_id()
            
            # Check permissions
            # permission_manager = PermissionManager(db)
            # for perm in permission_names:
            #     await permission_manager.require_permission(
            #         user_id, perm, tenant_id
            #     )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator