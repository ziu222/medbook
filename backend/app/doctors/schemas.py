from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class SpecialtyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


class DoctorSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    display_name: str
    specialty: SpecialtyRead
    clinic_name: str | None
    years_experience: int
    rating: float
    consultation_fee_vnd: int | None
    avatar_url: str | None


class DoctorDetail(DoctorSummary):
    bio: str | None


class DoctorProfilePut(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    specialty_id: int = Field(ge=1)
    display_name: str = Field(min_length=1, max_length=100)
    bio: str | None = Field(default=None, max_length=5000)
    clinic_name: str | None = Field(default=None, max_length=150)
    years_experience: int = Field(default=0, ge=0, le=80)
    consultation_fee_vnd: int | None = Field(default=None, ge=1000, le=100_000_000)
    avatar_url: HttpUrl | None = Field(default=None, max_length=500)
