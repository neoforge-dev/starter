"""Organization management API endpoints."""
import logging
from typing import Any, List, Optional, Dict
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, get_current_active_user
from app.api.middleware.tenant import get_tenant_context, require_tenant, TenantContext
from app.models.user import User
from app.models.tenant import (
    Organization, 
    OrganizationMembership, 
    MembershipStatus,
    OrganizationType,
    TenantAuditLog
)
from app.models.rbac import Role
from app.schemas.tenant import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationMembershipCreate,
    OrganizationMembershipUpdate,
    OrganizationMembershipResponse,
    OrganizationInviteCreate,
    OrganizationHierarchyResponse
)
from app.crud.tenant_crud import OrganizationScopedCRUD
from app.core.tenant import PermissionManager
from app.utils.audit import create_audit_log


logger = logging.getLogger(__name__)

router = APIRouter()


class OrganizationCRUD(OrganizationScopedCRUD[Organization, OrganizationCreate, OrganizationUpdate]):
    """CRUD operations for organizations."""
    
    def get_required_permissions(self, operation: str) -> List[str]:
        """Get required permissions for organization operations."""
        permission_map = {
            "create": ["organizations.create"],
            "read": ["organizations.read"],
            "update": ["organizations.update"],
            "delete": ["organizations.delete"]
        }
        return permission_map.get(operation, [])


class MembershipCRUD(OrganizationScopedCRUD[OrganizationMembership, OrganizationMembershipCreate, OrganizationMembershipUpdate]):
    """CRUD operations for organization memberships."""
    
    def get_required_permissions(self, operation: str) -> List[str]:
        """Get required permissions for membership operations."""
        permission_map = {
            "create": ["members.invite"],
            "read": ["members.read"],
            "update": ["members.manage"],
            "delete": ["members.remove"]
        }
        return permission_map.get(operation, [])


org_crud = OrganizationCRUD(Organization)
membership_crud = MembershipCRUD(OrganizationMembership)


@router.post("/", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_context: TenantContext = Depends(require_tenant),
    current_user: User = Depends(get_current_active_user),
    org_in: OrganizationCreate
) -> Any:
    """
    Create a new organization.
    
    Requires: organizations.create permission
    """
    try:
        # Check if slug is unique within tenant
        existing = await db.execute(
            select(Organization).where(
                and_(
                    Organization.tenant_id == tenant_context.tenant_id,
                    Organization.slug == org_in.slug
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Organization with slug '{org_in.slug}' already exists"
            )
        
        # Validate parent organization if specified
        if org_in.parent_id:
            parent = await org_crud.get_by_id_with_tenant(
                db,
                id=org_in.parent_id,
                tenant_id=tenant_context.tenant_id,
                user_id=current_user.id
            )
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent organization not found"
                )
        
        # Create organization
        organization = await org_crud.create_with_tenant(
            db,
            obj_in=org_in,
            tenant_id=tenant_context.tenant_id,
            created_by=current_user.id
        )
        
        # Add creator as admin member
        await _add_organization_member(
            db=db,
            organization_id=organization.id,
            user_id=current_user.id,
            role_name="org_admin",
            tenant_id=tenant_context.tenant_id,
            invited_by=current_user.id,
            auto_approve=True
        )
        
        await db.commit()
        
        # Log audit event
        await create_audit_log(
            db=db,
            tenant_id=tenant_context.tenant_id,
            actor_id=current_user.id,
            action="organization.created",
            resource_type="organization",
            resource_id=str(organization.id),
            details={
                "organization_slug": organization.slug,
                "organization_name": organization.name,
                "parent_id": org_in.parent_id
            }
        )
        
        logger.info(
            f"Created organization {organization.slug} in tenant {tenant_context.tenant_id}",
            extra={
                "organization_id": organization.id,
                "tenant_id": tenant_context.tenant_id,
                "user_id": current_user.id
            }
        )
        
        return organization
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create organization: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create organization"
        )


@router.get("/", response_model=List[OrganizationResponse])
async def list_organizations(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_context: TenantContext = Depends(require_tenant),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    parent_id: Optional[int] = Query(None),
    org_type: Optional[OrganizationType] = Query(None),
    include_children: bool = Query(False),
    search: Optional[str] = Query(None)
) -> Any:
    """
    List organizations with filtering and pagination.
    
    Requires: organizations.read permission
    """
    try:
        # Build filters
        filters = {}
        if parent_id is not None:
            filters['parent_id'] = parent_id
        if org_type:
            filters['type'] = org_type
        
        # Get organizations
        if include_children and parent_id:
            organizations = await org_crud.get_multi_with_hierarchy(
                db,
                tenant_id=tenant_context.tenant_id,
                organization_id=parent_id,
                user_id=current_user.id,
                include_children=True,
                skip=skip,
                limit=limit
            )
        else:
            organizations = await org_crud.get_multi_with_tenant(
                db,
                tenant_id=tenant_context.tenant_id,
                user_id=current_user.id,
                skip=skip,
                limit=limit,
                filters=filters
            )
        
        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            organizations = [
                org for org in organizations
                if search_lower in org.name.lower() or 
                   search_lower in org.slug.lower() or
                   (org.description and search_lower in org.description.lower())
            ]
        
        return organizations
        
    except Exception as e:
        logger.error(f"Failed to list organizations: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list organizations"
        )


@router.get("/{organization_id}", response_model=OrganizationResponse)
async def get_organization(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_context: TenantContext = Depends(require_tenant),
    current_user: User = Depends(get_current_active_user),
    organization_id: int
) -> Any:
    """
    Get organization by ID.
    
    Requires: organizations.read permission
    """
    organization = await org_crud.get_by_id_with_tenant(
        db,
        id=organization_id,
        tenant_id=tenant_context.tenant_id,
        user_id=current_user.id
    )
    
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    return organization


@router.put("/{organization_id}", response_model=OrganizationResponse)
async def update_organization(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_context: TenantContext = Depends(require_tenant),
    current_user: User = Depends(get_current_active_user),
    organization_id: int,
    org_in: OrganizationUpdate
) -> Any:
    """
    Update organization.
    
    Requires: organizations.update permission
    """
    try:
        # Get existing organization
        organization = await org_crud.get_by_id_with_tenant(
            db,
            id=organization_id,
            tenant_id=tenant_context.tenant_id,
            user_id=current_user.id
        )
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        
        # Check slug uniqueness if changed
        if org_in.slug and org_in.slug != organization.slug:
            existing = await db.execute(
                select(Organization).where(
                    and_(
                        Organization.tenant_id == tenant_context.tenant_id,
                        Organization.slug == org_in.slug,
                        Organization.id != organization_id
                    )
                )
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Organization with slug '{org_in.slug}' already exists"
                )
        
        # Validate parent change if specified
        if org_in.parent_id is not None and org_in.parent_id != organization.parent_id:
            if org_in.parent_id == organization_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Organization cannot be its own parent"
                )
            
            # Check for circular reference
            if await _would_create_cycle(db, organization_id, org_in.parent_id, tenant_context.tenant_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent change would create circular reference"
                )
        
        # Update organization
        updated_org = await org_crud.update_with_tenant(
            db,
            db_obj=organization,
            obj_in=org_in,
            tenant_id=tenant_context.tenant_id,
            updated_by=current_user.id
        )
        
        await db.commit()
        
        # Log audit event
        await create_audit_log(
            db=db,
            tenant_id=tenant_context.tenant_id,
            actor_id=current_user.id,
            action="organization.updated",
            resource_type="organization",
            resource_id=str(organization_id),
            details=org_in.dict(exclude_unset=True)
        )
        
        logger.info(
            f"Updated organization {organization_id} in tenant {tenant_context.tenant_id}",
            extra={
                "organization_id": organization_id,
                "tenant_id": tenant_context.tenant_id,
                "user_id": current_user.id
            }
        )
        
        return updated_org
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update organization {organization_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update organization"
        )


@router.delete("/{organization_id}")
async def delete_organization(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_context: TenantContext = Depends(require_tenant),
    current_user: User = Depends(get_current_active_user),
    organization_id: int,
    force: bool = Query(False)
) -> Any:
    """
    Delete organization.
    
    Requires: organizations.delete permission
    """
    try:
        # Get organization
        organization = await org_crud.get_by_id_with_tenant(
            db,
            id=organization_id,
            tenant_id=tenant_context.tenant_id,
            user_id=current_user.id
        )
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        
        # Check for child organizations
        child_count = await db.execute(
            select(func.count(Organization.id)).where(
                and_(
                    Organization.parent_id == organization_id,
                    Organization.tenant_id == tenant_context.tenant_id
                )
            )
        )
        child_count = child_count.scalar()
        
        if child_count > 0 and not force:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Organization has {child_count} child organizations. Use force=true to delete anyway."
            )
        
        # Check for active members
        member_count = await db.execute(
            select(func.count(OrganizationMembership.id)).where(
                and_(
                    OrganizationMembership.organization_id == organization_id,
                    OrganizationMembership.status == MembershipStatus.ACTIVE
                )
            )
        )
        member_count = member_count.scalar()
        
        if member_count > 1 and not force:  # Allow deletion if only current user is member
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Organization has {member_count} active members. Use force=true to delete anyway."
            )
        
        # Delete organization (cascades to memberships and children)
        deleted_org = await org_crud.remove_with_tenant(
            db,
            id=organization_id,
            tenant_id=tenant_context.tenant_id,
            deleted_by=current_user.id
        )
        
        await db.commit()
        
        # Log audit event
        await create_audit_log(
            db=db,
            tenant_id=tenant_context.tenant_id,
            actor_id=current_user.id,
            action="organization.deleted",
            resource_type="organization",
            resource_id=str(organization_id),
            details={
                "organization_slug": organization.slug,
                "organization_name": organization.name,
                "force_delete": force,
                "child_count": child_count,
                "member_count": member_count
            }
        )
        
        logger.info(
            f"Deleted organization {organization_id} in tenant {tenant_context.tenant_id}",
            extra={
                "organization_id": organization_id,
                "tenant_id": tenant_context.tenant_id,
                "user_id": current_user.id
            }
        )
        
        return {"message": "Organization deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete organization {organization_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete organization"
        )


@router.get("/{organization_id}/hierarchy", response_model=OrganizationHierarchyResponse)
async def get_organization_hierarchy(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_context: TenantContext = Depends(require_tenant),
    current_user: User = Depends(get_current_active_user),
    organization_id: int,
    max_depth: int = Query(10, ge=1, le=50)
) -> Any:
    """
    Get organization hierarchy (ancestors and descendants).
    
    Requires: organizations.read permission
    """
    try:
        # Get root organization
        root_org = await org_crud.get_by_id_with_tenant(
            db,
            id=organization_id,
            tenant_id=tenant_context.tenant_id,
            user_id=current_user.id
        )
        
        if not root_org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        
        # Get ancestors
        ancestors = await _get_organization_ancestors(
            db, organization_id, tenant_context.tenant_id, max_depth
        )
        
        # Get descendants
        descendants = await _get_organization_descendants(
            db, organization_id, tenant_context.tenant_id, max_depth
        )
        
        return {
            "organization": root_org,
            "ancestors": ancestors,
            "descendants": descendants,
            "total_depth": len(ancestors) + len(descendants)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get organization hierarchy: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get organization hierarchy"
        )


# Organization Membership endpoints

@router.post("/{organization_id}/members", response_model=OrganizationMembershipResponse, status_code=status.HTTP_201_CREATED)
async def invite_member(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_context: TenantContext = Depends(require_tenant),
    current_user: User = Depends(get_current_active_user),
    organization_id: int,
    invite_in: OrganizationInviteCreate
) -> Any:
    """
    Invite user to organization.
    
    Requires: members.invite permission
    """
    try:
        # Verify organization exists
        organization = await org_crud.get_by_id_with_tenant(
            db,
            id=organization_id,
            tenant_id=tenant_context.tenant_id,
            user_id=current_user.id
        )
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        
        # Find user by email
        user_result = await db.execute(
            select(User).where(User.email == invite_in.email)
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with email {invite_in.email} not found"
            )
        
        # Check if user is already a member
        existing_membership = await db.execute(
            select(OrganizationMembership).where(
                and_(
                    OrganizationMembership.user_id == user.id,
                    OrganizationMembership.organization_id == organization_id
                )
            )
        )
        
        if existing_membership.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this organization"
            )
        
        # Create membership
        membership = await _add_organization_member(
            db=db,
            organization_id=organization_id,
            user_id=user.id,
            role_name=invite_in.role or "member",
            tenant_id=tenant_context.tenant_id,
            invited_by=current_user.id,
            auto_approve=invite_in.auto_approve or False
        )
        
        await db.commit()
        
        # Log audit event
        await create_audit_log(
            db=db,
            tenant_id=tenant_context.tenant_id,
            actor_id=current_user.id,
            action="member.invited",
            resource_type="organization_membership",
            resource_id=str(membership.id),
            details={
                "organization_id": organization_id,
                "invited_user_id": user.id,
                "invited_email": invite_in.email,
                "role": invite_in.role,
                "auto_approve": invite_in.auto_approve
            }
        )
        
        logger.info(
            f"Invited user {user.id} to organization {organization_id}",
            extra={
                "organization_id": organization_id,
                "invited_user_id": user.id,
                "tenant_id": tenant_context.tenant_id,
                "inviter_id": current_user.id
            }
        )
        
        return membership
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to invite member: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to invite member"
        )


@router.get("/{organization_id}/members", response_model=List[OrganizationMembershipResponse])
async def list_members(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_context: TenantContext = Depends(require_tenant),
    current_user: User = Depends(get_current_active_user),
    organization_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[MembershipStatus] = Query(None),
    role_filter: Optional[str] = Query(None)
) -> Any:
    """
    List organization members.
    
    Requires: members.read permission
    """
    try:
        # Verify organization access
        organization = await org_crud.get_by_id_with_tenant(
            db,
            id=organization_id,
            tenant_id=tenant_context.tenant_id,
            user_id=current_user.id
        )
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        
        # Build query
        query = select(OrganizationMembership).where(
            OrganizationMembership.organization_id == organization_id
        ).options(
            selectinload(OrganizationMembership.user),
            selectinload(OrganizationMembership.role)
        )
        
        # Apply filters
        if status_filter:
            query = query.where(OrganizationMembership.status == status_filter)
        
        if role_filter:
            query = query.join(Role).where(Role.name == role_filter)
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        memberships = result.scalars().all()
        
        return list(memberships)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list members: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list members"
        )


# Helper functions

async def _add_organization_member(
    db: AsyncSession,
    organization_id: int,
    user_id: int,
    role_name: str,
    tenant_id: int,
    invited_by: int,
    auto_approve: bool = False
) -> OrganizationMembership:
    """Add user as organization member with role."""
    # Get role
    role_result = await db.execute(
        select(Role).where(
            and_(
                Role.name == role_name,
                Role.tenant_id == tenant_id
            )
        )
    )
    role = role_result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role '{role_name}' not found"
        )
    
    # Create membership
    membership = OrganizationMembership(
        user_id=user_id,
        organization_id=organization_id,
        role_id=role.id,
        status=MembershipStatus.ACTIVE if auto_approve else MembershipStatus.PENDING,
        invited_by_id=invited_by,
        joined_at=datetime.utcnow() if auto_approve else None
    )
    
    db.add(membership)
    await db.flush()
    
    return membership


async def _would_create_cycle(
    db: AsyncSession,
    org_id: int,
    new_parent_id: int,
    tenant_id: int
) -> bool:
    """Check if setting new_parent_id as parent would create circular reference."""
    current_id = new_parent_id
    visited = {org_id}
    
    while current_id:
        if current_id in visited:
            return True
        
        visited.add(current_id)
        
        # Get parent of current organization
        result = await db.execute(
            select(Organization.parent_id).where(
                and_(
                    Organization.id == current_id,
                    Organization.tenant_id == tenant_id
                )
            )
        )
        current_id = result.scalar_one_or_none()
    
    return False


async def _get_organization_ancestors(
    db: AsyncSession,
    org_id: int,
    tenant_id: int,
    max_depth: int
) -> List[Organization]:
    """Get organization ancestors up to max_depth."""
    ancestors = []
    current_id = org_id
    depth = 0
    
    while current_id and depth < max_depth:
        # Get parent organization
        result = await db.execute(
            select(Organization).where(
                and_(
                    Organization.tenant_id == tenant_id,
                    Organization.id.in_(
                        select(Organization.parent_id).where(
                            Organization.id == current_id
                        )
                    )
                )
            )
        )
        parent = result.scalar_one_or_none()
        
        if not parent:
            break
        
        ancestors.append(parent)
        current_id = parent.id
        depth += 1
    
    return ancestors


async def _get_organization_descendants(
    db: AsyncSession,
    org_id: int,
    tenant_id: int,
    max_depth: int
) -> List[Organization]:
    """Get organization descendants up to max_depth."""
    descendants = []
    current_level = [org_id]
    depth = 0
    
    while current_level and depth < max_depth:
        # Get children of current level
        result = await db.execute(
            select(Organization).where(
                and_(
                    Organization.tenant_id == tenant_id,
                    Organization.parent_id.in_(current_level)
                )
            )
        )
        children = result.scalars().all()
        
        if not children:
            break
        
        descendants.extend(children)
        current_level = [child.id for child in children]
        depth += 1
    
    return descendants