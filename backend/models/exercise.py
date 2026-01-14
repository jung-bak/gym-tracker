from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class MuscleGroup(str, Enum):
    CHEST = "chest"
    BACK = "back"
    SHOULDERS = "shoulders"
    BICEPS = "biceps"
    TRICEPS = "triceps"
    FOREARMS = "forearms"
    CORE = "core"
    QUADS = "quads"
    HAMSTRINGS = "hamstrings"
    GLUTES = "glutes"
    CALVES = "calves"
    FULL_BODY = "full_body"


class ExerciseCategory(str, Enum):
    COMPOUND = "compound"
    ISOLATION = "isolation"
    CARDIO = "cardio"
    FLEXIBILITY = "flexibility"


class ExerciseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    muscle_group: MuscleGroup
    category: ExerciseCategory = ExerciseCategory.COMPOUND
    notes: Optional[str] = None


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    muscle_group: Optional[MuscleGroup] = None
    category: Optional[ExerciseCategory] = None
    notes: Optional[str] = None


class Exercise(ExerciseBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
