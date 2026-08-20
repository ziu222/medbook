from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import CurrentUser, get_current_user
from app.core.database import get_session
from app.doctors.schemas import (
    DoctorDetail,
    DoctorProfilePut,
    DoctorSummary,
    SpecialtyRead,
)
from app.doctors.service import (
    get_doctor,
    get_doctor_by_subject,
    list_doctors,
    list_specialties,
    put_doctor_profile,
)

router = APIRouter(prefix="/api", tags=["doctor catalog"])
DatabaseSession = Annotated[Session, Depends(get_session)]
AuthenticatedUser = Annotated[CurrentUser, Depends(get_current_user)]


def require_doctor(current_user: AuthenticatedUser) -> CurrentUser:
    if "doctor" not in current_user.groups:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor role required",
        )
    return current_user


DoctorUser = Annotated[CurrentUser, Depends(require_doctor)]


@router.get("/specialties", response_model=list[SpecialtyRead])
def read_specialties(session: DatabaseSession):
    return list_specialties(session)


@router.get("/doctors", response_model=list[DoctorSummary])
def read_doctors(
    session: DatabaseSession,
    specialty_id: Annotated[int | None, Query(ge=1)] = None,
    name: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    return list_doctors(
        session,
        specialty_id=specialty_id,
        name=name,
        limit=limit,
        offset=offset,
    )


@router.get("/doctor/me", response_model=DoctorDetail)
def read_my_doctor_profile(session: DatabaseSession, current_user: DoctorUser):
    doctor = get_doctor_by_subject(session, current_user.subject)
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found",
        )
    return doctor


@router.put("/doctor/me", response_model=DoctorDetail)
def replace_my_doctor_profile(
    data: DoctorProfilePut,
    session: DatabaseSession,
    current_user: DoctorUser,
):
    doctor = put_doctor_profile(session, current_user.subject, data)
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialty not found",
        )
    return doctor


@router.get("/doctors/{doctor_id}", response_model=DoctorDetail)
def read_doctor(doctor_id: int, session: DatabaseSession):
    doctor = get_doctor(session, doctor_id)
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )
    return doctor
