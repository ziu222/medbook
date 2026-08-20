from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.cancellations.schemas import (
    CancellationPolicyCreate,
    CancellationPolicyRead,
    CancellationRead,
    CancellationRequest,
)
from app.cancellations.service import (
    activate_policy,
    cancel_appointment,
    create_policy,
    get_active_policy,
)
from app.core.auth import CurrentUser, get_current_user
from app.core.database import get_session

router = APIRouter(prefix="/api", tags=["cancellations"])
DatabaseSession = Annotated[Session, Depends(get_session)]
AuthenticatedUser = Annotated[CurrentUser, Depends(get_current_user)]


def require_role(role: str):
    def dependency(current_user: AuthenticatedUser) -> CurrentUser:
        if role not in current_user.groups:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN, f"{role.title()} role required"
            )
        return current_user

    return dependency


PatientUser = Annotated[CurrentUser, Depends(require_role("patient"))]
DoctorUser = Annotated[CurrentUser, Depends(require_role("doctor"))]
AdminUser = Annotated[CurrentUser, Depends(require_role("admin"))]


@router.post(
    "/appointments/{appointment_id}/cancel",
    response_model=CancellationRead,
)
def cancel_my_appointment(
    appointment_id: int,
    data: CancellationRequest,
    session: DatabaseSession,
    current_user: PatientUser,
):
    return cancel_appointment(
        session,
        appointment_id,
        current_user.subject,
        "patient",
        data.reason,
    )


@router.post(
    "/doctor/appointments/{appointment_id}/cancel",
    response_model=CancellationRead,
)
def cancel_doctor_appointment(
    appointment_id: int,
    data: CancellationRequest,
    session: DatabaseSession,
    current_user: DoctorUser,
):
    return cancel_appointment(
        session,
        appointment_id,
        current_user.subject,
        "doctor",
        data.reason,
    )


@router.get(
    "/admin/cancellation-policies/active",
    response_model=CancellationPolicyRead,
)
def read_active_policy(session: DatabaseSession, _: AdminUser):
    return get_active_policy(session)


@router.post(
    "/admin/cancellation-policies",
    response_model=CancellationPolicyRead,
    status_code=status.HTTP_201_CREATED,
)
def add_policy(
    data: CancellationPolicyCreate,
    session: DatabaseSession,
    current_user: AdminUser,
):
    return create_policy(session, current_user.subject, data)


@router.post(
    "/admin/cancellation-policies/{policy_id}/activate",
    response_model=CancellationPolicyRead,
)
def make_policy_active(policy_id: int, session: DatabaseSession, _: AdminUser):
    return activate_policy(session, policy_id)
