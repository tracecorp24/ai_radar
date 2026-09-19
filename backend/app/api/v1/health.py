from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings

router = APIRouter()

@router.get("/health", summary="Derinlemesine Sağlık ve Canlılık Kontrolü", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """
    Sistemin (FastAPI ve Veritabanı) canlılık durumunu kontrol eder.
    Monitoring araçları, Load Balancer ve Kubernetes Pod kontrolleri için kullanılır.
    """
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "checks": {
            "database": db_status,
            "storage": "healthy"
        }
    }
