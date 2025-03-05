"""create tables with models

Revision ID: 5f00d7881d03
Revises: c9b3dee5ebce
Create Date: 2025-03-02 13:53:21.619208

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5f00d7881d03'
down_revision: Union[str, None] = 'c9b3dee5ebce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass 