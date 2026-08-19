from pydantic import BaseModel


class UserResponse(BaseModel):
    id: int
    cognito_sub: str
    name: str
    email: str
    phone: str | None = None

    model_config = {"from_attributes": True}
