"""Create appointments and patient dependents."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "patient_dependents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_cognito_sub", sa.String(length=128), nullable=False),
        sa.Column("full_name", sa.String(length=100), nullable=False),
        sa.Column("relationship", sa.String(length=20), nullable=False),
        sa.Column("phone_number", sa.String(length=16), nullable=False),
        sa.Column("national_id_digest", sa.String(length=64), nullable=False),
        sa.Column("national_id_salt", sa.String(length=32), nullable=False),
        sa.Column("national_id_last4", sa.String(length=4), nullable=False),
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
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_patient_dependents_owner_cognito_sub"),
        "patient_dependents",
        ["owner_cognito_sub"],
    )
    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("booker_cognito_sub", sa.String(length=128), nullable=False),
        sa.Column("dependent_id", sa.Integer(), nullable=True),
        sa.Column("booking_for", sa.String(length=10), nullable=False),
        sa.Column("patient_full_name", sa.String(length=100), nullable=False),
        sa.Column("patient_phone_number", sa.String(length=16), nullable=True),
        sa.Column("patient_national_id_last4", sa.String(length=4), nullable=True),
        sa.Column("relationship", sa.String(length=20), nullable=True),
        sa.Column("symptoms", sa.Text(), nullable=False),
        sa.Column("appointment_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column(
            "status",
            sa.String(length=10),
            server_default="pending",
            nullable=False,
        ),
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
        sa.CheckConstraint(
            "booking_for IN ('self', 'relative')",
            name="appointment_booking_for",
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'confirmed', 'completed', 'cancelled')",
            name="appointment_status",
        ),
        sa.CheckConstraint("start_time < end_time", name="appointment_time_order"),
        sa.CheckConstraint(
            "(booking_for = 'self' AND dependent_id IS NULL) OR "
            "(booking_for = 'relative' AND dependent_id IS NOT NULL)",
            name="appointment_beneficiary",
        ),
        sa.ForeignKeyConstraint(
            ["booker_cognito_sub"],
            ["user_profiles.cognito_sub"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["dependent_id"],
            ["patient_dependents.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["doctor_id"],
            ["doctor_profiles.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_appointments_booker_cognito_sub"),
        "appointments",
        ["booker_cognito_sub"],
    )
    op.create_index(
        op.f("ix_appointments_doctor_id"),
        "appointments",
        ["doctor_id"],
    )
    op.create_index(
        "uq_active_appointment_slot",
        "appointments",
        ["doctor_id", "appointment_date", "start_time"],
        unique=True,
        postgresql_where=sa.text("status IN ('pending', 'confirmed')"),
        sqlite_where=sa.text("status IN ('pending', 'confirmed')"),
    )


def downgrade() -> None:
    op.drop_index("uq_active_appointment_slot", table_name="appointments")
    op.drop_index(op.f("ix_appointments_doctor_id"), table_name="appointments")
    op.drop_index(
        op.f("ix_appointments_booker_cognito_sub"),
        table_name="appointments",
    )
    op.drop_table("appointments")
    op.drop_index(
        op.f("ix_patient_dependents_owner_cognito_sub"),
        table_name="patient_dependents",
    )
    op.drop_table("patient_dependents")
