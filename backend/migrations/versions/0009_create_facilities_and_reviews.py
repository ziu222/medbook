"""Create facilities and doctor reviews."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0009"
down_revision: str | None = "0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "facilities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(150), nullable=False, unique=True),
        sa.Column("address", sa.String(300), nullable=False),
        sa.Column("phone_number", sa.String(16)),
        sa.Column("rating", sa.Numeric(2, 1), server_default="0", nullable=False),
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
        sa.CheckConstraint("rating >= 0 AND rating <= 5", name="facility_rating_range"),
    )
    op.add_column("doctor_profiles", sa.Column("facility_id", sa.Integer()))
    op.create_foreign_key(
        "fk_doctor_profiles_facility_id",
        "doctor_profiles",
        "facilities",
        ["facility_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        op.f("ix_doctor_profiles_facility_id"), "doctor_profiles", ["facility_id"]
    )
    op.create_table(
        "doctor_reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "appointment_id",
            sa.Integer(),
            sa.ForeignKey("appointments.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "doctor_id",
            sa.Integer(),
            sa.ForeignKey("doctor_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("patient_cognito_sub", sa.String(128), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("comment", sa.String(1000)),
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
            "score >= 1 AND score <= 5", name="doctor_review_score_range"
        ),
    )
    op.create_index(
        op.f("ix_doctor_reviews_doctor_id"), "doctor_reviews", ["doctor_id"]
    )
    op.create_index(
        op.f("ix_doctor_reviews_patient_cognito_sub"),
        "doctor_reviews",
        ["patient_cognito_sub"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_doctor_reviews_patient_cognito_sub"), table_name="doctor_reviews"
    )
    op.drop_index(op.f("ix_doctor_reviews_doctor_id"), table_name="doctor_reviews")
    op.drop_table("doctor_reviews")
    op.drop_index(op.f("ix_doctor_profiles_facility_id"), table_name="doctor_profiles")
    op.drop_constraint(
        "fk_doctor_profiles_facility_id", "doctor_profiles", type_="foreignkey"
    )
    op.drop_column("doctor_profiles", "facility_id")
    op.drop_table("facilities")
