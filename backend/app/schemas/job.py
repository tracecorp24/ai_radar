import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.job import JobStatus

# Ortak Görev Alanları
class JobBase(BaseModel):
    prompt: str
    provider: Optional[str] = "openrouter"
    model_name: Optional[str] = "gpt-4o-mini"

# Görev Oluşturma İsteği
class JobCreate(JobBase):
    pass

# Görev Yanıtı
class JobResponse(JobBase):
    id: int
    user_id: Optional[int] = None
    response: Optional[str] = None
    status: JobStatus
    error_message: Optional[str] = None
    created_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)
