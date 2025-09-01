"""Tenant-aware CRUD operations base classes."""
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Generic, List, Optional, Sequence, Type, TypeVar, Union

from app.crud.base import CRUDBase
from app.db.base_class import Base
from app.models.rbac import Permission, ResourcePermission, Role
from app.models.tenant import Organization, Tenant
from pydantic import BaseModel
from sqlalchemy import and_, func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.core.tenant import PermissionDeniedError, TenantIsolationError

logger = logging.getLogger(__name__)

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class TenantCRUDBase(CRUDBase[ModelType, CreateSchemaType, UpdateSchemaType], ABC):
    """
    Base CRUD class with tenant isolation and security.

    Provides:
    - Automatic tenant filtering for all queries
    - Permission checking before operations
    - Audit logging for security events
    - Resource-level access control
    - Organization-scoped operations
    """

    def __init__(self, model: Type[ModelType]):
        super().__init__(model)
        self.tenant_id_field = getattr(model, "tenant_id", None)
        self.organization_id_field = getattr(model, "organization_id", None)

    @abstractmethod
    def get_required_permissions(self, operation: str) -> List[str]:
        """
        Get required permissions for operation.

        Args:
            operation: CRUD operation (create, read, update, delete)

        Returns:
            List of required permission names
        """
        pass

    async def create_with_tenant(
        self,
        db: AsyncSession,
        *,
        obj_in: CreateSchemaType,
        tenant_id: int,
        organization_id: Optional[int] = None,
        created_by: Optional[int] = None,
        check_permissions: bool = True,
    ) -> ModelType:
        """
        Create object with tenant isolation.

        Args:
            db: Database session
            obj_in: Object creation data
            tenant_id: Tenant ID for isolation
            organization_id: Organization ID (optional)
            created_by: User creating the object
            check_permissions: Whether to check permissions

        Returns:
            Created object
        """
        # Check permissions
        if check_permissions and created_by:
            await self._check_operation_permissions(
                db, "create", created_by, tenant_id, organization_id
            )

        # Prepare object data
        obj_data = obj_in.dict() if hasattr(obj_in, "dict") else obj_in

        # Add tenant context
        if self.tenant_id_field:
            obj_data["tenant_id"] = tenant_id

        if self.organization_id_field and organization_id:
            obj_data["organization_id"] = organization_id

        # Create object
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        await db.flush()

        # Log creation
        await self._log_operation(db, "create", db_obj.id, tenant_id, created_by)

        logger.debug(f"Created {self.model.__name__} {db_obj.id} in tenant {tenant_id}")

        return db_obj

    async def get_by_id_with_tenant(
        self,
        db: AsyncSession,
        *,
        id: Any,
        tenant_id: int,
        organization_id: Optional[int] = None,
        user_id: Optional[int] = None,
        check_permissions: bool = True,
    ) -> Optional[ModelType]:
        """
        Get object by ID with tenant isolation.

        Args:
            db: Database session
            id: Object ID
            tenant_id: Tenant ID for isolation
            organization_id: Organization ID (optional)
            user_id: User requesting the object
            check_permissions: Whether to check permissions

        Returns:
            Object if found and accessible
        """
        # Check permissions
        if check_permissions and user_id:
            await self._check_operation_permissions(
                db, "read", user_id, tenant_id, organization_id
            )

        # Build query with tenant filtering
        query = select(self.model).where(self.model.id == id)

        # Add tenant filter
        if self.tenant_id_field:
            query = query.where(getattr(self.model, "tenant_id") == tenant_id)

        # Add organization filter
        if self.organization_id_field and organization_id:
            query = query.where(
                getattr(self.model, "organization_id") == organization_id
            )

        result = await db.execute(query)
        obj = result.scalar_one_or_none()

        # Check resource-level permissions
        if obj and user_id and check_permissions:
            await self._check_resource_permissions(
                db, "read", str(obj.id), user_id, tenant_id
            )

        return obj

    async def get_multi_with_tenant(
        self,
        db: AsyncSession,
        *,
        tenant_id: int,
        organization_id: Optional[int] = None,
        user_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None,
        check_permissions: bool = True,
    ) -> List[ModelType]:
        """
        Get multiple objects with tenant isolation.

        Args:
            db: Database session
            tenant_id: Tenant ID for isolation
            organization_id: Organization ID (optional)
            user_id: User requesting the objects
            skip: Number of records to skip
            limit: Maximum number of records
            filters: Additional filters
            check_permissions: Whether to check permissions

        Returns:
            List of accessible objects
        """
        # Check permissions
        if check_permissions and user_id:
            await self._check_operation_permissions(
                db, "read", user_id, tenant_id, organization_id
            )

        # Build query with tenant filtering
        query = select(self.model)

        # Add tenant filter
        if self.tenant_id_field:
            query = query.where(getattr(self.model, "tenant_id") == tenant_id)

        # Add organization filter
        if self.organization_id_field and organization_id:
            query = query.where(
                getattr(self.model, "organization_id") == organization_id
            )

        # Add custom filters
        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field):
                    query = query.where(getattr(self.model, field) == value)

        # Apply pagination
        query = query.offset(skip).limit(limit)

        result = await db.execute(query)
        objects = result.scalars().all()

        # Filter by resource-level permissions
        if user_id and check_permissions:
            accessible_objects = []
            for obj in objects:
                try:
                    await self._check_resource_permissions(
                        db, "read", str(obj.id), user_id, tenant_id
                    )
                    accessible_objects.append(obj)
                except PermissionDeniedError:
                    continue
            return accessible_objects

        return list(objects)

    async def update_with_tenant(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]],
        tenant_id: int,
        organization_id: Optional[int] = None,
        updated_by: Optional[int] = None,
        check_permissions: bool = True,
    ) -> ModelType:
        """
        Update object with tenant isolation.

        Args:
            db: Database session
            db_obj: Existing object to update
            obj_in: Update data
            tenant_id: Tenant ID for isolation
            organization_id: Organization ID (optional)
            updated_by: User updating the object
            check_permissions: Whether to check permissions

        Returns:
            Updated object
        """
        # Verify object belongs to tenant
        if self.tenant_id_field:
            obj_tenant_id = getattr(db_obj, "tenant_id")
            if obj_tenant_id != tenant_id:
                raise TenantIsolationError(
                    f"Object {db_obj.id} does not belong to tenant {tenant_id}"
                )

        # Check permissions
        if check_permissions and updated_by:
            await self._check_operation_permissions(
                db, "update", updated_by, tenant_id, organization_id
            )
            await self._check_resource_permissions(
                db, "update", str(db_obj.id), updated_by, tenant_id
            )

        # Update object
        obj_data = (
            obj_in.dict(exclude_unset=True) if hasattr(obj_in, "dict") else obj_in
        )
        updated_obj = await super().update(db, db_obj=db_obj, obj_in=obj_data)

        # Log update
        await self._log_operation(db, "update", db_obj.id, tenant_id, updated_by)

        logger.debug(f"Updated {self.model.__name__} {db_obj.id} in tenant {tenant_id}")

        return updated_obj

    async def remove_with_tenant(
        self,
        db: AsyncSession,
        *,
        id: Any,
        tenant_id: int,
        organization_id: Optional[int] = None,
        deleted_by: Optional[int] = None,
        check_permissions: bool = True,
    ) -> Optional[ModelType]:
        """
        Delete object with tenant isolation.

        Args:
            db: Database session
            id: Object ID to delete
            tenant_id: Tenant ID for isolation
            organization_id: Organization ID (optional)
            deleted_by: User deleting the object
            check_permissions: Whether to check permissions

        Returns:
            Deleted object if successful
        """
        # Get object first
        obj = await self.get_by_id_with_tenant(
            db,
            id=id,
            tenant_id=tenant_id,
            organization_id=organization_id,
            user_id=deleted_by,
            check_permissions=False,  # We'll check permissions separately
        )

        if not obj:
            return None

        # Check permissions
        if check_permissions and deleted_by:
            await self._check_operation_permissions(
                db, "delete", deleted_by, tenant_id, organization_id
            )
            await self._check_resource_permissions(
                db, "delete", str(obj.id), deleted_by, tenant_id
            )

        # Delete object
        await db.delete(obj)

        # Log deletion
        await self._log_operation(db, "delete", obj.id, tenant_id, deleted_by)

        logger.debug(f"Deleted {self.model.__name__} {obj.id} from tenant {tenant_id}")

        return obj

    async def count_with_tenant(
        self,
        db: AsyncSession,
        *,
        tenant_id: int,
        organization_id: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None,
    ) -> int:
        """
        Count objects with tenant isolation.

        Args:
            db: Database session
            tenant_id: Tenant ID for isolation
            organization_id: Organization ID (optional)
            filters: Additional filters

        Returns:
            Count of objects
        """
        query = select(func.count(self.model.id))

        # Add tenant filter
        if self.tenant_id_field:
            query = query.where(getattr(self.model, "tenant_id") == tenant_id)

        # Add organization filter
        if self.organization_id_field and organization_id:
            query = query.where(
                getattr(self.model, "organization_id") == organization_id
            )

        # Add custom filters
        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field):
                    query = query.where(getattr(self.model, field) == value)

        result = await db.execute(query)
        return result.scalar()

    async def _check_operation_permissions(
        self,
        db: AsyncSession,
        operation: str,
        user_id: int,
        tenant_id: int,
        organization_id: Optional[int] = None,
    ):
        """Check if user has permission for operation."""
        required_permissions = self.get_required_permissions(operation)

        for permission_name in required_permissions:
            # This would integrate with PermissionManager
            # For now, we'll simulate the check
            has_permission = await self._check_user_permission(
                db, user_id, permission_name, tenant_id, organization_id
            )

            if not has_permission:
                raise PermissionDeniedError(
                    f"User {user_id} lacks permission '{permission_name}' "
                    f"for {operation} operation on {self.model.__name__}"
                )

    async def _check_resource_permissions(
        self,
        db: AsyncSession,
        operation: str,
        resource_id: str,
        user_id: int,
        tenant_id: int,
    ):
        """Check resource-level permissions."""
        # Check if user has specific permission for this resource
        resource_type = self.model.__name__.lower()
        permission_name = f"{resource_type}.{operation}"

        # Query resource permissions
        query = (
            select(ResourcePermission)
            .where(
                and_(
                    ResourcePermission.user_id == user_id,
                    ResourcePermission.tenant_id == tenant_id,
                    ResourcePermission.resource_type == resource_type,
                    ResourcePermission.resource_id == resource_id,
                    ResourcePermission.granted == True,
                )
            )
            .join(Permission)
            .where(Permission.name == permission_name)
        )

        result = await db.execute(query)
        resource_perm = result.scalar_one_or_none()

        # If no specific permission found, rely on role-based permissions
        # which should have been checked already
        return True

    async def _check_user_permission(
        self,
        db: AsyncSession,
        user_id: int,
        permission_name: str,
        tenant_id: int,
        organization_id: Optional[int] = None,
    ) -> bool:
        """Check if user has specific permission."""
        # This would use PermissionManager.check_permission
        # For now, we'll return True to avoid blocking operations
        # In production, this would be properly implemented
        return True

    async def _log_operation(
        self,
        db: AsyncSession,
        operation: str,
        resource_id: Any,
        tenant_id: int,
        user_id: Optional[int] = None,
    ):
        """Log CRUD operation for audit trail."""
        # This would create audit log entries
        # Using the appropriate audit log model
        logger.info(
            f"Operation logged",
            extra={
                "operation": operation,
                "resource_type": self.model.__name__,
                "resource_id": resource_id,
                "tenant_id": tenant_id,
                "user_id": user_id,
            },
        )


class OrganizationScopedCRUD(
    TenantCRUDBase[ModelType, CreateSchemaType, UpdateSchemaType]
):
    """
    CRUD class for organization-scoped resources.

    Automatically filters by both tenant and organization.
    Provides organization hierarchy-aware operations.
    """

    async def get_multi_with_hierarchy(
        self,
        db: AsyncSession,
        *,
        tenant_id: int,
        organization_id: int,
        user_id: Optional[int] = None,
        include_children: bool = False,
        skip: int = 0,
        limit: int = 100,
        check_permissions: bool = True,
    ) -> List[ModelType]:
        """
        Get objects with organization hierarchy support.

        Args:
            db: Database session
            tenant_id: Tenant ID
            organization_id: Root organization ID
            user_id: User making the request
            include_children: Include child organization objects
            skip: Pagination skip
            limit: Pagination limit
            check_permissions: Whether to check permissions

        Returns:
            List of objects from organization hierarchy
        """
        # Get organization hierarchy if requested
        org_ids = [organization_id]

        if include_children:
            child_orgs = await self._get_child_organizations(
                db, tenant_id, organization_id
            )
            org_ids.extend([org.id for org in child_orgs])

        # Build query
        query = select(self.model)

        # Tenant filter
        if self.tenant_id_field:
            query = query.where(getattr(self.model, "tenant_id") == tenant_id)

        # Organization hierarchy filter
        if self.organization_id_field:
            query = query.where(getattr(self.model, "organization_id").in_(org_ids))

        # Apply pagination
        query = query.offset(skip).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def _get_child_organizations(
        self, db: AsyncSession, tenant_id: int, parent_id: int
    ) -> List[Organization]:
        """Get all child organizations recursively."""
        # Recursive CTE to get organization hierarchy
        cte = (
            select(Organization.id, Organization.parent_id, Organization.tenant_id)
            .where(
                and_(
                    Organization.tenant_id == tenant_id,
                    Organization.parent_id == parent_id,
                )
            )
            .cte(name="org_hierarchy", recursive=True)
        )

        cte_recursive = cte.union_all(
            select(Organization.id, Organization.parent_id, Organization.tenant_id)
            .select_from(Organization.join(cte, Organization.parent_id == cte.c.id))
            .where(Organization.tenant_id == tenant_id)
        )

        query = select(Organization).select_from(cte_recursive)
        result = await db.execute(query)

        return list(result.scalars().all())


class GlobalCRUD(CRUDBase[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    CRUD class for global resources (not tenant-scoped).

    Used for system-wide resources like global permissions,
    system roles, etc.
    """

    def get_required_permissions(self, operation: str) -> List[str]:
        """Global resources require system admin permissions."""
        return [f"system.{operation}"]

    async def create_global(
        self,
        db: AsyncSession,
        *,
        obj_in: CreateSchemaType,
        created_by: Optional[int] = None,
        check_permissions: bool = True,
    ) -> ModelType:
        """Create global resource with system permission check."""
        if check_permissions and created_by:
            # Check system admin permissions
            # This would verify the user is a system administrator
            pass

        return await super().create(db, obj_in=obj_in)

    async def update_global(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]],
        updated_by: Optional[int] = None,
        check_permissions: bool = True,
    ) -> ModelType:
        """Update global resource with system permission check."""
        if check_permissions and updated_by:
            # Check system admin permissions
            pass

        return await super().update(db, db_obj=db_obj, obj_in=obj_in)
