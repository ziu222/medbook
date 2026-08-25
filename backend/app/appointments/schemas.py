from datetime import date, datetime, time
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, SecretStr, field_validator

Relationship = Literal["father", "mother", "child", "spouse", "sibling", "other"]
AppointmentStatus = Literal["pending", "confirmed", "completed", "cancelled"]


class RelativeInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    full_name: str = Field(min_length=1, max_length=100)
    relationship: Relationship
    phone_number: str = Field(pattern=r"^\+?[0-9]{8,15}$")
    national_id: SecretStr
    consent_confirmed: Literal[True]

    @field_validator("national_id")
    @classmethod
    def validate_national_id(cls, value: SecretStr) -> SecretStr:
        national_id = value.get_secret_value()
        if len(national_id) != 12 or not national_id.isdigit():
            raise ValueError("national_id must contain exactly 12 digits")
        return value


class AppointmentCreateBase(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    doctor_id: int = Field(ge=1)
    appointment_date: date
    start_time: time
    symptoms: str = Field(min_length=1, max_length=2000)


class SelfAppointmentCreate(AppointmentCreateBase):
    booking_for: Literal["self"]


class RelativeAppointmentCreate(AppointmentCreateBase):
    booking_for: Literal["relative"]
    relative: RelativeInput


AppointmentCreate = Annotated[
    SelfAppointmentCreate | RelativeAppointmentCreate,
    Field(discriminator="booking_for"),
]


class AvailabilitySlot(BaseModel):
    start_time: time
    end_time: time


class AppointmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    doctor_id: int
    booking_for: str
    patient_full_name: str
    patient_phone_number: str | None
    patient_national_id_last4: str | None
    relationship: str | None
    symptoms: str
    appointment_date: date
    start_time: time
    end_time: time
    status: AppointmentStatus
    created_at: datetime


class AppointmentStatusEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    to_status: AppointmentStatus
    actor_role: str
    reason: str
    created_at: datetime


class AppointmentDetail(AppointmentRead):
    doctor_name: str
    specialty_name: str
    facility_name: str | None
    payment_status: str | None
    status_history: list[AppointmentStatusEventRead]


class MedicalRecordPut(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    clinical_notes: str = Field(min_length=1, max_length=5000)
    diagnosis: str | None = Field(default=None, max_length=1000)
    prescription: str | None = Field(default=None, max_length=2000)


class MedicalRecordRead(MedicalRecordPut):
    model_config = ConfigDict(from_attributes=True)

    id: int
    appointment_id: int
    doctor_id: int
    created_at: datetime
    updated_at: datetime
