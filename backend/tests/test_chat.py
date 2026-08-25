import json

import pytest
from app.chat.core_handler import _execute
from app.core.database import Base
from app.doctors.models import Specialty
from app.main import handler
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool


def _identity(groups: list[str]) -> dict:
    return {"subject": "user-sub", "groups": groups}


def test_emergency_chat_stops_before_external_calls(monkeypatch) -> None:
    def fail(*_args, **_kwargs):
        raise AssertionError("external service must not be called")

    monkeypatch.setattr("app.chat.handler._gemini", fail)
    monkeypatch.setattr("app.chat.handler._invoke_core", fail)
    event = {
        "routeKey": "POST /api/chat",
        "body": json.dumps({"message": "Người bệnh bất tỉnh và đang co giật"}),
        "requestContext": {
            "authorizer": {
                "jwt": {
                    "claims": {
                        "sub": "user-sub",
                        "cognito:groups": '["patient"]',
                    }
                }
            }
        },
    }

    response = handler(event, None)

    assert response["statusCode"] == 200
    assert "115" in json.loads(response["body"])["reply"]


def test_core_tools_validate_identity_and_read_real_specialties() -> None:
    engine = create_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(Specialty(name="Tim mạch", slug="tim-mach"))
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


def test_chat_executes_gemini_function_call(monkeypatch) -> None:
    responses = iter(
        [
            {
                "candidates": [
                    {
                        "content": {
                            "role": "model",
                            "parts": [
                                {
                                    "functionCall": {
                                        "name": "search_doctors",
                                        "args": {"specialty_id": 1},
                                    }
                                }
                            ],
                        }
                    }
                ]
            },
            {
                "candidates": [
                    {
                        "content": {
                            "role": "model",
                            "parts": [{"text": "Có một bác sĩ phù hợp."}],
                        }
                    }
                ]
            },
        ]
    )

    monkeypatch.setattr(
        "app.chat.handler._gemini", lambda *_args, **_kwargs: next(responses)
    )

    def invoke(tool, arguments, _identity):
        if tool == "list_specialties":
            return [{"id": 1, "name": "Tim mạch"}]
        assert tool == "search_doctors"
        assert arguments == {"specialty_id": 1}
        return [{"id": 2, "full_name": "Bác sĩ A"}]

    monkeypatch.setattr("app.chat.handler._invoke_core", invoke)
    event = {
        "routeKey": "POST /api/chat",
        "body": json.dumps({"message": "Tìm bác sĩ tim mạch"}),
        "requestContext": {
            "authorizer": {
                "jwt": {
                    "claims": {
                        "sub": "user-sub",
                        "cognito:groups": json.dumps(["patient"]),
                    }
                }
            }
        },
    }

    response = handler(event, None)
    body = json.loads(response["body"])

    assert response["statusCode"] == 200
    assert body == {
        "reply": "Có một bác sĩ phù hợp.",
        "tools_used": ["search_doctors"],
    }
