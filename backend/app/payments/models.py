from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("amount_vnd > 0", name="payment_amount_positive"),
        CheckConstraint(
            "status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')",
            name="payment_status",
        ),
        UniqueConstraint("appointment_id", name="uq_payment_appointment"),
        UniqueConstraint("txn_ref", name="uq_payment_txn_ref"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    appointment_id: Mapped[int] = mapped_column(
        ForeignKey("appointments.id", ondelete="RESTRICT"), index=True
    )
    provider: Mapped[str] = mapped_column(String(20), default="vnpay")
    amount_vnd: Mapped[int] = mapped_column(Integer)
    txn_ref: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    checkout_url: Mapped[str] = mapped_column(Text)
    transaction_date: Mapped[str] = mapped_column(String(14))
    provider_transaction_no: Mapped[str | None] = mapped_column(String(20))
    provider_pay_date: Mapped[str | None] = mapped_column(String(14))
    response_code: Mapped[str | None] = mapped_column(String(10))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Refund(Base):
    __tablename__ = "refunds"
    __table_args__ = (
        CheckConstraint("amount_vnd > 0", name="refund_amount_positive"),
        CheckConstraint(
            "percentage > 0 AND percentage <= 100", name="refund_percentage_range"
        ),
        CheckConstraint(
            "status IN ('pending', 'succeeded', 'failed')", name="refund_status"
        ),
        UniqueConstraint("payment_id", name="uq_refund_payment"),
        UniqueConstraint("request_id", name="uq_refund_request_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    payment_id: Mapped[int] = mapped_column(
        ForeignKey("payments.id", ondelete="RESTRICT"), index=True
    )
    request_id: Mapped[str] = mapped_column(String(32))
    amount_vnd: Mapped[int] = mapped_column(Integer)
    percentage: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    provider_response_code: Mapped[str | None] = mapped_column(String(10))
    provider_transaction_no: Mapped[str | None] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
