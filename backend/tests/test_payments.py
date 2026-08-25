from datetime import UTC, datetime, time, timedelta

from app.appointments.models import Appointment
from app.cancellations.models import CancellationPolicy, NotificationOutbox, RefundTier
from app.core.auth import CurrentUser, get_current_user
from app.core.database import Base, get_session
from app.doctors.models import DoctorProfile, DoctorWorkingDay, Specialty
from app.main import app
from app.payments.models import Payment, Refund
from app.users.models import UserProfile
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool


def test_patient_payment_confirms_appointment_and_refunds_on_cancel() -> None:
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

        paid = client.post(f"/api/appointments/{appointment_id}/payment")
        assert paid.status_code == 201
        assert paid.json() == {
            "appointment_id": appointment_id,
            "provider": "manual",
            "amount_vnd": 200_000,
            "status": "paid",
            "expires_at": paid.json()["expires_at"],
        }
        assert client.post(f"/api/appointments/{appointment_id}/payment").json() == (
            paid.json()
        )

        with Session(engine) as session:
            assert session.get(Appointment, appointment_id).status == "confirmed"
            assert session.scalar(select(Payment)).status == "paid"

        cancelled = client.post(
            f"/api/appointments/{appointment_id}/cancel",
            json={"reason": "Thay đổi kế hoạch"},
        )
        assert cancelled.status_code == 200
        assert cancelled.json()["refund_status"] == "succeeded"

        with Session(engine) as session:
            assert session.scalar(select(Payment)).status == "refunded"
            refund = session.scalar(select(Refund))
            assert refund.status == "succeeded"
            assert refund.amount_vnd == 200_000
            assert set(session.scalars(select(NotificationOutbox.event_type))) == {
                "appointment_booked",
                "payment_confirmed",
                "appointment_cancelled",
            }
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
