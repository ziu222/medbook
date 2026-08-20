from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_session
from app.doctors.models import DoctorProfile, Specialty
from app.main import app


def test_doctor_catalog_filters_and_detail() -> None:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)

    with Session(engine) as session:
        cardiology = Specialty(name="Tim mạch", slug="tim-mach")
        dermatology = Specialty(name="Da liễu", slug="da-lieu")
        session.add_all([cardiology, dermatology])
        session.flush()
        cardiology_id = cardiology.id
        session.add_all(
            [
                DoctorProfile(
                    cognito_sub="doctor-an",
                    specialty_id=cardiology.id,
                    display_name="Bác sĩ An",
                    bio="Chuyên điều trị tim mạch.",
                    clinic_name="MedBook Clinic",
                    years_experience=10,
                    rating=Decimal("4.8"),
                ),
                DoctorProfile(
                    cognito_sub="doctor-binh",
                    specialty_id=dermatology.id,
                    display_name="Bác sĩ Bình",
                    years_experience=5,
                    rating=Decimal("4.5"),
                ),
            ]
        )
        session.commit()
        doctor_id = session.scalar(
            select(DoctorProfile.id).where(DoctorProfile.cognito_sub == "doctor-an")
        )

    def session_override():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = session_override
    try:
        client = TestClient(app)

        specialties = client.get("/api/specialties")
        assert specialties.status_code == 200
        assert {item["slug"] for item in specialties.json()} == {
            "tim-mach",
            "da-lieu",
        }

        doctors = client.get(
            "/api/doctors",
            params={"specialty_id": cardiology_id, "name": "an"},
        )
        assert doctors.status_code == 200
        assert [doctor["display_name"] for doctor in doctors.json()] == ["Bác sĩ An"]

        detail = client.get(f"/api/doctors/{doctor_id}")
        assert detail.status_code == 200
        assert detail.json()["specialty"]["slug"] == "tim-mach"
        assert detail.json()["bio"] == "Chuyên điều trị tim mạch."
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
