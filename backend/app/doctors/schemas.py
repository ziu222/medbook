from datetime import date, datetime, time
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    HttpUrl,
    field_validator,
    model_validator,
)


class SpecialtyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


class FacilityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    address: str
    phone_number: str | None
    rating: float


class FacilityPut(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=150)
    address: str = Field(min_length=1, max_length=300)
    phone_number: str | None = Field(default=None, pattern=r"^\+?[0-9]{8,15}$")


class DoctorSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    display_name: str
    specialty: SpecialtyRead
    facility: FacilityRead | None
    clinic_name: str | None
    professional_title: str | None
    years_experience: int
    slot_duration_minutes: int
    rating: float
    avatar_url: str | None


class DoctorDetail(DoctorSummary):
    bio: str | None
    certificates: list[str]

    @field_validator("certificates", mode="before")
    @classmethod
    def _default_certificates(cls, value: list[str] | None) -> list[str]:
        return value or []


class DoctorProfilePut(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    specialty_id: int = Field(ge=1)
    facility_id: int | None = Field(default=None, ge=1)
    display_name: str = Field(min_length=1, max_length=100)
    bio: str | None = Field(default=None, max_length=5000)
    clinic_name: str | None = Field(default=None, max_length=150)
    professional_title: str | None = Field(default=None, max_length=150)
    certificates: list[Annotated[str, Field(max_length=200)]] = Field(
        default_factory=list, max_length=20
    )
    years_experience: int = Field(default=0, ge=0, le=80)
    slot_duration_minutes: Literal[30, 60] = Field(default=30)
    avatar_url: HttpUrl | None = Field(default=None, max_length=500)


class DoctorAccountCreate(DoctorProfilePut):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=255)


class WorkingDayPut(BaseModel):
    start_time: time
    end_time: time

    @model_validator(mode="after")
    def validate_time_order(self):
        if self.start_time >= self.end_time:
            raise ValueError("start_time must be before end_time")
        return self


class WorkingDayRead(WorkingDayPut):
    model_config = ConfigDict(from_attributes=True)

    id: int
    work_date: date


class BlockedSlotPut(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    block_date: date
    start_time: time
    end_time: time
    reason: str | None = Field(default=None, max_length=200)

    @model_validator(mode="after")
    def validate_time_order(self):
        if self.start_time >= self.end_time:
            raise ValueError("start_time must be before end_time")
        return self


class BlockedSlotRead(BlockedSlotPut):
    model_config = ConfigDict(from_attributes=True)

    id: int


class DoctorReviewPut(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    score: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class DoctorReviewRead(DoctorReviewPut):
    model_config = ConfigDict(from_attributes=True)

    id: int
    appointment_id: int
    doctor_id: int
    created_at: datetime
    updated_at: datetime
