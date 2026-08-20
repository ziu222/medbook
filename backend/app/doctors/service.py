from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.doctors.models import DoctorProfile, DoctorWorkingDay, Specialty
from app.doctors.schemas import DoctorProfilePut, WorkingDayPut


def list_specialties(session: Session) -> list[Specialty]:
    statement = select(Specialty).order_by(Specialty.name, Specialty.id)
    return list(session.scalars(statement))


def list_doctors(
    session: Session,
    *,
    specialty_id: int | None,
    name: str | None,
    limit: int,
    offset: int,
) -> list[DoctorProfile]:
    statement = (
        select(DoctorProfile)
        .options(joinedload(DoctorProfile.specialty))
        .order_by(DoctorProfile.display_name, DoctorProfile.id)
        .limit(limit)
        .offset(offset)
    )
    if specialty_id is not None:
        statement = statement.where(DoctorProfile.specialty_id == specialty_id)
    normalized_name = name.strip() if name else None
    if normalized_name:
        statement = statement.where(
            DoctorProfile.display_name.ilike(f"%{normalized_name}%")
        )
    return list(session.scalars(statement))


def get_doctor(session: Session, doctor_id: int) -> DoctorProfile | None:
    statement = (
        select(DoctorProfile)
        .options(joinedload(DoctorProfile.specialty))
        .where(DoctorProfile.id == doctor_id)
    )
    return session.scalar(statement)


def get_doctor_by_subject(session: Session, subject: str) -> DoctorProfile | None:
    statement = (
        select(DoctorProfile)
        .options(joinedload(DoctorProfile.specialty))
        .where(DoctorProfile.cognito_sub == subject)
    )
    return session.scalar(statement)


def put_doctor_profile(
    session: Session,
    subject: str,
    data: DoctorProfilePut,
) -> DoctorProfile | None:
    specialty = session.get(Specialty, data.specialty_id)
    if specialty is None:
        return None

    profile = get_doctor_by_subject(session, subject)
    values = data.model_dump(mode="json")
    if profile is None:
        profile = DoctorProfile(cognito_sub=subject, **values)
        session.add(profile)
    else:
        for field, value in values.items():
            setattr(profile, field, value)

    profile.specialty = specialty
    session.commit()
    session.refresh(profile)
    return profile


def put_working_day(
    session: Session,
    doctor: DoctorProfile,
    work_date: date,
    data: WorkingDayPut,
) -> DoctorWorkingDay:
    statement = select(DoctorWorkingDay).where(
        DoctorWorkingDay.doctor_id == doctor.id,
        DoctorWorkingDay.work_date == work_date,
    )
    working_day = session.scalar(statement)
    if working_day is None:
        working_day = DoctorWorkingDay(
            doctor_id=doctor.id,
            work_date=work_date,
            start_time=data.start_time,
            end_time=data.end_time,
        )
        session.add(working_day)
    else:
        working_day.start_time = data.start_time
        working_day.end_time = data.end_time

    session.commit()
    session.refresh(working_day)
    return working_day


def list_working_days(
    session: Session,
    doctor: DoctorProfile,
    date_from: date,
    date_to: date,
) -> list[DoctorWorkingDay]:
    statement = (
        select(DoctorWorkingDay)
        .where(
            DoctorWorkingDay.doctor_id == doctor.id,
            DoctorWorkingDay.work_date.between(date_from, date_to),
        )
        .order_by(DoctorWorkingDay.work_date)
    )
    return list(session.scalars(statement))
