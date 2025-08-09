"""Add email verification fields to users table

Revision ID: ef123456
Revises: abcd1234
Create Date: 2025-08-09 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ef123456'
down_revision: Union[str, None] = 'abcd1234'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add email verification fields to users table."""
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('email_verified_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Remove email verification fields from users table."""
    op.drop_column('users', 'email_verified_at')
    op.drop_column('users', 'is_verified')