import os
from datetime import date
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, joinedload

from app.appointments.models import Appointment
from app.doctors.models import (
    DoctorBlockedSlot,
    DoctorProfile,
    DoctorReview,
    DoctorWorkingDay,
    Facility,
    Specialty,
)
from app.doctors.schemas import (
    BlockedSlotPut,
    DoctorAccountCreate,
    DoctorProfilePut,
    DoctorReviewPut,
    FacilityPut,
    WorkingDayPut,
)


def list_specialties(session: Session) -> list[Specialty]:
    statement = select(Specialty).order_by(Specialty.name, Specialty.id)
    return list(session.scalars(statement))


def list_facilities(session: Session, limit: int, offset: int) -> list[Facility]:
    return list(
        session.scalars(
            select(Facility).order_by(Facility.name).limit(limit).offset(offset)
        )
    )


def get_facility(session: Session, facility_id: int) -> Facility:
    facility = session.get(Facility, facility_id)
    if facility is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Facility not found")
    return facility


def put_facility(
    session: Session,
    data: FacilityPut,
    facility_id: int | None = None,
) -> Facility:
    facility = session.get(Facility, facility_id) if facility_id else None
    if facility_id and facility is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Facility not found")
    if facility is None:
        facility = Facility(**data.model_dump())
        session.add(facility)
    else:
        for field, value in data.model_dump().items():
            setattr(facility, field, value)
    session.commit()
    session.refresh(facility)
    return facility


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
        .options(
            joinedload(DoctorProfile.specialty), joinedload(DoctorProfile.facility)
        )
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
        .options(
            joinedload(DoctorProfile.specialty), joinedload(DoctorProfile.facility)
        )
        .where(DoctorProfile.id == doctor_id)
    )
    return session.scalar(statement)


def get_doctor_by_subject(session: Session, subject: str) -> DoctorProfile | None:
    statement = (
        select(DoctorProfile)
        .options(
            joinedload(DoctorProfile.specialty), joinedload(DoctorProfile.facility)
        )
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
    facility = session.get(Facility, data.facility_id) if data.facility_id else None
    if data.facility_id and facility is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Facility not found")

    profile = get_doctor_by_subject(session, subject)
    values = data.model_dump(mode="json")
    if profile is None:
        profile = DoctorProfile(cognito_sub=subject, **values)
        session.add(profile)
    else:
        for field, value in values.items():
            setattr(profile, field, value)

    profile.specialty = specialty
    profile.facility = facility
    session.commit()
    session.refresh(profile)
    return profile


def create_doctor_account(
    session: Session,
    data: DoctorAccountCreate,
) -> DoctorProfile:
    specialty = session.get(Specialty, data.specialty_id)
    if specialty is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Specialty not found")
    facility = session.get(Facility, data.facility_id) if data.facility_id else None
    if data.facility_id and facility is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Facility not found")

    cognito = boto3.client("cognito-idp")
    user_pool_id = os.environ["COGNITO_USER_POOL_ID"]
    try:
        created = cognito.admin_create_user(
            UserPoolId=user_pool_id,
            Username=data.email,
            UserAttributes=[
                {"Name": "email", "Value": data.email},
                {"Name": "email_verified", "Value": "true"},
            ],
            DesiredDeliveryMediums=["EMAIL"],
        )
    except cognito.exceptions.UsernameExistsException:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    except ClientError as error:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            f"Cognito error: {error.response['Error']['Message']}",
        )

    subject = next(
        attr["Value"]
        for attr in created["User"]["Attributes"]
        if attr["Name"] == "sub"
    )
    cognito.admin_add_user_to_group(
        UserPoolId=user_pool_id,
        Username=data.email,
        GroupName="doctor",
    )

    profile = DoctorProfile(
        cognito_sub=subject,
        **data.model_dump(mode="json", exclude={"email"}),
    )
    session.add(profile)
    profile.specialty = specialty
    profile.facility = facility
    session.commit()
    session.refresh(profile)
    return profile


def put_working_day(
    session: Session,
    doctor: DoctorProfile,
    work_date: date,
    data: WorkingDayPut,
) -> DoctorWorkingDay:
    if session.scalar(
        select(Appointment.id).where(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == work_date,
            Appointment.status.in_(("pending", "confirmed")),
        )
    ):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Cannot replace a schedule with active appointments",
        )
    session.execute(
        delete(DoctorWorkingDay).where(
            DoctorWorkingDay.doctor_id == doctor.id,
            DoctorWorkingDay.work_date == work_date,
        )
    )
    working_day = DoctorWorkingDay(
        doctor_id=doctor.id,
        work_date=work_date,
        start_time=data.start_time,
        end_time=data.end_time,
    )
    session.add(working_day)
    session.commit()
    session.refresh(working_day)
    return working_day


def add_working_interval(
    session: Session,
    doctor: DoctorProfile,
    work_date: date,
    data: WorkingDayPut,
) -> DoctorWorkingDay:
    overlap = session.scalar(
        select(DoctorWorkingDay.id).where(
            DoctorWorkingDay.doctor_id == doctor.id,
            DoctorWorkingDay.work_date == work_date,
            DoctorWorkingDay.start_time < data.end_time,
            DoctorWorkingDay.end_time > data.start_time,
        )
    )
    if overlap:
        raise HTTPException(status.HTTP_409_CONFLICT, "Working intervals overlap")
    interval = DoctorWorkingDay(
        doctor_id=doctor.id,
        work_date=work_date,
        start_time=data.start_time,
        end_time=data.end_time,
    )
    session.add(interval)
    session.commit()
    session.refresh(interval)
    return interval


def close_working_day(
    session: Session,
    doctor: DoctorProfile,
    work_date: date,
) -> None:
    if session.scalar(
        select(Appointment.id).where(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == work_date,
            Appointment.status.in_(("pending", "confirmed")),
        )
    ):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Cannot close a day with active appointments",
        )
    session.execute(
        delete(DoctorWorkingDay).where(
            DoctorWorkingDay.doctor_id == doctor.id,
            DoctorWorkingDay.work_date == work_date,
        )
    )
    session.commit()


def add_blocked_slot(
    session: Session,
    doctor: DoctorProfile,
    data: BlockedSlotPut,
) -> DoctorBlockedSlot:
    if session.scalar(
        select(Appointment.id).where(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == data.block_date,
            Appointment.status.in_(("pending", "confirmed")),
            Appointment.start_time < data.end_time,
            Appointment.end_time > data.start_time,
        )
    ):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Cannot block a slot with an active appointment",
        )
    blocked = DoctorBlockedSlot(doctor_id=doctor.id, **data.model_dump())
    session.add(blocked)
    session.commit()
    session.refresh(blocked)
    return blocked


def delete_blocked_slot(
    session: Session,
    doctor: DoctorProfile,
    blocked_slot_id: int,
) -> None:
    blocked = session.get(DoctorBlockedSlot, blocked_slot_id)
    if blocked is None or blocked.doctor_id != doctor.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Blocked slot not found")
    session.delete(blocked)
    session.commit()


def list_blocked_slots(
    session: Session,
    doctor: DoctorProfile,
    date_from: date,
    date_to: date,
) -> list[DoctorBlockedSlot]:
    return list(
        session.scalars(
            select(DoctorBlockedSlot)
            .where(
                DoctorBlockedSlot.doctor_id == doctor.id,
                DoctorBlockedSlot.block_date.between(date_from, date_to),
            )
            .order_by(DoctorBlockedSlot.block_date, DoctorBlockedSlot.start_time)
        )
    )


def put_review(
    session: Session,
    appointment_id: int,
    subject: str,
    data: DoctorReviewPut,
) -> DoctorReview:
    appointment = session.get(Appointment, appointment_id)
    if (
        appointment is None
        or appointment.booker_cognito_sub != subject
        or appointment.status != "completed"
    ):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Only a completed owned appointment can be reviewed",
        )
    review = session.scalar(
        select(DoctorReview).where(DoctorReview.appointment_id == appointment_id)
    )
    if review is None:
        review = DoctorReview(
            appointment_id=appointment.id,
            doctor_id=appointment.doctor_id,
            patient_cognito_sub=subject,
            **data.model_dump(),
        )
        session.add(review)
    else:
        review.score = data.score
        review.comment = data.comment
    session.flush()
    doctor = session.get(DoctorProfile, appointment.doctor_id)
    average = session.scalar(
        select(func.avg(DoctorReview.score)).where(
            DoctorReview.doctor_id == appointment.doctor_id
        )
    )
    doctor.rating = Decimal(str(average)).quantize(Decimal("0.1"))
    if doctor.facility_id:
        facility = session.get(Facility, doctor.facility_id)
        facility_average = session.scalar(
            select(func.avg(DoctorProfile.rating)).where(
                DoctorProfile.facility_id == doctor.facility_id
            )
        )
        facility.rating = Decimal(str(facility_average)).quantize(Decimal("0.1"))
    session.commit()
    session.refresh(review)
    return review


def list_reviews(
    session: Session,
    doctor_id: int,
    limit: int,
    offset: int,
) -> list[DoctorReview]:
    if session.get(DoctorProfile, doctor_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Doctor not found")
    return list(
        session.scalars(
            select(DoctorReview)
            .where(DoctorReview.doctor_id == doctor_id)
            .order_by(DoctorReview.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
    )


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
        .order_by(DoctorWorkingDay.work_date, DoctorWorkingDay.start_time)
    )
    return list(session.scalars(statement))
