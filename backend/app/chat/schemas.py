from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ChatInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    message: str = Field(min_length=3, max_length=2000)


class ToolIdentity(BaseModel):
    model_config = ConfigDict(extra="forbid")

    subject: str = Field(min_length=1, max_length=128)
    groups: set[Literal["patient", "doctor", "admin"]] = Field(max_length=1)


class CoreToolRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    operation: Literal["ai-tool"]
    tool: Literal[
        "list_specialties",
        "search_doctors",
        "get_doctor_schedule",
        "get_my_appointments",
    ]
    arguments: dict
    identity: ToolIdentity


class SearchDoctorsArgs(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    specialty_id: int = Field(ge=1)
    appointment_date: date | None = None
    facility_id: int | None = Field(default=None, ge=1)
    name: str | None = Field(default=None, min_length=1, max_length=100)


class DoctorScheduleArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")

    doctor_id: int = Field(ge=1)
    appointment_date: date


class MyAppointmentsArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")

    appointment_date: date | None = None
    status: Literal["pending", "confirmed", "completed", "cancelled"] | None = None
