"""Create doctor working days."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "doctor_working_days",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("work_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint("start_time < end_time", name="working_time_order"),
        sa.ForeignKeyConstraint(
            ["doctor_id"],
            ["doctor_profiles.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "doctor_id",
            "work_date",
            name="uq_doctor_work_date",
        ),
    )
    op.create_index(
        op.f("ix_doctor_working_days_doctor_id"),
        "doctor_working_days",
        ["doctor_id"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_doctor_working_days_doctor_id"),
        table_name="doctor_working_days",
    )
    op.drop_table("doctor_working_days")
