from datetime import date, time
from pydantic import BaseModel


class ScheduleResponse(BaseModel):
    id: int
    doctor_id: int
    date: date
    start_time: time
    end_time: time

    model_config = {"from_attributes": True}
