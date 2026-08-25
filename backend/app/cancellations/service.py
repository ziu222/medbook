import json
import os
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

import boto3
from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.appointments.models import Appointment
from app.cancellations.models import (
    AppointmentPolicyAssignment,
    AppointmentStatusEvent,
    CancellationPolicy,
    NotificationOutbox,
    RefundTier,
)
from app.cancellations.schemas import CancellationPolicyCreate, CancellationRead
from app.doctors.models import DoctorProfile
from app.payments.models import Payment
from app.payments.service import queue_refund

APP_TIMEZONE = ZoneInfo("Asia/Ho_Chi_Minh")


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


def _assigned_policy(session: Session, appointment_id: int) -> CancellationPolicy:
    policy = session.scalar(
        select(CancellationPolicy)
        .join(
            AppointmentPolicyAssignment,
            AppointmentPolicyAssignment.policy_id == CancellationPolicy.id,
        )
        .where(AppointmentPolicyAssignment.appointment_id == appointment_id)
    )
    return policy or get_active_policy(session)


def _refund_percentage(
    policy: CancellationPolicy,
    actor: str,
    minutes_before: int,
) -> int:
    policy_actor = "provider" if actor == "doctor" else "patient"
    eligible = [
        tier
        for tier in policy.refund_tiers
        if tier.actor_role == policy_actor
        and max(minutes_before, 0) >= tier.min_minutes_before
    ]
    if not eligible:
        return 0
    return max(eligible, key=lambda tier: tier.min_minutes_before).refund_percentage


def _cancellation_result(
    event: AppointmentStatusEvent,
    notification_status: str,
) -> CancellationRead:
    return CancellationRead(
        appointment_id=event.appointment_id,
        status="cancelled",
        cancelled_by=event.actor_role,
        reason=event.reason,
        policy_id=event.policy_id,
        minutes_before=event.minutes_before,
        refund_percentage=event.refund_percentage,
        refund_status=event.refund_status,
        notification_status=notification_status,
        cancelled_at=event.created_at,
    )


def cancel_appointment(
    session: Session,
    appointment_id: int,
    subject: str,
    actor: str,
    reason: str,
) -> CancellationRead:
    appointment = session.scalar(
        select(Appointment).where(Appointment.id == appointment_id).with_for_update()
    )
    if appointment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")

    doctor = session.get(DoctorProfile, appointment.doctor_id)
    if actor == "patient" and appointment.booker_cognito_sub != subject:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")
    if actor == "doctor" and (doctor is None or doctor.cognito_sub != subject):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")

    existing = session.scalar(
        select(AppointmentStatusEvent).where(
            AppointmentStatusEvent.appointment_id == appointment_id,
            AppointmentStatusEvent.to_status == "cancelled",
        )
    )
    if existing is not None:
        outbox = session.scalar(
            select(NotificationOutbox).where(
                NotificationOutbox.event_type == "appointment_cancelled",
                NotificationOutbox.aggregate_id == appointment_id,
            )
        )
        return _cancellation_result(existing, outbox.status if outbox else "pending")

    if appointment.status not in ("pending", "confirmed"):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Cannot cancel appointment with status {appointment.status}",
        )

    policy = _assigned_policy(session, appointment.id)
    appointment_at = datetime.combine(
        appointment.appointment_date,
        appointment.start_time,
        tzinfo=APP_TIMEZONE,
    )
    minutes_before = int(
        (appointment_at - datetime.now(APP_TIMEZONE)).total_seconds() // 60
    )
    cutoff = (
        policy.patient_cancel_cutoff_minutes
        if actor == "patient"
        else policy.provider_cancel_cutoff_minutes
    )
    if cutoff is not None and minutes_before < cutoff:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Appointment is inside the cancellation cutoff",
        )

    refund_percentage = _refund_percentage(policy, actor, minutes_before)
    payment = session.scalar(
        select(Payment).where(
            Payment.appointment_id == appointment.id,
            Payment.status == "paid",
        )
    )
    refund = (
        queue_refund(session, payment, refund_percentage)
        if payment is not None and refund_percentage > 0
        else None
    )

    event = AppointmentStatusEvent(
        appointment_id=appointment.id,
        from_status=appointment.status,
        to_status="cancelled",
        actor_sub=subject,
        actor_role=actor,
        reason=reason,
        policy_id=policy.id,
        minutes_before=minutes_before,
        refund_percentage=refund_percentage,
        refund_status=refund.status if refund else "not_applicable",
    )
    appointment.status = "cancelled"
    session.add(event)
    session.flush()
    outbox = NotificationOutbox(
        event_type="appointment_cancelled",
        aggregate_id=appointment.id,
        payload=json.dumps(
            {
                "appointment_id": appointment.id,
                "booker_sub": appointment.booker_cognito_sub,
                "patient_full_name": appointment.patient_full_name,
                "doctor_name": doctor.display_name if doctor else "Bác sĩ",
                "appointment_date": appointment.appointment_date.isoformat(),
                "start_time": appointment.start_time.isoformat(),
                "reason": reason,
                "cancelled_by": actor,
                "refund_percentage": refund_percentage,
            },
            ensure_ascii=False,
        ),
        status="pending",
        attempts=0,
    )
    session.add(outbox)
    session.commit()
    session.refresh(event)
    return _cancellation_result(event, outbox.status)


def dispatch_notifications(session: Session) -> int:
    tomorrow = datetime.now(APP_TIMEZONE).date() + timedelta(days=1)
    appointments = session.scalars(
        select(Appointment).where(
            Appointment.appointment_date == tomorrow,
            Appointment.status == "confirmed",
        )
    )
    for appointment in appointments:
        exists = session.scalar(
            select(NotificationOutbox.id).where(
                NotificationOutbox.event_type == "appointment_reminder",
                NotificationOutbox.aggregate_id == appointment.id,
            )
        )
        if not exists:
            session.add(
                NotificationOutbox(
                    event_type="appointment_reminder",
                    aggregate_id=appointment.id,
                    payload=json.dumps(
                        {
                            "booker_sub": appointment.booker_cognito_sub,
                            "appointment_id": appointment.id,
                            "patient_full_name": appointment.patient_full_name,
                            "appointment_date": appointment.appointment_date.isoformat(),
                            "start_time": appointment.start_time.isoformat(),
                        },
                        ensure_ascii=False,
                    ),
                    status="pending",
                    attempts=0,
                )
            )
    session.flush()
    queue_url = os.environ["NOTIFICATION_QUEUE_URL"]
    messages = list(
        session.scalars(
            select(NotificationOutbox)
            .where(NotificationOutbox.status == "pending")
            .order_by(NotificationOutbox.id)
            .limit(10)
            .with_for_update(skip_locked=True)
        )
    )
    if not messages:
        return 0

    sqs = boto3.client("sqs")
    for message in messages:
        sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(
                {
                    "event_type": message.event_type,
                    "payload": json.loads(message.payload),
                },
                ensure_ascii=False,
            ),
            MessageGroupId=message.event_type,
            MessageDeduplicationId=str(message.id),
        )
        message.status = "queued"
        message.attempts += 1
        message.queued_at = datetime.now(UTC)
    session.commit()
    return len(messages)
