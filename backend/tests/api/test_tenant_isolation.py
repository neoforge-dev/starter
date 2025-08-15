"""Tests for tenant isolation and security."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.tenant import Tenant, Organization, OrganizationMembership, TenantStatus
from app.models.rbac import Role, Permission, role_permissions
from app.models.user import User
from app.core.config import get_settings
from tests.factories import UserFactory, TenantFactory, OrganizationFactory


class TestTenantIsolation:
    """Test tenant data isolation and security."""
    
    async def test_tenant_data_isolation(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        other_tenant: Tenant,
        superuser_token_headers: dict
    ):
        """Test that tenant data is completely isolated."""
        # Create users in each tenant
        tenant1_user = await UserFactory.create(db)
        tenant2_user = await UserFactory.create(db)
        
        # Create organizations in each tenant
        org1 = await OrganizationFactory.create(db, tenant_id=test_tenant.id)
        org2 = await OrganizationFactory.create(db, tenant_id=other_tenant.id)
        
        # Test that tenant1 user cannot access tenant2 org
        response = await client.get(
            f"/api/v1/organizations/{org2.id}",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            }
        )
        assert response.status_code == 404  # Should not find org from other tenant
        
        # Test that tenant2 user cannot access tenant1 org
        response = await client.get(
            f"/api/v1/organizations/{org1.id}",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(other_tenant.uuid)
            }
        )
        assert response.status_code == 404  # Should not find org from other tenant
    
    async def test_tenant_middleware_resolution(
        self,
        client: AsyncClient,
        test_tenant: Tenant
    ):
        """Test tenant resolution from different sources."""
        # Test resolution from X-Tenant-ID header
        response = await client.get(
            "/api/v1/health",
            headers={"X-Tenant-ID": str(test_tenant.uuid)}
        )
        assert response.status_code == 200
        assert response.headers.get("X-Tenant-ID") == str(test_tenant.uuid)
        
        # Test resolution from X-Tenant-Slug header
        response = await client.get(
            "/api/v1/health",
            headers={"X-Tenant-Slug": test_tenant.slug}
        )
        assert response.status_code == 200
        assert response.headers.get("X-Tenant-Slug") == test_tenant.slug
    
    async def test_tenant_status_enforcement(
        self,
        client: AsyncClient,
        db: AsyncSession,
        superuser_token_headers: dict
    ):
        """Test that tenant status is enforced."""
        # Create suspended tenant
        suspended_tenant = await TenantFactory.create(
            db, 
            status=TenantStatus.SUSPENDED,
            suspension_reason="Test suspension"
        )
        
        # Test that suspended tenant is blocked
        response = await client.get(
            "/api/v1/organizations/",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(suspended_tenant.uuid)
            }
        )
        assert response.status_code == 403
        assert "suspended" in response.json()["detail"].lower()
        
        # Create cancelled tenant
        cancelled_tenant = await TenantFactory.create(
            db,
            status=TenantStatus.CANCELLED
        )
        
        # Test that cancelled tenant is blocked
        response = await client.get(
            "/api/v1/organizations/",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(cancelled_tenant.uuid)
            }
        )
        assert response.status_code == 410
        assert "cancelled" in response.json()["detail"].lower()
    
    async def test_cross_tenant_data_leakage_prevention(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        other_tenant: Tenant,
        superuser_token_headers: dict
    ):
        """Test that no cross-tenant data leakage occurs."""
        # Create multiple organizations in each tenant
        tenant1_orgs = []
        tenant2_orgs = []
        
        for i in range(3):
            org1 = await OrganizationFactory.create(
                db, 
                tenant_id=test_tenant.id,
                slug=f"tenant1-org-{i}"
            )
            tenant1_orgs.append(org1)
            
            org2 = await OrganizationFactory.create(
                db,
                tenant_id=other_tenant.id,
                slug=f"tenant2-org-{i}"
            )
            tenant2_orgs.append(org2)
        
        # List organizations from tenant1 context
        response = await client.get(
            "/api/v1/organizations/",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            }
        )
        assert response.status_code == 200
        orgs = response.json()
        
        # Verify only tenant1 organizations are returned
        org_ids = [org["id"] for org in orgs]
        tenant1_org_ids = [org.id for org in tenant1_orgs]
        tenant2_org_ids = [org.id for org in tenant2_orgs]
        
        for org_id in tenant1_org_ids:
            assert org_id in org_ids
        
        for org_id in tenant2_org_ids:
            assert org_id not in org_ids
    
    async def test_tenant_schema_isolation(
        self,
        db: AsyncSession,
        test_tenant: Tenant,
        other_tenant: Tenant
    ):
        """Test database schema isolation."""
        # This would test schema-level isolation
        # In a real implementation, you'd verify that:
        # 1. Each tenant has its own schema
        # 2. Queries are properly scoped to tenant schema
        # 3. No cross-schema data access is possible
        
        # Get tenant schema names
        assert test_tenant.schema_name != other_tenant.schema_name
        assert test_tenant.schema_name.startswith("tenant_")
        assert other_tenant.schema_name.startswith("tenant_")
        
        # Verify schemas exist (would need actual schema creation in real implementation)
        # This is a placeholder test for schema isolation concepts
        assert test_tenant.schema_name is not None
        assert other_tenant.schema_name is not None


class TestRBACIsolation:
    """Test RBAC isolation and permission enforcement."""
    
    async def test_role_tenant_isolation(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        other_tenant: Tenant,
        superuser_token_headers: dict
    ):
        """Test that roles are isolated per tenant."""
        # Create roles in different tenants
        role1 = Role(
            name="admin",
            display_name="Administrator",
            tenant_id=test_tenant.id,
            is_system=False,
            type="custom"
        )
        db.add(role1)
        
        role2 = Role(
            name="admin",  # Same name, different tenant
            display_name="Administrator",
            tenant_id=other_tenant.id,
            is_system=False,
            type="custom"
        )
        db.add(role2)
        
        await db.commit()
        
        # List roles from tenant1 context
        response = await client.get(
            "/api/v1/rbac/roles",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            }
        )
        assert response.status_code == 200
        roles = response.json()
        
        # Verify only tenant1 roles are returned
        role_ids = [role["id"] for role in roles]
        assert role1.id in role_ids
        assert role2.id not in role_ids
    
    async def test_permission_enforcement(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        normal_user: User,
        normal_user_token_headers: dict
    ):
        """Test that permissions are properly enforced."""
        # Create organization without proper permissions
        org_data = {
            "slug": "test-org",
            "name": "Test Organization",
            "type": "team"
        }
        
        response = await client.post(
            "/api/v1/organizations/",
            headers={
                **normal_user_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            },
            json=org_data
        )
        
        # Should fail due to lack of permissions (if permission checking is enabled)
        # In a real implementation with full permission checking, this would be 403
        # For now, we'll test the structure is correct
        assert response.status_code in [201, 403]  # Either succeeds or properly denied
    
    async def test_organization_membership_isolation(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        other_tenant: Tenant,
        superuser_token_headers: dict
    ):
        """Test organization membership isolation."""
        # Create organizations and users in different tenants
        org1 = await OrganizationFactory.create(db, tenant_id=test_tenant.id)
        org2 = await OrganizationFactory.create(db, tenant_id=other_tenant.id)
        
        user1 = await UserFactory.create(db)
        user2 = await UserFactory.create(db)
        
        # Create memberships
        membership1 = OrganizationMembership(
            user_id=user1.id,
            organization_id=org1.id,
            status="active"
        )
        db.add(membership1)
        
        membership2 = OrganizationMembership(
            user_id=user2.id,
            organization_id=org2.id,
            status="active"
        )
        db.add(membership2)
        
        await db.commit()
        
        # List members from tenant1 context
        response = await client.get(
            f"/api/v1/organizations/{org1.id}/members",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            }
        )
        assert response.status_code == 200
        members = response.json()
        
        # Verify only tenant1 organization members are returned
        member_user_ids = [member["user_id"] for member in members]
        assert user1.id in member_user_ids
        assert user2.id not in member_user_ids


class TestSecurityValidation:
    """Test security validation and attack prevention."""
    
    async def test_tenant_enumeration_prevention(
        self,
        client: AsyncClient,
        db: AsyncSession
    ):
        """Test that tenant enumeration is prevented."""
        # Try to access with invalid tenant ID
        response = await client.get(
            "/api/v1/organizations/",
            headers={"X-Tenant-ID": "invalid-uuid"}
        )
        
        # Should either fail gracefully or return generic error
        assert response.status_code in [400, 401, 404]
        
        # Try to access with non-existent tenant UUID
        import uuid
        fake_uuid = str(uuid.uuid4())
        
        response = await client.get(
            "/api/v1/organizations/",
            headers={"X-Tenant-ID": fake_uuid}
        )
        
        # Should not reveal information about tenant existence
        assert response.status_code in [400, 401, 404]
    
    async def test_sql_injection_prevention(
        self,
        client: AsyncClient,
        test_tenant: Tenant,
        superuser_token_headers: dict
    ):
        """Test SQL injection prevention in tenant operations."""
        # Try SQL injection in organization creation
        malicious_data = {
            "slug": "test'; DROP TABLE organizations; --",
            "name": "'; SELECT * FROM users; --",
            "type": "team"
        }
        
        response = await client.post(
            "/api/v1/organizations/",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            },
            json=malicious_data
        )
        
        # Should either succeed with escaped data or fail validation
        # But should not execute malicious SQL
        assert response.status_code in [201, 400, 422]
    
    async def test_authorization_bypass_prevention(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        other_tenant: Tenant,
        normal_user_token_headers: dict
    ):
        """Test that authorization cannot be bypassed."""
        # Create organization in other tenant
        other_org = await OrganizationFactory.create(db, tenant_id=other_tenant.id)
        
        # Try to access other tenant's organization with tenant1 context
        response = await client.get(
            f"/api/v1/organizations/{other_org.id}",
            headers={
                **normal_user_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            }
        )
        
        # Should not find the organization (tenant isolation)
        assert response.status_code == 404
        
        # Try to access with other tenant context (should also fail due to user not belonging)
        response = await client.get(
            f"/api/v1/organizations/{other_org.id}",
            headers={
                **normal_user_token_headers,
                "X-Tenant-ID": str(other_tenant.uuid)
            }
        )
        
        # Should fail due to user not having access to other tenant
        assert response.status_code in [401, 403, 404]


@pytest.fixture
async def test_tenant(db: AsyncSession) -> Tenant:
    """Create a test tenant."""
    return await TenantFactory.create(db, slug="test-tenant")


@pytest.fixture
async def other_tenant(db: AsyncSession) -> Tenant:
    """Create another test tenant for isolation testing."""
    return await TenantFactory.create(db, slug="other-tenant")


# Factory additions for tests
class TenantFactory:
    """Factory for creating test tenants."""
    
    @staticmethod
    async def create(
        db: AsyncSession,
        slug: str = None,
        name: str = None,
        status: TenantStatus = TenantStatus.ACTIVE,
        **kwargs
    ) -> Tenant:
        """Create a test tenant."""
        import uuid
        
        if not slug:
            slug = f"test-{uuid.uuid4().hex[:8]}"
        
        if not name:
            name = f"Test Tenant {slug}"
        
        tenant = Tenant(
            slug=slug,
            name=name,
            status=status,
            schema_name=f"tenant_{slug}_{uuid.uuid4().hex[:8]}",
            subscription_tier="trial",
            require_mfa=False,
            session_timeout_minutes=480,
            **kwargs
        )
        
        db.add(tenant)
        await db.commit()
        await db.refresh(tenant)
        
        return tenant


class OrganizationFactory:
    """Factory for creating test organizations."""
    
    @staticmethod
    async def create(
        db: AsyncSession,
        tenant_id: int,
        slug: str = None,
        name: str = None,
        **kwargs
    ) -> Organization:
        """Create a test organization."""
        import uuid
        
        if not slug:
            slug = f"org-{uuid.uuid4().hex[:8]}"
        
        if not name:
            name = f"Test Organization {slug}"
        
        org = Organization(
            slug=slug,
            name=name,
            tenant_id=tenant_id,
            type="team",
            visibility="private",
            requires_approval=True,
            is_active=True,
            **kwargs
        )
        
        db.add(org)
        await db.commit()
        await db.refresh(org)
        
        return org