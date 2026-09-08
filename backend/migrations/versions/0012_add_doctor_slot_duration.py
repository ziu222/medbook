"""Let each doctor choose a 30- or 60-minute appointment slot length."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0012"
down_revision: str | None = "0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "doctor_profiles",
        sa.Column(
            "slot_duration_minutes",
            sa.Integer(),
            nullable=False,
            server_default="30",
        ),
    )
    op.create_check_constraint(
        "slot_duration_allowed",
        "doctor_profiles",
        "slot_duration_minutes IN (30, 60)",
    )


def downgrade() -> None:
    op.drop_constraint("slot_duration_allowed", "doctor_profiles", type_="check")
    op.drop_column("doctor_profiles", "slot_duration_minutes")
