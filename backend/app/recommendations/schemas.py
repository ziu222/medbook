from datetime import date, time

from pydantic import BaseModel, ConfigDict, Field


class SymptomInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    description: str = Field(min_length=3, max_length=2000)


class SymptomClassification(BaseModel):
    urgent: bool
    specialty_id: int | None
    specialty_name: str | None
    reason: str
    emergency_message: str | None = None


class RecommendationInput(SymptomInput):
    appointment_date: date
    facility_id: int | None = Field(default=None, ge=1)


class DoctorRecommendation(BaseModel):
    doctor_id: int
    doctor_name: str
    specialty_name: str
    facility_name: str | None
    rating: float
    available_slots: list[time]
    factors: list[str]


class RecommendationRead(BaseModel):
    classification: SymptomClassification
    doctors: list[DoctorRecommendation]
