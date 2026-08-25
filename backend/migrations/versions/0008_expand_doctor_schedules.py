"""Expand doctor schedules with multiple intervals and blocked slots."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(
        "uq_doctor_work_date",
        "doctor_working_days",
        type_="unique",
    )
    op.create_unique_constraint(
        "uq_doctor_work_interval",
        "doctor_working_days",
        ["doctor_id", "work_date", "start_time"],
    )
    op.create_table(
        "doctor_blocked_slots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "doctor_id",
            sa.Integer(),
            sa.ForeignKey("doctor_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("block_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("reason", sa.String(length=200)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint("start_time < end_time", name="blocked_time_order"),
        sa.UniqueConstraint(
            "doctor_id",
            "block_date",
            "start_time",
            name="uq_doctor_blocked_slot",
        ),
    )
    op.create_index(
        op.f("ix_doctor_blocked_slots_doctor_id"),
        "doctor_blocked_slots",
        ["doctor_id"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_doctor_blocked_slots_doctor_id"),
        table_name="doctor_blocked_slots",
    )
    op.drop_table("doctor_blocked_slots")
    op.drop_constraint(
        "uq_doctor_work_interval",
        "doctor_working_days",
        type_="unique",
    )
    op.create_unique_constraint(
        "uq_doctor_work_date",
        "doctor_working_days",
        ["doctor_id", "work_date"],
    )
