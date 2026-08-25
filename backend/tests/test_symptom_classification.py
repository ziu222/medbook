import json

from app.main import handler


def _event(description: str) -> dict:
    return {
        "routeKey": "POST /api/symptoms/classify",
        "body": json.dumps({"description": description}),
        "requestContext": {
            "authorizer": {
                "jwt": {
                    "claims": {
                        "sub": "patient-sub",
                        "cognito:groups": json.dumps(["patient"]),
                    }
                }
            }
        },
    }


def test_emergency_stops_before_external_calls(monkeypatch) -> None:
    def fail(*_args, **_kwargs):
        raise AssertionError("external service must not be called")

    monkeypatch.setattr("app.chat.handler._gemini", fail)
    monkeypatch.setattr("app.chat.handler._invoke_core", fail)

    response = handler(_event("Người bệnh bất tỉnh và đang co giật"), None)

    assert response["statusCode"] == 200
    assert "115" in json.loads(response["body"])["emergency_message"]


def test_classification_uses_valid_specialty(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.chat.handler._invoke_core",
        lambda *_args: [{"id": 9, "name": "Thần kinh"}],
    )
    monkeypatch.setattr(
        "app.chat.handler._gemini",
        lambda *_args: {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps(
                                    {
                                        "specialty_id": 9,
                                        "reason": "Phù hợp với triệu chứng.",
                                    }
                                )
                            }
                        ]
                    }
                }
            ]
        },
    )

    response = handler(_event("Tôi thường xuyên đau đầu và chóng mặt"), None)
    body = json.loads(response["body"])

    assert response["statusCode"] == 200
    assert body["urgent"] is False
    assert body["specialty_id"] == 9
    assert body["specialty_name"] == "Thần kinh"
