"""Admin API endpoints."""
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api import deps
from app.core.security import get_password_hash
from app.models.admin import Admin, AdminRole
from app.schemas import admin as schemas

router = APIRouter()


def check_admin_permission(
    current_admin: Admin,
    required_role: AdminRole,
    action: str,
    resource: str,
) -> None:
    """Check if admin has required permissions."""
    # Super admin can do anything
    if current_admin.role == AdminRole.SUPER_ADMIN:
        return

    # Check role hierarchy
    role_hierarchy = {
        AdminRole.SUPER_ADMIN: 4,
        AdminRole.CONTENT_ADMIN: 3,
        AdminRole.USER_ADMIN: 2,
        AdminRole.READONLY_ADMIN: 1,
    }

    if role_hierarchy[current_admin.role] < role_hierarchy[required_role]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Admin role {current_admin.role} cannot perform {action} on {resource}",
        )


@router.post("/", response_model=schemas.Admin)
async def create_admin(
    *,
    db: AsyncSession = Depends(deps.get_db),
    admin_in: schemas.AdminCreate,
    current_admin: Admin = Depends(deps.get_current_admin),
) -> Any:
    """Create new admin user."""
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

    admin = await crud.admin.create(
        db=db,
        obj_in=admin_in,
        actor_id=current_admin.id,
    )
    return admin


@router.get("/me", response_model=schemas.Admin)
async def read_admin_me(
    current_admin: Admin = Depends(deps.get_current_admin),
) -> Any:
    """Get current admin user."""
    return current_admin


@router.get("/{admin_id}", response_model=schemas.Admin)
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

    admin = await crud.admin.get(db=db, id=admin_id)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found",
        )
    return admin


@router.get("/", response_model=List[schemas.Admin])
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
    return admins


@router.put("/{admin_id}", response_model=schemas.Admin)
async def update_admin(
    *,
    db: AsyncSession = Depends(deps.get_db),
    admin_id: int,
    admin_in: schemas.AdminUpdate,
    current_admin: Admin = Depends(deps.get_current_admin),
) -> Any:
    """Update an admin."""
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
        action="update",
        resource="admin",
    )

    # Only super admin can modify other super admins
    if admin.role == AdminRole.SUPER_ADMIN and current_admin.role != AdminRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can modify other super admins",
        )

    admin = await crud.admin.update(
        db=db,
        db_obj=admin,
        obj_in=admin_in,
        actor_id=current_admin.id,
    )
    return admin


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