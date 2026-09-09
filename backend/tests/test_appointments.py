from datetime import UTC, datetime, time, timedelta

from app.appointments.models import Appointment, PatientDependent
from app.cancellations.models import (
    AppointmentStatusEvent,
    CancellationPolicy,
    RefundTier,
)
from app.core.auth import CurrentUser, get_current_user
from app.core.database import Base, get_session
from app.doctors.models import DoctorProfile, DoctorWorkingDay, Specialty
from app.main import app
from app.users.models import UserProfile
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool


def test_booking_self_relative_availability_and_role_views() -> None:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    work_date = datetime.now(UTC).date() + timedelta(days=1)

    with Session(engine) as session:
        specialty = Specialty(name="Tim mạch", slug="tim-mach")
        doctor = DoctorProfile(
            cognito_sub="doctor-sub",
            specialty=specialty,
            display_name="Bác sĩ An",
            years_experience=10,
        )
        session.add_all(
            [
                doctor,
                DoctorProfile(
                    cognito_sub="other-doctor-sub",
                    specialty=specialty,
                    display_name="Bác sĩ Bình",
                    years_experience=8,
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
                UserProfile(
                    cognito_sub="patient-sub",
                    display_name="Nguyễn Văn A",
                    phone_number="0912345678",
                ),
            ]
        )
        session.flush()
        session.add(
            DoctorWorkingDay(
                doctor_id=doctor.id,
                work_date=work_date,
                start_time=time(8),
                end_time=time(10),
            )
        )
        session.commit()
        doctor_id = doctor.id

    def session_override():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = session_override
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        subject="patient-sub",
        groups=frozenset({"patient"}),
    )

    try:
        client = TestClient(app)
        availability = client.get(
            f"/api/doctors/{doctor_id}/availability",
            params={"date": work_date},
        )
        assert availability.status_code == 200
        assert len(availability.json()) == 4

        self_booking = {
            "doctor_id": doctor_id,
            "appointment_date": work_date.isoformat(),
            "start_time": "08:00",
            "booking_for": "self",
            "symptoms": "Đau ngực nhẹ khi vận động",
        }
        booked = client.post("/api/appointments", json=self_booking)
        assert booked.status_code == 201
        assert booked.json()["patient_full_name"] == "Nguyễn Văn A"
        appointment_id = booked.json()["id"]

        duplicate = client.post("/api/appointments", json=self_booking)
        assert duplicate.status_code == 409

        relative_booking = {
            "doctor_id": doctor_id,
            "appointment_date": work_date.isoformat(),
            "start_time": "08:30",
            "booking_for": "relative",
            "symptoms": "Đau đầu kéo dài",
            "relative": {
                "full_name": "Nguyễn Văn B",
                "relationship": "father",
                "phone_number": "0987654321",
                "national_id": "079123456789",
                "consent_confirmed": True,
            },
        }
        relative = client.post("/api/appointments", json=relative_booking)
        assert relative.status_code == 201
        assert relative.json()["patient_national_id_last4"] == "6789"
        assert "079123456789" not in relative.text

        relative_booking["start_time"] = "09:00"
        reused = client.post("/api/appointments", json=relative_booking)
        assert reused.status_code == 201

        mine = client.get("/api/appointments/me")
        assert mine.status_code == 200
        assert len(mine.json()) == 3
        filtered = client.get(
            "/api/appointments/me",
            params={
                "date": work_date,
                "status": "pending",
                "limit": 1,
                "offset": 1,
            },
        )
        assert filtered.status_code == 200
        assert len(filtered.json()) == 1
        assert client.get(f"/api/appointments/{appointment_id}").status_code == 200

        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            subject="other-patient-sub",
            groups=frozenset({"patient"}),
        )
        assert client.get(f"/api/appointments/{appointment_id}").status_code == 404

        with Session(engine) as session:
            dependents = list(session.scalars(select(PatientDependent)))
            assert len(dependents) == 1
            assert dependents[0].national_id_digest != "079123456789"

        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            subject="doctor-sub",
            groups=frozenset({"doctor"}),
        )
        doctor_view = client.get(
            "/api/doctor/appointments",
            params={"date": work_date, "status": "pending", "limit": 2, "offset": 1},
        )
        assert doctor_view.status_code == 200
        assert len(doctor_view.json()) == 2
        assert client.get(f"/api/appointments/{appointment_id}").status_code == 200
        assert (
            client.post(
                f"/api/doctor/appointments/{appointment_id}/complete"
            ).status_code
            == 409
        )

        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            subject="other-doctor-sub",
            groups=frozenset({"doctor"}),
        )
        assert client.get(f"/api/appointments/{appointment_id}").status_code == 404

        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            subject="doctor-sub",
            groups=frozenset({"doctor"}),
        )
        with Session(engine) as session:
            appointment = session.get(Appointment, appointment_id)
            appointment.status = "confirmed"
            appointment.appointment_date = work_date - timedelta(days=2)
            session.commit()

        completed = client.post(f"/api/doctor/appointments/{appointment_id}/complete")
        assert completed.status_code == 200
        assert completed.json()["status"] == "completed"
        assert (
            client.post(f"/api/doctor/appointments/{appointment_id}/complete").json()
            == completed.json()
        )
        assert (
            len(
                client.get(
                    "/api/doctor/appointments",
                    params={"status": "completed"},
                ).json()
            )
            == 1
        )
        with Session(engine) as session:
            event = session.scalar(
                select(AppointmentStatusEvent).where(
                    AppointmentStatusEvent.appointment_id == appointment_id,
                    AppointmentStatusEvent.to_status == "completed",
                )
            )
            assert event.actor_sub == "doctor-sub"
    finally:
        app.dependency_overrides.clear()


def test_hourly_doctor_gets_hourly_slots_and_cannot_change_with_active_booking() -> None:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    work_date = datetime.now(UTC).date() + timedelta(days=1)

    with Session(engine) as session:
        specialty = Specialty(name="Tim mạch", slug="tim-mach")
        doctor = DoctorProfile(
            cognito_sub="doctor-sub",
            specialty=specialty,
            display_name="Bác sĩ An",
            years_experience=10,
            slot_duration_minutes=60,
        )
        session.add_all(
            [
                doctor,
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
                UserProfile(
                    cognito_sub="patient-sub",
                    display_name="Nguyễn Văn A",
                    phone_number="0912345678",
                ),
            ]
        )
        session.flush()
        specialty_id = specialty.id
        session.add(
            DoctorWorkingDay(
                doctor_id=doctor.id,
                work_date=work_date,
                start_time=time(8),
                end_time=time(10),
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

        # 2-hour window at 60 min/slot => 2 slots (vs. 4 at the 30 min default).
        availability = client.get(
            f"/api/doctors/{doctor_id}/availability",
            params={"date": work_date},
        )
        assert availability.status_code == 200
        assert [slot["start_time"] for slot in availability.json()] == [
            "08:00:00",
            "09:00:00",
        ]

        booked = client.post(
            "/api/appointments",
            json={
                "doctor_id": doctor_id,
                "appointment_date": work_date.isoformat(),
                "start_time": "08:00",
                "booking_for": "self",
                "symptoms": "Đau ngực nhẹ khi vận động",
            },
        )
        assert booked.status_code == 201

        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            subject="admin-sub", groups=frozenset({"admin"})
        )
        blocked = client.put(
            f"/api/admin/doctors/{doctor_id}",
            json={
                "specialty_id": specialty_id,
                "display_name": "Bác sĩ An",
                "years_experience": 10,
                "slot_duration_minutes": 30,
            },
        )
        assert blocked.status_code == 409

        unrelated_update = client.put(
            f"/api/admin/doctors/{doctor_id}",
            json={
                "specialty_id": specialty_id,
                "display_name": "Bác sĩ An 2",
                "years_experience": 10,
                "slot_duration_minutes": 60,
            },
        )
        assert unrelated_update.status_code == 200
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_idempotent_booking_active_cap_and_reschedule() -> None:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    work_date = datetime.now(UTC).date() + timedelta(days=1)

    with Session(engine) as session:
        specialty = Specialty(name="Tim mạch", slug="tim-mach")
        doctor = DoctorProfile(
            cognito_sub="doctor-sub",
            specialty=specialty,
            display_name="Bác sĩ An",
            years_experience=10,
        )
        session.add_all(
            [
                doctor,
                CancellationPolicy(
                    patient_cancel_cutoff_minutes=60,
                    provider_cancel_cutoff_minutes=None,
                    is_active=True,
                    created_by_sub="system",
                    effective_from=datetime.now(UTC),
                    refund_tiers=[
                        RefundTier(
                            actor_role="patient",
                            min_minutes_before=60,
                            refund_percentage=100,
                        ),
                        RefundTier(
                            actor_role="provider",
                            min_minutes_before=0,
                            refund_percentage=100,
                        ),
                    ],
                ),
                UserProfile(
                    cognito_sub="patient-sub",
                    display_name="Nguyễn Văn A",
                    phone_number="0912345678",
                ),
            ]
        )
        session.flush()
        session.add(
            DoctorWorkingDay(
                doctor_id=doctor.id,
                work_date=work_date,
                start_time=time(8),
                end_time=time(14),
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

    def book(start_time: str, client_request_id: str | None = None) -> dict:
        payload = {
            "doctor_id": doctor_id,
            "appointment_date": work_date.isoformat(),
            "start_time": start_time,
            "booking_for": "self",
            "symptoms": "Đau ngực nhẹ khi vận động",
        }
        if client_request_id is not None:
            payload["client_request_id"] = client_request_id
        return client.post("/api/appointments", json=payload)

    try:
        client = TestClient(app)

        first = book("08:00", client_request_id="dup-key")
        assert first.status_code == 201
        appointment_id = first.json()["id"]
        assert first.json()["reschedule_count"] == 0

        # Unpaid (pending) appointments can't be rescheduled — cancel and rebook instead.
        unpaid_reschedule = client.post(
            f"/api/appointments/{appointment_id}/reschedule",
            json={"appointment_date": work_date.isoformat(), "start_time": "13:00"},
        )
        assert unpaid_reschedule.status_code == 409

        paid = client.post(f"/api/appointments/{appointment_id}/payment")
        assert paid.status_code == 201

        replay = book("08:00", client_request_id="dup-key")
        assert replay.status_code == 201
        assert replay.json()["id"] == appointment_id
        assert len(client.get("/api/appointments/me").json()) == 1

        for start_time in ("08:30", "09:00", "09:30", "10:00"):
            filler = book(start_time)
            assert filler.status_code == 201

        assert len(client.get("/api/appointments/me").json()) == 5

        over_cap = book("10:30")
        assert over_cap.status_code == 429

        moved = client.post(
            f"/api/appointments/{appointment_id}/reschedule",
            json={"appointment_date": work_date.isoformat(), "start_time": "13:00"},
        )
        assert moved.status_code == 200
        assert moved.json()["start_time"] == "13:00:00"
        assert moved.json()["reschedule_count"] == 1

        moved_again = client.post(
            f"/api/appointments/{appointment_id}/reschedule",
            json={"appointment_date": work_date.isoformat(), "start_time": "13:30"},
        )
        assert moved_again.status_code == 409
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
        engine.dispose()
