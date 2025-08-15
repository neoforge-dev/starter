"""Tests for organization management API endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.tenant import Tenant, Organization, OrganizationMembership, MembershipStatus
from app.models.user import User
from tests.factories import UserFactory


class TestOrganizationAPI:
    """Test organization CRUD operations."""
    
    async def test_create_organization(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        superuser_token_headers: dict
    ):
        """Test creating a new organization."""
        org_data = {
            "slug": "engineering",
            "name": "Engineering Team",
            "description": "Software engineering organization",
            "type": "team",
            "visibility": "private",
            "requires_approval": True
        }
        
        response = await client.post(
            "/api/v1/organizations/",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            },
            json=org_data
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["slug"] == org_data["slug"]
        assert data["name"] == org_data["name"]
        assert data["description"] == org_data["description"]
        assert data["type"] == org_data["type"]
        assert data["tenant_id"] == test_tenant.id
        assert data["is_active"] is True
        
        # Verify organization was created in database
        org = await db.get(Organization, data["id"])
        assert org is not None
        assert org.tenant_id == test_tenant.id
    
    async def test_create_organization_duplicate_slug(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        test_organization: Organization,
        superuser_token_headers: dict
    ):
        """Test creating organization with duplicate slug fails."""
        org_data = {
            "slug": test_organization.slug,  # Duplicate slug
            "name": "Another Organization",
            "type": "team"
        }
        
        response = await client.post(
            "/api/v1/organizations/",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            },
            json=org_data
        )
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    async def test_get_organization(
        self,
        client: AsyncClient,
        test_tenant: Tenant,
        test_organization: Organization,
        superuser_token_headers: dict
    ):
        """Test getting organization by ID."""
        response = await client.get(
            f"/api/v1/organizations/{test_organization.id}",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == test_organization.id
        assert data["slug"] == test_organization.slug
        assert data["name"] == test_organization.name
        assert data["tenant_id"] == test_tenant.id
    
    async def test_get_organization_not_found(
        self,
        client: AsyncClient,
        test_tenant: Tenant,
        superuser_token_headers: dict
    ):
        """Test getting non-existent organization returns 404."""
        response = await client.get(
            "/api/v1/organizations/999999",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            }
        )
        
        assert response.status_code == 404
    
    async def test_list_organizations(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        superuser_token_headers: dict
    ):
        """Test listing organizations with pagination."""
        # Create multiple organizations
        orgs = []
        for i in range(5):
            org = Organization(
                slug=f"org-{i}",
                name=f"Organization {i}",
                tenant_id=test_tenant.id,
                type="team",
                visibility="private",
                requires_approval=True,
                is_active=True
            )
            db.add(org)
            orgs.append(org)
        
        await db.commit()
        
        # Test listing with pagination
        response = await client.get(
            "/api/v1/organizations/?skip=0&limit=3",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) <= 3  # Respects limit
        
        # Verify all returned orgs belong to correct tenant
        for org_data in data:
            assert org_data["tenant_id"] == test_tenant.id
    
    async def test_update_organization(
        self,
        client: AsyncClient,
        test_tenant: Tenant,
        test_organization: Organization,
        superuser_token_headers: dict
    ):
        """Test updating organization."""
        update_data = {
            "name": "Updated Organization Name",
            "description": "Updated description",
            "visibility": "internal"
        }
        
        response = await client.put(
            f"/api/v1/organizations/{test_organization.id}",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            },
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]
        assert data["visibility"] == update_data["visibility"]
        assert data["id"] == test_organization.id
    
    async def test_delete_organization(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        superuser_token_headers: dict
    ):
        """Test deleting organization."""
        # Create organization to delete
        org = Organization(
            slug="to-delete",
            name="Organization to Delete",
            tenant_id=test_tenant.id,
            type="team",
            visibility="private",
            requires_approval=True,
            is_active=True
        )
        db.add(org)
        await db.commit()
        
        response = await client.delete(
            f"/api/v1/organizations/{org.id}",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            }
        )
        
        assert response.status_code == 200
        
        # Verify organization was deleted
        deleted_org = await db.get(Organization, org.id)
        assert deleted_org is None
    
    async def test_organization_hierarchy(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        superuser_token_headers: dict
    ):
        """Test organization hierarchy functionality."""
        # Create parent organization
        parent_org = Organization(
            slug="parent",
            name="Parent Organization",
            tenant_id=test_tenant.id,
            type="enterprise",
            visibility="private",
            requires_approval=True,
            is_active=True
        )
        db.add(parent_org)
        await db.flush()
        
        # Create child organization
        child_org = Organization(
            slug="child",
            name="Child Organization",
            tenant_id=test_tenant.id,
            parent_id=parent_org.id,
            type="department",
            visibility="private",
            requires_approval=True,
            is_active=True
        )
        db.add(child_org)
        await db.commit()
        
        # Test getting hierarchy
        response = await client.get(
            f"/api/v1/organizations/{parent_org.id}/hierarchy",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["organization"]["id"] == parent_org.id
        assert len(data["descendants"]) == 1
        assert data["descendants"][0]["id"] == child_org.id
        assert data["descendants"][0]["parent_id"] == parent_org.id


class TestOrganizationMembership:
    """Test organization membership management."""
    
    async def test_invite_member(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        test_organization: Organization,
        normal_user: User,
        superuser_token_headers: dict
    ):
        """Test inviting user to organization."""
        invite_data = {
            "email": normal_user.email,
            "role": "member",
            "auto_approve": True
        }
        
        response = await client.post(
            f"/api/v1/organizations/{test_organization.id}/members",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            },
            json=invite_data
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["user_id"] == normal_user.id
        assert data["organization_id"] == test_organization.id
        assert data["status"] == "active"  # auto_approve=True
        
        # Verify membership was created
        membership = await db.execute(
            select(OrganizationMembership).where(
                OrganizationMembership.user_id == normal_user.id,
                OrganizationMembership.organization_id == test_organization.id
            )
        )
        membership = membership.scalar_one_or_none()
        assert membership is not None
        assert membership.status == MembershipStatus.ACTIVE
    
    async def test_invite_member_pending_approval(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        test_organization: Organization,
        normal_user: User,
        superuser_token_headers: dict
    ):
        """Test inviting user with pending approval."""
        invite_data = {
            "email": normal_user.email,
            "role": "member",
            "auto_approve": False
        }
        
        response = await client.post(
            f"/api/v1/organizations/{test_organization.id}/members",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            },
            json=invite_data
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["status"] == "pending"  # auto_approve=False
    
    async def test_invite_nonexistent_user(
        self,
        client: AsyncClient,
        test_tenant: Tenant,
        test_organization: Organization,
        superuser_token_headers: dict
    ):
        """Test inviting non-existent user fails."""
        invite_data = {
            "email": "nonexistent@example.com",
            "role": "member",
            "auto_approve": True
        }
        
        response = await client.post(
            f"/api/v1/organizations/{test_organization.id}/members",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            },
            json=invite_data
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    async def test_list_members(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        test_organization: Organization,
        superuser_token_headers: dict
    ):
        """Test listing organization members."""
        # Create users and memberships
        users = []
        for i in range(3):
            user = await UserFactory.create(db, email=f"member{i}@example.com")
            users.append(user)
            
            membership = OrganizationMembership(
                user_id=user.id,
                organization_id=test_organization.id,
                status=MembershipStatus.ACTIVE
            )
            db.add(membership)
        
        await db.commit()
        
        response = await client.get(
            f"/api/v1/organizations/{test_organization.id}/members",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should include all created members
        member_user_ids = [member["user_id"] for member in data]
        for user in users:
            assert user.id in member_user_ids
    
    async def test_filter_members_by_status(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_tenant: Tenant,
        test_organization: Organization,
        superuser_token_headers: dict
    ):
        """Test filtering members by status."""
        # Create active and pending members
        active_user = await UserFactory.create(db, email="active@example.com")
        pending_user = await UserFactory.create(db, email="pending@example.com")
        
        active_membership = OrganizationMembership(
            user_id=active_user.id,
            organization_id=test_organization.id,
            status=MembershipStatus.ACTIVE
        )
        db.add(active_membership)
        
        pending_membership = OrganizationMembership(
            user_id=pending_user.id,
            organization_id=test_organization.id,
            status=MembershipStatus.PENDING
        )
        db.add(pending_membership)
        
        await db.commit()
        
        # Filter by active status
        response = await client.get(
            f"/api/v1/organizations/{test_organization.id}/members?status_filter=active",
            headers={
                **superuser_token_headers,
                "X-Tenant-ID": str(test_tenant.uuid)
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only return active members
        member_user_ids = [member["user_id"] for member in data]
        assert active_user.id in member_user_ids
        assert pending_user.id not in member_user_ids


@pytest.fixture
async def test_organization(
    db: AsyncSession,
    test_tenant: Tenant
) -> Organization:
    """Create a test organization."""
    org = Organization(
        slug="test-org",
        name="Test Organization",
        description="A test organization",
        tenant_id=test_tenant.id,
        type="team",
        visibility="private",
        requires_approval=True,
        is_active=True
    )
    db.add(org)
    await db.commit()
    await db.refresh(org)
    return org