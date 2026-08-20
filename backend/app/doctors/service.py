from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.doctors.models import DoctorProfile, Specialty
from app.doctors.schemas import DoctorProfilePut


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
