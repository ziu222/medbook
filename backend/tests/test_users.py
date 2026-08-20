from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.auth import CurrentUser, get_current_user
from app.core.database import Base, get_session
from app.main import app


def test_profile_identity_comes_from_verified_claims() -> None:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)

    def session_override():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = session_override
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        subject="verified-sub", groups=frozenset({"patient"})
    )

    try:
        client = TestClient(app)
        response = client.put(
            "/api/users/me",
            json={
                "display_name": "Nguyen Van A",
                "phone_number": "+84901234567",
                "date_of_birth": "2000-01-02",
            },
        )

        assert response.status_code == 200
        assert response.json()["cognito_sub"] == "verified-sub"
        assert response.json()["date_of_birth"] == date(2000, 1, 2).isoformat()

        spoof = client.put(
            "/api/users/me",
            json={"cognito_sub": "attacker", "display_name": "Attacker"},
        )
        assert spoof.status_code == 422
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
