"""Role-Based Access Control (RBAC) API endpoints."""
import logging
from typing import Any, List, Optional, Dict
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, delete
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, get_current_active_user
from app.api.middleware.tenant import get_tenant_context, require_tenant, TenantContext
from app.models.user import User
from app.models.tenant import Organization
from app.models.rbac import (
    Role, 
    Permission, 
    ResourcePermission, 
    PermissionCache,
    role_permissions,
    user_role_assignments,
    PermissionScope,
    PermissionAction,
    RoleType
)
from app.schemas.tenant import (
    RoleCreate,
    RoleUpdate,
    RoleResponse,
    RoleAssignmentCreate,
    RoleAssignmentResponse,
    PermissionCreate,
    PermissionUpdate,
    PermissionResponse,
    ResourcePermissionCreate,
    ResourcePermissionResponse
)
from app.crud.tenant_crud import TenantCRUDBase, GlobalCRUD
from app.core.tenant import PermissionManager
from app.utils.audit import create_audit_log


logger = logging.getLogger(__name__)

router = APIRouter()


class RoleCRUD(TenantCRUDBase[Role, RoleCreate, RoleUpdate]):
    """CRUD operations for roles."""
    
    def get_required_permissions(self, operation: str) -> List[str]:
        """Get required permissions for role operations."""
        permission_map = {
            "create": ["roles.create"],
            "read": ["roles.read"],
            "update": ["roles.update"],
            "delete": ["roles.delete"]
        }
        return permission_map.get(operation, [])


class PermissionCRUD(GlobalCRUD[Permission, PermissionCreate, PermissionUpdate]):
    """CRUD operations for permissions (global scope)."""
    
    def get_required_permissions(self, operation: str) -> List[str]:
        """Get required permissions for permission operations."""
        permission_map = {
            "create": ["permissions.create"],
            "read": ["permissions.read"],
            "update": ["permissions.update"],
            "delete": ["permissions.delete"]
        }
        return permission_map.get(operation, [])


role_crud = RoleCRUD(Role)
permission_crud = PermissionCRUD(Permission)


# Role endpoints

@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_context: TenantContext = Depends(require_tenant),
    current_user: User = Depends(get_current_active_user),
    role_in: RoleCreate
) -> Any:
    """
    Create a new role.
    
    Requires: roles.create permission
    """
    try:
        # Validate role name uniqueness within tenant/organization context
        existing = await db.execute(
            select(Role).where(
                and_(
                    Role.name == role_in.name,
                    Role.tenant_id == tenant_context.tenant_id,
                    Role.organization_id == role_in.organization_id
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role '{role_in.name}' already exists in this context"
            )
        
        # Validate organization exists if specified
        if role_in.organization_id:
            org_result = await db.execute(
                select(Organization).where(
                    and_(
                        Organization.id == role_in.organization_id,
                        Organization.tenant_id == tenant_context.tenant_id
                    )
                )
            )
            if not org_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Organization not found"
                )
        
        # Validate parent role if specified
        if role_in.parent_role_id:
            parent_role = await db.execute(
                select(Role).where(
                    and_(
                        Role.id == role_in.parent_role_id,
                        Role.tenant_id == tenant_context.tenant_id
                    )
                )
            )
            if not parent_role.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent role not found"
                )
        
        # Set tenant context
        role_data = role_in.dict()
        role_data['tenant_id'] = tenant_context.tenant_id
        
        # Create role
        role = Role(**role_data)
        db.add(role)
        await db.flush()
        
        # Assign permissions if specified
        if role_in.permission_ids:
            await _assign_permissions_to_role(
                db, role.id, role_in.permission_ids, tenant_context.tenant_id
            )
        
        await db.commit()
        
        # Log audit event
        await create_audit_log(
            db=db,
            tenant_id=tenant_context.tenant_id,
            actor_id=current_user.id,
            action="role.created",
            resource_type="role",
            resource_id=str(role.id),
            details={
                "role_name": role.name,
                "role_type": role.type,
                "organization_id": role.organization_id,
                "permission_count": len(role_in.permission_ids or [])
            }
        )
        
        logger.info(
            f"Created role {role.name} in tenant {tenant_context.tenant_id}",
            extra={
                "role_id": role.id,
                "tenant_id": tenant_context.tenant_id,
                "user_id": current_user.id
            }
        )
        
        return role
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create role: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create role"
        )


@router.get("/roles", response_model=List[RoleResponse])
async def list_roles(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_context: TenantContext = Depends(require_tenant),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    organization_id: Optional[int] = Query(None),
    role_type: Optional[RoleType] = Query(None),
    include_permissions: bool = Query(False)
) -> Any:
    """
    List roles with filtering.
    
    Requires: roles.read permission
    """
    try:
        # Build query
        query = select(Role).where(Role.tenant_id == tenant_context.tenant_id)
        
        # Apply filters
        if organization_id is not None:
            query = query.where(Role.organization_id == organization_id)
        
        if role_type:
            query = query.where(Role.type == role_type)
        
        # Include permissions if requested
        if include_permissions:
            query = query.options(selectinload(Role.permissions))
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        roles = result.scalars().all()
        
        return list(roles)
        
    except Exception as e:
        logger.error(f"Failed to list roles: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list roles"
        )


@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_context: TenantContext = Depends(require_tenant),
    current_user: User = Depends(get_current_active_user),
    role_id: int,
    include_permissions: bool = Query(False),
    include_hierarchy: bool = Query(False)
) -> Any:
    """
    Get role by ID with optional nested data.
    
    Requires: roles.read permission
    """
    # Build query with optional includes
    query = select(Role).where(
        and_(
            Role.id == role_id,
            Role.tenant_id == tenant_context.tenant_id
        )
    )
    
    if include_permissions:
        query = query.options(selectinload(Role.permissions))
    
    if include_hierarchy:
        query = query.options(
            selectinload(Role.parent_role),
            selectinload(Role.child_roles)
        )
    
    result = await db.execute(query)
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    return role


@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_context: TenantContext = Depends(require_tenant),
    current_user: User = Depends(get_current_active_user),
    role_id: int,
    role_in: RoleUpdate
) -> Any:
    """
    Update role.
    
    Requires: roles.update permission
    """
    try:
        # Get existing role
        role = await role_crud.get_by_id_with_tenant(
            db,
            id=role_id,
            tenant_id=tenant_context.tenant_id,
            user_id=current_user.id
        )
        
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        # Check if role is system role
        if role.is_system and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot modify system roles"
            )
        
        # Validate name uniqueness if changed
        if role_in.name and role_in.name != role.name:
            existing = await db.execute(
                select(Role).where(
                    and_(
                        Role.name == role_in.name,
                        Role.tenant_id == tenant_context.tenant_id,
                        Role.organization_id == role.organization_id,
                        Role.id != role_id
                    )
                )
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Role '{role_in.name}' already exists"
                )
        
        # Update role
        update_data = role_in.dict(exclude_unset=True)
        
        # Handle permission updates
        if role_in.permission_ids is not None:
            # Remove current permissions
            await db.execute(
                delete(role_permissions).where(role_permissions.c.role_id == role_id)
            )
            
            # Add new permissions
            if role_in.permission_ids:
                await _assign_permissions_to_role(
                    db, role_id, role_in.permission_ids, tenant_context.tenant_id
                )
            
            # Remove from update data as it's handled separately
            update_data.pop('permission_ids', None)
        
        # Apply updates
        for field, value in update_data.items():
            setattr(role, field, value)
        
        await db.commit()
        
        # Clear permission cache for users with this role
        await _invalidate_role_permission_cache(db, role_id, tenant_context.tenant_id)
        
        # Log audit event
        await create_audit_log(
            db=db,
            tenant_id=tenant_context.tenant_id,
            actor_id=current_user.id,
            action="role.updated",
            resource_type="role",
            resource_id=str(role_id),
            details=update_data
        )
        
        logger.info(
            f"Updated role {role_id} in tenant {tenant_context.tenant_id}",
            extra={
                "role_id": role_id,
                "tenant_id": tenant_context.tenant_id,
                "user_id": current_user.id
            }
        )
        
        return role
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update role {role_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update role"
        )


@router.delete("/roles/{role_id}")
async def delete_role(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_context: TenantContext = Depends(require_tenant),
    current_user: User = Depends(get_current_active_user),
    role_id: int,
    force: bool = Query(False)
) -> Any:
    """
    Delete role.
    
    Requires: roles.delete permission
    """
    try:
        # Get role
        role = await role_crud.get_by_id_with_tenant(
            db,
            id=role_id,
            tenant_id=tenant_context.tenant_id,
            user_id=current_user.id
        )
        
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        # Check if role is system role
        if role.is_system:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete system roles"
            )
        
        # Check for assigned users
        user_count = await db.execute(
            select(func.count()).select_from(user_role_assignments).where(
                user_role_assignments.c.role_id == role_id
            )
        )
        user_count = user_count.scalar()
        
        if user_count > 0 and not force:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role is assigned to {user_count} users. Use force=true to delete anyway."
            )
        
        # Delete role (cascades to assignments and permissions)
        await db.delete(role)
        await db.commit()
        
        # Clear permission cache
        await _invalidate_role_permission_cache(db, role_id, tenant_context.tenant_id)
        
        # Log audit event
        await create_audit_log(
            db=db,
            tenant_id=tenant_context.tenant_id,
            actor_id=current_user.id,
            action="role.deleted",
            resource_type="role",
            resource_id=str(role_id),
            details={
                "role_name": role.name,
                "user_count": user_count,
                "force_delete": force
            }
        )
        
        logger.info(
            f"Deleted role {role_id} in tenant {tenant_context.tenant_id}",
            extra={
                "role_id": role_id,
                "tenant_id": tenant_context.tenant_id,
                "user_id": current_user.id
            }
        )
        
        return {"message": "Role deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete role {role_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete role"
        )


# Role assignment endpoints

@router.post("/roles/{role_id}/assignments", response_model=RoleAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def assign_role(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_context: TenantContext = Depends(require_tenant),
    current_user: User = Depends(get_current_active_user),
    role_id: int,
    assignment_in: RoleAssignmentCreate
) -> Any:
    """
    Assign role to user.
    
    Requires: roles.assign permission
    """
    try:
        # Verify role exists and belongs to tenant
        role = await role_crud.get_by_id_with_tenant(
            db,
            id=role_id,
            tenant_id=tenant_context.tenant_id,
            user_id=current_user.id
        )
        
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        # Verify user exists (in same tenant context)
        user_result = await db.execute(
            select(User).where(User.id == assignment_in.user_id)
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if assignment already exists
        existing = await db.execute(
            select(func.count()).select_from(user_role_assignments).where(
                and_(
                    user_role_assignments.c.user_id == assignment_in.user_id,
                    user_role_assignments.c.role_id == role_id,
                    user_role_assignments.c.tenant_id == tenant_context.tenant_id,
                    user_role_assignments.c.organization_id == assignment_in.organization_id
                )
            )
        )
        
        if existing.scalar() > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role already assigned to user in this context"
            )
        
        # Create assignment
        assignment_data = {
            'user_id': assignment_in.user_id,
            'role_id': role_id,
            'tenant_id': tenant_context.tenant_id,
            'organization_id': assignment_in.organization_id,
            'assigned_at': datetime.now(timezone.utc),
            'assigned_by_id': current_user.id
        }
        
        await db.execute(
            user_role_assignments.insert().values(**assignment_data)
        )
        
        await db.commit()
        
        # Clear user permission cache
        await _invalidate_user_permission_cache(
            db, assignment_in.user_id, tenant_context.tenant_id, assignment_in.organization_id
        )
        
        # Log audit event
        await create_audit_log(
            db=db,
            tenant_id=tenant_context.tenant_id,
            actor_id=current_user.id,
            action="role.assigned",
            resource_type="role_assignment",
            resource_id=f"{assignment_in.user_id}:{role_id}",
            details={
                "user_id": assignment_in.user_id,
                "role_id": role_id,
                "role_name": role.name,
                "organization_id": assignment_in.organization_id
            }
        )
        
        logger.info(
            f"Assigned role {role_id} to user {assignment_in.user_id}",
            extra={
                "role_id": role_id,
                "user_id": assignment_in.user_id,
                "tenant_id": tenant_context.tenant_id,
                "assignor_id": current_user.id
            }
        )
        
        return assignment_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to assign role: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign role"
        )


# Permission endpoints

@router.get("/permissions", response_model=List[PermissionResponse])
async def list_permissions(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    resource_type: Optional[str] = Query(None),
    action: Optional[PermissionAction] = Query(None),
    scope: Optional[PermissionScope] = Query(None),
    search: Optional[str] = Query(None)
) -> Any:
    """
    List available permissions.
    
    Requires: permissions.read permission
    """
    try:
        # Build query
        query = select(Permission).where(Permission.is_active == True)
        
        # Apply filters
        if resource_type:
            query = query.where(Permission.resource_type == resource_type)
        
        if action:
            query = query.where(Permission.action == action)
        
        if scope:
            query = query.where(Permission.scope == scope)
        
        if search:
            search_filter = or_(
                Permission.name.ilike(f"%{search}%"),
                Permission.display_name.ilike(f"%{search}%"),
                Permission.description.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        permissions = result.scalars().all()
        
        return list(permissions)
        
    except Exception as e:
        logger.error(f"Failed to list permissions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list permissions"
        )


# Helper functions

async def _assign_permissions_to_role(
    db: AsyncSession,
    role_id: int,
    permission_ids: List[int],
    tenant_id: int
):
    """Assign permissions to role."""
    # Verify all permissions exist
    permission_result = await db.execute(
        select(Permission).where(Permission.id.in_(permission_ids))
    )
    permissions = permission_result.scalars().all()
    
    if len(permissions) != len(permission_ids):
        found_ids = {p.id for p in permissions}
        missing_ids = set(permission_ids) - found_ids
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Permissions not found: {missing_ids}"
        )
    
    # Create role-permission assignments
    assignments = [
        {"role_id": role_id, "permission_id": perm_id}
        for perm_id in permission_ids
    ]
    
    await db.execute(
        role_permissions.insert().values(assignments)
    )


async def _invalidate_role_permission_cache(
    db: AsyncSession,
    role_id: int,
    tenant_id: int
):
    """Invalidate permission cache for all users with this role."""
    # Get users with this role
    user_result = await db.execute(
        select(user_role_assignments.c.user_id).where(
            and_(
                user_role_assignments.c.role_id == role_id,
                user_role_assignments.c.tenant_id == tenant_id
            )
        )
    )
    user_ids = [row[0] for row in user_result.fetchall()]
    
    # Clear cache entries
    if user_ids:
        await db.execute(
            delete(PermissionCache).where(
                and_(
                    PermissionCache.user_id.in_(user_ids),
                    PermissionCache.tenant_id == tenant_id
                )
            )
        )


async def _invalidate_user_permission_cache(
    db: AsyncSession,
    user_id: int,
    tenant_id: int,
    organization_id: Optional[int] = None
):
    """Invalidate permission cache for specific user."""
    query = delete(PermissionCache).where(
        and_(
            PermissionCache.user_id == user_id,
            PermissionCache.tenant_id == tenant_id
        )
    )
    
    if organization_id:
        query = query.where(PermissionCache.organization_id == organization_id)
    
    await db.execute(query)