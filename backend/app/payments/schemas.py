from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class PaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    appointment_id: int
    provider: Literal["manual", "vnpay"]
    amount_vnd: int
    status: Literal["pending", "paid", "failed", "refunded", "partially_refunded"]
    expires_at: datetime
