"""Add multi-tenant architecture

Revision ID: 20250815_1600_mt_arch
Revises: 20250814_2120_add_content_suggestions_system
Create Date: 2025-08-15 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250815_1600_mt_arch'
down_revision = '20250814_2120_add_content_suggestions_system'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add multi-tenant architecture tables."""
    
    # Create tenant status enum
    tenant_status_enum = postgresql.ENUM(
        'ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELLED',
        name='tenantstatus',
        create_type=False
    )
    tenant_status_enum.create(op.get_bind(), checkfirst=True)
    
    # Create organization type enum
    org_type_enum = postgresql.ENUM(
        'ENTERPRISE', 'TEAM', 'DEPARTMENT', 'PROJECT',
        name='organizationtype',
        create_type=False
    )
    org_type_enum.create(op.get_bind(), checkfirst=True)
    
    # Create membership status enum
    membership_status_enum = postgresql.ENUM(
        'PENDING', 'ACTIVE', 'SUSPENDED', 'REMOVED',
        name='membershipstatus',
        create_type=False
    )
    membership_status_enum.create(op.get_bind(), checkfirst=True)
    
    # Create permission scope enum
    permission_scope_enum = postgresql.ENUM(
        'GLOBAL', 'TENANT', 'ORGANIZATION', 'RESOURCE',
        name='permissionscope',
        create_type=False
    )
    permission_scope_enum.create(op.get_bind(), checkfirst=True)
    
    # Create permission action enum
    permission_action_enum = postgresql.ENUM(
        'CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE', 'INVITE', 'APPROVE', 'EXECUTE', 'ADMIN',
        name='permissionaction',
        create_type=False
    )
    permission_action_enum.create(op.get_bind(), checkfirst=True)
    
    # Create role type enum
    role_type_enum = postgresql.ENUM(
        'SYSTEM', 'CUSTOM', 'INHERITED',
        name='roletype',
        create_type=False
    )
    role_type_enum.create(op.get_bind(), checkfirst=True)
    
    # Create tenants table
    op.create_table(
        'tenants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('uuid', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('domain', sa.String(255), nullable=True),
        sa.Column('status', tenant_status_enum, nullable=False),
        sa.Column('schema_name', sa.String(100), nullable=False),
        sa.Column('settings', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('limits', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('branding', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('subscription_tier', sa.String(50), nullable=False),
        sa.Column('billing_email', sa.String(255), nullable=True),
        sa.Column('trial_ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('suspended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('suspension_reason', sa.Text(), nullable=True),
        sa.Column('require_mfa', sa.Boolean(), nullable=False),
        sa.Column('allowed_ip_ranges', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('session_timeout_minutes', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug'),
        sa.UniqueConstraint('uuid'),
        sa.UniqueConstraint('domain'),
        sa.UniqueConstraint('schema_name')
    )
    
    # Create indexes for tenants
    op.create_index('ix_tenants_slug', 'tenants', ['slug'])
    op.create_index('ix_tenants_uuid', 'tenants', ['uuid'])
    op.create_index('ix_tenants_domain', 'tenants', ['domain'])
    op.create_index('ix_tenants_status', 'tenants', ['status'])
    
    # Create organizations table
    op.create_table(
        'organizations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('uuid', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type', org_type_enum, nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('settings', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('visibility', sa.String(20), nullable=False),
        sa.Column('requires_approval', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('uuid')
    )
    
    # Create indexes for organizations
    op.create_index('idx_org_tenant_slug', 'organizations', ['tenant_id', 'slug'], unique=True)
    op.create_index('idx_org_tenant_parent', 'organizations', ['tenant_id', 'parent_id'])
    op.create_index('idx_org_type_active', 'organizations', ['type', 'is_active'])
    op.create_index('ix_organizations_slug', 'organizations', ['slug'])
    op.create_index('ix_organizations_uuid', 'organizations', ['uuid'])
    op.create_index('ix_organizations_tenant_id', 'organizations', ['tenant_id'])
    op.create_index('ix_organizations_parent_id', 'organizations', ['parent_id'])
    op.create_index('ix_organizations_type', 'organizations', ['type'])
    op.create_index('ix_organizations_is_active', 'organizations', ['is_active'])
    
    # Create permissions table
    op.create_table(
        'permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('display_name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('resource_type', sa.String(50), nullable=False),
        sa.Column('action', permission_action_enum, nullable=False),
        sa.Column('scope', permission_scope_enum, nullable=False),
        sa.Column('is_system', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('requires_permissions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('conflicts_with', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('conditions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # Create indexes for permissions
    op.create_index('ix_permissions_name', 'permissions', ['name'])
    op.create_index('ix_permissions_resource_type', 'permissions', ['resource_type'])
    op.create_index('ix_permissions_action', 'permissions', ['action'])
    op.create_index('ix_permissions_scope', 'permissions', ['scope'])
    op.create_index('ix_permissions_is_active', 'permissions', ['is_active'])
    
    # Create roles table
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('display_name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type', role_type_enum, nullable=False),
        sa.Column('is_system', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=True),
        sa.Column('parent_role_id', sa.Integer(), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=False),
        sa.Column('settings', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_role_id'], ['roles.id'], ondelete='SET NULL')
    )
    
    # Create indexes for roles
    op.create_index('uq_role_name_context', 'roles', ['name', 'tenant_id', 'organization_id'], unique=True)
    op.create_index('idx_role_tenant', 'roles', ['tenant_id'])
    op.create_index('idx_role_organization', 'roles', ['organization_id'])
    op.create_index('idx_role_type_active', 'roles', ['type', 'is_active'])
    op.create_index('idx_role_parent', 'roles', ['parent_role_id'])
    op.create_index('ix_roles_name', 'roles', ['name'])
    op.create_index('ix_roles_type', 'roles', ['type'])
    op.create_index('ix_roles_is_active', 'roles', ['is_active'])
    
    # Create role_permissions association table
    op.create_table(
        'role_permissions',
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('role_id', 'permission_id'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ondelete='CASCADE')
    )
    
    # Create indexes for role_permissions
    op.create_index('idx_role_permissions_role', 'role_permissions', ['role_id'])
    op.create_index('idx_role_permissions_permission', 'role_permissions', ['permission_id'])
    
    # Create user_role_assignments association table
    op.create_table(
        'user_role_assignments',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=True),
        sa.Column('assigned_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('assigned_by_id', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('user_id', 'role_id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_by_id'], ['users.id'], ondelete='SET NULL')
    )
    
    # Create indexes for user_role_assignments
    op.create_index('idx_user_role_tenant', 'user_role_assignments', ['user_id', 'tenant_id'])
    op.create_index('idx_user_role_org', 'user_role_assignments', ['user_id', 'organization_id'])
    op.create_index('idx_role_assignments_role', 'user_role_assignments', ['role_id'])
    
    # Create organization_memberships table
    op.create_table(
        'organization_memberships',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('status', membership_status_enum, nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=True),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('invited_by_id', sa.Integer(), nullable=True),
        sa.Column('invitation_token', sa.String(255), nullable=True),
        sa.Column('invitation_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('permissions_override', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['invited_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('invitation_token')
    )
    
    # Create indexes for organization_memberships
    op.create_index('idx_membership_user_org', 'organization_memberships', ['user_id', 'organization_id'], unique=True)
    op.create_index('idx_membership_status', 'organization_memberships', ['status'])
    op.create_index('idx_membership_role', 'organization_memberships', ['role_id'])
    op.create_index('idx_invitation_token', 'organization_memberships', ['invitation_token'], unique=True)
    
    # Create resource_permissions table
    op.create_table(
        'resource_permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=False),
        sa.Column('resource_id', sa.String(255), nullable=False),
        sa.Column('granted', sa.Boolean(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('granted_by_id', sa.Integer(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('conditions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['granted_by_id'], ['users.id'], ondelete='SET NULL')
    )
    
    # Create indexes for resource_permissions
    op.create_index('uq_resource_permission', 'resource_permissions', 
                   ['user_id', 'permission_id', 'resource_type', 'resource_id'], unique=True)
    op.create_index('idx_resource_perm_user', 'resource_permissions', ['user_id'])
    op.create_index('idx_resource_perm_resource', 'resource_permissions', ['resource_type', 'resource_id'])
    op.create_index('idx_resource_perm_tenant', 'resource_permissions', ['tenant_id'])
    op.create_index('idx_resource_perm_expires', 'resource_permissions', ['expires_at'])
    
    # Create permission_cache table
    op.create_table(
        'permission_cache',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=True),
        sa.Column('permissions', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('roles', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('cache_key', sa.String(255), nullable=False),
        sa.Column('last_computed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('invalidated', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('cache_key')
    )
    
    # Create indexes for permission_cache
    op.create_index('uq_permission_cache_context', 'permission_cache', 
                   ['user_id', 'tenant_id', 'organization_id'], unique=True)
    op.create_index('idx_perm_cache_user', 'permission_cache', ['user_id'])
    op.create_index('idx_perm_cache_expires', 'permission_cache', ['expires_at'])
    op.create_index('idx_perm_cache_invalidated', 'permission_cache', ['invalidated'])
    
    # Create tenant_audit_logs table
    op.create_table(
        'tenant_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('actor_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=False),
        sa.Column('resource_id', sa.String(255), nullable=True),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL')
    )
    
    # Create indexes for tenant_audit_logs
    op.create_index('idx_audit_tenant_action', 'tenant_audit_logs', ['tenant_id', 'action'])
    op.create_index('idx_audit_actor', 'tenant_audit_logs', ['actor_id'])
    op.create_index('idx_audit_resource', 'tenant_audit_logs', ['resource_type', 'resource_id'])
    op.create_index('idx_audit_created', 'tenant_audit_logs', ['created_at'])
    
    # Create role_audit_logs table
    op.create_table(
        'role_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('actor_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('target_user_id', sa.Integer(), nullable=True),
        sa.Column('role_id', sa.Integer(), nullable=True),
        sa.Column('permission_id', sa.Integer(), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=True),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['target_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='SET NULL')
    )
    
    # Create indexes for role_audit_logs
    op.create_index('idx_role_audit_tenant_action', 'role_audit_logs', ['tenant_id', 'action'])
    op.create_index('idx_role_audit_actor', 'role_audit_logs', ['actor_id'])
    op.create_index('idx_role_audit_target', 'role_audit_logs', ['target_user_id'])
    op.create_index('idx_role_audit_role', 'role_audit_logs', ['role_id'])
    op.create_index('idx_role_audit_permission', 'role_audit_logs', ['permission_id'])
    op.create_index('idx_role_audit_created', 'role_audit_logs', ['created_at'])


def downgrade() -> None:
    """Remove multi-tenant architecture tables."""
    
    # Drop tables in reverse order to handle foreign key dependencies
    op.drop_table('role_audit_logs')
    op.drop_table('tenant_audit_logs')
    op.drop_table('permission_cache')
    op.drop_table('resource_permissions')
    op.drop_table('organization_memberships')
    op.drop_table('user_role_assignments')
    op.drop_table('role_permissions')
    op.drop_table('roles')
    op.drop_table('permissions')
    op.drop_table('organizations')
    op.drop_table('tenants')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS roletype')
    op.execute('DROP TYPE IF EXISTS permissionaction')
    op.execute('DROP TYPE IF EXISTS permissionscope')
    op.execute('DROP TYPE IF EXISTS membershipstatus')
    op.execute('DROP TYPE IF EXISTS organizationtype')
    op.execute('DROP TYPE IF EXISTS tenantstatus')