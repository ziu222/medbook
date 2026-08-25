import json

from app.main import handler


def test_recommendations_use_classification_and_domain_search(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.chat.handler._classify",
        lambda *_args: {
            "urgent": False,
            "specialty_id": 1,
            "specialty_name": "Tim mạch",
            "reason": "Phù hợp với triệu chứng.",
            "emergency_message": None,
        },
    )

    def invoke(tool, arguments, _identity):
        assert tool == "search_doctors"
        assert arguments == {
            "specialty_id": 1,
            "appointment_date": "2026-09-01",
            "facility_id": 2,
        }
        return [
            {
                "doctor_id": 3,
                "doctor_name": "Bác sĩ An",
                "specialty_name": "Tim mạch",
                "facility_name": "MedBook Clinic",
                "rating": 4.8,
                "available_slots": ["08:00:00"],
            }
        ]

    monkeypatch.setattr("app.chat.handler._invoke_core", invoke)
    event = {
        "routeKey": "POST /api/recommendations/doctors",
        "body": json.dumps(
            {
                "description": "Đau ngực nhẹ",
                "appointment_date": "2026-09-01",
                "facility_id": 2,
            }
        ),
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

    response = handler(event, None)
    body = json.loads(response["body"])

    assert response["statusCode"] == 200
    assert body["doctors"][0]["doctor_id"] == 3
    assert body["doctors"][0]["factors"] == [
        "Chuyên khoa: Tim mạch",
        "Đánh giá: 4.8",
        "Slot trống: 1",
    ]
