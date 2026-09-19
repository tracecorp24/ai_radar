import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.job import Job, JobStatus
from app.schemas.job import JobCreate, JobResponse
from app.models.user import User
from app.api.deps import get_current_user
from app.services.ai.factory import LLMFactory
from app.services.ai.cost_guard import AICostGuard

router = APIRouter(prefix="/ai", tags=["AI Integration"])

@router.post("/generate", response_model=JobResponse, summary="Vendor-Bağımsız AI Metin Üretimi")
async def generate_ai_text(
    job_in: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Vendor-bağımsız LLM adaptörü üzerinden metin üretir.
    İşlemi ve sonucunu 'jobs' tablosuna kaydeder.
    """
    # 0. Günlük AI limit kontrolü
    AICostGuard.check_user_daily_limit(db, current_user.id)

    # 1. Veritabanına PENDING durumunda kaydet
    job = Job(
        user_id=current_user.id,
        prompt=job_in.prompt,
        provider=job_in.provider or "openrouter",
        model_name=job_in.model_name or "gpt-4o-mini",
        status=JobStatus.RUNNING
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # 2. Fabrikadan sağlayıcı adaptörünü al ve çalıştır
    try:
        provider_adapter = LLMFactory.get_provider(job.provider)
        response_text = await provider_adapter.agenerate(
            prompt=job.prompt,
            model=job.model_name
        )
        
        job.response = response_text
        job.status = JobStatus.COMPLETED
        job.completed_at = datetime.datetime.utcnow()
    except Exception as e:
        job.status = JobStatus.FAILED
        job.error_message = str(e)
        
    db.commit()
    db.refresh(job)
    return job
