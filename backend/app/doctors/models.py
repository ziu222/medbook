from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    Time,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Specialty(Base):
    __tablename__ = "specialties"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True)


class Facility(Base):
    __tablename__ = "facilities"
    __table_args__ = (
        CheckConstraint("rating >= 0 AND rating <= 5", name="facility_rating_range"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), unique=True)
    address: Mapped[str] = mapped_column(String(300))
    phone_number: Mapped[str | None] = mapped_column(String(16))
    rating: Mapped[Decimal] = mapped_column(Numeric(2, 1), default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"
    __table_args__ = (
        CheckConstraint("years_experience >= 0", name="years_experience_nonnegative"),
        CheckConstraint("rating >= 0 AND rating <= 5", name="rating_range"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    cognito_sub: Mapped[str] = mapped_column(String(128), unique=True)
    specialty_id: Mapped[int] = mapped_column(
        ForeignKey("specialties.id", ondelete="RESTRICT"),
        index=True,
    )
    facility_id: Mapped[int | None] = mapped_column(
        ForeignKey("facilities.id", ondelete="SET NULL"), index=True
    )
    display_name: Mapped[str] = mapped_column(String(100), index=True)
    bio: Mapped[str | None] = mapped_column(Text)
    clinic_name: Mapped[str | None] = mapped_column(String(150))
    years_experience: Mapped[int] = mapped_column(default=0)
    rating: Mapped[Decimal] = mapped_column(Numeric(2, 1), default=0)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    specialty: Mapped[Specialty] = relationship()
    facility: Mapped[Facility | None] = relationship()


class DoctorWorkingDay(Base):
    __tablename__ = "doctor_working_days"
    __table_args__ = (
        UniqueConstraint(
            "doctor_id",
            "work_date",
            "start_time",
            name="uq_doctor_work_interval",
        ),
        CheckConstraint("start_time < end_time", name="working_time_order"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctor_profiles.id", ondelete="CASCADE"),
        index=True,
    )
    work_date: Mapped[date] = mapped_column(Date)
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class DoctorBlockedSlot(Base):
    __tablename__ = "doctor_blocked_slots"
    __table_args__ = (
        UniqueConstraint(
            "doctor_id",
            "block_date",
            "start_time",
            name="uq_doctor_blocked_slot",
        ),
        CheckConstraint("start_time < end_time", name="blocked_time_order"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctor_profiles.id", ondelete="CASCADE"),
        index=True,
    )
    block_date: Mapped[date] = mapped_column(Date)
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    reason: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class DoctorReview(Base):
    __tablename__ = "doctor_reviews"
    __table_args__ = (
        CheckConstraint("score >= 1 AND score <= 5", name="doctor_review_score_range"),
        UniqueConstraint("appointment_id", name="uq_doctor_review_appointment"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    appointment_id: Mapped[int] = mapped_column(
        ForeignKey("appointments.id", ondelete="CASCADE")
    )
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctor_profiles.id", ondelete="CASCADE"), index=True
    )
    patient_cognito_sub: Mapped[str] = mapped_column(String(128), index=True)
    score: Mapped[int] = mapped_column()
    comment: Mapped[str | None] = mapped_column(String(1000))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
