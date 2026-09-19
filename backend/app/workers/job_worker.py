import asyncio
import logging
import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.job import Job, JobStatus
from app.services.ai.factory import LLMFactory

logger = logging.getLogger(__name__)

class JobWorker:
    """
    Arka planda PENDING durumundaki AI görevlerini kuyruktan/veritabanından çekip çalıştıran Worker sınıfı.
    """
    def __init__(self):
        self.is_running = False

    async def process_single_job(self, db: Session, job: Job) -> bool:
        """
        Tek bir görevi işler ve durumunu günceller.
        """
        try:
            job.status = JobStatus.RUNNING
            db.commit()
            
            provider = LLMFactory.get_provider(job.provider)
            response_text = await provider.agenerate(prompt=job.prompt, model=job.model_name)
            
            job.response = response_text
            job.status = JobStatus.COMPLETED
            job.completed_at = datetime.datetime.utcnow()
            db.commit()
            logger.info(f"[JobWorker] Görev #{job.id} başarıyla tamamlandı.")
            return True
        except Exception as e:
            db.rollback()
            job.status = JobStatus.FAILED
            job.error_message = str(e)
            db.commit()
            logger.error(f"[JobWorker] Görev #{job.id} başarısız oldu: {e}")
            return False

    async def run_once(self, db: Optional[Session] = None) -> int:
        """
        Veritabanındaki PENDING durumundaki tüm görevleri tek seferlik işler.
        db verilirse mevcut oturumu kullanır (testler ve bağlantı havuzu için).
        """
        should_close = False
        if db is None:
            db = SessionLocal()
            should_close = True

        try:
            pending_jobs = db.query(Job).filter(Job.status == JobStatus.PENDING).all()
            processed_count = 0
            for job in pending_jobs:
                success = await self.process_single_job(db, job)
                if success:
                    processed_count += 1
            return processed_count
        finally:
            if should_close:
                db.close()
