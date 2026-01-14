from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserProfile(BaseModel):
    uid: str
    email: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    height_cm: Optional[float] = Field(None, gt=0, le=300)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    height_cm: Optional[float] = Field(None, gt=0, le=300)
