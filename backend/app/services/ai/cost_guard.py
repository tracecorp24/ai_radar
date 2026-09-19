import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.job import Job, JobStatus

class AICostGuard:
    """
    AI Kullanım & Maliyet Koruması.
    Kullanıcıların günlük AI istek adedini ve token limitini denetler.
    """
    DAILY_JOB_LIMIT = 50 # Kullanıcı başına günlük maks AI isteği

    @classmethod
    def check_user_daily_limit(cls, db: Session, user_id: int):
        today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        daily_count = db.query(func.count(Job.id)).filter(
            Job.user_id == user_id,
            Job.created_at >= today_start
        ).scalar() or 0

        if daily_count >= cls.DAILY_JOB_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Günlük AI kullanım limitinize ({cls.DAILY_JOB_LIMIT} işlem) ulaştınız."
            )
