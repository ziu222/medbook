from datetime import UTC, datetime, time, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.appointments.models import PatientDependent
from app.core.auth import CurrentUser, get_current_user
from app.core.database import Base, get_session
from app.doctors.models import DoctorProfile, DoctorWorkingDay, Specialty
from app.main import app
from app.users.models import UserProfile


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
            params={"date": work_date},
        )
        assert doctor_view.status_code == 200
        assert len(doctor_view.json()) == 3
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
