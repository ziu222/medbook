import json
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.appointments.models import Appointment
from app.doctors.models import DoctorProfile
from app.payments.models import Payment, Refund

PAYMENT_TTL = timedelta(minutes=15)


def create_payment(
    session: Session,
    appointment_id: int,
    subject: str,
) -> Payment:
    appointment = session.scalar(
        select(Appointment).where(Appointment.id == appointment_id).with_for_update()
    )
    if appointment is None or appointment.booker_cognito_sub != subject:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")
    existing = session.scalar(
        select(Payment).where(Payment.appointment_id == appointment_id)
    )
    if existing is not None and existing.status == "paid":
        return existing
    if appointment.status != "pending":
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Cannot pay appointment with status {appointment.status}",
        )

    doctor = session.get(DoctorProfile, appointment.doctor_id)
    if doctor is None or doctor.consultation_fee_vnd is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Doctor has not configured a consultation fee"
        )

    now = datetime.now(UTC)
    if existing is None:
        payment = Payment(
            appointment_id=appointment.id,
            provider="manual",
            amount_vnd=doctor.consultation_fee_vnd,
            txn_ref=f"MANUAL-{appointment.id}-{secrets.token_hex(4)}",
            status="paid",
            checkout_url="https://medbook.invalid/manual-payment",
            transaction_date=now.strftime("%Y%m%d%H%M%S"),
            expires_at=now + PAYMENT_TTL,
            paid_at=now,
        )
        session.add(payment)
    else:
        payment = existing
        payment.provider = "manual"
        payment.status = "paid"
        payment.paid_at = now
    appointment.status = "confirmed"
    from app.cancellations.models import NotificationOutbox

    session.add(
        NotificationOutbox(
            event_type="payment_confirmed",
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
    session.commit()
    session.refresh(payment)
    return payment


def get_payment(session: Session, appointment_id: int, subject: str) -> Payment:
    payment = session.scalar(
        select(Payment)
        .join(Appointment, Appointment.id == Payment.appointment_id)
        .where(
            Payment.appointment_id == appointment_id,
            Appointment.booker_cognito_sub == subject,
        )
    )
    if payment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payment not found")
    return payment


def queue_refund(session: Session, payment: Payment, percentage: int) -> Refund:
    existing = session.scalar(select(Refund).where(Refund.payment_id == payment.id))
    if existing is not None:
        return existing

    refund = Refund(
        payment_id=payment.id,
        request_id=secrets.token_hex(16),
        amount_vnd=payment.amount_vnd * percentage // 100,
        percentage=percentage,
        status="succeeded",
        completed_at=datetime.now(UTC),
    )
    session.add(refund)
    payment.status = "refunded" if percentage == 100 else "partially_refunded"
    return refund
