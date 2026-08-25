import json
import logging
import os

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


def _attribute(user: dict, name: str) -> str:
    return next(
        item["Value"] for item in user["UserAttributes"] if item["Name"] == name
    )


def send_email(event_type: str, payload: dict) -> None:
    user = boto3.client("cognito-idp").admin_get_user(
        UserPoolId=os.environ["COGNITO_USER_POOL_ID"],
        Username=payload["booker_sub"],
    )
    recipient = _attribute(user, "email")
    labels = {
        "appointment_booked": "đã được đặt",
        "payment_confirmed": "đã thanh toán",
        "appointment_reminder": "sắp diễn ra",
        "appointment_cancelled": "đã được hủy",
    }
    subject = f"MedBook — lịch khám #{payload['appointment_id']} {labels[event_type]}"
    body = (
        f"Xin chào {payload['patient_full_name']},\n\n"
        f"Lịch khám lúc {payload['start_time']} ngày {payload['appointment_date']} "
        f"{labels[event_type]}.\n"
        + (f"Lý do: {payload['reason']}\n" if payload.get("reason") else "")
        + "\nMedBook"
    )
    boto3.client("ses").send_email(
        Source=os.environ["SES_FROM_EMAIL"],
        Destination={"ToAddresses": [recipient]},
        Message={
            "Subject": {"Data": subject, "Charset": "UTF-8"},
            "Body": {"Text": {"Data": body, "Charset": "UTF-8"}},
        },
    )


def handle_sqs(event: dict) -> dict:
    failures = []
    for record in event.get("Records", []):
        try:
            message = json.loads(record["body"])
            event_type = message.get("event_type", "appointment_cancelled")
            payload = message.get("payload", message)
            if event_type not in {
                "appointment_booked",
                "payment_confirmed",
                "appointment_reminder",
                "appointment_cancelled",
            }:
                raise ValueError("Unsupported event type")
            send_email(event_type, payload)
        except Exception as error:  # noqa: BLE001
            error_code = (
                error.response.get("Error", {}).get("Code")
                if isinstance(error, ClientError)
                else type(error).__name__
            )
            logger.error("Async event failed: %s", error_code)
            failures.append({"itemIdentifier": record["messageId"]})
    return {"batchItemFailures": failures}
