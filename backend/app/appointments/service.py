import hashlib
import hmac
import secrets
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.appointments.models import Appointment, PatientDependent
from app.appointments.schemas import (
    AppointmentCreate,
    AvailabilitySlot,
    RelativeAppointmentCreate,
)
from app.cancellations.service import assign_active_policy
from app.doctors.models import DoctorProfile, DoctorWorkingDay
from app.users.models import UserProfile

SLOT_DURATION = timedelta(minutes=30)
ACTIVE_STATUSES = ("pending", "confirmed")
APP_TIMEZONE = ZoneInfo("Asia/Ho_Chi_Minh")


def get_available_slots(
    session: Session,
    doctor_id: int,
    appointment_date: date,
) -> list[AvailabilitySlot]:
    if session.get(DoctorProfile, doctor_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Doctor not found")

    working_day = session.scalar(
        select(DoctorWorkingDay).where(
            DoctorWorkingDay.doctor_id == doctor_id,
            DoctorWorkingDay.work_date == appointment_date,
        )
    )
    if working_day is None:
        return []

    occupied = set(
        session.scalars(
            select(Appointment.start_time).where(
                Appointment.doctor_id == doctor_id,
                Appointment.appointment_date == appointment_date,
                Appointment.status.in_(ACTIVE_STATUSES),
            )
        )
    )
    slots = []
    now = datetime.now(APP_TIMEZONE)
    current = datetime.combine(appointment_date, working_day.start_time)
    finish = datetime.combine(appointment_date, working_day.end_time)
    while current + SLOT_DURATION <= finish:
        end = current + SLOT_DURATION
        is_future = appointment_date > now.date() or current.time() > now.time()
        if is_future and current.time() not in occupied:
            slots.append(
                AvailabilitySlot(start_time=current.time(), end_time=end.time())
            )
        current = end
    return slots


def _national_id_digest(national_id: str, salt: bytes) -> str:
    return hashlib.scrypt(
        national_id.encode(),
        salt=salt,
        n=2**14,
        r=8,
        p=1,
        dklen=32,
    ).hex()


def _put_dependent(
    session: Session,
    owner_cognito_sub: str,
    data: RelativeAppointmentCreate,
) -> PatientDependent:
    national_id = data.relative.national_id.get_secret_value()
    # ponytail: linear scan is fine for a family-sized list; add a keyed lookup only if this grows.
    dependents = session.scalars(
        select(PatientDependent).where(
            PatientDependent.owner_cognito_sub == owner_cognito_sub
        )
    )
    dependent = next(
        (
            item
            for item in dependents
            if hmac.compare_digest(
                item.national_id_digest,
                _national_id_digest(national_id, bytes.fromhex(item.national_id_salt)),
            )
        ),
        None,
    )
    if dependent is None:
        salt = secrets.token_bytes(16)
        dependent = PatientDependent(
            owner_cognito_sub=owner_cognito_sub,
            national_id_digest=_national_id_digest(national_id, salt),
            national_id_salt=salt.hex(),
            national_id_last4=national_id[-4:],
            full_name=data.relative.full_name,
            relationship=data.relative.relationship,
            phone_number=data.relative.phone_number,
        )
        session.add(dependent)
        session.flush()
    else:
        dependent.full_name = data.relative.full_name
        dependent.relationship = data.relative.relationship
        dependent.phone_number = data.relative.phone_number
    return dependent


def create_appointment(
    session: Session,
    subject: str,
    data: AppointmentCreate,
) -> Appointment:
    if data.appointment_date < datetime.now(APP_TIMEZONE).date():
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "appointment_date cannot be in the past",
        )
    profile = session.get(UserProfile, subject)
    if profile is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Complete user profile first")

    slots = get_available_slots(session, data.doctor_id, data.appointment_date)
    slot = next((slot for slot in slots if slot.start_time == data.start_time), None)
    if slot is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Slot is not available")

    dependent = None
    patient_full_name = profile.display_name
    patient_phone_number = profile.phone_number
    national_id_last4 = None
    relationship = None
    if isinstance(data, RelativeAppointmentCreate):
        dependent = _put_dependent(session, subject, data)
        patient_full_name = dependent.full_name
        patient_phone_number = dependent.phone_number
        national_id_last4 = dependent.national_id_last4
        relationship = dependent.relationship

    appointment = Appointment(
        doctor_id=data.doctor_id,
        booker_cognito_sub=subject,
        dependent_id=dependent.id if dependent else None,
        booking_for=data.booking_for,
        patient_full_name=patient_full_name,
        patient_phone_number=patient_phone_number,
        patient_national_id_last4=national_id_last4,
        relationship=relationship,
        symptoms=data.symptoms,
        appointment_date=data.appointment_date,
        start_time=data.start_time,
        end_time=slot.end_time,
        status="pending",
    )
    session.add(appointment)
    try:
        assign_active_policy(session, appointment)
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Slot is not available"
        ) from error
    session.refresh(appointment)
    return appointment


def list_patient_appointments(session: Session, subject: str) -> list[Appointment]:
    statement = (
        select(Appointment)
        .where(Appointment.booker_cognito_sub == subject)
        .order_by(Appointment.appointment_date, Appointment.start_time)
    )
    return list(session.scalars(statement))


def list_doctor_appointments(
    session: Session,
    subject: str,
    appointment_date: date | None,
) -> list[Appointment]:
    doctor = session.scalar(
        select(DoctorProfile).where(DoctorProfile.cognito_sub == subject)
    )
    if doctor is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Complete doctor profile first")
    statement = select(Appointment).where(Appointment.doctor_id == doctor.id)
    if appointment_date is not None:
        statement = statement.where(Appointment.appointment_date == appointment_date)
    return list(
        session.scalars(
            statement.order_by(Appointment.appointment_date, Appointment.start_time)
        )
    )
