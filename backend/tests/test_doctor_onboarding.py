from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from starlette.requests import Request

from app.core.auth import CurrentUser, get_current_user
from app.core.database import Base, get_session
from app.doctors.models import Specialty
from app.main import app


def test_cognito_group_string_is_parsed() -> None:
    request = Request(
        {
            "type": "http",
            "aws.event": {
                "requestContext": {
                    "authorizer": {
                        "jwt": {
                            "claims": {
                                "sub": "doctor-sub",
                                "cognito:groups": '["doctor"]',
                            }
                        }
                    }
                }
            },
        }
    )
    assert get_current_user(request).groups == frozenset({"doctor"})


def test_doctor_can_create_and_read_own_profile() -> None:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)

    with Session(engine) as session:
        specialty = Specialty(name="Tim mạch", slug="tim-mach")
        session.add(specialty)
        session.commit()
        specialty_id = specialty.id

    def session_override():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = session_override
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        subject="verified-doctor-sub",
        groups=frozenset({"doctor"}),
    )

    try:
        client = TestClient(app)
        response = client.put(
            "/api/doctor/me",
            json={
                "specialty_id": specialty_id,
                "display_name": "Bác sĩ An",
                "bio": "Chuyên điều trị tim mạch.",
                "clinic_name": "MedBook Clinic",
                "years_experience": 10,
            },
        )
        assert response.status_code == 200
        assert response.json()["display_name"] == "Bác sĩ An"
        assert response.json()["rating"] == 0

        profile = client.get("/api/doctor/me")
        assert profile.status_code == 200
        assert profile.json()["specialty"]["slug"] == "tim-mach"

        work_date = datetime.now(UTC).date() + timedelta(days=1)
        schedule = client.put(
            f"/api/doctor/schedules/{work_date.isoformat()}",
            json={"start_time": "08:00", "end_time": "17:00"},
        )
        assert schedule.status_code == 200
        assert schedule.json()["work_date"] == work_date.isoformat()

        replacement = client.put(
            f"/api/doctor/schedules/{work_date.isoformat()}",
            json={"start_time": "09:00", "end_time": "16:00"},
        )
        assert replacement.status_code == 200

        schedules = client.get(
            "/api/doctor/schedules",
            params={"date_from": work_date, "date_to": work_date},
        )
        assert schedules.status_code == 200
        assert len(schedules.json()) == 1
        assert schedules.json()[0]["start_time"] == "09:00:00"

        invalid_schedule = client.put(
            f"/api/doctor/schedules/{work_date.isoformat()}",
            json={"start_time": "17:00", "end_time": "08:00"},
        )
        assert invalid_schedule.status_code == 422

        spoof = client.put(
            "/api/doctor/me",
            json={
                "cognito_sub": "attacker",
                "specialty_id": specialty_id,
                "display_name": "Attacker",
            },
        )
        assert spoof.status_code == 422

        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            subject="patient-sub",
            groups=frozenset({"patient"}),
        )
        forbidden = client.get("/api/doctor/me")
        assert forbidden.status_code == 403
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
