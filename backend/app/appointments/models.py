from datetime import date, datetime, time

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    Time,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PatientDependent(Base):
    __tablename__ = "patient_dependents"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_cognito_sub: Mapped[str] = mapped_column(String(128), index=True)
    full_name: Mapped[str] = mapped_column(String(100))
    relationship: Mapped[str] = mapped_column(String(20))
    phone_number: Mapped[str] = mapped_column(String(16))
    national_id_digest: Mapped[str] = mapped_column(String(64))
    national_id_salt: Mapped[str] = mapped_column(String(32))
    national_id_last4: Mapped[str] = mapped_column(String(4))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        CheckConstraint(
            "booking_for IN ('self', 'relative')",
            name="appointment_booking_for",
        ),
        CheckConstraint(
            "status IN ('pending', 'confirmed', 'completed', 'cancelled')",
            name="appointment_status",
        ),
        CheckConstraint("start_time < end_time", name="appointment_time_order"),
        CheckConstraint(
            "(booking_for = 'self' AND dependent_id IS NULL) OR "
            "(booking_for = 'relative' AND dependent_id IS NOT NULL)",
            name="appointment_beneficiary",
        ),
        Index(
            "uq_active_appointment_slot",
            "doctor_id",
            "appointment_date",
            "start_time",
            unique=True,
            postgresql_where=text("status IN ('pending', 'confirmed')"),
            sqlite_where=text("status IN ('pending', 'confirmed')"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctor_profiles.id", ondelete="RESTRICT"),
        index=True,
    )
    booker_cognito_sub: Mapped[str] = mapped_column(
        ForeignKey("user_profiles.cognito_sub", ondelete="RESTRICT"),
        index=True,
    )
    dependent_id: Mapped[int | None] = mapped_column(
        ForeignKey("patient_dependents.id", ondelete="RESTRICT")
    )
    booking_for: Mapped[str] = mapped_column(String(10))
    patient_full_name: Mapped[str] = mapped_column(String(100))
    patient_phone_number: Mapped[str | None] = mapped_column(String(16))
    patient_national_id_last4: Mapped[str | None] = mapped_column(String(4))
    relationship: Mapped[str | None] = mapped_column(String(20))
    symptoms: Mapped[str] = mapped_column(Text)
    appointment_date: Mapped[date] = mapped_column(Date)
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    status: Mapped[str] = mapped_column(String(10), default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
