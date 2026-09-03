"""Drop doctor_profiles.consultation_fee_vnd — booking now charges a flat platform fee."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0011"
down_revision: str | None = "0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(
        "consultation_fee_positive", "doctor_profiles", type_="check"
    )
    op.drop_column("doctor_profiles", "consultation_fee_vnd")


def downgrade() -> None:
    op.add_column(
        "doctor_profiles", sa.Column("consultation_fee_vnd", sa.Integer())
    )
    op.create_check_constraint(
        "consultation_fee_positive",
        "doctor_profiles",
        "consultation_fee_vnd IS NULL OR consultation_fee_vnd > 0",
    )
