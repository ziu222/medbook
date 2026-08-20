"""Create cancellation policies, audit events, and notification outbox."""

from collections.abc import Sequence
from datetime import UTC, datetime

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "cancellation_policies",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("patient_cancel_cutoff_minutes", sa.Integer(), nullable=False),
        sa.Column("provider_cancel_cutoff_minutes", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_by_sub", sa.String(length=128), nullable=False),
        sa.Column("effective_from", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "patient_cancel_cutoff_minutes >= 0",
            name="patient_cancel_cutoff_nonnegative",
        ),
        sa.CheckConstraint(
            "provider_cancel_cutoff_minutes IS NULL OR "
            "provider_cancel_cutoff_minutes >= 0",
            name="provider_cancel_cutoff_nonnegative",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "uq_active_cancellation_policy",
        "cancellation_policies",
        ["is_active"],
        unique=True,
        postgresql_where=sa.text("is_active"),
        sqlite_where=sa.text("is_active = 1"),
    )
    op.create_table(
        "refund_tiers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("policy_id", sa.Integer(), nullable=False),
        sa.Column("actor_role", sa.String(length=10), nullable=False),
        sa.Column("min_minutes_before", sa.Integer(), nullable=False),
        sa.Column("refund_percentage", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "actor_role IN ('patient', 'provider')",
            name="refund_tier_actor_role",
        ),
        sa.CheckConstraint(
            "min_minutes_before >= 0",
            name="refund_tier_minutes_nonnegative",
        ),
        sa.CheckConstraint(
            "refund_percentage >= 0 AND refund_percentage <= 100",
            name="refund_tier_percentage_range",
        ),
        sa.ForeignKeyConstraint(
            ["policy_id"],
            ["cancellation_policies.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "policy_id",
            "actor_role",
            "min_minutes_before",
            name="uq_refund_tier_threshold",
        ),
    )
    op.create_index(
        op.f("ix_refund_tiers_policy_id"),
        "refund_tiers",
        ["policy_id"],
    )

    policies = sa.table(
        "cancellation_policies",
        sa.column("id", sa.Integer()),
        sa.column("patient_cancel_cutoff_minutes", sa.Integer()),
        sa.column("provider_cancel_cutoff_minutes", sa.Integer()),
        sa.column("is_active", sa.Boolean()),
        sa.column("created_by_sub", sa.String()),
        sa.column("effective_from", sa.DateTime(timezone=True)),
    )
    op.bulk_insert(
        policies,
        [
            {
                "id": 1,
                "patient_cancel_cutoff_minutes": 1440,
                "provider_cancel_cutoff_minutes": None,
                "is_active": True,
                "created_by_sub": "system",
                "effective_from": datetime.now(UTC),
            }
        ],
    )
    tiers = sa.table(
        "refund_tiers",
        sa.column("id", sa.Integer()),
        sa.column("policy_id", sa.Integer()),
        sa.column("actor_role", sa.String()),
        sa.column("min_minutes_before", sa.Integer()),
        sa.column("refund_percentage", sa.Integer()),
    )
    op.bulk_insert(
        tiers,
        [
            {
                "id": 1,
                "policy_id": 1,
                "actor_role": "patient",
                "min_minutes_before": 10080,
                "refund_percentage": 100,
            },
            {
                "id": 2,
                "policy_id": 1,
                "actor_role": "patient",
                "min_minutes_before": 4320,
                "refund_percentage": 50,
            },
            {
                "id": 3,
                "policy_id": 1,
                "actor_role": "patient",
                "min_minutes_before": 1440,
                "refund_percentage": 0,
            },
            {
                "id": 4,
                "policy_id": 1,
                "actor_role": "provider",
                "min_minutes_before": 0,
                "refund_percentage": 100,
            },
        ],
    )

    op.create_table(
        "appointment_policy_assignments",
        sa.Column("appointment_id", sa.Integer(), nullable=False),
        sa.Column("policy_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["appointment_id"],
            ["appointments.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["policy_id"],
            ["cancellation_policies.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("appointment_id"),
    )
    op.create_index(
        op.f("ix_appointment_policy_assignments_policy_id"),
        "appointment_policy_assignments",
        ["policy_id"],
    )
    op.execute(
        sa.text(
            "INSERT INTO appointment_policy_assignments (appointment_id, policy_id) "
            "SELECT id, 1 FROM appointments"
        )
    )
    op.create_table(
        "appointment_status_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("appointment_id", sa.Integer(), nullable=False),
        sa.Column("from_status", sa.String(length=10), nullable=False),
        sa.Column("to_status", sa.String(length=10), nullable=False),
        sa.Column("actor_sub", sa.String(length=128), nullable=False),
        sa.Column("actor_role", sa.String(length=10), nullable=False),
        sa.Column("reason", sa.String(length=500), nullable=False),
        sa.Column("policy_id", sa.Integer(), nullable=False),
        sa.Column("minutes_before", sa.Integer(), nullable=False),
        sa.Column("refund_percentage", sa.Integer(), nullable=False),
        sa.Column("refund_status", sa.String(length=20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "actor_role IN ('patient', 'doctor', 'admin')",
            name="appointment_event_actor_role",
        ),
        sa.CheckConstraint(
            "refund_percentage >= 0 AND refund_percentage <= 100",
            name="appointment_event_refund_percentage",
        ),
        sa.CheckConstraint(
            "refund_status IN ('not_applicable', 'pending', 'succeeded', 'failed')",
            name="appointment_event_refund_status",
        ),
        sa.ForeignKeyConstraint(
            ["appointment_id"],
            ["appointments.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["policy_id"],
            ["cancellation_policies.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "appointment_id",
            "to_status",
            name="uq_appointment_status_event",
        ),
    )
    op.create_index(
        op.f("ix_appointment_status_events_appointment_id"),
        "appointment_status_events",
        ["appointment_id"],
    )
    op.create_table(
        "notification_outbox",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("aggregate_id", sa.Integer(), nullable=False),
        sa.Column("payload", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=10), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("queued_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('pending', 'queued')",
            name="notification_outbox_status",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "event_type",
            "aggregate_id",
            name="uq_notification_outbox_event",
        ),
    )

    if op.get_bind().dialect.name == "postgresql":
        op.execute(
            "SELECT setval(pg_get_serial_sequence('cancellation_policies', 'id'), 1)"
        )
        op.execute("SELECT setval(pg_get_serial_sequence('refund_tiers', 'id'), 4)")


def downgrade() -> None:
    op.drop_table("notification_outbox")
    op.drop_index(
        op.f("ix_appointment_status_events_appointment_id"),
        table_name="appointment_status_events",
    )
    op.drop_table("appointment_status_events")
    op.drop_index(
        op.f("ix_appointment_policy_assignments_policy_id"),
        table_name="appointment_policy_assignments",
    )
    op.drop_table("appointment_policy_assignments")
    op.drop_index(op.f("ix_refund_tiers_policy_id"), table_name="refund_tiers")
    op.drop_table("refund_tiers")
    op.drop_index(
        "uq_active_cancellation_policy",
        table_name="cancellation_policies",
    )
    op.drop_table("cancellation_policies")
