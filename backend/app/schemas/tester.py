import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

class TesterCreate(BaseModel):
    email: EmailStr
    enabled: Optional[bool] = True

class TesterResponse(BaseModel):
    id: int
    email: EmailStr
    enabled: bool
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
