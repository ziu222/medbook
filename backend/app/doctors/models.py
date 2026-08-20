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


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"
    __table_args__ = (
        CheckConstraint("years_experience >= 0", name="years_experience_nonnegative"),
        CheckConstraint("rating >= 0 AND rating <= 5", name="rating_range"),
        CheckConstraint(
            "consultation_fee_vnd IS NULL OR consultation_fee_vnd > 0",
            name="consultation_fee_positive",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    cognito_sub: Mapped[str] = mapped_column(String(128), unique=True)
    specialty_id: Mapped[int] = mapped_column(
        ForeignKey("specialties.id", ondelete="RESTRICT"),
        index=True,
    )
    display_name: Mapped[str] = mapped_column(String(100), index=True)
    bio: Mapped[str | None] = mapped_column(Text)
    clinic_name: Mapped[str | None] = mapped_column(String(150))
    years_experience: Mapped[int] = mapped_column(default=0)
    rating: Mapped[Decimal] = mapped_column(Numeric(2, 1), default=0)
    consultation_fee_vnd: Mapped[int | None]
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    specialty: Mapped[Specialty] = relationship()


class DoctorWorkingDay(Base):
    __tablename__ = "doctor_working_days"
    # ponytail: one interval per day; allow multiple non-overlapping rows when split shifts are required.
    __table_args__ = (
        UniqueConstraint("doctor_id", "work_date", name="uq_doctor_work_date"),
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
