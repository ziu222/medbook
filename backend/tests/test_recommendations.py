import pytest
from app.chat.core_handler import _execute
from app.core.database import Base
from app.doctors.models import Specialty
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool


def _identity(groups: list[str]) -> dict:
    return {"subject": "user-sub", "groups": groups}


def test_tools_read_real_data_and_enforce_role() -> None:
    engine = create_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(Specialty(name="Tim mạch", slug="tim-mach-ai"))
        session.commit()

        result = _execute(
            session,
            {
                "operation": "ai-tool",
                "tool": "list_specialties",
                "arguments": {},
                "identity": _identity(["patient"]),
            },
        )
        assert result == [{"id": 1, "name": "Tim mạch"}]

        with pytest.raises(PermissionError):
            _execute(
                session,
                {
                    "operation": "ai-tool",
                    "tool": "get_my_appointments",
                    "arguments": {},
                    "identity": _identity(["admin"]),
                },
            )
    engine.dispose()
