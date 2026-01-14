from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date


class WeightLogBase(BaseModel):
    weight: float = Field(..., gt=0, le=1000)
    date: date
    notes: Optional[str] = None


class WeightLogCreate(WeightLogBase):
    pass


class WeightLog(WeightLogBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class BodyMetrics(BaseModel):
    user_id: str
    height_cm: Optional[float] = Field(None, gt=0, le=300)
    weight_logs: list[WeightLog] = Field(default_factory=list)
    updated_at: datetime

    class Config:
        from_attributes = True
