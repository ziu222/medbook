import hashlib
import hmac
import json
import logging
import os
from datetime import datetime
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

import boto3
from botocore.exceptions import ClientError

from app.core.config import get_vnpay_credentials

logger = logging.getLogger(__name__)
APP_TIMEZONE = ZoneInfo("Asia/Ho_Chi_Minh")


def _attribute(user: dict, name: str) -> str:
    return next(
        item["Value"] for item in user["UserAttributes"] if item["Name"] == name
    )


def send_cancellation_email(payload: dict) -> None:
    user = boto3.client("cognito-idp").admin_get_user(
        UserPoolId=os.environ["COGNITO_USER_POOL_ID"],
        Username=payload["booker_sub"],
    )
    recipient = _attribute(user, "email")
    subject = f"MedBook — lịch khám #{payload['appointment_id']} đã được hủy"
    body = (
        f"Xin chào {payload['patient_full_name']},\n\n"
        f"Lịch khám với {payload['doctor_name']} lúc {payload['start_time']} "
        f"ngày {payload['appointment_date']} đã được hủy.\n"
        f"Lý do: {payload['reason']}\n"
        f"Mức hoàn phí theo chính sách: {payload['refund_percentage']}%.\n\n"
        "MedBook"
    )
    boto3.client("ses").send_email(
        Source=os.environ["SES_FROM_EMAIL"],
        Destination={"ToAddresses": [recipient]},
        Message={
            "Subject": {"Data": subject, "Charset": "UTF-8"},
            "Body": {"Text": {"Data": body, "Charset": "UTF-8"}},
        },
    )


def _refund_signature(values: dict[str, str], secret: str) -> str:
    fields = (
        "vnp_RequestId",
        "vnp_Version",
        "vnp_Command",
        "vnp_TmnCode",
        "vnp_TransactionType",
        "vnp_TxnRef",
        "vnp_Amount",
        "vnp_TransactionNo",
        "vnp_TransactionDate",
        "vnp_CreateBy",
        "vnp_CreateDate",
        "vnp_IpAddr",
        "vnp_OrderInfo",
    )
    data = "|".join(values.get(field, "") for field in fields)
    return hmac.new(secret.encode(), data.encode(), hashlib.sha512).hexdigest()


def _valid_refund_response(values: dict[str, str], secret: str) -> bool:
    fields = (
        "vnp_ResponseId",
        "vnp_Command",
        "vnp_ResponseCode",
        "vnp_Message",
        "vnp_TmnCode",
        "vnp_TxnRef",
        "vnp_Amount",
        "vnp_BankCode",
        "vnp_PayDate",
        "vnp_TransactionNo",
        "vnp_TransactionType",
        "vnp_TransactionStatus",
        "vnp_OrderInfo",
    )
    data = "|".join(str(values.get(field, "")) for field in fields)
    expected = hmac.new(secret.encode(), data.encode(), hashlib.sha512).hexdigest()
    return hmac.compare_digest(str(values.get("vnp_SecureHash", "")).lower(), expected)


def request_refund(payload: dict) -> None:
    credentials = get_vnpay_credentials()
    now = datetime.now(APP_TIMEZONE)
    values = {
        "vnp_RequestId": payload["request_id"],
        "vnp_Version": "2.1.0",
        "vnp_Command": "refund",
        "vnp_TmnCode": credentials["tmn_code"],
        "vnp_TransactionType": "02" if payload["percentage"] == 100 else "03",
        "vnp_TxnRef": payload["txn_ref"],
        "vnp_Amount": str(payload["amount_vnd"] * 100),
        "vnp_TransactionNo": payload.get("transaction_no") or "",
        "vnp_TransactionDate": payload["transaction_date"],
        "vnp_CreateBy": "medbook",
        "vnp_CreateDate": now.strftime("%Y%m%d%H%M%S"),
        "vnp_IpAddr": "127.0.0.1",
        "vnp_OrderInfo": f"Hoan tien lich kham {payload['txn_ref']}",
    }
    values["vnp_SecureHash"] = _refund_signature(values, credentials["hash_secret"])
    request = Request(
        os.environ["VNPAY_API_URL"],
        data=json.dumps(values).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=15) as response:
        result = json.loads(response.read())
    if not _valid_refund_response(result, credentials["hash_secret"]):
        raise RuntimeError("Invalid VNPAY refund response signature")

    response_code = str(result.get("vnp_ResponseCode", "99"))
    transaction_status = str(result.get("vnp_TransactionStatus", ""))
    if response_code == "00" and transaction_status == "00":
        result_status = "succeeded"
    elif response_code in {"00", "94"} or transaction_status in {"05", "06"}:
        result_status = "pending"
    else:
        result_status = "failed"
    invocation = boto3.client("lambda").invoke(
        FunctionName=os.environ["API_FUNCTION_NAME"],
        InvocationType="RequestResponse",
        Payload=json.dumps(
            {
                "operation": "record-refund-result",
                "refund_id": payload["refund_id"],
                "status": result_status,
                "response_code": response_code,
                "transaction_no": result.get("vnp_TransactionNo"),
            }
        ).encode(),
    )
    api_result = json.loads(invocation["Payload"].read())
    if invocation.get("FunctionError") or api_result.get("statusCode") != 200:
        raise RuntimeError("Could not persist refund result")


def handle_sqs(event: dict) -> dict:
    failures = []
    for record in event.get("Records", []):
        try:
            message = json.loads(record["body"])
            event_type = message.get("event_type", "appointment_cancelled")
            payload = message.get("payload", message)
            if event_type == "appointment_cancelled":
                send_cancellation_email(payload)
            elif event_type == "payment_refund_requested":
                request_refund(payload)
            else:
                raise ValueError("Unsupported event type")
        except Exception as error:  # noqa: BLE001
            error_code = (
                error.response.get("Error", {}).get("Code")
                if isinstance(error, ClientError)
                else type(error).__name__
            )
            logger.error("Async event failed: %s", error_code)
            failures.append({"itemIdentifier": record["messageId"]})
    return {"batchItemFailures": failures}
