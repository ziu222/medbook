from datetime import UTC, date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserProfilePut(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    display_name: str = Field(min_length=1, max_length=100)
    phone_number: str | None = Field(default=None, pattern=r"^\+?[0-9]{8,15}$")
    date_of_birth: date | None = None

    @field_validator("date_of_birth")
    @classmethod
    def reject_future_birth_date(cls, value: date | None) -> date | None:
        if value is not None and value > datetime.now(UTC).date():
            raise ValueError("date_of_birth cannot be in the future")
        return value


class UserProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    cognito_sub: str
    display_name: str
    phone_number: str | None
    date_of_birth: date | None
    created_at: datetime
    updated_at: datetime
