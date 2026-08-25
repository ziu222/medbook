from datetime import date, datetime, timedelta
from typing import Annotated
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import CurrentUser, get_current_user
from app.core.database import get_session
from app.doctors.schemas import (
    BlockedSlotPut,
    BlockedSlotRead,
    DoctorDetail,
    DoctorProfilePut,
    DoctorReviewPut,
    DoctorReviewRead,
    DoctorSummary,
    FacilityPut,
    FacilityRead,
    SpecialtyRead,
    WorkingDayPut,
    WorkingDayRead,
)
from app.doctors.service import (
    add_blocked_slot,
    add_working_interval,
    close_working_day,
    delete_blocked_slot,
    get_doctor,
    get_doctor_by_subject,
    get_facility,
    list_blocked_slots,
    list_doctors,
    list_facilities,
    list_reviews,
    list_specialties,
    list_working_days,
    put_doctor_profile,
    put_facility,
    put_review,
    put_working_day,
)

router = APIRouter(prefix="/api", tags=["doctor catalog"])
APP_TIMEZONE = ZoneInfo("Asia/Ho_Chi_Minh")
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


def require_admin(current_user: AuthenticatedUser) -> CurrentUser:
    if "admin" not in current_user.groups:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin role required")
    return current_user


AdminUser = Annotated[CurrentUser, Depends(require_admin)]


@router.get("/specialties", response_model=list[SpecialtyRead])
def read_specialties(session: DatabaseSession):
    return list_specialties(session)


@router.get("/facilities", response_model=list[FacilityRead])
def read_facilities(
    session: DatabaseSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    return list_facilities(session, limit, offset)


@router.get("/facilities/{facility_id}", response_model=FacilityRead)
def read_facility(facility_id: int, session: DatabaseSession):
    return get_facility(session, facility_id)


@router.post(
    "/admin/facilities",
    response_model=FacilityRead,
    status_code=status.HTTP_201_CREATED,
)
def add_facility(data: FacilityPut, session: DatabaseSession, _: AdminUser):
    return put_facility(session, data)


@router.put("/admin/facilities/{facility_id}", response_model=FacilityRead)
def replace_facility(
    facility_id: int,
    data: FacilityPut,
    session: DatabaseSession,
    _: AdminUser,
):
    return put_facility(session, data, facility_id)


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


def require_doctor_profile(session: Session, current_user: CurrentUser):
    doctor = get_doctor_by_subject(session, current_user.subject)
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Complete doctor profile first",
        )
    return doctor


@router.put(
    "/doctor/schedules/{work_date}",
    response_model=WorkingDayRead,
)
def replace_working_day(
    work_date: date,
    data: WorkingDayPut,
    session: DatabaseSession,
    current_user: DoctorUser,
):
    if work_date < datetime.now(APP_TIMEZONE).date():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="work_date cannot be in the past",
        )
    doctor = require_doctor_profile(session, current_user)
    return put_working_day(session, doctor, work_date, data)


@router.post(
    "/doctor/schedules/{work_date}",
    response_model=WorkingDayRead,
    status_code=status.HTTP_201_CREATED,
)
def add_schedule_interval(
    work_date: date,
    data: WorkingDayPut,
    session: DatabaseSession,
    current_user: DoctorUser,
):
    if work_date < datetime.now(APP_TIMEZONE).date():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Past date")
    return add_working_interval(
        session,
        require_doctor_profile(session, current_user),
        work_date,
        data,
    )


@router.delete("/doctor/schedules/{work_date}", status_code=status.HTTP_204_NO_CONTENT)
def close_schedule(
    work_date: date,
    session: DatabaseSession,
    current_user: DoctorUser,
):
    close_working_day(
        session,
        require_doctor_profile(session, current_user),
        work_date,
    )


@router.post(
    "/doctor/blocked-slots",
    response_model=BlockedSlotRead,
    status_code=status.HTTP_201_CREATED,
)
def block_slot(
    data: BlockedSlotPut,
    session: DatabaseSession,
    current_user: DoctorUser,
):
    if data.block_date < datetime.now(APP_TIMEZONE).date():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Past date")
    return add_blocked_slot(
        session,
        require_doctor_profile(session, current_user),
        data,
    )


@router.get("/doctor/blocked-slots", response_model=list[BlockedSlotRead])
def read_blocked_slots(
    session: DatabaseSession,
    current_user: DoctorUser,
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
):
    date_from = date_from or datetime.now(APP_TIMEZONE).date()
    date_to = date_to or date_from + timedelta(days=30)
    if date_to < date_from or date_to > date_from + timedelta(days=90):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid date range")
    return list_blocked_slots(
        session,
        require_doctor_profile(session, current_user),
        date_from,
        date_to,
    )


@router.delete(
    "/doctor/blocked-slots/{blocked_slot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def unblock_slot(
    blocked_slot_id: int,
    session: DatabaseSession,
    current_user: DoctorUser,
):
    delete_blocked_slot(
        session,
        require_doctor_profile(session, current_user),
        blocked_slot_id,
    )


@router.get("/doctor/schedules", response_model=list[WorkingDayRead])
def read_working_days(
    session: DatabaseSession,
    current_user: DoctorUser,
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
):
    date_from = date_from or datetime.now(APP_TIMEZONE).date()
    date_to = date_to or date_from + timedelta(days=30)
    if date_to < date_from or date_to > date_from + timedelta(days=90):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="date range must be between 0 and 90 days",
        )
    doctor = require_doctor_profile(session, current_user)
    return list_working_days(session, doctor, date_from, date_to)


@router.get("/doctors/{doctor_id}", response_model=DoctorDetail)
def read_doctor(doctor_id: int, session: DatabaseSession):
    doctor = get_doctor(session, doctor_id)
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )
    return doctor


@router.get("/doctors/{doctor_id}/reviews", response_model=list[DoctorReviewRead])
def read_doctor_reviews(
    doctor_id: int,
    session: DatabaseSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    return list_reviews(session, doctor_id, limit, offset)


@router.put(
    "/appointments/{appointment_id}/review",
    response_model=DoctorReviewRead,
)
def review_doctor(
    appointment_id: int,
    data: DoctorReviewPut,
    session: DatabaseSession,
    current_user: AuthenticatedUser,
):
    if "patient" not in current_user.groups:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Patient role required")
    return put_review(session, appointment_id, current_user.subject, data)
