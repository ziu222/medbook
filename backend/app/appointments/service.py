import hashlib
import hmac
import secrets
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.appointments.models import Appointment, MedicalRecord, PatientDependent
from app.appointments.schemas import (
    AppointmentCreate,
    AppointmentDetail,
    AvailabilitySlot,
    MedicalRecordPut,
    RelativeAppointmentCreate,
)
from app.cancellations.models import (
    AppointmentPolicyAssignment,
    AppointmentStatusEvent,
)
from app.cancellations.service import assign_active_policy
from app.doctors.models import DoctorBlockedSlot, DoctorProfile, DoctorWorkingDay
from app.payments.models import Payment
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

    working_days = list(
        session.scalars(
            select(DoctorWorkingDay).where(
                DoctorWorkingDay.doctor_id == doctor_id,
                DoctorWorkingDay.work_date == appointment_date,
            )
        )
    )
    if not working_days:
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
    blocked = list(
        session.scalars(
            select(DoctorBlockedSlot).where(
                DoctorBlockedSlot.doctor_id == doctor_id,
                DoctorBlockedSlot.block_date == appointment_date,
            )
        )
    )
    slots = {}
    now = datetime.now(APP_TIMEZONE)
    for working_day in working_days:
        current = datetime.combine(appointment_date, working_day.start_time)
        finish = datetime.combine(appointment_date, working_day.end_time)
        while current + SLOT_DURATION <= finish:
            end = current + SLOT_DURATION
            is_future = appointment_date > now.date() or current.time() > now.time()
            is_blocked = any(
                current.time() < item.end_time and end.time() > item.start_time
                for item in blocked
            )
            if is_future and not is_blocked and current.time() not in occupied:
                slots[current.time()] = AvailabilitySlot(
                    start_time=current.time(),
                    end_time=end.time(),
                )
            current = end
    return [slots[key] for key in sorted(slots)]


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


def list_patient_appointments(
    session: Session,
    subject: str,
    *,
    appointment_date: date | None,
    appointment_status: str | None,
    limit: int,
    offset: int,
) -> list[Appointment]:
    statement = (
        select(Appointment)
        .where(Appointment.booker_cognito_sub == subject)
        .order_by(Appointment.appointment_date, Appointment.start_time)
        .limit(limit)
        .offset(offset)
    )
    if appointment_date is not None:
        statement = statement.where(Appointment.appointment_date == appointment_date)
    if appointment_status is not None:
        statement = statement.where(Appointment.status == appointment_status)
    return list(session.scalars(statement))


def _doctor_by_subject(session: Session, subject: str) -> DoctorProfile:
    doctor = session.scalar(
        select(DoctorProfile).where(DoctorProfile.cognito_sub == subject)
    )
    if doctor is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Complete doctor profile first")
    return doctor


def list_doctor_appointments(
    session: Session,
    subject: str,
    *,
    appointment_date: date | None,
    appointment_status: str | None,
    limit: int,
    offset: int,
) -> list[Appointment]:
    doctor = _doctor_by_subject(session, subject)
    statement = (
        select(Appointment)
        .where(Appointment.doctor_id == doctor.id)
        .order_by(Appointment.appointment_date, Appointment.start_time)
        .limit(limit)
        .offset(offset)
    )
    if appointment_date is not None:
        statement = statement.where(Appointment.appointment_date == appointment_date)
    if appointment_status is not None:
        statement = statement.where(Appointment.status == appointment_status)
    return list(session.scalars(statement))


def get_appointment(
    session: Session,
    appointment_id: int,
    subject: str,
    groups: frozenset[str],
) -> Appointment:
    appointment = session.get(Appointment, appointment_id)
    if "patient" in groups and appointment is not None:
        if appointment.booker_cognito_sub == subject:
            return appointment
    elif "doctor" in groups and appointment is not None:
        doctor = _doctor_by_subject(session, subject)
        if appointment.doctor_id == doctor.id:
            return appointment
    elif not groups & {"patient", "doctor"}:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Patient or doctor role required"
        )
    raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")


def get_appointment_detail(
    session: Session,
    appointment_id: int,
    subject: str,
    groups: frozenset[str],
) -> AppointmentDetail:
    appointment = get_appointment(session, appointment_id, subject, groups)
    doctor = session.get(DoctorProfile, appointment.doctor_id)
    payment = session.scalar(
        select(Payment).where(Payment.appointment_id == appointment.id)
    )
    history = list(
        session.scalars(
            select(AppointmentStatusEvent)
            .where(AppointmentStatusEvent.appointment_id == appointment.id)
            .order_by(AppointmentStatusEvent.created_at)
        )
    )
    return AppointmentDetail.model_validate(
        {
            **appointment.__dict__,
            "doctor_name": doctor.display_name,
            "specialty_name": doctor.specialty.name,
            "facility_name": doctor.facility.name if doctor.facility else None,
            "payment_status": payment.status if payment else None,
            "status_history": history,
        }
    )


def put_medical_record(
    session: Session,
    appointment_id: int,
    subject: str,
    data: MedicalRecordPut,
) -> MedicalRecord:
    doctor = _doctor_by_subject(session, subject)
    appointment = session.get(Appointment, appointment_id)
    if appointment is None or appointment.doctor_id != doctor.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")
    if appointment.status not in {"confirmed", "completed"}:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Medical record requires a confirmed or completed appointment",
        )
    record = session.scalar(
        select(MedicalRecord).where(MedicalRecord.appointment_id == appointment.id)
    )
    if record is None:
        record = MedicalRecord(
            appointment_id=appointment.id,
            doctor_id=doctor.id,
            patient_cognito_sub=appointment.booker_cognito_sub,
            **data.model_dump(),
        )
        session.add(record)
    else:
        for field, value in data.model_dump().items():
            setattr(record, field, value)
    session.commit()
    session.refresh(record)
    return record


def get_medical_record(
    session: Session,
    appointment_id: int,
    subject: str,
    groups: frozenset[str],
) -> MedicalRecord:
    get_appointment(session, appointment_id, subject, groups)
    record = session.scalar(
        select(MedicalRecord).where(MedicalRecord.appointment_id == appointment_id)
    )
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Medical record not found")
    return record


def complete_appointment(
    session: Session,
    appointment_id: int,
    subject: str,
) -> Appointment:
    doctor = _doctor_by_subject(session, subject)
    appointment = session.scalar(
        select(Appointment).where(Appointment.id == appointment_id).with_for_update()
    )
    if appointment is None or appointment.doctor_id != doctor.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")
    if appointment.status == "completed":
        return appointment
    if appointment.status != "confirmed":
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Cannot complete appointment with status {appointment.status}",
        )

    appointment_end = datetime.combine(
        appointment.appointment_date,
        appointment.end_time,
        tzinfo=APP_TIMEZONE,
    )
    now = datetime.now(APP_TIMEZONE)
    if now < appointment_end:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Appointment cannot be completed before its scheduled end",
        )

    assignment = session.get(AppointmentPolicyAssignment, appointment.id)
    if assignment is None:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "Appointment policy assignment is missing",
        )
    session.add(
        AppointmentStatusEvent(
            appointment_id=appointment.id,
            from_status=appointment.status,
            to_status="completed",
            actor_sub=subject,
            actor_role="doctor",
            reason="Appointment completed",
            policy_id=assignment.policy_id,
            minutes_before=int((appointment_end - now).total_seconds() // 60),
            refund_percentage=0,
            refund_status="not_applicable",
        )
    )
    appointment.status = "completed"
    session.commit()
    session.refresh(appointment)
    return appointment
