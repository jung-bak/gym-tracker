from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date


class PerformedSet(BaseModel):
    set_number: int = Field(..., ge=1)
    reps: int = Field(..., ge=0, le=200)
    weight: float = Field(..., ge=0)
    rpe: Optional[float] = Field(None, ge=1, le=10)
    completed: bool = True
    notes: Optional[str] = None


class PerformedExerciseBase(BaseModel):
    exercise_id: str
    routine_item_id: Optional[str] = None
    is_adhoc: bool = False
    sets: list[PerformedSet] = Field(default_factory=list)
    order: int = Field(..., ge=0)
    notes: Optional[str] = None


class PerformedExercise(PerformedExerciseBase):
    id: str
    exercise_name: Optional[str] = None

    class Config:
        from_attributes = True


class WorkoutSessionBase(BaseModel):
    routine_id: Optional[str] = None
    routine_name: Optional[str] = None
    date: date
    notes: Optional[str] = None


class WorkoutSessionCreate(WorkoutSessionBase):
    pass


class WorkoutSessionUpdate(BaseModel):
    notes: Optional[str] = None
    end_time: Optional[datetime] = None


class WorkoutSession(WorkoutSessionBase):
    id: str
    user_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    performed_exercises: list[PerformedExercise] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AddExerciseToSession(BaseModel):
    exercise_id: str
    routine_item_id: Optional[str] = None
    is_adhoc: bool = False


class AddSetToExercise(BaseModel):
    reps: int = Field(..., ge=0, le=200)
    weight: float = Field(..., ge=0)
    rpe: Optional[float] = Field(None, ge=1, le=10)
    notes: Optional[str] = None
