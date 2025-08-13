"""add project/support/community/idempotency tables

Revision ID: 20250812_add_proj_support_comm_idemp
Revises: 20250809_2030_email_verification_fields
Create Date: 2025-08-12 15:48:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '20250812_add_proj_support_comm_idemp'
# depends on the last existing migration; update if needed
down_revision: Union[str, None] = '20250809_2030_email_verification_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # user_sessions
    op.create_table(
        'user_sessions',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('user_id', sa.Integer, nullable=False, index=True),
        sa.Column('hashed_refresh_token', sa.String(), nullable=False, index=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('revoked_at', sa.DateTime(), nullable=True, index=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_user_sessions_user_id_users', ondelete='CASCADE'),
    )
    op.create_index('ix_user_sessions_user_id', 'user_sessions', ['user_id'], unique=False)
    op.create_index('ix_user_sessions_hashed_refresh_token', 'user_sessions', ['hashed_refresh_token'], unique=True)
    op.create_index('ix_user_sessions_created_at', 'user_sessions', ['created_at'], unique=False)
    op.create_index('ix_user_sessions_expires_at', 'user_sessions', ['expires_at'], unique=False)
    op.create_index('ix_user_sessions_revoked_at', 'user_sessions', ['revoked_at'], unique=False)
    op.create_table(
        'projects',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('name', sa.String(), nullable=False, index=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('owner_id', sa.Integer, sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    op.create_table(
        'support_tickets',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('email', sa.String(), nullable=False, index=True),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='open', index=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    op.create_table(
        'community_posts',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('author', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    op.create_table(
        'idempotency_keys',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('key', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('method', sa.String(), nullable=False),
        sa.Column('path', sa.String(), nullable=False),
        sa.Column('user_id', sa.Integer, nullable=True),
        sa.Column('request_hash', sa.String(), nullable=False),
        sa.Column('response_body', sa.Text(), nullable=True),
        sa.Column('status_code', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'status_events',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('service_id', sa.String(), nullable=False, index=True),
        sa.Column('status', sa.String(), nullable=False, index=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
    )


def downgrade() -> None:
    op.drop_index('ix_user_sessions_revoked_at', table_name='user_sessions')
    op.drop_index('ix_user_sessions_expires_at', table_name='user_sessions')
    op.drop_index('ix_user_sessions_created_at', table_name='user_sessions')
    op.drop_index('ix_user_sessions_hashed_refresh_token', table_name='user_sessions')
    op.drop_index('ix_user_sessions_user_id', table_name='user_sessions')
    op.drop_table('user_sessions')
    op.drop_table('status_events')
    op.drop_table('idempotency_keys')
    op.drop_table('community_posts')
    op.drop_table('support_tickets')
    op.drop_table('projects')
