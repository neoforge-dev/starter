"""Add password reset token table

Revision ID: abcd1234
Revises: 5f00d7881d03
Create Date: 2025-08-09 20:22:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey


# revision identifiers, used by Alembic.
revision: str = 'abcd1234'
down_revision: Union[str, None] = '5f00d7881d03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create password_reset_tokens table."""
    op.create_table(
        'password_reset_tokens',
        Column('id', Integer, primary_key=True, index=True),
        Column('token_hash', String, unique=True, index=True, nullable=False),
        Column('user_id', Integer, ForeignKey('users.id'), nullable=False, index=True),
        Column('expires_at', DateTime, nullable=False),
        Column('is_used', Boolean, default=False, nullable=False),
        Column('used_at', DateTime, nullable=True),
        Column('created_at', DateTime, server_default=sa.text('CURRENT_TIMESTAMP')),
        Column('updated_at', DateTime, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
    )


def downgrade() -> None:
    """Drop password_reset_tokens table."""
    op.drop_table('password_reset_tokens')