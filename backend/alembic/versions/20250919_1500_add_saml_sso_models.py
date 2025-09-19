"""add_saml_sso_models

Revision ID: 20250919_1500_add_saml_sso_models
Revises: 20250919_1400_add_growth_analytics_tables
Create Date: 2025-09-19 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250919_1500_add_saml_sso_models'
down_revision = '20250919_1400_add_growth_analytics_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Create saml_configs table
    op.create_table('saml_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('uuid', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('idp_type', sa.Enum('OKTA', 'AZURE_AD', 'GOOGLE_WORKSPACE', 'ONELOGIN', 'ADFS', 'GENERIC', name='identityprovider'), nullable=False),
        sa.Column('idp_entity_id', sa.String(length=500), nullable=False),
        sa.Column('idp_sso_url', sa.String(length=1000), nullable=False),
        sa.Column('idp_slo_url', sa.String(length=1000), nullable=True),
        sa.Column('idp_x509_cert', sa.Text(), nullable=False),
        sa.Column('idp_metadata_url', sa.String(length=1000), nullable=True),
        sa.Column('sp_entity_id', sa.String(length=500), nullable=False),
        sa.Column('sp_acs_url', sa.String(length=1000), nullable=False),
        sa.Column('sp_slo_url', sa.String(length=1000), nullable=True),
        sa.Column('sp_x509_cert', sa.Text(), nullable=True),
        sa.Column('sp_private_key', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', 'TESTING', 'ERROR', name='samlstatus'), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('auto_provision', sa.Boolean(), nullable=False),
        sa.Column('attribute_mapping', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('default_role', sa.String(length=100), nullable=True),
        sa.Column('group_mapping', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('require_signed_assertions', sa.Boolean(), nullable=False),
        sa.Column('require_signed_responses', sa.Boolean(), nullable=False),
        sa.Column('encrypt_assertions', sa.Boolean(), nullable=False),
        sa.Column('signature_algorithm', sa.String(length=100), nullable=False),
        sa.Column('digest_algorithm', sa.String(length=100), nullable=False),
        sa.Column('session_timeout_minutes', sa.Integer(), nullable=False),
        sa.Column('max_authentication_age', sa.Integer(), nullable=False),
        sa.Column('settings', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('last_metadata_refresh', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_test_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('test_result', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_saml_config_entity_id', 'saml_configs', ['sp_entity_id'], unique=False)
    op.create_index('idx_saml_config_idp_type', 'saml_configs', ['idp_type'], unique=False)
    op.create_index('idx_saml_config_tenant_status', 'saml_configs', ['tenant_id', 'status'], unique=False)
    op.create_index(op.f('ix_saml_configs_id'), 'saml_configs', ['id'], unique=False)
    op.create_index(op.f('ix_saml_configs_uuid'), 'saml_configs', ['uuid'], unique=True)

    # Create saml_sessions table
    op.create_table('saml_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('uuid', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', sa.String(length=255), nullable=False),
        sa.Column('request_id', sa.String(length=255), nullable=False),
        sa.Column('config_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('INITIATED', 'AUTHENTICATED', 'EXPIRED', 'TERMINATED', 'ERROR', name='samlsessionstatus'), nullable=False),
        sa.Column('initiated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('authenticated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('terminated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('relay_state', sa.String(length=1000), nullable=True),
        sa.Column('name_id', sa.String(length=500), nullable=True),
        sa.Column('name_id_format', sa.String(length=200), nullable=True),
        sa.Column('session_index', sa.String(length=500), nullable=True),
        sa.Column('assertion_id', sa.String(length=255), nullable=True),
        sa.Column('assertion_attributes', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('assertion_conditions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('client_ip', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('error_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['config_id'], ['saml_configs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_saml_session_config_status', 'saml_sessions', ['config_id', 'status'], unique=False)
    op.create_index('idx_saml_session_created', 'saml_sessions', ['initiated_at'], unique=False)
    op.create_index('idx_saml_session_expires', 'saml_sessions', ['expires_at'], unique=False)
    op.create_index('idx_saml_session_name_id', 'saml_sessions', ['name_id'], unique=False)
    op.create_index('idx_saml_session_user', 'saml_sessions', ['user_id'], unique=False)
    op.create_index(op.f('ix_saml_sessions_id'), 'saml_sessions', ['id'], unique=False)
    op.create_index(op.f('ix_saml_sessions_request_id'), 'saml_sessions', ['request_id'], unique=True)
    op.create_index(op.f('ix_saml_sessions_session_id'), 'saml_sessions', ['session_id'], unique=True)
    op.create_index(op.f('ix_saml_sessions_uuid'), 'saml_sessions', ['uuid'], unique=True)

    # Create saml_attribute_mappings table
    op.create_table('saml_attribute_mappings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('uuid', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('idp_type', sa.Enum('OKTA', 'AZURE_AD', 'GOOGLE_WORKSPACE', 'ONELOGIN', 'ADFS', 'GENERIC', name='identityprovider'), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('attribute_mappings', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('group_mappings', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('default_attributes', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_system', sa.Boolean(), nullable=False),
        sa.Column('usage_count', sa.Integer(), nullable=False),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_saml_attr_mapping_active', 'saml_attribute_mappings', ['is_active'], unique=False)
    op.create_index('idx_saml_attr_mapping_idp_type', 'saml_attribute_mappings', ['idp_type'], unique=False)
    op.create_index('idx_saml_attr_mapping_system', 'saml_attribute_mappings', ['is_system'], unique=False)
    op.create_index('idx_saml_attr_mapping_tenant', 'saml_attribute_mappings', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_saml_attribute_mappings_id'), 'saml_attribute_mappings', ['id'], unique=False)
    op.create_index(op.f('ix_saml_attribute_mappings_uuid'), 'saml_attribute_mappings', ['uuid'], unique=True)

    # Create saml_audit_logs table
    op.create_table('saml_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('uuid', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('config_id', sa.Integer(), nullable=True),
        sa.Column('session_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('event_status', sa.String(length=50), nullable=False),
        sa.Column('event_message', sa.Text(), nullable=True),
        sa.Column('event_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('client_ip', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('risk_score', sa.Integer(), nullable=True),
        sa.Column('security_flags', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['config_id'], ['saml_configs.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['session_id'], ['saml_sessions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_saml_audit_client_ip', 'saml_audit_logs', ['client_ip'], unique=False)
    op.create_index('idx_saml_audit_created', 'saml_audit_logs', ['created_at'], unique=False)
    op.create_index('idx_saml_audit_risk', 'saml_audit_logs', ['risk_score'], unique=False)
    op.create_index('idx_saml_audit_status', 'saml_audit_logs', ['event_status'], unique=False)
    op.create_index('idx_saml_audit_tenant_event', 'saml_audit_logs', ['tenant_id', 'event_type'], unique=False)
    op.create_index('idx_saml_audit_user', 'saml_audit_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_saml_audit_logs_id'), 'saml_audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_saml_audit_logs_uuid'), 'saml_audit_logs', ['uuid'], unique=True)


def downgrade():
    # Drop indexes and tables in reverse order
    op.drop_index(op.f('ix_saml_audit_logs_uuid'), table_name='saml_audit_logs')
    op.drop_index(op.f('ix_saml_audit_logs_id'), table_name='saml_audit_logs')
    op.drop_index('idx_saml_audit_user', table_name='saml_audit_logs')
    op.drop_index('idx_saml_audit_tenant_event', table_name='saml_audit_logs')
    op.drop_index('idx_saml_audit_status', table_name='saml_audit_logs')
    op.drop_index('idx_saml_audit_risk', table_name='saml_audit_logs')
    op.drop_index('idx_saml_audit_created', table_name='saml_audit_logs')
    op.drop_index('idx_saml_audit_client_ip', table_name='saml_audit_logs')
    op.drop_table('saml_audit_logs')
    
    op.drop_index(op.f('ix_saml_attribute_mappings_uuid'), table_name='saml_attribute_mappings')
    op.drop_index(op.f('ix_saml_attribute_mappings_id'), table_name='saml_attribute_mappings')
    op.drop_index('idx_saml_attr_mapping_tenant', table_name='saml_attribute_mappings')
    op.drop_index('idx_saml_attr_mapping_system', table_name='saml_attribute_mappings')
    op.drop_index('idx_saml_attr_mapping_idp_type', table_name='saml_attribute_mappings')
    op.drop_index('idx_saml_attr_mapping_active', table_name='saml_attribute_mappings')
    op.drop_table('saml_attribute_mappings')
    
    op.drop_index(op.f('ix_saml_sessions_uuid'), table_name='saml_sessions')
    op.drop_index(op.f('ix_saml_sessions_session_id'), table_name='saml_sessions')
    op.drop_index(op.f('ix_saml_sessions_request_id'), table_name='saml_sessions')
    op.drop_index(op.f('ix_saml_sessions_id'), table_name='saml_sessions')
    op.drop_index('idx_saml_session_user', table_name='saml_sessions')
    op.drop_index('idx_saml_session_name_id', table_name='saml_sessions')
    op.drop_index('idx_saml_session_expires', table_name='saml_sessions')
    op.drop_index('idx_saml_session_created', table_name='saml_sessions')
    op.drop_index('idx_saml_session_config_status', table_name='saml_sessions')
    op.drop_table('saml_sessions')
    
    op.drop_index(op.f('ix_saml_configs_uuid'), table_name='saml_configs')
    op.drop_index(op.f('ix_saml_configs_id'), table_name='saml_configs')
    op.drop_index('idx_saml_config_tenant_status', table_name='saml_configs')
    op.drop_index('idx_saml_config_idp_type', table_name='saml_configs')
    op.drop_index('idx_saml_config_entity_id', table_name='saml_configs')
    op.drop_table('saml_configs')
    
    # Drop enums
    op.execute("DROP TYPE IF EXISTS samlsessionstatus")
    op.execute("DROP TYPE IF EXISTS samlstatus")
    op.execute("DROP TYPE IF EXISTS identityprovider")