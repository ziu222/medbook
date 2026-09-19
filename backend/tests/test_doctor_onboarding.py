from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from starlette.requests import Request

from app.core.auth import CurrentUser, get_current_user
from app.core.database import Base, get_session
from app.doctors.models import DoctorProfile, Specialty
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


def test_admin_manages_profile_doctor_only_manages_schedule() -> None:
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

        profile = DoctorProfile(
            cognito_sub="verified-doctor-sub",
            specialty_id=specialty_id,
            display_name="Bác sĩ An",
            years_experience=5,
        )
        session.add(profile)
        session.commit()
        doctor_id = profile.id

    def session_override():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = session_override
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        subject="admin-sub",
        groups=frozenset({"admin"}),
    )

    try:
        client = TestClient(app)

        response = client.put(
            f"/api/admin/doctors/{doctor_id}",
            json={
                "specialty_id": specialty_id,
                "display_name": "Bác sĩ An",
                "bio": "Chuyên điều trị tim mạch.",
                "clinic_name": "MedBook Clinic",
                "years_experience": 10,
                "professional_title": "Thạc sĩ, Bác sĩ CKI",
                "certificates": ["Chứng chỉ hành nghề Nội tim mạch"],
            },
        )
        assert response.status_code == 200
        assert response.json()["display_name"] == "Bác sĩ An"
        assert response.json()["rating"] == 0
        assert response.json()["slot_duration_minutes"] == 30
        assert response.json()["professional_title"] == "Thạc sĩ, Bác sĩ CKI"

        invalid_duration = client.put(
            f"/api/admin/doctors/{doctor_id}",
            json={
                "specialty_id": specialty_id,
                "display_name": "Bác sĩ An",
                "years_experience": 10,
                "slot_duration_minutes": 45,
            },
        )
        assert invalid_duration.status_code == 422

        # Doctor cannot self-edit anymore — only admin has a write endpoint.
        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            subject="verified-doctor-sub",
            groups=frozenset({"doctor"}),
        )

        no_self_edit = client.put(
            "/api/doctor/me",
            json={"specialty_id": specialty_id, "display_name": "Attacker edit"},
        )
        assert no_self_edit.status_code == 405

        profile_detail = client.get("/api/doctor/me")
        assert profile_detail.status_code == 200
        assert profile_detail.json()["certificates"] == [
            "Chứng chỉ hành nghề Nội tim mạch"
        ]
        assert profile_detail.json()["specialty"]["slug"] == "tim-mach"

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

        # A doctor cannot edit another doctor's profile via the admin endpoint either.
        forbidden = client.put(
            f"/api/admin/doctors/{doctor_id}",
            json={"specialty_id": specialty_id, "display_name": "Attacker edit"},
        )
        assert forbidden.status_code == 403

        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            subject="patient-sub",
            groups=frozenset({"patient"}),
        )
        forbidden_read = client.get("/api/doctor/me")
        assert forbidden_read.status_code == 403
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
