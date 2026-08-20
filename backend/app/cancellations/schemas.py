from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class RefundTierInput(BaseModel):
    actor_role: Literal["patient", "provider"]
    min_minutes_before: int = Field(ge=0)
    refund_percentage: int = Field(ge=0, le=100)


class CancellationPolicyCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    patient_cancel_cutoff_minutes: int = Field(ge=0)
    provider_cancel_cutoff_minutes: int | None = Field(default=None, ge=0)
    refund_tiers: list[RefundTierInput] = Field(min_length=2, max_length=20)

    @model_validator(mode="after")
    def validate_tiers(self):
        keys = {
            (tier.actor_role, tier.min_minutes_before) for tier in self.refund_tiers
        }
        if len(keys) != len(self.refund_tiers):
            raise ValueError("refund tier thresholds must be unique per actor")
        if {tier.actor_role for tier in self.refund_tiers} != {
            "patient",
            "provider",
        }:
            raise ValueError("refund tiers must cover patient and provider")
        return self


class RefundTierRead(RefundTierInput):
    model_config = ConfigDict(from_attributes=True)

    id: int


class CancellationPolicyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_cancel_cutoff_minutes: int
    provider_cancel_cutoff_minutes: int | None
    is_active: bool
    created_by_sub: str
    effective_from: datetime
    refund_tiers: list[RefundTierRead]
