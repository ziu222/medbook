"""Create doctor catalog."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "specialties",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("slug"),
    )
    op.create_table(
        "doctor_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("cognito_sub", sa.String(length=128), nullable=False),
        sa.Column("specialty_id", sa.Integer(), nullable=False),
        sa.Column("display_name", sa.String(length=100), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("clinic_name", sa.String(length=150), nullable=True),
        sa.Column(
            "years_experience",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "rating",
            sa.Numeric(precision=2, scale=1),
            server_default="0",
            nullable=False,
        ),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
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
            "years_experience >= 0",
            name="years_experience_nonnegative",
        ),
        sa.CheckConstraint("rating >= 0 AND rating <= 5", name="rating_range"),
        sa.ForeignKeyConstraint(
            ["specialty_id"],
            ["specialties.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cognito_sub"),
    )
    op.create_index(
        op.f("ix_doctor_profiles_display_name"),
        "doctor_profiles",
        ["display_name"],
    )
    op.create_index(
        op.f("ix_doctor_profiles_specialty_id"),
        "doctor_profiles",
        ["specialty_id"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_doctor_profiles_specialty_id"),
        table_name="doctor_profiles",
    )
    op.drop_index(
        op.f("ix_doctor_profiles_display_name"),
        table_name="doctor_profiles",
    )
    op.drop_table("doctor_profiles")
    op.drop_table("specialties")
