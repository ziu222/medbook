from pydantic import BaseModel


class SpecialtyResponse(BaseModel):
    id: int
    name: str
    description: str | None = None

    model_config = {"from_attributes": True}


class DoctorResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    experience_years: int
    level: str | None = None          # VD: "Thạc sĩ", "Tiến sĩ", "Giáo sư"
    certificates: str | None = None   # VD: "Chứng chỉ Tim mạch can thiệp"
    specialty_id: int
    specialty: SpecialtyResponse | None = None

    model_config = {"from_attributes": True}
