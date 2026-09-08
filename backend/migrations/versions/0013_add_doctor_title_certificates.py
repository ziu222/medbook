"""Add doctor_profiles.professional_title and certificates for the profile page."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0013"
down_revision: str | None = "0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "doctor_profiles", sa.Column("professional_title", sa.String(150))
    )
    op.add_column("doctor_profiles", sa.Column("certificates", sa.JSON()))


def downgrade() -> None:
    op.drop_column("doctor_profiles", "certificates")
    op.drop_column("doctor_profiles", "professional_title")
