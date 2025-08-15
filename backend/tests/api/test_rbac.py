"""Tests for RBAC API endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.tenant import Tenant, Organization
from app.models.rbac import Role, Permission, ResourcePermission, PermissionScope, PermissionAction, RoleType
from app.models.user import User
from tests.factories import UserFactory


class TestRoleAPI:
    """Test role management API endpoints."""
    
    async def test_create_role(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        superuser_token_headers: dict
    ):
        """Test creating a new role."""
        role_data = {
            "name": "project_manager",
            "display_name": "Project Manager",
            "description": "Manages projects and teams",
            "type": "custom",
            "priority": 50,
            "tenant_id": test_tenant.id
        }
        
        response = await client.post(
            "/api/v1/rbac/roles",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            },
            json=role_data
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["name"] == role_data["name"]
        assert data["display_name"] == role_data["display_name"]
        assert data["description"] == role_data["description"]
        assert data["type"] == role_data["type"]
        assert data["tenant_id"] == test_tenant.id
        assert data["is_active"] is True
        
        # Verify role was created in database
        role = await db.get(Role, data["id"])
        assert role is not None
        assert role.tenant_id == test_tenant.id
    
    async def test_create_role_duplicate_name(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        test_role: Role,
        superuser_token_headers: dict
    ):
        """Test creating role with duplicate name fails."""
        role_data = {
            "name": test_role.name,  # Duplicate name
            "display_name": "Another Role",
            "type": "custom",
            "tenant_id": test_tenant.id
        }
        
        response = await client.post(
            "/api/v1/rbac/roles",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            },
            json=role_data
        )
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    async def test_get_role(
        self,
        client: AsyncClient,
        test_tenant: Tenant,
        test_role: Role,
        superuser_token_headers: dict
    ):
        """Test getting role by ID."""
        response = await client.get(
            f"/api/v1/rbac/roles/{test_role.id}",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == test_role.id
        assert data["name"] == test_role.name
        assert data["display_name"] == test_role.display_name
        assert data["tenant_id"] == test_tenant.id
    
    async def test_list_roles(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        superuser_token_headers: dict
    ):
        """Test listing roles with filtering."""
        # Create multiple roles
        roles = []
        for i in range(3):
            role = Role(
                name=f"role_{i}",
                display_name=f"Role {i}",
                tenant_id=test_tenant.id,
                type=RoleType.CUSTOM,
                is_system=False,
                is_active=True,
                priority=10 + i
            )
            db.add(role)
            roles.append(role)
        
        await db.commit()
        
        # Test listing with pagination
        response = await client.get(
            "/api/v1/rbac/roles?skip=0&limit=2",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) <= 2  # Respects limit
        
        # Verify all returned roles belong to correct tenant
        for role_data in data:
            assert role_data["tenant_id"] == test_tenant.id
    
    async def test_update_role(
        self,
        client: AsyncClient,
        test_tenant: Tenant,
        test_role: Role,
        superuser_token_headers: dict
    ):
        """Test updating role."""
        update_data = {
            "display_name": "Updated Role Name",
            "description": "Updated description",
            "priority": 75
        }
        
        response = await client.put(
            f"/api/v1/rbac/roles/{test_role.id}",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            },
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["display_name"] == update_data["display_name"]
        assert data["description"] == update_data["description"]
        assert data["priority"] == update_data["priority"]
        assert data["id"] == test_role.id
    
    async def test_delete_role(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        superuser_token_headers: dict
    ):
        """Test deleting role."""
        # Create role to delete
        role = Role(
            name="to_delete",
            display_name="Role to Delete",
            tenant_id=test_tenant.id,
            type=RoleType.CUSTOM,
            is_system=False,
            is_active=True,
            priority=10
        )
        db.add(role)
        await db.commit()
        
        response = await client.delete(
            f"/api/v1/rbac/roles/{role.id}",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            }
        )
        
        assert response.status_code == 200
        
        # Verify role was deleted
        deleted_role = await db.get(Role, role.id)
        assert deleted_role is None
    
    async def test_delete_system_role_forbidden(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        superuser_token_headers: dict
    ):
        """Test that system roles cannot be deleted."""
        # Create system role
        system_role = Role(
            name="system_admin",
            display_name="System Administrator",
            tenant_id=test_tenant.id,
            type=RoleType.SYSTEM,
            is_system=True,
            is_active=True,
            priority=100
        )
        db.add(system_role)
        await db.commit()
        
        response = await client.delete(
            f"/api/v1/rbac/roles/{system_role.id}",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            }
        )
        
        assert response.status_code == 403
        assert "system roles" in response.json()["detail"]


class TestRoleAssignment:
    """Test role assignment functionality."""
    
    async def test_assign_role_to_user(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        test_role: Role,
        normal_user: User,
        superuser_token_headers: dict
    ):
        """Test assigning role to user."""
        assignment_data = {
            "user_id": normal_user.id,
            "tenant_id": test_tenant.id
        }
        
        response = await client.post(
            f"/api/v1/rbac/roles/{test_role.id}/assignments",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            },
            json=assignment_data
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["user_id"] == normal_user.id
        assert data["role_id"] == test_role.id
        assert data["tenant_id"] == test_tenant.id
    
    async def test_assign_role_duplicate_assignment(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        test_role: Role,
        normal_user: User,
        superuser_token_headers: dict
    ):
        """Test that duplicate role assignment fails."""
        # First assignment
        assignment_data = {
            "user_id": normal_user.id,
            "tenant_id": test_tenant.id
        }
        
        response1 = await client.post(
            f"/api/v1/rbac/roles/{test_role.id}/assignments",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            },
            json=assignment_data
        )
        assert response1.status_code == 201
        
        # Second assignment (should fail)
        response2 = await client.post(
            f"/api/v1/rbac/roles/{test_role.id}/assignments",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            },
            json=assignment_data
        )
        assert response2.status_code == 400
        assert "already assigned" in response2.json()["detail"]


class TestPermissionAPI:
    """Test permission management API endpoints."""
    
    async def test_list_permissions(
        self,
        client: AsyncClient,
        db: AsyncSession,
        superuser_token_headers: dict
    ):
        """Test listing permissions."""
        # Create test permissions
        permissions = []
        for i in range(3):
            permission = Permission(
                name=f"test.action_{i}",
                display_name=f"Test Action {i}",
                description=f"Test permission {i}",
                resource_type="test",
                action=PermissionAction.READ,
                scope=PermissionScope.ORGANIZATION,
                is_system=False,
                is_active=True
            )
            db.add(permission)
            permissions.append(permission)
        
        await db.commit()
        
        response = await client.get(
            "/api/v1/rbac/permissions",
            headers=superuser_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should include created permissions
        permission_names = [perm["name"] for perm in data]
        for permission in permissions:
            assert permission.name in permission_names
    
    async def test_filter_permissions_by_resource_type(
        self,
        client: AsyncClient,
        db: AsyncSession,
        superuser_token_headers: dict
    ):
        """Test filtering permissions by resource type."""
        # Create permissions for different resource types
        user_permission = Permission(
            name="users.read",
            display_name="Read Users",
            resource_type="users",
            action=PermissionAction.READ,
            scope=PermissionScope.ORGANIZATION,
            is_system=False,
            is_active=True
        )
        db.add(user_permission)
        
        project_permission = Permission(
            name="projects.read",
            display_name="Read Projects",
            resource_type="projects",
            action=PermissionAction.READ,
            scope=PermissionScope.ORGANIZATION,
            is_system=False,
            is_active=True
        )
        db.add(project_permission)
        
        await db.commit()
        
        # Filter by resource type
        response = await client.get(
            "/api/v1/rbac/permissions?resource_type=users",
            headers=superuser_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only return user permissions
        for perm in data:
            assert perm["resource_type"] == "users"
    
    async def test_search_permissions(
        self,
        client: AsyncClient,
        db: AsyncSession,
        superuser_token_headers: dict
    ):
        """Test searching permissions by name/description."""
        # Create searchable permission
        permission = Permission(
            name="special.search.permission",
            display_name="Special Search Permission",
            description="A very special permission for testing search",
            resource_type="test",
            action=PermissionAction.READ,
            scope=PermissionScope.ORGANIZATION,
            is_system=False,
            is_active=True
        )
        db.add(permission)
        await db.commit()
        
        # Search by keyword
        response = await client.get(
            "/api/v1/rbac/permissions?search=special",
            headers=superuser_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should find the special permission
        permission_names = [perm["name"] for perm in data]
        assert permission.name in permission_names


class TestResourcePermissions:
    """Test resource-level permission management."""
    
    async def test_grant_resource_permission(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        test_organization: Organization,
        normal_user: User,
        superuser_token_headers: dict
    ):
        """Test granting resource-specific permission."""
        # Create a permission first
        permission = Permission(
            name="organizations.admin",
            display_name="Organization Admin",
            resource_type="organizations",
            action=PermissionAction.ADMIN,
            scope=PermissionScope.RESOURCE,
            is_system=False,
            is_active=True
        )
        db.add(permission)
        await db.commit()
        
        # Grant permission on specific organization
        grant_data = {
            "user_id": normal_user.id,
            "permission_name": "organizations.admin",
            "resource_type": "organizations",
            "resource_id": str(test_organization.id),
            "granted": True,
            "notes": "Test resource permission grant"
        }
        
        response = await client.post(
            "/api/v1/rbac/resource-permissions",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            },
            json=grant_data
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["user_id"] == normal_user.id
        assert data["resource_type"] == "organizations"
        assert data["resource_id"] == str(test_organization.id)
        assert data["granted"] is True
        assert data["tenant_id"] == test_tenant.id
        
        # Verify permission was created in database
        resource_perm = await db.execute(
            select(ResourcePermission).where(
                ResourcePermission.user_id == normal_user.id,
                ResourcePermission.resource_type == "organizations",
                ResourcePermission.resource_id == str(test_organization.id)
            )
        )
        resource_perm = resource_perm.scalar_one_or_none()
        assert resource_perm is not None
        assert resource_perm.granted is True


class TestPermissionEnforcement:
    """Test permission enforcement and security."""
    
    async def test_tenant_permission_isolation(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        other_tenant: Tenant,
        superuser_token_headers: dict
    ):
        """Test that permissions are isolated per tenant."""
        # Create role in test_tenant
        role = Role(
            name="test_role",
            display_name="Test Role",
            tenant_id=test_tenant.id,
            type=RoleType.CUSTOM,
            is_system=False,
            is_active=True,
            priority=10
        )
        db.add(role)
        await db.commit()
        
        # Try to access role from other tenant context
        response = await client.get(
            f"/api/v1/rbac/roles/{role.id}",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(other_tenant.uuid)
            }
        )
        
        assert response.status_code == 404  # Should not find role from other tenant
    
    async def test_role_hierarchy_inheritance(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        superuser_token_headers: dict
    ):
        """Test role hierarchy and permission inheritance."""
        # Create parent role
        parent_role = Role(
            name="parent_role",
            display_name="Parent Role",
            tenant_id=test_tenant.id,
            type=RoleType.CUSTOM,
            is_system=False,
            is_active=True,
            priority=50
        )
        db.add(parent_role)
        await db.flush()
        
        # Create child role
        child_role_data = {
            "name": "child_role",
            "display_name": "Child Role",
            "type": "inherited",
            "parent_role_id": parent_role.id,
            "tenant_id": test_tenant.id
        }
        
        response = await client.post(
            "/api/v1/rbac/roles",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            },
            json=child_role_data
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["parent_role_id"] == parent_role.id
        assert data["type"] == "inherited"


@pytest.fixture
async def test_role(
    db: AsyncSession,
    test_tenant: Tenant
) -> Role:
    """Create a test role."""
    role = Role(
        name="test_role",
        display_name="Test Role",
        description="A test role",
        tenant_id=test_tenant.id,
        type=RoleType.CUSTOM,
        is_system=False,
        is_active=True,
        priority=10
    )
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role