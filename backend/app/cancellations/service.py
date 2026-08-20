from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.appointments.models import Appointment
from app.cancellations.models import (
    AppointmentPolicyAssignment,
    CancellationPolicy,
    RefundTier,
)
from app.cancellations.schemas import CancellationPolicyCreate


def get_active_policy(session: Session) -> CancellationPolicy:
    policy = session.scalar(
        select(CancellationPolicy).where(CancellationPolicy.is_active.is_(True))
    )
    if policy is None:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Cancellation policy is not configured",
        )
    return policy


def assign_active_policy(session: Session, appointment: Appointment) -> None:
    session.flush()
    session.add(
        AppointmentPolicyAssignment(
            appointment_id=appointment.id,
            policy_id=get_active_policy(session).id,
        )
    )


def create_policy(
    session: Session,
    subject: str,
    data: CancellationPolicyCreate,
) -> CancellationPolicy:
    policy = CancellationPolicy(
        patient_cancel_cutoff_minutes=data.patient_cancel_cutoff_minutes,
        provider_cancel_cutoff_minutes=data.provider_cancel_cutoff_minutes,
        is_active=False,
        created_by_sub=subject,
        effective_from=datetime.now(UTC),
        refund_tiers=[RefundTier(**tier.model_dump()) for tier in data.refund_tiers],
    )
    session.add(policy)
    session.commit()
    session.refresh(policy)
    return policy


def activate_policy(session: Session, policy_id: int) -> CancellationPolicy:
    policy = session.get(CancellationPolicy, policy_id)
    if policy is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cancellation policy not found")
    session.execute(update(CancellationPolicy).values(is_active=False))
    policy.is_active = True
    policy.effective_from = datetime.now(UTC)
    session.commit()
    session.refresh(policy)
    return policy
