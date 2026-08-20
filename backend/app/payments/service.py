import hashlib
import hmac
import json
import secrets
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.appointments.models import Appointment
from app.core.config import get_vnpay_credentials
from app.payments.models import Payment, Refund

APP_TIMEZONE = ZoneInfo("Asia/Ho_Chi_Minh")
PAYMENT_TTL = timedelta(minutes=15)
# Flat platform fee to hold/confirm a slot — unrelated to the doctor's own
# consultation fee, which is paid at the clinic and never flows through VNPAY.
BOOKING_FEE_VND = 150_000


def _sign_query(values: dict[str, str], secret: str) -> str:
    sign_data = urlencode(sorted(values.items()))
    return hmac.new(secret.encode(), sign_data.encode(), hashlib.sha512).hexdigest()


def validate_vnpay_signature(values: dict[str, str], secret: str) -> bool:
    received = values.get("vnp_SecureHash", "")
    signed_values = {
        key: value
        for key, value in values.items()
        if key.startswith("vnp_")
        and key not in {"vnp_SecureHash", "vnp_SecureHashType"}
        and value
    }
    return bool(received) and hmac.compare_digest(
        received.lower(), _sign_query(signed_values, secret)
    )


def create_payment(
    session: Session,
    appointment_id: int,
    subject: str,
    client_ip: str,
) -> Payment:
    appointment = session.scalar(
        select(Appointment).where(Appointment.id == appointment_id).with_for_update()
    )
    if appointment is None or appointment.booker_cognito_sub != subject:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")
    if appointment.status != "pending":
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Cannot pay appointment with status {appointment.status}",
        )

    existing = session.scalar(
        select(Payment).where(Payment.appointment_id == appointment_id)
    )
    if existing is not None:
        return existing

    credentials = get_vnpay_credentials()
    now = datetime.now(APP_TIMEZONE)
    expires_at = now + PAYMENT_TTL
    txn_ref = f"MB{appointment.id}{now:%Y%m%d%H%M%S}{secrets.token_hex(4)}"
    values = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": credentials["tmn_code"],
        "vnp_Amount": str(BOOKING_FEE_VND * 100),
        "vnp_CreateDate": now.strftime("%Y%m%d%H%M%S"),
        "vnp_CurrCode": "VND",
        "vnp_IpAddr": client_ip[:45],
        "vnp_Locale": "vn",
        "vnp_OrderInfo": f"Thanh toan lich kham {appointment.id}",
        "vnp_OrderType": "other",
        "vnp_ReturnUrl": credentials["return_url"],
        "vnp_ExpireDate": expires_at.strftime("%Y%m%d%H%M%S"),
        "vnp_TxnRef": txn_ref,
    }
    values["vnp_SecureHash"] = _sign_query(values, credentials["hash_secret"])
    payment = Payment(
        appointment_id=appointment.id,
        provider="vnpay",
        amount_vnd=BOOKING_FEE_VND,
        txn_ref=txn_ref,
        status="pending",
        checkout_url=f"{credentials['pay_url']}?{urlencode(sorted(values.items()))}",
        transaction_date=values["vnp_CreateDate"],
        expires_at=expires_at.astimezone(UTC),
    )
    session.add(payment)
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

    from app.cancellations.models import NotificationOutbox

    refund = Refund(
        payment_id=payment.id,
        request_id=secrets.token_hex(16),
        amount_vnd=payment.amount_vnd * percentage // 100,
        percentage=percentage,
        status="pending",
    )
    session.add(refund)
    session.flush()
    session.add(
        NotificationOutbox(
            event_type="payment_refund_requested",
            aggregate_id=refund.id,
            payload=json.dumps(
                {
                    "refund_id": refund.id,
                    "request_id": refund.request_id,
                    "txn_ref": payment.txn_ref,
                    "amount_vnd": refund.amount_vnd,
                    "percentage": refund.percentage,
                    "transaction_no": payment.provider_transaction_no,
                    "transaction_date": payment.transaction_date,
                }
            ),
            status="pending",
            attempts=0,
        )
    )
    return refund


def process_vnpay_ipn(session: Session, values: dict[str, str]) -> dict[str, str]:
    credentials = get_vnpay_credentials()
    if not validate_vnpay_signature(values, credentials["hash_secret"]):
        return {"RspCode": "97", "Message": "Invalid signature"}
    if values.get("vnp_TmnCode") != credentials["tmn_code"]:
        return {"RspCode": "97", "Message": "Invalid terminal"}

    payment = session.scalar(
        select(Payment)
        .where(Payment.txn_ref == values.get("vnp_TxnRef"))
        .with_for_update()
    )
    if payment is None:
        return {"RspCode": "01", "Message": "Order not found"}
    try:
        received_amount = int(values.get("vnp_Amount", ""))
    except ValueError:
        return {"RspCode": "04", "Message": "Invalid amount"}
    if received_amount != payment.amount_vnd * 100:
        return {"RspCode": "04", "Message": "Invalid amount"}
    if payment.status == "paid":
        return {"RspCode": "02", "Message": "Order already confirmed"}
    if payment.status != "pending":
        return {"RspCode": "02", "Message": "Order already processed"}

    appointment = session.get(Appointment, payment.appointment_id)
    if appointment is None:
        return {"RspCode": "01", "Message": "Order not found"}
    success = (
        values.get("vnp_ResponseCode") == "00"
        and values.get("vnp_TransactionStatus") == "00"
    )
    payment.status = "paid" if success else "failed"
    payment.response_code = values.get("vnp_ResponseCode")
    payment.provider_transaction_no = values.get("vnp_TransactionNo")
    payment.provider_pay_date = values.get("vnp_PayDate")
    if success:
        payment.paid_at = datetime.now(UTC)
        if appointment.status == "cancelled":
            refund = queue_refund(session, payment, 100)
            from app.cancellations.models import AppointmentStatusEvent

            cancellation = session.scalar(
                select(AppointmentStatusEvent).where(
                    AppointmentStatusEvent.appointment_id == appointment.id,
                    AppointmentStatusEvent.to_status == "cancelled",
                )
            )
            if cancellation is not None:
                cancellation.refund_percentage = 100
                cancellation.refund_status = refund.status
        elif appointment.status == "pending":
            appointment.status = "confirmed"
        else:
            session.rollback()
            return {"RspCode": "02", "Message": "Order already processed"}
    elif appointment.status == "pending":
        appointment.status = "cancelled"
    session.commit()
    return {"RspCode": "00", "Message": "Confirm success"}


def record_refund_result(session: Session, event: dict) -> None:
    refund = session.scalar(
        select(Refund).where(Refund.id == int(event["refund_id"])).with_for_update()
    )
    if refund is None or refund.status == "succeeded":
        return
    refund.status = event["status"]
    refund.provider_response_code = event.get("response_code")
    refund.provider_transaction_no = event.get("transaction_no")
    if refund.status in {"succeeded", "failed"}:
        refund.completed_at = datetime.now(UTC)

    payment = session.get(Payment, refund.payment_id)
    if payment is not None and refund.status == "succeeded":
        payment.status = (
            "refunded" if refund.percentage == 100 else "partially_refunded"
        )

    from app.cancellations.models import AppointmentStatusEvent

    status_event = (
        session.scalar(
            select(AppointmentStatusEvent).where(
                AppointmentStatusEvent.appointment_id == payment.appointment_id
            )
        )
        if payment
        else None
    )
    if status_event is not None:
        status_event.refund_status = refund.status
    session.commit()
