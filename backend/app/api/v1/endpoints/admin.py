"""Admin API endpoints."""
from typing import Any, List
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api import deps
from app.core.auth import get_password_hash
from app.models.admin import Admin, AdminRole
from app.schemas import admin as schemas
from app.schemas.common import PaginatedResponse
from app.crud.audit_log import audit_log as audit_crud
from datetime import datetime
from app.schemas.user import UserCreate

# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter()


def check_admin_permission(
    current_admin: Admin,
    required_role: AdminRole,
    action: str,
    resource: str,
) -> None:
    """Check if admin has required permissions."""
    logger.debug(f"Checking permissions for admin {current_admin.id}, role={current_admin.role}, required_role={required_role}")
    
    # Super admin can do anything
    if current_admin.role == AdminRole.SUPER_ADMIN:
        logger.debug("Admin is super admin, allowing action")
        return

    # Check role hierarchy
    role_hierarchy = {
        AdminRole.SUPER_ADMIN: 4,
        AdminRole.CONTENT_ADMIN: 3,
        AdminRole.USER_ADMIN: 2,
        AdminRole.READONLY_ADMIN: 1,
    }

    if role_hierarchy[current_admin.role] < role_hierarchy[required_role]:
        logger.debug(f"Permission denied: {current_admin.role} < {required_role}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Admin role {current_admin.role} cannot perform {action} on {resource}",
        )
    
    logger.debug(f"Permission granted: {current_admin.role} >= {required_role}")


@router.post("/", response_model=schemas.AdminWithUser, status_code=status.HTTP_201_CREATED)
async def create_admin(
    *,
    db: AsyncSession = Depends(deps.get_db),
    admin_in: schemas.AdminCreate,
    current_admin: Admin = Depends(deps.get_current_admin),
) -> Any:
    """Create new admin user."""
    logger.debug(f"Creating admin user, current_admin={current_admin.id}, role={current_admin.role}")
    
    # Check permissions
    check_admin_permission(
        current_admin=current_admin,
        required_role=AdminRole.SUPER_ADMIN,
        action="create",
        resource="admin",
    )

    # Check if email already exists
    user = await crud.user.get_by_email(db, email=admin_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user first
    user_in = admin_in.to_user_create()
    user = await crud.user.create(db, obj_in=user_in)
    
    # Create admin with user_id
    admin_data = schemas.AdminCreateWithoutUser(
        role=admin_in.role,
        is_active=admin_in.is_active
    )
    admin = await crud.admin.create(
        db=db,
        obj_in=admin_data,
        actor_id=current_admin.id,
        user_id=user.id
    )
    
    # Create response using AdminWithUser schema
    response_data = schemas.AdminWithUser(
        id=admin.id,
        user_id=admin.user_id,
        role=admin.role,
        is_active=admin.is_active,
        last_login=admin.last_login,
        created_at=admin.created_at,
        updated_at=admin.updated_at,
        email=user.email,
        full_name=user.full_name
    )
    
    return response_data


@router.get("/me", response_model=schemas.AdminWithUser)
async def read_admin_me(
    current_admin: Admin = Depends(deps.get_current_admin),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """Get current admin user."""
    user = await crud.user.get(db, id=current_admin.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return schemas.AdminWithUser(
        id=current_admin.id,
        user_id=current_admin.user_id,
        role=current_admin.role,
        is_active=current_admin.is_active,
        last_login=current_admin.last_login,
        created_at=current_admin.created_at,
        updated_at=current_admin.updated_at,
        email=user.email,
        full_name=user.full_name
    )


@router.get("/{admin_id}", response_model=schemas.AdminWithUser)
async def read_admin(
    *,
    admin_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_admin: Admin = Depends(deps.get_current_admin),
) -> Any:
    """Get admin by ID."""
    # Check permissions
    check_admin_permission(
        current_admin=current_admin,
        required_role=AdminRole.USER_ADMIN,
        action="read",
        resource="admin",
    )
    
    # Get admin
    admin = await crud.admin.get(db, id=admin_id)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found",
        )
    
    # Get the associated user
    user = await crud.user.get(db, id=admin.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return schemas.AdminWithUser(
        id=admin.id,
        user_id=admin.user_id,
        role=admin.role,
        is_active=admin.is_active,
        last_login=admin.last_login,
        created_at=admin.created_at,
        updated_at=admin.updated_at,
        email=user.email,
        full_name=user.full_name
    )


@router.get("/audit-logs", response_model=PaginatedResponse)
async def list_audit_logs(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_admin: Admin = Depends(deps.get_current_admin),
    page: int = 1,
    page_size: int = 50,
    user_id: int | None = None,
    action: str | None = None,
    since: str | None = None,
    until: str | None = None,
) -> PaginatedResponse:
    """List audit logs (admin only)."""
    # Require at least READONLY_ADMIN
    check_admin_permission(
        current_admin=current_admin,
        required_role=AdminRole.READONLY_ADMIN,
        action="read",
        resource="audit_logs",
    )

    dt_since = datetime.fromisoformat(since) if since else None
    dt_until = datetime.fromisoformat(until) if until else None
    skip = (page - 1) * page_size
    items, total = await audit_crud.list(
        db,
        user_id=user_id,
        action=action,
        since=dt_since,
        until=dt_until,
        skip=skip,
        limit=page_size,
    )
    pages = (total + page_size - 1) // page_size if page_size else 1
    payload_items = [
        {
            "id": it.id,
            "user_id": it.user_id,
            "action": it.action,
            "resource": it.resource,
            "metadata": it.metadata,
            "created_at": it.created_at.isoformat(),
        }
        for it in items
    ]
    return PaginatedResponse(items=payload_items, total=total, page=page, page_size=page_size, pages=pages)


@router.get("/", response_model=List[schemas.AdminWithUser])
async def read_admins(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_admin: Admin = Depends(deps.get_current_admin),
) -> Any:
    """Retrieve admins."""
    # Check permissions
    check_admin_permission(
        current_admin=current_admin,
        required_role=AdminRole.USER_ADMIN,
        action="read",
        resource="admin",
    )

    admins = await crud.admin.get_multi_with_users(
        db=db,
        skip=skip,
        limit=limit,
    )
    
    # Format the response to include user information
    result = []
    for admin, user in admins:
        admin_data = {**admin.__dict__}
        admin_data["email"] = user.email
        admin_data["full_name"] = user.full_name
        result.append(admin_data)
    
    return result


@router.put("/{admin_id}", response_model=schemas.AdminWithUser)
async def update_admin(
    *,
    db: AsyncSession = Depends(deps.get_db),
    admin_id: int,
    admin_in: schemas.AdminUpdate,
    current_admin: Admin = Depends(deps.get_current_admin),
) -> Any:
    """Update admin user."""
    # Check permissions
    check_admin_permission(
        current_admin=current_admin,
        required_role=AdminRole.SUPER_ADMIN,
        action="update",
        resource="admin",
    )
    
    # Get admin
    admin = await crud.admin.get(db, id=admin_id)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found",
        )
    
    # Get the associated user
    user = await crud.user.get(db, id=admin.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Update user if needed
    if admin_in.email or admin_in.full_name or admin_in.password:
        user_update = {}
        if admin_in.email:
            user_update["email"] = admin_in.email
        if admin_in.full_name:
            user_update["full_name"] = admin_in.full_name
        if admin_in.password:
            user_update["password"] = admin_in.password
            user_update["password_confirm"] = admin_in.password
        
        user = await crud.user.update(
            db=db,
            db_obj=user,
            obj_in=user_update
        )
    
    # Update admin
    admin = await crud.admin.update(
        db=db,
        db_obj=admin,
        obj_in=admin_in,
        actor_id=current_admin.id
    )
    
    # Create response using AdminWithUser schema
    response_data = schemas.AdminWithUser(
        id=admin.id,
        user_id=admin.user_id,
        role=admin.role,
        is_active=admin.is_active,
        last_login=admin.last_login,
        created_at=admin.created_at,
        updated_at=admin.updated_at,
        email=user.email,
        full_name=user.full_name
    )
    
    return response_data


@router.delete("/{admin_id}", response_model=schemas.Admin)
async def delete_admin(
    *,
    db: AsyncSession = Depends(deps.get_db),
    admin_id: int,
    current_admin: Admin = Depends(deps.get_current_admin),
) -> Any:
    """Delete an admin."""
    admin = await crud.admin.get(db=db, id=admin_id)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found",
        )

    # Check permissions
    check_admin_permission(
        current_admin=current_admin,
        required_role=AdminRole.SUPER_ADMIN,
        action="delete",
        resource="admin",
    )

    # Cannot delete yourself
    if admin.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself",
        )

    # Only super admin can delete other super admins
    if admin.role == AdminRole.SUPER_ADMIN and current_admin.role != AdminRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can delete other super admins",
        )

    admin = await crud.admin.remove(
        db=db,
        id=admin_id,
        actor_id=current_admin.id,
    )
    return admin 