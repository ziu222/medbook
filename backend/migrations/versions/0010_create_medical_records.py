"""Create appointment medical records."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "medical_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "appointment_id",
            sa.Integer(),
            sa.ForeignKey("appointments.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("patient_cognito_sub", sa.String(128), nullable=False),
        sa.Column("clinical_notes", sa.Text(), nullable=False),
        sa.Column("diagnosis", sa.String(1000)),
        sa.Column("prescription", sa.String(2000)),
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
    )
    op.create_index(
        op.f("ix_medical_records_doctor_id"), "medical_records", ["doctor_id"]
    )
    op.create_index(
        op.f("ix_medical_records_patient_cognito_sub"),
        "medical_records",
        ["patient_cognito_sub"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_medical_records_patient_cognito_sub"), table_name="medical_records"
    )
    op.drop_index(op.f("ix_medical_records_doctor_id"), table_name="medical_records")
    op.drop_table("medical_records")
