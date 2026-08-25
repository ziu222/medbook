import base64
import json
import logging
import os
from functools import cache
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from pydantic import ValidationError
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.chat.core_handler import _execute
from app.chat.schemas import ToolIdentity
from app.core.database import get_engine
from app.recommendations.schemas import RecommendationInput, SymptomInput

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)
DEFAULT_MODEL = "gemini-3.5-flash-lite"
logger = logging.getLogger(__name__)
EMERGENCY_TERMS = (
    "khó thở nghiêm trọng",
    "bất tỉnh",
    "đau ngực dữ dội",
    "chảy máu không cầm",
    "co giật",
    "đột quỵ",
    "liệt nửa người",
    "tự tử",
)


@cache
def _gemini_api_key() -> str:
    response = boto3.client("secretsmanager").get_secret_value(
        SecretId=os.environ["GEMINI_SECRET_ARN"]
    )
    secret = json.loads(response["SecretString"])
    if not isinstance(secret.get("api_key"), str) or not secret["api_key"]:
        raise RuntimeError("Gemini secret is missing api_key")
    return secret["api_key"]


def _gemini(contents: list[dict], system_instruction: str) -> dict:
    payload = {
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "contents": contents,
        "generationConfig": {
            "temperature": 0,
            "maxOutputTokens": 500,
            "responseMimeType": "application/json",
        },
    }
    request = Request(
        GEMINI_URL.format(model=os.getenv("GEMINI_MODEL", DEFAULT_MODEL)),
        data=json.dumps(payload).encode(),
        headers={
            "x-goog-api-key": _gemini_api_key(),
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=12) as response:
            return json.load(response)
    except (HTTPError, URLError, TimeoutError) as error:
        raise RuntimeError("Gemini request failed") from error


def _response_text(response: dict) -> str:
    return "".join(
        part.get("text", "") for part in response["candidates"][0]["content"]["parts"]
    )


def _invoke_core(tool: str, arguments: dict, identity: ToolIdentity):
    payload = {
        "operation": "ai-tool",
        "tool": tool,
        "arguments": arguments,
        "identity": {
            "subject": identity.subject,
            "groups": sorted(identity.groups),
        },
    }
    with Session(get_engine()) as session:
        session.execute(text("SET TRANSACTION READ ONLY"))
        return _execute(session, payload)


def _identity(event: dict) -> ToolIdentity:
    claims = (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("jwt", {})
        .get("claims", {})
    )
    raw_groups = claims.get("cognito:groups", [])
    if isinstance(raw_groups, str):
        try:
            raw_groups = json.loads(raw_groups)
        except json.JSONDecodeError:
            raw_groups = [raw_groups]
    return ToolIdentity(subject=claims.get("sub", ""), groups=set(raw_groups))


def _body(event: dict) -> dict:
    body = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode()
    return json.loads(body)


def _is_emergency(description: str) -> bool:
    normalized = description.casefold()
    return any(term in normalized for term in EMERGENCY_TERMS)


def _emergency_response() -> dict:
    return {
        "urgent": True,
        "specialty_id": None,
        "specialty_name": None,
        "reason": "Mô tả có dấu hiệu cần được đánh giá khẩn cấp.",
        "emergency_message": (
            "Hãy gọi 115 hoặc đến cơ sở cấp cứu gần nhất ngay; "
            "không chờ đặt lịch khám thông thường."
        ),
    }


def _classify(description: str, identity: ToolIdentity) -> dict:
    if _is_emergency(description):
        return _emergency_response()
    specialties = _invoke_core("list_specialties", {}, identity)
    response = _gemini(
        [
            {
                "role": "user",
                "parts": [
                    {
                        "text": (
                            f"Chuyên khoa: {json.dumps(specialties, ensure_ascii=False)}\n"
                            f"Triệu chứng: {description}"
                        )
                    }
                ],
            }
        ],
        (
            "Bạn chỉ định hướng chuyên khoa, không chẩn đoán. Chọn đúng một "
            "chuyên khoa trong danh sách và trả JSON gồm specialty_id, reason."
        ),
    )
    result = json.loads(_response_text(response))
    specialty = next(
        item for item in specialties if item["id"] == result.get("specialty_id")
    )
    return {
        "urgent": False,
        "specialty_id": specialty["id"],
        "specialty_name": specialty["name"],
        "reason": str(result.get("reason", "Phù hợp với mô tả triệu chứng."))[:300],
        "emergency_message": None,
    }


def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {"content-type": "application/json"},
        "body": json.dumps(body, ensure_ascii=False),
    }


def handler(event, _context):
    try:
        identity = _identity(event)
        route = event.get("routeKey")
        body = _body(event)
        if route == "POST /api/symptoms/classify":
            data = SymptomInput.model_validate(body)
            return _response(200, _classify(data.description, identity))
        if route == "POST /api/recommendations/doctors":
            data = RecommendationInput.model_validate(body)
            classification = _classify(data.description, identity)
            doctors = []
            if not classification["urgent"]:
                doctors = _invoke_core(
                    "search_doctors",
                    {
                        "specialty_id": classification["specialty_id"],
                        "appointment_date": data.appointment_date.isoformat(),
                        "facility_id": data.facility_id,
                    },
                    identity,
                )
                for doctor in doctors:
                    doctor["factors"] = [
                        "Chuyên khoa: {}".format(doctor["specialty_name"]),
                        "Đánh giá: {}".format(doctor["rating"]),
                        "Slot trống: {}".format(len(doctor["available_slots"])),
                    ]
            return _response(
                200, {"classification": classification, "doctors": doctors}
            )
        return _response(404, {"detail": "Not found"})
    except (ValidationError, ValueError, json.JSONDecodeError):
        return _response(422, {"detail": "Invalid request"})
    except (
        BotoCoreError,
        ClientError,
        KeyError,
        RuntimeError,
        StopIteration,
        TypeError,
    ):
        logger.exception("AI request failed")
        return _response(502, {"detail": "AI service temporarily unavailable"})
