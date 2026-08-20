from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.appointments.schemas import (
    AppointmentCreate,
    AppointmentRead,
    AvailabilitySlot,
)
from app.appointments.service import (
    create_appointment,
    get_available_slots,
    list_doctor_appointments,
    list_patient_appointments,
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
def read_my_appointments(session: DatabaseSession, current_user: PatientUser):
    return list_patient_appointments(session, current_user.subject)


@router.get("/doctor/appointments", response_model=list[AppointmentRead])
def read_doctor_appointments(
    session: DatabaseSession,
    current_user: DoctorUser,
    appointment_date: Annotated[date | None, Query(alias="date")] = None,
):
    return list_doctor_appointments(session, current_user.subject, appointment_date)
