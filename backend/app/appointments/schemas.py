from datetime import datetime
from pydantic import BaseModel


class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_time: datetime
    notes: str | None = None


class AppointmentResponse(BaseModel):
    id: int
    user_id: int
    doctor_id: int
    appointment_time: datetime
    status: str
    notes: str | None = None

    model_config = {"from_attributes": True}
