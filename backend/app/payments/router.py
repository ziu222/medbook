from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import CurrentUser, get_current_user
from app.core.database import get_session
from app.payments.schemas import PaymentRead
from app.payments.service import create_payment, get_payment

router = APIRouter(prefix="/api", tags=["payments"])
DatabaseSession = Annotated[Session, Depends(get_session)]
AuthenticatedUser = Annotated[CurrentUser, Depends(get_current_user)]


def require_patient(current_user: AuthenticatedUser) -> CurrentUser:
    if "patient" not in current_user.groups:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Patient role required")
    return current_user


PatientUser = Annotated[CurrentUser, Depends(require_patient)]


@router.post(
    "/appointments/{appointment_id}/payment",
    response_model=PaymentRead,
    status_code=status.HTTP_201_CREATED,
)
def start_payment(
    appointment_id: int,
    session: DatabaseSession,
    current_user: PatientUser,
):
    return create_payment(session, appointment_id, current_user.subject)


@router.get("/appointments/{appointment_id}/payment", response_model=PaymentRead)
def read_payment(
    appointment_id: int,
    session: DatabaseSession,
    current_user: PatientUser,
):
    return get_payment(session, appointment_id, current_user.subject)
