from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.user import User
from app.models.job import Job, JobStatus

router = APIRouter(prefix="/metrics", tags=["System Metrics"])

@router.get("/", summary="Canlı Sistem ve AI Kullanım Metrikleri")
def get_system_metrics(db: Session = Depends(get_db)):
    """
    Sistemdeki toplam kullanıcı, üretilen AI iş adedi ve performans durumunu döndürür.
    """
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_jobs = db.query(func.count(Job.id)).scalar() or 0
    completed_jobs = db.query(func.count(Job.id)).filter(Job.status == JobStatus.COMPLETED).scalar() or 0
    failed_jobs = db.query(func.count(Job.id)).filter(Job.status == JobStatus.FAILED).scalar() or 0
    pending_jobs = db.query(func.count(Job.id)).filter(Job.status == JobStatus.PENDING).scalar() or 0

    return {
        "metrics": {
            "total_users": total_users,
            "total_ai_jobs": total_jobs,
            "completed_ai_jobs": completed_jobs,
            "failed_ai_jobs": failed_jobs,
            "pending_ai_jobs": pending_jobs,
            "success_rate_percent": round((completed_jobs / total_jobs * 100), 2) if total_jobs > 0 else 100.0
        }
    }
