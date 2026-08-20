import hashlib
import hmac
from datetime import UTC, datetime, time, timedelta
from urllib.parse import parse_qs, urlencode, urlparse

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.appointments.models import Appointment
from app.cancellations.models import CancellationPolicy, NotificationOutbox, RefundTier
from app.core.auth import CurrentUser, get_current_user
from app.core.database import Base, get_session
from app.doctors.models import DoctorProfile, DoctorWorkingDay, Specialty
from app.main import app
from app.payments.models import Payment, Refund
from app.users.models import UserProfile

SECRET = "test-secret"


def _sign(values: dict[str, str]) -> str:
    data = urlencode(sorted(values.items()))
    return hmac.new(SECRET.encode(), data.encode(), hashlib.sha512).hexdigest()


def test_vnpay_signature_amount_idempotency_and_refund_outbox(monkeypatch) -> None:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    work_date = datetime.now(UTC).date() + timedelta(days=10)
    with Session(engine) as session:
        doctor = DoctorProfile(
            cognito_sub="doctor-sub",
            specialty=Specialty(name="Tim mạch", slug="tim-mach-payment"),
            display_name="Bác sĩ An",
            years_experience=10,
            consultation_fee_vnd=200_000,
        )
        session.add_all(
            [
                doctor,
                UserProfile(
                    cognito_sub="patient-sub",
                    display_name="Nguyễn Văn A",
                    phone_number="0912345678",
                ),
                CancellationPolicy(
                    patient_cancel_cutoff_minutes=1440,
                    provider_cancel_cutoff_minutes=None,
                    is_active=True,
                    created_by_sub="system",
                    effective_from=datetime.now(UTC),
                    refund_tiers=[
                        RefundTier(
                            actor_role="patient",
                            min_minutes_before=1440,
                            refund_percentage=100,
                        ),
                        RefundTier(
                            actor_role="provider",
                            min_minutes_before=0,
                            refund_percentage=100,
                        ),
                    ],
                ),
            ]
        )
        session.flush()
        session.add(
            DoctorWorkingDay(
                doctor_id=doctor.id,
                work_date=work_date,
                start_time=time(8),
                end_time=time(9),
            )
        )
        session.commit()
        doctor_id = doctor.id

    def session_override():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = session_override
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        subject="patient-sub", groups=frozenset({"patient"})
    )
    monkeypatch.setattr(
        "app.payments.service.get_vnpay_credentials",
        lambda: {
            "tmn_code": "TESTCODE",
            "hash_secret": SECRET,
            "pay_url": "https://sandbox.vnpayment.vn/pay",
            "return_url": "https://medbook.example/payment/result",
        },
    )

    try:
        client = TestClient(app)
        booked = client.post(
            "/api/appointments",
            json={
                "doctor_id": doctor_id,
                "appointment_date": work_date.isoformat(),
                "start_time": "08:00",
                "booking_for": "self",
                "symptoms": "Đau ngực nhẹ",
            },
        )
        appointment_id = booked.json()["id"]
        started = client.post(f"/api/appointments/{appointment_id}/payment")
        assert started.status_code == 201
        assert started.json()["amount_vnd"] == 150_000

        params = {
            key: values[0]
            for key, values in parse_qs(
                urlparse(started.json()["checkout_url"]).query
            ).items()
        }
        assert hmac.compare_digest(params.pop("vnp_SecureHash"), _sign(params))

        ipn = {
            "vnp_TmnCode": "TESTCODE",
            "vnp_TxnRef": params["vnp_TxnRef"],
            "vnp_Amount": "15000000",
            "vnp_ResponseCode": "00",
            "vnp_TransactionStatus": "00",
            "vnp_TransactionNo": "123456",
            "vnp_PayDate": "20260819120000",
        }
        forged = ipn | {"vnp_Amount": "10000"}
        forged["vnp_SecureHash"] = _sign(forged)
        assert (
            client.get("/api/payments/vnpay/ipn", params=forged).json()["RspCode"]
            == "04"
        )

        ipn["vnp_SecureHash"] = _sign(ipn)
        assert (
            client.get("/api/payments/vnpay/ipn", params=ipn).json()["RspCode"] == "00"
        )
        assert (
            client.get("/api/payments/vnpay/ipn", params=ipn).json()["RspCode"] == "02"
        )

        cancelled = client.post(
            f"/api/appointments/{appointment_id}/cancel",
            json={"reason": "Thay đổi kế hoạch"},
        )
        assert cancelled.json()["refund_status"] == "pending"
        with Session(engine) as session:
            assert session.scalar(select(Payment)).status == "paid"
            assert session.scalar(select(Refund)).amount_vnd == 150_000
            event_types = set(session.scalars(select(NotificationOutbox.event_type)))
            assert event_types == {"appointment_cancelled", "payment_refund_requested"}

        late_booking = client.post(
            "/api/appointments",
            json={
                "doctor_id": doctor_id,
                "appointment_date": work_date.isoformat(),
                "start_time": "08:30",
                "booking_for": "self",
                "symptoms": "Đau đầu",
            },
        ).json()
        late_payment = client.post(
            f"/api/appointments/{late_booking['id']}/payment"
        ).json()
        late_params = {
            key: values[0]
            for key, values in parse_qs(
                urlparse(late_payment["checkout_url"]).query
            ).items()
        }
        late_params.pop("vnp_SecureHash")
        cancelled_before_ipn = client.post(
            f"/api/appointments/{late_booking['id']}/cancel",
            json={"reason": "Hủy khi đang thanh toán"},
        )
        assert cancelled_before_ipn.json()["refund_status"] == "not_applicable"

        late_ipn = {
            "vnp_TmnCode": "TESTCODE",
            "vnp_TxnRef": late_params["vnp_TxnRef"],
            "vnp_Amount": "15000000",
            "vnp_ResponseCode": "00",
            "vnp_TransactionStatus": "00",
            "vnp_TransactionNo": "654321",
            "vnp_PayDate": "20260819120500",
        }
        late_ipn["vnp_SecureHash"] = _sign(late_ipn)
        assert (
            client.get("/api/payments/vnpay/ipn", params=late_ipn).json()["RspCode"]
            == "00"
        )
        with Session(engine) as session:
            assert session.get(Appointment, late_booking["id"]).status == "cancelled"
            late_payment_row = session.scalar(
                select(Payment).where(Payment.appointment_id == late_booking["id"])
            )
            assert late_payment_row.status == "paid"
            late_refund = session.scalar(
                select(Refund).where(Refund.payment_id == late_payment_row.id)
            )
            assert late_refund.percentage == 100
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
