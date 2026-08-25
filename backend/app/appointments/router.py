from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.appointments.schemas import (
    AppointmentCreate,
    AppointmentDetail,
    AppointmentRead,
    AppointmentStatus,
    AvailabilitySlot,
    MedicalRecordPut,
    MedicalRecordRead,
)
from app.appointments.service import (
    complete_appointment,
    create_appointment,
    get_appointment_detail,
    get_available_slots,
    get_medical_record,
    list_doctor_appointments,
    list_patient_appointments,
    put_medical_record,
)
from app.core.auth import CurrentUser, get_current_user
from app.core.database import get_session

router = APIRouter(prefix="/api", tags=["appointments"])
DatabaseSession = Annotated[Session, Depends(get_session)]
AuthenticatedUser = Annotated[CurrentUser, Depends(get_current_user)]


def require_patient(current_user: AuthenticatedUser) -> CurrentUser:
    if "patient" not in current_user.groups:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Patient role required")
    return current_user


def require_doctor(current_user: AuthenticatedUser) -> CurrentUser:
    if "doctor" not in current_user.groups:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Doctor role required")
    return current_user


PatientUser = Annotated[CurrentUser, Depends(require_patient)]
DoctorUser = Annotated[CurrentUser, Depends(require_doctor)]


@router.get(
    "/doctors/{doctor_id}/availability",
    response_model=list[AvailabilitySlot],
)
def read_availability(
    doctor_id: int,
    appointment_date: Annotated[date, Query(alias="date")],
    session: DatabaseSession,
):
    return get_available_slots(session, doctor_id, appointment_date)


@router.post(
    "/appointments",
    response_model=AppointmentRead,
    status_code=status.HTTP_201_CREATED,
)
def book_appointment(
    data: AppointmentCreate,
    session: DatabaseSession,
    current_user: PatientUser,
):
    return create_appointment(session, current_user.subject, data)


@router.get("/appointments/me", response_model=list[AppointmentRead])
def read_my_appointments(
    session: DatabaseSession,
    current_user: PatientUser,
    appointment_date: Annotated[date | None, Query(alias="date")] = None,
    appointment_status: Annotated[
        AppointmentStatus | None, Query(alias="status")
    ] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    return list_patient_appointments(
        session,
        current_user.subject,
        appointment_date=appointment_date,
        appointment_status=appointment_status,
        limit=limit,
        offset=offset,
    )


@router.get("/appointments/{appointment_id}", response_model=AppointmentDetail)
def read_appointment(
    appointment_id: int,
    session: DatabaseSession,
    current_user: AuthenticatedUser,
):
    return get_appointment_detail(
        session,
        appointment_id,
        current_user.subject,
        current_user.groups,
    )


@router.get(
    "/appointments/{appointment_id}/medical-record",
    response_model=MedicalRecordRead,
)
def read_medical_record(
    appointment_id: int,
    session: DatabaseSession,
    current_user: AuthenticatedUser,
):
    return get_medical_record(
        session,
        appointment_id,
        current_user.subject,
        current_user.groups,
    )


@router.put(
    "/doctor/appointments/{appointment_id}/medical-record",
    response_model=MedicalRecordRead,
)
def replace_medical_record(
    appointment_id: int,
    data: MedicalRecordPut,
    session: DatabaseSession,
    current_user: DoctorUser,
):
    return put_medical_record(session, appointment_id, current_user.subject, data)


@router.get("/doctor/appointments", response_model=list[AppointmentRead])
def read_doctor_appointments(
    session: DatabaseSession,
    current_user: DoctorUser,
    appointment_date: Annotated[date | None, Query(alias="date")] = None,
    appointment_status: Annotated[
        AppointmentStatus | None, Query(alias="status")
    ] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    return list_doctor_appointments(
        session,
        current_user.subject,
        appointment_date=appointment_date,
        appointment_status=appointment_status,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/doctor/appointments/{appointment_id}/complete",
    response_model=AppointmentRead,
)
def finish_appointment(
    appointment_id: int,
    session: DatabaseSession,
    current_user: DoctorUser,
):
    return complete_appointment(session, appointment_id, current_user.subject)
