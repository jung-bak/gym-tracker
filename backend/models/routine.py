from pydantic import BaseModel, Field
from typing import Optional, Union
from datetime import datetime, date
from enum import Enum


class RoutineItemType(str, Enum):
    EXERCISE = "exercise"
    SUPERSET = "superset"


class RoutineItemBase(BaseModel):
    exercise_id: str
    target_sets: int = Field(..., ge=1, le=20)
    target_reps: int = Field(..., ge=1, le=100)
    target_weight: Optional[float] = Field(None, ge=0)
    target_rpe: Optional[float] = Field(None, ge=1, le=10)
    rest_seconds: int = Field(default=90, ge=0, le=600)
    notes: Optional[str] = None
    order: int = Field(..., ge=0)


class RoutineItemCreate(RoutineItemBase):
    pass


class RoutineItem(RoutineItemBase):
    id: str

    class Config:
        from_attributes = True


class SupersetBase(BaseModel):
    name: Optional[str] = None
    items: list[RoutineItemCreate]
    rest_seconds: int = Field(default=90, ge=0, le=600)
    order: int = Field(..., ge=0)


class Superset(SupersetBase):
    id: str
    items: list[RoutineItem]

    class Config:
        from_attributes = True


class RoutineProvision(BaseModel):
    """A provision can be either a single exercise item or a superset."""
    type: RoutineItemType
    data: Union[RoutineItem, Superset]


class RoutineBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    schedule_start_date: Optional[date] = None
    schedule_end_date: Optional[date] = None


class RoutineCreate(RoutineBase):
    provisions: list[dict] = Field(default_factory=list)


class RoutineUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    schedule_start_date: Optional[date] = None
    schedule_end_date: Optional[date] = None
    provisions: Optional[list[dict]] = None


class Routine(RoutineBase):
    id: str
    user_id: str
    provisions: list[dict] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
