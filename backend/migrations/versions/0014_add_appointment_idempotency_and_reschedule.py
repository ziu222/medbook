"""Add appointment client_request_id (double-submit guard) and reschedule_count."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0014"
down_revision: str | None = "0013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("appointments", sa.Column("client_request_id", sa.String(64)))
    op.add_column(
        "appointments",
        sa.Column(
            "reschedule_count", sa.Integer(), nullable=False, server_default="0"
        ),
    )
    op.create_index(
        "uq_appointment_client_request",
        "appointments",
        ["booker_cognito_sub", "client_request_id"],
        unique=True,
        postgresql_where=sa.text("client_request_id IS NOT NULL"),
        sqlite_where=sa.text("client_request_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_appointment_client_request", table_name="appointments")
    op.drop_column("appointments", "reschedule_count")
    op.drop_column("appointments", "client_request_id")
