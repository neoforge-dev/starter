"""create tables

Revision ID: c9b3dee5ebce
Revises: 10dde5a7dde1
Create Date: 2025-03-02 13:17:01.017005

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9b3dee5ebce'
down_revision: Union[str, None] = '10dde5a7dde1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass 