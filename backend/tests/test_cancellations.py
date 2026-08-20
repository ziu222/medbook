import json
from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.cancellations.models import (
    AppointmentStatusEvent,
    CancellationPolicy,
    NotificationOutbox,
    RefundTier,
)
from app.core.auth import CurrentUser, get_current_user
from app.core.database import Base, get_session
from app.doctors.models import DoctorProfile, DoctorWorkingDay, Specialty
from app.main import app
from app.users.models import UserProfile


def test_patient_cutoff_doctor_override_and_outbox() -> None:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    today = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).date()
    far_date, near_date = today + timedelta(days=10), today + timedelta(days=2)

    with Session(engine) as session:
        doctor = DoctorProfile(
            cognito_sub="doctor-sub",
            specialty=Specialty(name="Nội tổng quát", slug="noi-tong-quat"),
            display_name="Bác sĩ An",
            years_experience=10,
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
                    patient_cancel_cutoff_minutes=10080,
                    provider_cancel_cutoff_minutes=None,
                    is_active=True,
                    created_by_sub="system",
                    effective_from=datetime.now(UTC),
                    refund_tiers=[
                        RefundTier(
                            actor_role="patient",
                            min_minutes_before=10080,
                            refund_percentage=100,
                        ),
                        RefundTier(
                            actor_role="patient",
                            min_minutes_before=0,
                            refund_percentage=0,
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
        session.add_all(
            [
                DoctorWorkingDay(
                    doctor_id=doctor.id,
                    work_date=work_date,
                    start_time=time(8),
                    end_time=time(9),
                )
                for work_date in (far_date, near_date)
            ]
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

        def book(work_date):
            response = client.post(
                "/api/appointments",
                json={
                    "doctor_id": doctor_id,
                    "appointment_date": work_date.isoformat(),
                    "start_time": "08:00",
                    "booking_for": "self",
                    "symptoms": "Thông tin nhạy cảm không được đưa vào outbox",
                },
            )
            assert response.status_code == 201
            return response.json()["id"]

        far_id, near_id = book(far_date), book(near_date)
        cancelled = client.post(
            f"/api/appointments/{far_id}/cancel",
            json={"reason": "Không còn nhu cầu khám"},
        )
        assert cancelled.status_code == 200
        assert cancelled.json()["refund_percentage"] == 100
        assert cancelled.json()["refund_status"] == "not_applicable"

        repeated = client.post(
            f"/api/appointments/{far_id}/cancel",
            json={"reason": "Yêu cầu lặp lại"},
        )
        assert repeated.status_code == 200
        assert repeated.json()["reason"] == "Không còn nhu cầu khám"

        blocked = client.post(
            f"/api/appointments/{near_id}/cancel",
            json={"reason": "Đổi ý"},
        )
        assert blocked.status_code == 409

        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            subject="doctor-sub", groups=frozenset({"doctor"})
        )
        doctor_cancelled = client.post(
            f"/api/doctor/appointments/{near_id}/cancel",
            json={"reason": "Bác sĩ bận đột xuất"},
        )
        assert doctor_cancelled.status_code == 200
        assert doctor_cancelled.json()["refund_percentage"] == 100

        with Session(engine) as session:
            assert len(list(session.scalars(select(AppointmentStatusEvent)))) == 2
            outboxes = list(session.scalars(select(NotificationOutbox)))
            assert len(outboxes) == 2
            assert "Thông tin nhạy cảm" not in outboxes[0].payload
            assert "booker_sub" in json.loads(outboxes[0].payload)
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
