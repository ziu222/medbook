from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, HttpUrl


class PaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    appointment_id: int
    provider: Literal["vnpay"]
    amount_vnd: int
    status: Literal["pending", "paid", "failed", "refunded", "partially_refunded"]
    checkout_url: HttpUrl
    expires_at: datetime


class VnpayIpnResponse(BaseModel):
    RspCode: str
    Message: str
