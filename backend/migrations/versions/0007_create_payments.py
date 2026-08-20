"""Create VNPAY payments and refunds."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "doctor_profiles",
        sa.Column("consultation_fee_vnd", sa.Integer(), nullable=True),
    )
    op.create_check_constraint(
        "consultation_fee_positive",
        "doctor_profiles",
        "consultation_fee_vnd IS NULL OR consultation_fee_vnd > 0",
    )
    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("appointment_id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=20), nullable=False),
        sa.Column("amount_vnd", sa.Integer(), nullable=False),
        sa.Column("txn_ref", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("checkout_url", sa.Text(), nullable=False),
        sa.Column("transaction_date", sa.String(length=14), nullable=False),
        sa.Column("provider_transaction_no", sa.String(length=20), nullable=True),
        sa.Column("provider_pay_date", sa.String(length=14), nullable=True),
        sa.Column("response_code", sa.String(length=10), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.CheckConstraint("amount_vnd > 0", name="payment_amount_positive"),
        sa.CheckConstraint(
            "status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')",
            name="payment_status",
        ),
        sa.ForeignKeyConstraint(
            ["appointment_id"], ["appointments.id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("appointment_id", name="uq_payment_appointment"),
        sa.UniqueConstraint("txn_ref", name="uq_payment_txn_ref"),
    )
    op.create_index(op.f("ix_payments_appointment_id"), "payments", ["appointment_id"])
    op.create_table(
        "refunds",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("payment_id", sa.Integer(), nullable=False),
        sa.Column("request_id", sa.String(length=32), nullable=False),
        sa.Column("amount_vnd", sa.Integer(), nullable=False),
        sa.Column("percentage", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("provider_response_code", sa.String(length=10), nullable=True),
        sa.Column("provider_transaction_no", sa.String(length=20), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("amount_vnd > 0", name="refund_amount_positive"),
        sa.CheckConstraint(
            "percentage > 0 AND percentage <= 100", name="refund_percentage_range"
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'succeeded', 'failed')", name="refund_status"
        ),
        sa.ForeignKeyConstraint(["payment_id"], ["payments.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("payment_id", name="uq_refund_payment"),
        sa.UniqueConstraint("request_id", name="uq_refund_request_id"),
    )
    op.create_index(op.f("ix_refunds_payment_id"), "refunds", ["payment_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_refunds_payment_id"), table_name="refunds")
    op.drop_table("refunds")
    op.drop_index(op.f("ix_payments_appointment_id"), table_name="payments")
    op.drop_table("payments")
    op.drop_constraint("consultation_fee_positive", "doctor_profiles", type_="check")
    op.drop_column("doctor_profiles", "consultation_fee_vnd")
