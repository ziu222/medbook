from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CancellationPolicy(Base):
    __tablename__ = "cancellation_policies"
    __table_args__ = (
        CheckConstraint(
            "patient_cancel_cutoff_minutes >= 0",
            name="patient_cancel_cutoff_nonnegative",
        ),
        CheckConstraint(
            "provider_cancel_cutoff_minutes IS NULL OR "
            "provider_cancel_cutoff_minutes >= 0",
            name="provider_cancel_cutoff_nonnegative",
        ),
        Index(
            "uq_active_cancellation_policy",
            "is_active",
            unique=True,
            postgresql_where=text("is_active"),
            sqlite_where=text("is_active = 1"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_cancel_cutoff_minutes: Mapped[int] = mapped_column(Integer)
    provider_cancel_cutoff_minutes: Mapped[int | None] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by_sub: Mapped[str] = mapped_column(String(128))
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    refund_tiers: Mapped[list["RefundTier"]] = relationship(
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="RefundTier.actor_role, RefundTier.min_minutes_before.desc()",
    )


class RefundTier(Base):
    __tablename__ = "refund_tiers"
    __table_args__ = (
        CheckConstraint(
            "actor_role IN ('patient', 'provider')",
            name="refund_tier_actor_role",
        ),
        CheckConstraint(
            "min_minutes_before >= 0",
            name="refund_tier_minutes_nonnegative",
        ),
        CheckConstraint(
            "refund_percentage >= 0 AND refund_percentage <= 100",
            name="refund_tier_percentage_range",
        ),
        UniqueConstraint(
            "policy_id",
            "actor_role",
            "min_minutes_before",
            name="uq_refund_tier_threshold",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    policy_id: Mapped[int] = mapped_column(
        ForeignKey("cancellation_policies.id", ondelete="CASCADE"),
        index=True,
    )
    actor_role: Mapped[str] = mapped_column(String(10))
    min_minutes_before: Mapped[int] = mapped_column(Integer)
    refund_percentage: Mapped[int] = mapped_column(Integer)


class AppointmentPolicyAssignment(Base):
    __tablename__ = "appointment_policy_assignments"

    appointment_id: Mapped[int] = mapped_column(
        ForeignKey("appointments.id", ondelete="CASCADE"),
        primary_key=True,
    )
    policy_id: Mapped[int] = mapped_column(
        ForeignKey("cancellation_policies.id", ondelete="RESTRICT"),
        index=True,
    )


class AppointmentStatusEvent(Base):
    __tablename__ = "appointment_status_events"
    __table_args__ = (
        CheckConstraint(
            "actor_role IN ('patient', 'doctor', 'admin')",
            name="appointment_event_actor_role",
        ),
        CheckConstraint(
            "refund_percentage >= 0 AND refund_percentage <= 100",
            name="appointment_event_refund_percentage",
        ),
        CheckConstraint(
            "refund_status IN ('not_applicable', 'pending', 'succeeded', 'failed')",
            name="appointment_event_refund_status",
        ),
        UniqueConstraint(
            "appointment_id",
            "to_status",
            name="uq_appointment_status_event",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    appointment_id: Mapped[int] = mapped_column(
        ForeignKey("appointments.id", ondelete="CASCADE"),
        index=True,
    )
    from_status: Mapped[str] = mapped_column(String(10))
    to_status: Mapped[str] = mapped_column(String(10))
    actor_sub: Mapped[str] = mapped_column(String(128))
    actor_role: Mapped[str] = mapped_column(String(10))
    reason: Mapped[str] = mapped_column(String(500))
    policy_id: Mapped[int] = mapped_column(
        ForeignKey("cancellation_policies.id", ondelete="RESTRICT")
    )
    minutes_before: Mapped[int] = mapped_column(Integer)
    refund_percentage: Mapped[int] = mapped_column(Integer)
    refund_status: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class NotificationOutbox(Base):
    __tablename__ = "notification_outbox"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'queued')",
            name="notification_outbox_status",
        ),
        UniqueConstraint(
            "event_type",
            "aggregate_id",
            name="uq_notification_outbox_event",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    event_type: Mapped[str] = mapped_column(String(50))
    aggregate_id: Mapped[int] = mapped_column(Integer)
    payload: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(10), default="pending")
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    queued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
